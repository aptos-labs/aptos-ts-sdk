// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { EphemeralKeyPair } from "../../../src/account/EphemeralKeyPair.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import { getProof } from "../../../src/internal/keyless.js";
import { keylessTestObject } from "../helper.js";

function makeEphemeral(): EphemeralKeyPair {
  const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(0x44));
  const expiryDateSecs = Math.floor(Date.now() / 1000) + 3600;
  return new EphemeralKeyPair({ privateKey: sk, expiryDateSecs, blinder: new Uint8Array(31).fill(1) });
}

function makeFakeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${enc({ alg: "RS256", typ: "JWT" })}.${enc(payload)}.AAAA`;
}

const keylessConfigResource = {
  max_commited_epk_bytes: 93,
  max_exp_horizon_secs: "1000000",
  max_extra_field_bytes: 350,
  max_iss_val_bytes: 120,
  max_jwt_header_b64_bytes: 300,
  max_signatures_per_txn: 3,
  override_aud_vals: [],
  training_wheels_pubkey: {
    vec: ["0x1388de358cf4701696bd58ed4b96e9d670cbbb914b888be1ceda6374a3098ed4"],
  },
};

const vkResource = {
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
};

function installKeylessMocks(mock: ReturnType<typeof createMockClient>) {
  mock.setResponder((req) => {
    const url = req.url ?? "";
    if (url.includes("keyless_account::Configuration")) {
      return { data: { type: "0x1::keyless_account::Configuration", data: keylessConfigResource } };
    }
    if (url.includes("Groth16VerificationKey")) {
      return { data: { type: "0x1::keyless_account::Groth16VerificationKey", data: vkResource } };
    }
    if (url.includes("pepper")) {
      return { data: { pepper: keylessTestObject.pepper } };
    }
    if (url.includes("prove")) {
      const trainingSig = keylessTestObject.proof.trainingWheelsSignature!;
      return {
        data: {
          proof: {
            a: new Uint8Array(32).fill(1),
            b: new Uint8Array(64).fill(2),
            c: new Uint8Array(32).fill(3),
          },
          training_wheels_signature: trainingSig.bcsToHex().toString(),
        },
      };
    }
    if (url.includes("/resource/0x1::account::Account")) {
      return { status: 404, statusText: "Not Found", data: { message: "not found" } };
    }
    return { data: {} };
  });
}

describe("internal/keyless.getProof — success path", () => {
  const mockOpts = {
    network: Network.DEVNET as const,
    pepper: "https://pepper.example/v0",
    prover: "https://prover.example/v0",
  };

  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  it("POSTs to the prover and returns a ZeroKnowledgeSig when config resources are available", async () => {
    const mock = createMockClient(mockOpts);
    installKeylessMocks(mock);
    const epk = makeEphemeral();
    const jwt = makeFakeJwt({ iat: epk.expiryDateSecs - 1800, sub: "user@x" });
    const pepper = new Uint8Array(31).fill(7);

    const proof = await getProof({
      aptosConfig: mock.config,
      jwt,
      ephemeralKeyPair: epk,
      pepper,
      maxExpHorizonSecs: 1_000_000,
    });

    expect(proof.expHorizonSecs).toBe(1_000_000);
    expect(proof.proof.variant).toBeDefined();
    expect(mock.requests.some((r) => r.url?.includes("prove"))).toBe(true);
  });

  it("rejects peppers that are not exactly 31 bytes", async () => {
    const mock = createMockClient(mockOpts);
    installKeylessMocks(mock);
    const epk = makeEphemeral();
    const jwt = makeFakeJwt({ iat: epk.expiryDateSecs - 1800, sub: "user@x" });

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt,
        ephemeralKeyPair: epk,
        pepper: "0x0102",
        maxExpHorizonSecs: 1_000_000,
      }),
    ).rejects.toThrow(/Pepper needs to be 31 bytes/);
  });

  it("rejects ephemeral key pairs whose lifespan exceeds maxExpHorizonSecs", async () => {
    const mock = createMockClient(mockOpts);
    installKeylessMocks(mock);
    const epk = makeEphemeral();
    const jwt = makeFakeJwt({ iat: 1, sub: "user@x" });

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt,
        ephemeralKeyPair: epk,
        pepper: keylessTestObject.pepper,
        maxExpHorizonSecs: 1,
      }),
    ).rejects.toThrow(/EphemeralKeyPair is too long lived/);
  });

  it("rejects JWTs without a numeric iat claim", async () => {
    const mock = createMockClient(mockOpts);
    installKeylessMocks(mock);
    const epk = makeEphemeral();
    const jwt = makeFakeJwt({ sub: "user@x" });

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt,
        ephemeralKeyPair: epk,
        pepper: keylessTestObject.pepper,
        maxExpHorizonSecs: 1_000_000,
      }),
    ).rejects.toThrow("iat was not found");
  });

  it("fetches pepper from the pepper service when pepper is omitted", async () => {
    const mock = createMockClient(mockOpts);
    installKeylessMocks(mock);
    const epk = makeEphemeral();
    const jwt = makeFakeJwt({ iat: epk.expiryDateSecs - 1800, sub: "user@x" });

    const proof = await getProof({
      aptosConfig: mock.config,
      jwt,
      ephemeralKeyPair: epk,
      maxExpHorizonSecs: 1_000_000,
    });

    expect(proof.proof.variant).toBeDefined();
    expect(mock.requests.some((r) => r.url?.includes("pepper"))).toBe(true);
  });
});
