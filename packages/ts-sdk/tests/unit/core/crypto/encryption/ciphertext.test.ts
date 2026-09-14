// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { Deserializer } from "../../../../../src/bcs/deserializer.js";
import { Serializer, Serializable } from "../../../../../src/bcs/serializer.js";
import { BIBECiphertext, Ciphertext, EncryptionKey } from "../../../../../src/core/crypto/encryption/ciphertext.js";
import { SymmetricCiphertext, SymmetricKey, getRandomFr } from "../../../../../src/core/crypto/encryption/symmetric.js";
import { g2ToBytes } from "../../../../../src/core/crypto/encryption/curveSerialization.js";

const SYMMETRIC_KEY_LENGTH = 16;
const GCM_NONCE_LENGTH = 12;

describe("core/crypto/encryption/ciphertext", () => {
  function makeG2Points() {
    const g = bls12_381.G2.Point.BASE;
    return [g, g, g] as const;
  }

  it("BIBECiphertext rejects fewer than 3 G2 points at construction", () => {
    const key = new SymmetricKey(new Uint8Array(SYMMETRIC_KEY_LENGTH).fill(1));
    const sym = new SymmetricCiphertext(new Uint8Array(GCM_NONCE_LENGTH), new Uint8Array(16));
    expect(() => new BIBECiphertext(1n, [makeG2Points()[0]], key, sym)).toThrow(/Need 3 G2 points/);
  });

  it("BIBECiphertext round-trips through BCS", () => {
    const key = new SymmetricKey(new Uint8Array(SYMMETRIC_KEY_LENGTH).fill(2));
    const sym = new SymmetricCiphertext(new Uint8Array(GCM_NONCE_LENGTH).fill(3), new Uint8Array(16).fill(4));
    const original = new BIBECiphertext(getRandomFr(), [...makeG2Points()], key, sym);

    const s = new Serializer();
    original.serialize(s);
    const restored = BIBECiphertext.deserialize(new Deserializer(s.toUint8Array()));

    expect(restored.id).toBe(original.id);
    expect(restored.paddedKey.key).toEqual(key.key);
  });

  it("BIBECiphertext.deserialize throws when G2 byte length is wrong", () => {
    const s = new Serializer();
    s.serializeBytes(new Uint8Array(32)); // id
    s.serializeBytes(new Uint8Array(10)); // too short for 3 G2 points
    expect(() => BIBECiphertext.deserialize(new Deserializer(s.toUint8Array()))).toThrow(
      /Expected .* bytes for 3 G2 points/,
    );
  });

  it("Ciphertext validates vk and signature lengths at construction", () => {
    const key = new SymmetricKey(new Uint8Array(SYMMETRIC_KEY_LENGTH).fill(5));
    const sym = new SymmetricCiphertext(new Uint8Array(GCM_NONCE_LENGTH), new Uint8Array(16));
    const bibe = new BIBECiphertext(2n, [...makeG2Points()], key, sym);

    expect(() => new Ciphertext(new Uint8Array(16), bibe, new Uint8Array(0), new Uint8Array(64))).toThrow(
      /ed25519 public key must be 32 bytes/,
    );
    expect(() => new Ciphertext(new Uint8Array(32), bibe, new Uint8Array(0), new Uint8Array(32))).toThrow(
      /ed25519 signature must be 64 bytes/,
    );
  });

  it("Ciphertext round-trips through BCS", () => {
    const key = new SymmetricKey(new Uint8Array(SYMMETRIC_KEY_LENGTH).fill(6));
    const sym = new SymmetricCiphertext(new Uint8Array(GCM_NONCE_LENGTH).fill(7), new Uint8Array(16).fill(8));
    const bibe = new BIBECiphertext(3n, [...makeG2Points()], key, sym);
    const original = new Ciphertext(
      new Uint8Array(32).fill(9),
      bibe,
      new TextEncoder().encode("associated"),
      new Uint8Array(64).fill(10),
    );

    const s = new Serializer();
    original.serialize(s);
    const restored = Ciphertext.deserialize(new Deserializer(s.toUint8Array()));

    expect(restored.vk).toEqual(original.vk);
    expect(restored.associatedDataBytes).toEqual(original.associatedDataBytes);
    expect(restored.signature).toEqual(original.signature);
    expect(g2ToBytes(restored.bibeCt.ctG2[0])).toEqual(g2ToBytes(original.bibeCt.ctG2[0]));
  });

  it("EncryptionKey round-trips and can encrypt/decrypt-shaped associated data", () => {
    const g2 = bls12_381.G2.Point.BASE;
    const key = new EncryptionKey(g2, g2.multiply(2n));

    const s = new Serializer();
    key.serialize(s);
    const restored = EncryptionKey.deserialize(new Deserializer(s.toUint8Array()));
    expect(g2ToBytes(restored.sigMpkG2)).toEqual(g2ToBytes(key.sigMpkG2));

    class BytesPayload extends Serializable {
      constructor(readonly bytes: Uint8Array) {
        super();
      }
      serialize(serializer: Serializer): void {
        serializer.serializeBytes(this.bytes);
      }
    }

    const ciphertext = key.encrypt(
      new BytesPayload(new TextEncoder().encode("secret")),
      new BytesPayload(new Uint8Array()),
    );
    expect(ciphertext).toBeInstanceOf(Ciphertext);
    expect(ciphertext.vk).toHaveLength(32);
    expect(ciphertext.signature).toHaveLength(64);
    expect(ciphertext.bibeCt).toBeInstanceOf(BIBECiphertext);
  });
});
