// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";
import { Deserializer } from "../../src/bcs/index.js";
import { EphemeralKeyPair } from "../../src/account/EphemeralKeyPair.js";
import { Ed25519PrivateKey } from "../../src/core/crypto/ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "../../src/core/crypto/ephemeral.js";

const PRIV = new Ed25519PrivateKey(new Uint8Array(32).fill(0x11));

describe("EphemeralKeyPair", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives a stable nonce from privateKey + expiryDateSecs + blinder", () => {
    const blinder = new Uint8Array(31).fill(0x22);
    const a = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1_000_000_000, blinder });
    const b = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1_000_000_000, blinder });
    expect(a.nonce).toEqual(b.nonce);
    expect(a.nonce.length).toBeGreaterThan(0);
  });

  it("generates a random blinder when none is provided", () => {
    const a = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1_000_000_000 });
    const b = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1_000_000_000 });
    expect(a.blinder.length).toBe(EphemeralKeyPair.BLINDER_LENGTH);
    expect(a.blinder).not.toEqual(b.blinder);
    expect(a.nonce).not.toEqual(b.nonce);
  });

  it("defaults expiryDateSecs to two weeks in the future at the hour boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const kp = new EphemeralKeyPair({ privateKey: PRIV });
    // Two weeks = 14 days = 1_209_600 seconds. The implementation floors to
    // the nearest *local* hour, so we only assert the bounds rather than an
    // exact value (CI runs in different timezones).
    const nowSecs = Math.floor(Date.now() / 1000);
    expect(kp.expiryDateSecs).toBeGreaterThan(nowSecs);
    expect(kp.expiryDateSecs - nowSecs).toBeLessThanOrEqual(1_209_600);
    expect(kp.expiryDateSecs - nowSecs).toBeGreaterThan(1_209_600 - 3600);
  });

  it("returns the EphemeralPublicKey", () => {
    const kp = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1_000_000_000 });
    expect(kp.getPublicKey()).toBeInstanceOf(EphemeralPublicKey);
  });

  it("isExpired returns true when expiryDateSecs is in the past", () => {
    const kp = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1 });
    expect(kp.isExpired()).toBe(true);
  });

  it("isExpired returns false when expiryDateSecs is in the future", () => {
    const kp = new EphemeralKeyPair({
      privateKey: PRIV,
      expiryDateSecs: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(kp.isExpired()).toBe(false);
  });

  it("sign produces a verifiable EphemeralSignature on a fresh key pair", () => {
    const kp = new EphemeralKeyPair({
      privateKey: PRIV,
      expiryDateSecs: Math.floor(Date.now() / 1000) + 3600,
    });
    const message = "0xcafebabe";
    const sig = kp.sign(message);
    expect(sig).toBeInstanceOf(EphemeralSignature);
    expect(kp.getPublicKey().verifySignature({ message, signature: sig })).toBe(true);
  });

  it("sign throws when the key pair has expired", () => {
    const kp = new EphemeralKeyPair({ privateKey: PRIV, expiryDateSecs: 1 });
    expect(() => kp.sign("0x00")).toThrow(/expired/);
  });

  it("clear() zeroizes the blinder and disables signing", () => {
    const kp = new EphemeralKeyPair({
      privateKey: new Ed25519PrivateKey(new Uint8Array(32).fill(0x33)),
      expiryDateSecs: Math.floor(Date.now() / 1000) + 3600,
      blinder: new Uint8Array(31).fill(0x44),
    });
    expect(kp.isCleared()).toBe(false);
    kp.clear();
    expect(kp.isCleared()).toBe(true);
    // Blinder is overwritten to zero in the final pass.
    expect(Array.from(kp.blinder)).toEqual(new Array(31).fill(0));
    // sign() must throw after clear, even before the expiry check.
    expect(() => kp.sign("0x00")).toThrow(/cleared from memory/);
  });

  it("clear() is idempotent", () => {
    const kp = new EphemeralKeyPair({
      privateKey: new Ed25519PrivateKey(new Uint8Array(32).fill(0x55)),
      expiryDateSecs: Math.floor(Date.now() / 1000) + 3600,
    });
    kp.clear();
    // Second call must not throw.
    expect(() => kp.clear()).not.toThrow();
    expect(kp.isCleared()).toBe(true);
  });

  it("BCS serialize/deserialize round-trips the key pair", () => {
    const original = new EphemeralKeyPair({
      privateKey: PRIV,
      expiryDateSecs: 1_700_000_000,
      blinder: new Uint8Array(31).fill(0x77),
    });
    const bytes = original.bcsToBytes();
    const back = EphemeralKeyPair.fromBytes(bytes);
    expect(back.expiryDateSecs).toBe(original.expiryDateSecs);
    expect(back.blinder).toEqual(original.blinder);
    expect(back.nonce).toBe(original.nonce);
  });

  it("deserialize rejects an unknown variant index", () => {
    // Manually craft a buffer: ULEB128(99). Anything after is irrelevant since
    // the switch throws before reading more.
    const d = new Deserializer(new Uint8Array([99]));
    expect(() => EphemeralKeyPair.deserialize(d)).toThrow(/Unknown variant index for EphemeralPublicKey/);
  });

  it("generate() produces a new Ed25519-backed key pair", () => {
    const a = EphemeralKeyPair.generate();
    const b = EphemeralKeyPair.generate();
    expect(a.getPublicKey()).toBeInstanceOf(EphemeralPublicKey);
    // Two independently generated keys must differ (with overwhelming
    // probability; collision probability is 2^-256).
    expect(a.bcsToBytes()).not.toEqual(b.bcsToBytes());
  });
});
