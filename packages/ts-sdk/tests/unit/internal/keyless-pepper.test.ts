// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { getPepper, getPepperBase } from "../../../src/internal/keyless.js";
import { EPHEMERAL_KEY_PAIR, keylessTestObject } from "../helper.js";
import { Hex } from "../../../src/core/hex.js";

describe("internal/keyless pepper services", () => {
  const mockOpts = {
    network: Network.DEVNET as const,
    pepper: "https://pepper.example/v0",
    prover: "https://prover.example/v0",
  };

  it("getPepper POSTs JWT and ephemeral key material to the pepper fetch endpoint", async () => {
    const mock = createMockClient(mockOpts);
    mock.setResponder((req) => {
      if (req.url?.includes("pepper") && req.method === "POST") {
        return { data: { pepper: keylessTestObject.pepper } };
      }
      return { data: {} };
    });

    const pepper = await getPepper({
      aptosConfig: mock.config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
    });

    expect(Hex.fromHexInput(pepper).toString()).toBe(keylessTestObject.pepper);
    const pepperReq = mock.requests.find((r) => r.url?.includes("pepper"));
    expect(pepperReq?.method).toBe("POST");
    expect(pepperReq?.body).toMatchObject({
      jwt_b64: keylessTestObject.JWT,
      uid_key: "sub",
      exp_date_secs: EPHEMERAL_KEY_PAIR.expiryDateSecs,
    });
    expectRequest(pepperReq!, { method: "POST", urlIncludes: "fetch" });
  });

  it("getPepperBase POSTs to the signature endpoint and returns raw pepper_base bytes", async () => {
    const mock = createMockClient(mockOpts);
    const pepperBaseHex = `0x${"ab".repeat(48)}`;
    mock.setResponder((req) => {
      if (req.url?.includes("pepper") && req.method === "POST") {
        return { data: { signature: pepperBaseHex } };
      }
      return { data: {} };
    });

    const pepperBase = await getPepperBase({
      aptosConfig: mock.config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      uidKey: "email",
    });

    expect(pepperBase).toHaveLength(48);
    expect(Hex.fromHexInput(pepperBase).toString()).toBe(pepperBaseHex);
    expect(mock.requests.some((r) => r.url?.includes("signature"))).toBe(true);
  });
});
