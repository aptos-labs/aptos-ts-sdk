// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Parity tests for aptos-core/crates/aptos-batch-encryption/src/tests/typescript/symmetric.rs.
 * Each describe block corresponds to a Rust test in that file.
 */

import { gcm } from "@noble/ciphers/aes.js";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import { Deserializer } from "../../../../../src/bcs/deserializer";
import { Serializer } from "../../../../../src/bcs/serializer";
import { bigintToLEBytesFr, leBytesToBigint } from "../../../../../src/core/crypto/encryption/fieldSerialization";
import { g2ToBytes } from "../../../../../src/core/crypto/encryption/curveSerialization";
import {
  hashG2Element,
  hashToFr,
  hmacKdf,
  ID_HASH_DST,
  OneTimePad,
  SymmetricCiphertext,
  SymmetricKey,
} from "../../../../../src/core/crypto/encryption/symmetric";

// ---------------------------------------------------------------------------
// test_hmac_kdf
// ---------------------------------------------------------------------------
describe("hmacKdf (aptos-core test_hmac_kdf parity)", () => {
  const INPUT_SIZES = [1, 2, 7, 8, 31, 32, 33, 63, 64, 65];

  test.each(INPUT_SIZES)("output is 32 bytes for input length %i", (size) => {
    const input = crypto.getRandomValues(new Uint8Array(size));
    expect(hmacKdf(input).length).toBe(32);
  });

  test.each(INPUT_SIZES)("output is deterministic for input length %i", (size) => {
    const input = crypto.getRandomValues(new Uint8Array(size));
    expect(hmacKdf(input)).toEqual(hmacKdf(input));
  });

  test("distinct inputs produce distinct outputs", () => {
    const a = new Uint8Array(32).fill(0x01);
    const b = new Uint8Array(32).fill(0x02);
    expect(hmacKdf(a)).not.toEqual(hmacKdf(b));
  });
});

// ---------------------------------------------------------------------------
// test_hash_to_fr
// ---------------------------------------------------------------------------
describe("hashToFr (aptos-core test_hash_to_fr parity)", () => {
  const DST = new TextEncoder().encode("dst");
  const INPUT_SIZES = [1, 2, 7, 8, 31, 32, 33, 63, 64, 65];

  test.each(INPUT_SIZES)("output is deterministic for input length %i", (size) => {
    const input = crypto.getRandomValues(new Uint8Array(size));
    expect(hashToFr(input, DST)).toBe(hashToFr(input, DST));
  });

  test.each(INPUT_SIZES)("output is in Fr range for input length %i", (size) => {
    const input = crypto.getRandomValues(new Uint8Array(size));
    const fr = hashToFr(input, DST);
    expect(fr >= 0n).toBe(true);
    expect(fr < bls12_381.fields.Fr.ORDER).toBe(true);
  });

  test("distinct inputs produce distinct outputs", () => {
    const a = new Uint8Array(32).fill(0xaa);
    const b = new Uint8Array(32).fill(0xbb);
    expect(hashToFr(a, DST)).not.toBe(hashToFr(b, DST));
  });

  test("ID_HASH_DST produces same result as explicit DST", () => {
    const input = new Uint8Array(32).fill(0x42);
    expect(hashToFr(input, ID_HASH_DST)).toBe(
      hashToFr(input, new TextEncoder().encode("APTOS_BATCH_ENCRYPTION_HASH_ID")),
    );
  });

  test("LE bytes of output roundtrip through leBytesToBigint/bigintToLEBytesFr", () => {
    const input = new Uint8Array(16).fill(0x55);
    const fr = hashToFr(input, DST);
    const leBytes = bigintToLEBytesFr(fr);
    expect(leBytes.length).toBe(32);
    expect(leBytesToBigint(leBytes)).toBe(fr);
  });
});

// ---------------------------------------------------------------------------
// test_symmetric_key_serialize
// ---------------------------------------------------------------------------
describe("SymmetricKey BCS serialization (aptos-core test_symmetric_key_serialize parity)", () => {
  test("serialize/deserialize roundtrip preserves key bytes", () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(16));
    const key = new SymmetricKey(keyBytes);

    const serializer = new Serializer();
    key.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const restored = SymmetricKey.deserialize(new Deserializer(bytes));
    expect(restored.key).toEqual(keyBytes);
  });

  test("serialized length is exactly 16 bytes (fixed, no length prefix)", () => {
    const key = new SymmetricKey(new Uint8Array(16).fill(0x7f));
    const serializer = new Serializer();
    key.serialize(serializer);
    expect(serializer.toUint8Array().length).toBe(16);
  });
});

