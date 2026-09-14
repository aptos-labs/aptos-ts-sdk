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

describe("TwistedEd25519PrivateKey.fromPepperBase", () => {
  // 48-byte pepper_base = [0,1,...,47]
  const PEPPER_BASE_HEX =
    "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f";
  // Known-answer vector pinning the scheme (SHA-512(utf8(DOMAIN) || pepper_base) mod l, little-endian).
  // MUST match the Petra/reference implementation byte-for-byte.
  const EXPECTED_DK_HEX = "0x8dc90fb1c1383fd9d5041329ec128758da8fed0980e502dc9cf1709222005f06";

  it("pins the domain-separation string and pepper_base length", () => {
    expect(TwistedEd25519PrivateKey.PEPPER_DK_DERIVATION_DOMAIN).toBe(
      "APTOS_CONFIDENTIAL_ASSETS::PEPPER_DK_DERIVATION::v1",
    );
    expect(TwistedEd25519PrivateKey.PEPPER_BASE_LENGTH).toBe(48);
  });

  it("matches the known-answer vector and is deterministic", () => {
    const dk1 = TwistedEd25519PrivateKey.fromPepperBase(PEPPER_BASE_HEX);
    const dk2 = TwistedEd25519PrivateKey.fromPepperBase(PEPPER_BASE_HEX);
    expect(dk1.toString()).toBe(EXPECTED_DK_HEX);
    expect(dk2.toString()).toBe(EXPECTED_DK_HEX);
  });

  it("accepts a Uint8Array and derives a usable key", () => {
    const dk = TwistedEd25519PrivateKey.fromPepperBase(Hex.fromHexInput(PEPPER_BASE_HEX).toUint8Array());
    expect(dk.toString()).toBe(EXPECTED_DK_HEX);
    expect(() => dk.publicKey()).not.toThrow();
  });

  it("rejects a pepper_base that is not 48 bytes", () => {
    expect(() => TwistedEd25519PrivateKey.fromPepperBase(new Uint8Array(31))).toThrow(/48 bytes/);
    expect(() => TwistedEd25519PrivateKey.fromPepperBase(new Uint8Array(64))).toThrow(/48 bytes/);
  });

  it("produces distinct DKs for distinct pepper_base values", () => {
    const a = TwistedEd25519PrivateKey.fromPepperBase(new Uint8Array(48).fill(1));
    const b = TwistedEd25519PrivateKey.fromPepperBase(new Uint8Array(48).fill(2));
    expect(a.toString()).not.toBe(b.toString());
  });
});
