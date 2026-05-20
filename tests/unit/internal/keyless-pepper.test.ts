// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Coverage for the simpler branches of internal/keyless.ts — getPepper
 * (request shape + parsing) and getProof's pre-fetch validation. Anything
 * that needs a real prover response or a real JWT signature stays in e2e.
 */

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { EphemeralKeyPair } from "../../../src/account/EphemeralKeyPair.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import { getPepper, getProof } from "../../../src/internal/keyless.js";

function makeEphemeral(): EphemeralKeyPair {
  const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(0x33));
  return new EphemeralKeyPair({ privateKey: sk });
}

// Build a syntactically-valid JWT (header.payload.signature, base64url).
// jwtDecode only parses the payload — it doesn't verify the signature.
function makeFakeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${enc({ alg: "RS256", typ: "JWT" })}.${enc(payload)}.AAAA`;
}

describe("internal/keyless.getPepper", () => {
  // Use a non-LOCAL network because LOCAL has no pepper endpoint mapping.
  // We hardcode a pepper URL via `pepper` so getRequestUrl works.
  const mockOpts = { network: Network.DEVNET as const, pepper: "https://pepper.example/v0" };

  it("POSTs the expected body to the pepper service and returns the parsed pepper bytes", async () => {
    const mock = createMockClient(mockOpts);
    // 31-byte pepper (the on-chain length).
    const pepperHex = `0x${"ab".repeat(31)}`;
    mock.enqueue({ data: { pepper: pepperHex } });

    const epk = makeEphemeral();
    const pepper = await getPepper({
      aptosConfig: mock.config,
      jwt: "ignored-here-because-no-decoding-happens",
      ephemeralKeyPair: epk,
    });

    expect(pepper).toBeInstanceOf(Uint8Array);
    expect(pepper.length).toBe(31);

    const body = mock.requests[0]?.body as {
      jwt_b64: string;
      epk: string;
      exp_date_secs: number;
      epk_blinder: string;
      uid_key: string;
      derivation_path: undefined | string;
    };
    expect(body.jwt_b64).toBe("ignored-here-because-no-decoding-happens");
    expect(body.uid_key).toBe("sub"); // default
    expect(body.epk).toMatch(/^[0-9a-f]+$/i); // hex without 0x prefix
    expect(typeof body.exp_date_secs).toBe("number");
    expect(body.derivation_path).toBeUndefined();

    expectRequest(mock.requests[0], { method: "POST", originMethod: "getPepper", urlIncludes: "fetch" });
  });

  it("forwards a custom uidKey and derivationPath", async () => {
    const mock = createMockClient(mockOpts);
    mock.enqueue({ data: { pepper: `0x${"00".repeat(31)}` } });

    await getPepper({
      aptosConfig: mock.config,
      jwt: "x",
      ephemeralKeyPair: makeEphemeral(),
      uidKey: "email",
      derivationPath: "m/44'/637'/0'/0'",
    });

    const body = mock.requests[0]?.body as { uid_key: string; derivation_path: string };
    expect(body.uid_key).toBe("email");
    expect(body.derivation_path).toBe("m/44'/637'/0'/0'");
  });
});

describe("internal/keyless.getProof — pre-network validation", () => {
  const mockOpts = { network: Network.DEVNET as const, prover: "https://prover.example/v0" };

  it("throws when the pepper is the wrong length (the explicit guard before network call)", async () => {
    const mock = createMockClient(mockOpts);
    // No prover response queued — the validation should throw first.
    const tooShortPepper = new Uint8Array(10); // 10 != 31

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt: makeFakeJwt({ iat: 1700000000, sub: "user@x" }),
        ephemeralKeyPair: makeEphemeral(),
        pepper: tooShortPepper,
        maxExpHorizonSecs: 1_000_000,
      }),
    ).rejects.toThrow(/Pepper needs to be 31 bytes/);

    expect(mock.requests).toHaveLength(0);
  });

  it("throws 'iat was not found' when the decoded JWT has no numeric iat", async () => {
    const mock = createMockClient(mockOpts);
    const validPepper = new Uint8Array(31);

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt: makeFakeJwt({ sub: "user@x" /* no iat */ }),
        ephemeralKeyPair: makeEphemeral(),
        pepper: validPepper,
        maxExpHorizonSecs: 1_000_000,
      }),
    ).rejects.toThrow(/iat was not found/);

    expect(mock.requests).toHaveLength(0);
  });

  it("throws when the ephemeral key pair lifespan exceeds maxExpHorizonSecs", async () => {
    const mock = createMockClient(mockOpts);
    const validPepper = new Uint8Array(31);
    const epk = makeEphemeral();
    // Old iat means lifespan is huge — exceeds the small horizon.
    const oldIat = Math.floor(epk.expiryDateSecs - 10_000_000 /* 10M secs older */);

    await expect(
      getProof({
        aptosConfig: mock.config,
        jwt: makeFakeJwt({ iat: oldIat, sub: "x" }),
        ephemeralKeyPair: epk,
        pepper: validPepper,
        maxExpHorizonSecs: 60, // 1 minute — definitely smaller than 10M seconds
      }),
    ).rejects.toThrow(/EphemeralKeyPair is too long lived/);

    expect(mock.requests).toHaveLength(0);
  });
});