// ---------------------------------------------------------------------------
// test_symmetric_encrypt
// ---------------------------------------------------------------------------
describe("SymmetricKey encrypt/decrypt (aptos-core test_symmetric_encrypt parity)", () => {
  class StringMsg {
    constructor(readonly s: string) {}
    serialize(serializer: Serializer): void {
      serializer.serializeStr(this.s);
    }
  }

  test("encrypts and decrypts 'hi' correctly", () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(16));
    const key = new SymmetricKey(keyBytes);

    const msgSerializer = new Serializer();
    new StringMsg("hi").serialize(msgSerializer);
    const expectedPlaintext = msgSerializer.toUint8Array();

    const ct = key.encrypt({ serialize: (s: Serializer) => new StringMsg("hi").serialize(s) } as any);
    const decrypted = gcm(key.key, ct.nonce).decrypt(ct.ctBody);
    expect(decrypted).toEqual(expectedPlaintext);
  });

  test("two encryptions of the same message produce different ciphertexts (random nonce)", () => {
    const key = new SymmetricKey(new Uint8Array(16).fill(0x11));
    const msg = { serialize: (s: Serializer) => s.serializeStr("hi") } as any;
    const ct1 = key.encrypt(msg);
    const ct2 = key.encrypt(msg);
    // Nonces should differ (random), so ciphertexts should differ
    expect(ct1.nonce).not.toEqual(ct2.nonce);
  });

  test("SymmetricCiphertext BCS roundtrip preserves nonce and ctBody", () => {
    const key = new SymmetricKey(new Uint8Array(16).fill(0x22));
    const ct = key.encrypt({ serialize: (s: Serializer) => s.serializeStr("hi") } as any);

    const serializer = new Serializer();
    ct.serialize(serializer);
    const restored = SymmetricCiphertext.deserialize(new Deserializer(serializer.toUint8Array()));

    expect(restored.nonce).toEqual(ct.nonce);
    expect(restored.ctBody).toEqual(ct.ctBody);
  });
});

// ---------------------------------------------------------------------------
// test_otp_generation
// ---------------------------------------------------------------------------
describe("OneTimePad.fromSourceBytes (aptos-core test_otp_generation parity)", () => {
  test("produces a 16-byte OTP from 64-byte source", () => {
    const source = crypto.getRandomValues(new Uint8Array(64));
    const otp = OneTimePad.fromSourceBytes(source);
    expect(otp.otp.length).toBe(16);
  });

  test("output is deterministic for the same source", () => {
    const source = new Uint8Array(64).fill(0xab);
    expect(OneTimePad.fromSourceBytes(source).otp).toEqual(OneTimePad.fromSourceBytes(source).otp);
  });

  test("BCS serialization roundtrip preserves OTP bytes", () => {
    const source = crypto.getRandomValues(new Uint8Array(64));
    const otp = OneTimePad.fromSourceBytes(source);

    const serializer = new Serializer();
    otp.serialize(serializer);
    const restored = OneTimePad.deserialize(new Deserializer(serializer.toUint8Array()));

    expect(restored.otp).toEqual(otp.otp);
  });

  test("serialized length is exactly 16 bytes (fixed, no length prefix)", () => {
    const otp = OneTimePad.fromSourceBytes(new Uint8Array(64).fill(0x55));
    const serializer = new Serializer();
    otp.serialize(serializer);
    expect(serializer.toUint8Array().length).toBe(16);
  });
});

// ---------------------------------------------------------------------------
// test_otp_padding
// ---------------------------------------------------------------------------
describe("OneTimePad.padKey (aptos-core test_otp_padding parity)", () => {
  test("padKey XORs OTP bytes with key bytes", () => {
    const keyBytes = new Uint8Array(16).fill(0xff);
    const source = new Uint8Array(64).fill(0x00);
    const key = new SymmetricKey(keyBytes);
    const otp = OneTimePad.fromSourceBytes(source);
    const padded = otp.padKey(key);

    const expectedPaddedKey = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      expectedPaddedKey[i] = keyBytes[i] ^ otp.otp[i];
    }
    expect(padded.key).toEqual(expectedPaddedKey);
  });

  test("padKey is its own inverse (XOR twice returns original)", () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(16));
    const source = crypto.getRandomValues(new Uint8Array(64));
    const key = new SymmetricKey(keyBytes);
    const otp = OneTimePad.fromSourceBytes(source);

    const padded = otp.padKey(key);
    const unpadded = otp.padKey(padded);
    expect(unpadded.key).toEqual(keyBytes);
  });

  test("BCS roundtrip of padded key", () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(16));
    const source = crypto.getRandomValues(new Uint8Array(64));
    const padded = OneTimePad.fromSourceBytes(source).padKey(new SymmetricKey(keyBytes));

    const serializer = new Serializer();
    padded.serialize(serializer);
    const restored = SymmetricKey.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(restored.key).toEqual(padded.key);
  });
});

// ---------------------------------------------------------------------------
// test_hash_g2_element
// ---------------------------------------------------------------------------
describe("hashG2Element (aptos-core test_hash_g2_element parity)", () => {
  test("output is a valid G1 point (torsion-free)", () => {
    const g2 = bls12_381.G2.Point.BASE;
    const h = hashG2Element(g2);
    expect(h.isTorsionFree()).toBe(true);
  });

  test("output is deterministic", () => {
    const g2 = bls12_381.G2.Point.BASE.multiply(7n);
    expect(hashG2Element(g2).equals(hashG2Element(g2))).toBe(true);
  });

  test("distinct G2 inputs produce distinct G1 outputs", () => {
    const h1 = hashG2Element(bls12_381.G2.Point.BASE);
    const h2 = hashG2Element(bls12_381.G2.Point.BASE.multiply(2n));
    expect(h1.equals(h2)).toBe(false);
  });

  test("matches bls12_381.G1.hashToCurve with the same DST and serialized input", () => {
    const DST = "APTOS_BATCH_ENCRYPTION_HASH_G2_ELEMENT";
    const g2 = bls12_381.G2.Point.BASE.multiply(13n);
    const expected = bls12_381.G1.hashToCurve(g2ToBytes(g2), { DST });
    expect(hashG2Element(g2).equals(expected)).toBe(true);
  });
});
