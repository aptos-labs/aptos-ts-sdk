// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils.js";
import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { type H2COpts, hash_to_field } from "@noble/curves/abstract/hash-to-curve.js";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import type { WeierstrassPoint } from "@noble/curves/abstract/weierstrass.js";
import type { Fp2 } from "@noble/curves/abstract/tower.js";
import { Serializable, Serializer } from "../../../bcs/serializer.js";
import { Deserializer } from "../../../bcs/deserializer.js";
import { leBytesToBigint } from "./fieldSerialization.js";
import { g2ToBytes } from "./curveSerialization.js";

const HASH_G2_ELEMENT_DST = "APTOS_BATCH_ENCRYPTION_HASH_G2_ELEMENT";
const HKDF_SALT = new TextEncoder().encode("APTOS_BATCH_ENCRYPTION_OTP");

/** AES-128 key length and OTP length (both 16 bytes). */
const SYMMETRIC_KEY_LENGTH = 16;
/** AES-GCM nonce length. */
const GCM_NONCE_LENGTH = 12;

/** Domain separation tag for Id::from_verifying_key_and_ad. Must match Rust ID_HASH_DST. */
export const ID_HASH_DST = new TextEncoder().encode("APTOS_BATCH_ENCRYPTION_HASH_ID");

export class OneTimePad extends Serializable {
  otp: Uint8Array;

  constructor(otp: Uint8Array) {
    super();
    if (otp.length !== SYMMETRIC_KEY_LENGTH) {
      throw new Error(`One-time-pad length must be ${SYMMETRIC_KEY_LENGTH} bytes`);
    }
    this.otp = otp;
  }

  static fromSourceBytes(otpSource: Uint8Array): OneTimePad {
    const derived = hmacKdf(otpSource);
    return new OneTimePad(derived.slice(0, SYMMETRIC_KEY_LENGTH));
  }

  padKey(value: SymmetricKey): SymmetricKey {
    const paddedKey = new Uint8Array(SYMMETRIC_KEY_LENGTH);
    for (let i = 0; i < SYMMETRIC_KEY_LENGTH; i++) {
      paddedKey[i] = value.key[i] ^ this.otp[i];
    }
    return new SymmetricKey(paddedKey);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.otp);
  }

  static deserialize(deserializer: Deserializer): OneTimePad {
    return new OneTimePad(deserializer.deserializeFixedBytes(SYMMETRIC_KEY_LENGTH));
  }
}

export class SymmetricCiphertext extends Serializable {
  nonce: Uint8Array;
  ctBody: Uint8Array;

  constructor(nonce: Uint8Array, ctBody: Uint8Array) {
    super();
    if (nonce.length !== GCM_NONCE_LENGTH) {
      throw new Error(`Nonce must be ${GCM_NONCE_LENGTH} bytes`);
    }
    this.nonce = nonce;
    this.ctBody = ctBody;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.nonce);
    serializer.serializeBytes(this.ctBody);
  }

  static deserialize(deserializer: Deserializer): SymmetricCiphertext {
    const nonce = deserializer.deserializeFixedBytes(GCM_NONCE_LENGTH);
    const ctBody = deserializer.deserializeBytes();
    return new SymmetricCiphertext(nonce, ctBody);
  }
}

export class SymmetricKey extends Serializable {
  key: Uint8Array;

  constructor(key?: Uint8Array) {
    super();
    if (key) {
      if (key.length !== SYMMETRIC_KEY_LENGTH) {
        throw new Error(`Must provide a key of size ${SYMMETRIC_KEY_LENGTH}`);
      }
      this.key = key;
    } else {
      this.key = randomBytes(SYMMETRIC_KEY_LENGTH);
    }
  }

  encrypt(msg: Serializable): SymmetricCiphertext {
    const nonce = randomBytes(GCM_NONCE_LENGTH);
    const serializer = new Serializer();
    msg.serialize(serializer);
    const bytes = serializer.toUint8Array();
    const ctBody = gcm(this.key, nonce).encrypt(bytes);
    return new SymmetricCiphertext(nonce, ctBody);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.key);
  }

  static deserialize(deserializer: Deserializer): SymmetricKey {
    return new SymmetricKey(deserializer.deserializeFixedBytes(SYMMETRIC_KEY_LENGTH));
  }
}

export function hmacKdf(otpSource: Uint8Array): Uint8Array {
  return hkdf(sha256, otpSource, HKDF_SALT, new Uint8Array(), 32);
}

export function getRandomFr(): bigint {
  const randomBigint = leBytesToBigint(randomBytes(128));
  return bls12_381.fields.Fr.create(randomBigint);
}

/**
 * Hash bytes to a field element in Fr. Used for Id and other hashes.
 * @param input - bytes to hash (e.g. vk || BCS(associated_data) for Id)
 * @param dst - optional domain separation tag; use ID_HASH_DST for Id::from_verifying_key_and_ad
 */
export function hashToFr(input: Uint8Array, dst: Uint8Array = new Uint8Array(0)): bigint {
  const options: H2COpts = {
    DST: dst,
    expand: "xmd",
    hash: sha256,
    p: bls12_381.fields.Fr.ORDER,
    m: 1,
    k: 128,
  };
  return hash_to_field(Uint8Array.from(input), 1, options)[0][0];
}

export function hashG2Element(g2Element: WeierstrassPoint<Fp2>) {
  const bytes = g2ToBytes(g2Element);
  return bls12_381.G1.hashToCurve(bytes, { DST: HASH_G2_ELEMENT_DST });
}
