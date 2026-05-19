/**
 * Unit tests for the domain-separated confidential-asset decryption-key derivation.
 *
 * The 32-byte signing message per chain is fixed; these tests pin the values so any
 * change to the derivation surface (constant string, chain literals, hash algorithm)
 * fails CI loudly.
 */

import { describe, it, expect } from "vitest";
import { Hex, Network } from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "../../src/index.js";

const VECTORS: Array<{ network: Network; expectedHex: string }> = [
  {
    network: Network.MAINNET,
    expectedHex: "0xb22523cee15e8a94819a13ae96b7d5d8d8ef42213aa2b56f4fe5c40ea848e46c",
  },
  {
    network: Network.TESTNET,
    expectedHex: "0xcc51262a1ec8b1fc392dd02e9cd92e13f53fec4fd481ee5d5b3c3d8f58e247e6",
  },
  {
    network: Network.DEVNET,
    expectedHex: "0xfa56c4a0724a76979f09c7dbff5c31865ba5ef1d08eef0446581a450124c88e9",
  },
];

describe("TwistedEd25519PrivateKey.getDecryptionKeySigningMessage", () => {
  it("uses the canonical domain-separation prefix", () => {
    expect(TwistedEd25519PrivateKey.DK_DERIVATION_DOMAIN_PREFIX).toBe("APTOS_CONFIDENTIAL_ASSETS::DK_DERIVATION::");
  });

  it.each(VECTORS)("matches the test vector for $network", ({ network, expectedHex }) => {
    const signingMessage = TwistedEd25519PrivateKey.getDecryptionKeySigningMessage(network);
    expect(signingMessage.length).toBe(32);
    expect(Hex.fromHexInput(signingMessage).toString()).toBe(expectedHex);
  });

  it("produces a distinct message for each network", () => {
    const messages = VECTORS.map((v) =>
      Hex.fromHexInput(TwistedEd25519PrivateKey.getDecryptionKeySigningMessage(v.network)).toString(),
    );
    expect(new Set(messages).size).toBe(messages.length);
  });
});
