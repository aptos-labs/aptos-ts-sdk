// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { EphemeralKeyPair } from "../../../src/account/ephemeral-key-pair.js";
import { Ed25519PrivateKey } from "../../../src/crypto/ed25519.js";

const PRIVATE_KEY_HEX = "ed25519-priv-0x1111111111111111111111111111111111111111111111111111111111111111";

describe("EphemeralKeyPair", () => {
  it("generates a new key pair", () => {
    const ekp = EphemeralKeyPair.generate();
    expect(ekp.getPublicKey()).toBeDefined();
    expect(ekp.nonce).toBeDefined();
    expect(ekp.expiryDateSecs).toBeGreaterThan(0);
    expect(ekp.blinder.length).toBe(31);
  });

  it("creates from private key with custom expiry", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const ekp = new EphemeralKeyPair({
      privateKey,
      expiryDateSecs: 9876543210,
      blinder: new Uint8Array(31),
    });
    expect(ekp.expiryDateSecs).toBe(9876543210);
    expect(ekp.isExpired()).toBe(false);
  });

  it("detects expired key pair", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const ekp = new EphemeralKeyPair({
      privateKey,
      expiryDateSecs: 10, // long in the past
      blinder: new Uint8Array(31),
    });
    expect(ekp.isExpired()).toBe(true);
  });

  it("serializes and deserializes", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const ekp = new EphemeralKeyPair({
      privateKey,
      expiryDateSecs: 9876543210,
      blinder: new Uint8Array(31),
    });

    const bytes = ekp.bcsToBytes();
    const restored = EphemeralKeyPair.fromBytes(bytes);

    expect(restored.nonce).toEqual(ekp.nonce);
    expect(restored.expiryDateSecs).toEqual(ekp.expiryDateSecs);
    expect(restored.blinder).toEqual(ekp.blinder);
  });

  it("signs data when not expired", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const ekp = new EphemeralKeyPair({
      privateKey,
      expiryDateSecs: 9876543210,
      blinder: new Uint8Array(31),
    });
    const sig = ekp.sign("68656c6c6f");
    expect(sig).toBeDefined();
  });

  it("throws when signing with expired key pair", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const ekp = new EphemeralKeyPair({
      privateKey,
      expiryDateSecs: 10,
      blinder: new Uint8Array(31),
    });
    expect(() => ekp.sign("68656c6c6f")).toThrow("expired");
  });

  it("clears key material", () => {
    const ekp = EphemeralKeyPair.generate();
    expect(ekp.isCleared()).toBe(false);
    ekp.clear();
    expect(ekp.isCleared()).toBe(true);
    expect(() => ekp.sign("68656c6c6f")).toThrow("cleared");
  });

  it("nonce is deterministic for same inputs", () => {
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const blinder = new Uint8Array(31);

    const ekp1 = new EphemeralKeyPair({ privateKey, expiryDateSecs: 9876543210, blinder });
    const ekp2 = new EphemeralKeyPair({
      privateKey: new Ed25519PrivateKey(PRIVATE_KEY_HEX),
      expiryDateSecs: 9876543210,
      blinder: new Uint8Array(31),
    });

    expect(ekp1.nonce).toEqual(ekp2.nonce);
  });
});
