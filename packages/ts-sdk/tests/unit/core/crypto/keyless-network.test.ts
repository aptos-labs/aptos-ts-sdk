// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../../src/utils/memoize.js";
import { Network } from "../../../../src/utils/apiEndpoints.js";
import {
  fetchJWK,
  getKeylessConfig,
  getKeylessJWKs,
  KeylessConfiguration,
  KeylessPublicKey,
  MoveJWK,
} from "../../../../src/core/crypto/keyless.js";
import { KeylessErrorType } from "../../../../src/errors/index.js";
import { keylessTestConfig, keylessTestObject } from "../../helper.js";
import { installKeylessMocks, patchedJwksResponse } from "../../helpers/keylessMocks.js";
import { AccountAddress } from "../../../../src/core/index.js";

describe("core/crypto/keyless — on-chain config and JWK fetch", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);

  it("getKeylessConfig loads on-chain configuration and verification key resources", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);

    const config = await getKeylessConfig({ aptosConfig: mock.config });

    expect(config.maxExpHorizonSecs).toBe(1_000_000);
    expect(config.maxCommitedEpkBytes).toBe(93);
    expect(config.verificationKey.hash().length).toBe(32);
    expect(mock.requests.some((r) => r.url?.includes("keyless_account::Configuration"))).toBe(true);
    expect(mock.requests.some((r) => r.url?.includes("Groth16VerificationKey"))).toBe(true);
  });

  it("KeylessConfiguration.create maps on-chain resource shapes", () => {
    const config = KeylessConfiguration.create(
      {
        alpha_g1: "0xe2f26dbea299f5223b646cb1fb33eadb059d9407559d7441dfd902e3a79a4d2d",
        beta_g2:
          "0xabb73dc17fbc13021e2471e0c08bd67d8401f52b73d6d07483794cad4778180e0c06f33bbc4c79a9cadef253a68084d382f17788f885c9afd176f7cb2f036789",
        delta_g2:
          "0xb106619932d0ef372c46909a2492e246d5de739aa140e27f2c71c0470662f125219049cfe15e4d140d7e4bb911284aad1cad19880efb86f2d9dd4b1bb344ef8f",
        gamma_abc_g1: [
          "0x6123b6fea40de2a7e3595f9c35210da8a45a7e8c2f7da9eb4548e9210cfea81a",
          "0x32a9b8347c512483812ee922dc75952842f8f3083edb6fe8d5c3c07e1340b683",
        ],
        gamma_g2:
          "0xedf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19",
      },
      {
        max_commited_epk_bytes: 93,
        max_exp_horizon_secs: "1000000",
        max_extra_field_bytes: 350,
        max_iss_val_bytes: 120,
        max_jwt_header_b64_bytes: 300,
        max_signatures_per_txn: 3,
        override_aud_vals: [],
        training_wheels_pubkey: { vec: ["0x1388de358cf4701696bd58ed4b96e9d670cbbb914b888be1ceda6374a3098ed4"] },
      },
    );

    expect(config.trainingWheelsPubkey).toBeDefined();
    expect(config.verificationKey.toSnarkJsJson().IC).toHaveLength(2);
  });

  it("Groth16VerificationKey hash is stable for fixture verification key bytes", () => {
    const hash = keylessTestConfig.verificationKey.hash();
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
    expect(Array.from(hash.slice(0, 4))).toEqual(Array.from(keylessTestConfig.verificationKey.hash().slice(0, 4)));
  });

  it("getKeylessJWKs returns a map keyed by issuer with MoveJWK entries", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);

    const jwks = await getKeylessJWKs({ aptosConfig: mock.config });

    expect(jwks.get(keylessTestObject.iss)).toHaveLength(1);
    expect(jwks.get(keylessTestObject.iss)?.[0].kid).toBe(keylessTestObject.jwk.kid);
    expectRequest(mock.requests[0], { method: "GET", urlIncludes: "PatchedJWKs" });
  });

  it("getKeylessJWKs fetches federated JWKs when jwkAddr is provided", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);
    const jwkAddr = AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000face");

    const jwks = await getKeylessJWKs({ aptosConfig: mock.config, jwkAddr, useCache: false });

    expect(jwks.get(keylessTestObject.iss)?.[0].kty).toBe("RSA");
    expect(mock.requests[0]?.url).toContain(jwkAddr.toString());
    expect(mock.requests[0]?.url).toContain("FederatedJWKs");
  });

  it("fetchJWK returns the JWK matching kid for a known issuer", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);

    const jwk = await fetchJWK({
      aptosConfig: mock.config,
      publicKey,
      kid: keylessTestObject.jwk.kid,
    });

    expect(jwk).toBeInstanceOf(MoveJWK);
    expect(jwk.kid).toBe("test-rsa");
    expect(jwk.alg).toBe("RS256");
  });

  it("fetchJWK throws INVALID_JWT_ISS_NOT_RECOGNIZED when the issuer is absent", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    mock.setResponder((req) => {
      if (req.url?.includes("PatchedJWKs")) {
        return { data: patchedJwksResponse("other.issuer") };
      }
      return { data: {} };
    });

    await expect(
      fetchJWK({ aptosConfig: mock.config, publicKey, kid: keylessTestObject.jwk.kid }),
    ).rejects.toMatchObject({ type: KeylessErrorType.INVALID_JWT_ISS_NOT_RECOGNIZED });
  });

  it("fetchJWK throws INVALID_JWT_JWK_NOT_FOUND when kid does not match", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);

    await expect(fetchJWK({ aptosConfig: mock.config, publicKey, kid: "missing-kid" })).rejects.toMatchObject({
      type: KeylessErrorType.INVALID_JWT_JWK_NOT_FOUND,
    });
  });

  it("fetchJWK wraps fullnode failures as FULL_NODE_JWKS_LOOKUP_ERROR", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    mock.enqueueError(new Error("network down"));

    await expect(
      fetchJWK({ aptosConfig: mock.config, publicKey, kid: keylessTestObject.jwk.kid }),
    ).rejects.toMatchObject({ type: KeylessErrorType.FULL_NODE_JWKS_LOOKUP_ERROR });
  });

  it("getKeylessConfig wraps resource lookup failures as FULL_NODE_CONFIG_LOOKUP_ERROR", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    mock.enqueueError(new Error("config missing"));

    await expect(getKeylessConfig({ aptosConfig: mock.config })).rejects.toMatchObject({
      type: KeylessErrorType.FULL_NODE_CONFIG_LOOKUP_ERROR,
    });
  });
});
