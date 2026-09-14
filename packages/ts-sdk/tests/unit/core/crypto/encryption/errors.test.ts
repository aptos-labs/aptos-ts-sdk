// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Constructor-validation paths for the BIBE/AES encryption types. These
 * checks are easy to miss with the parity tests since they exercise the
 * happy-path roundtrips only.
 */

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../../../src/bcs/index.js";
import { BIBECiphertext, Ciphertext } from "../../../../../src/core/crypto/encryption/ciphertext.js";
import { OneTimePad, SymmetricCiphertext, SymmetricKey } from "../../../../../src/core/crypto/encryption/symmetric.js";

describe("SymmetricKey constructor", () => {
  it("generates a random 16-byte key when none is provided", () => {
    const a = new SymmetricKey();
    const b = new SymmetricKey();
    expect(a.key.length).toBe(16);
    expect(b.key.length).toBe(16);
    // Two random keys must not match. The probability of an accidental collision
    // is 2^-128.
    expect(a.key).not.toEqual(b.key);
  });

  it("stores a caller-supplied 16-byte key as-is", () => {
    const bytes = new Uint8Array(16).fill(0x42);
    expect(new SymmetricKey(bytes).key).toBe(bytes);
  });

  it("rejects a non-16-byte key", () => {
    expect(() => new SymmetricKey(new Uint8Array(15))).toThrow(/key of size 16/);
    expect(() => new SymmetricKey(new Uint8Array(17))).toThrow(/key of size 16/);
  });
});

describe("OneTimePad constructor", () => {
  it("accepts a 16-byte buffer", () => {
    const bytes = new Uint8Array(16).fill(0x55);
    expect(new OneTimePad(bytes).otp).toBe(bytes);
  });

  it("rejects a buffer of the wrong length", () => {
    expect(() => new OneTimePad(new Uint8Array(15))).toThrow(/One-time-pad length/);
    expect(() => new OneTimePad(new Uint8Array(17))).toThrow(/One-time-pad length/);
  });

  it("padKey XORs its OTP with the symmetric key", () => {
    const otp = new OneTimePad(new Uint8Array(16).fill(0xff));
    const key = new SymmetricKey(new Uint8Array(16).fill(0x0f));
    const padded = otp.padKey(key);
    // 0x0F xor 0xFF == 0xF0 for every byte.
    expect(Array.from(padded.key)).toEqual(new Array(16).fill(0xf0));
  });
});

describe("SymmetricCiphertext constructor", () => {
  it("rejects nonces that are not exactly 12 bytes (AES-GCM nonce length)", () => {
    expect(() => new SymmetricCiphertext(new Uint8Array(11), new Uint8Array(8))).toThrow(/Nonce must be 12 bytes/);
    expect(() => new SymmetricCiphertext(new Uint8Array(13), new Uint8Array(8))).toThrow(/Nonce must be 12 bytes/);
  });

  it("accepts a 12-byte nonce", () => {
    const nonce = new Uint8Array(12).fill(1);
    const body = new Uint8Array([1, 2, 3]);
    const ct = new SymmetricCiphertext(nonce, body);
    expect(ct.nonce).toBe(nonce);
    expect(ct.ctBody).toBe(body);
  });

  it("roundtrips through BCS", () => {
    const ct = new SymmetricCiphertext(new Uint8Array(12).fill(7), new Uint8Array([9, 9, 9]));
    const serializer = new Serializer();
    ct.serialize(serializer);
    const back = SymmetricCiphertext.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(back.nonce).toEqual(ct.nonce);
    expect(back.ctBody).toEqual(ct.ctBody);
  });
});

describe("BIBECiphertext constructor", () => {
  it("requires exactly 3 G2 points", () => {
    // We don't need real G2 points for the length-check branch.
    const fakeG2 = [] as unknown as never[];
    expect(
      () =>
        new BIBECiphertext(
          1n,
          fakeG2,
          new SymmetricKey(new Uint8Array(16)),
          new SymmetricCiphertext(new Uint8Array(12), new Uint8Array()),
        ),
    ).toThrow(/3 G2 points/);
  });
});

describe("Ciphertext constructor", () => {
  // Reusable inner values that pass downstream checks.
  const dummyBibe = {} as BIBECiphertext;

  it("rejects a verifying key whose length is not 32 bytes", () => {
    expect(() => new Ciphertext(new Uint8Array(31), dummyBibe, new Uint8Array(), new Uint8Array(64))).toThrow(
      /ed25519 public key must be 32 bytes/,
    );
  });

  it("rejects a signature whose length is not 64 bytes", () => {
    expect(() => new Ciphertext(new Uint8Array(32), dummyBibe, new Uint8Array(), new Uint8Array(63))).toThrow(
      /ed25519 signature must be 64 bytes/,
    );
  });

  it("accepts a well-shaped ciphertext", () => {
    const ct = new Ciphertext(
      new Uint8Array(32).fill(0x11),
      dummyBibe,
      new Uint8Array([1, 2, 3]),
      new Uint8Array(64).fill(0x22),
    );
    expect(ct.vk.length).toBe(32);
    expect(ct.signature.length).toBe(64);
  });
});
