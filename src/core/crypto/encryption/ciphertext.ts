// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Ported from aptos-core/crates/aptos-batch-encryption/ts-batch-encrypt/src/ciphertext.ts.
 * BCS layout must match the Rust types in aptos_batch_encryption::shared::ciphertext.
 */

import { ed25519 } from "@noble/curves/ed25519";
import { bls12_381 } from "@noble/curves/bls12-381";
import type { Fp2 } from "@noble/curves/abstract/tower";
import type { WeierstrassPoint } from "@noble/curves/abstract/weierstrass";
import { Serializable, Serializer } from "../../../bcs/serializer";
import { Deserializer } from "../../../bcs/deserializer";
import { leBytesToBigint, bigintToLEBytesFr, fp12ToLEBytes } from "./fieldSerialization";
import { bytesToG2, G2_SIZE, g2ToBytes } from "./curveSerialization";
import {
  getRandomFr,
  hashG2Element,
  hashToFr,
  ID_HASH_DST,
  OneTimePad,
  SymmetricCiphertext,
  SymmetricKey,
} from "./symmetric";

/**
 * Corresponds to the Rust type `aptos_batch_encryption::shared::ciphertext::BIBECiphertext`.
 */
export class BIBECiphertext extends Serializable {
  id: bigint;
  ctG2: WeierstrassPoint<Fp2>[];
  paddedKey: SymmetricKey;
  symmetricCiphertext: SymmetricCiphertext;

  constructor(
    id: bigint,
    ctG2: WeierstrassPoint<Fp2>[],
    paddedKey: SymmetricKey,
    symmetricCiphertext: SymmetricCiphertext,
  ) {
    super();
    if (ctG2.length !== 3) {
      throw new Error("Need 3 G2 points here");
    }
    this.id = id;
    this.ctG2 = ctG2;
    this.paddedKey = paddedKey;
    this.symmetricCiphertext = symmetricCiphertext;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(bigintToLEBytesFr(this.id));
    // BCS: single length prefix for all 3 G2 elements (matches arkworks-serde wrapper in Rust)
    const ctG2Bytes = new Uint8Array(G2_SIZE * 3);
    ctG2Bytes.set(g2ToBytes(this.ctG2[0]), 0);
    ctG2Bytes.set(g2ToBytes(this.ctG2[1]), G2_SIZE);
    ctG2Bytes.set(g2ToBytes(this.ctG2[2]), G2_SIZE * 2);
    serializer.serializeBytes(ctG2Bytes);
    this.paddedKey.serialize(serializer);
    this.symmetricCiphertext.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): BIBECiphertext {
    const id = leBytesToBigint(deserializer.deserializeBytes());
    const ctG2Bytes = deserializer.deserializeBytes();
    if (ctG2Bytes.length !== G2_SIZE * 3) {
      throw new Error(`Expected ${G2_SIZE * 3} bytes for 3 G2 points, got ${ctG2Bytes.length}`);
    }
    const ctG2 = [
      bytesToG2(ctG2Bytes.slice(0, G2_SIZE)),
      bytesToG2(ctG2Bytes.slice(G2_SIZE, G2_SIZE * 2)),
      bytesToG2(ctG2Bytes.slice(G2_SIZE * 2, G2_SIZE * 3)),
    ];
    const paddedKey = SymmetricKey.deserialize(deserializer);
    const symmetricCiphertext = SymmetricCiphertext.deserialize(deserializer);
    return new BIBECiphertext(id, ctG2, paddedKey, symmetricCiphertext);
  }
}

/**
 * Corresponds to the Rust type `aptos_batch_encryption::shared::ciphertext::Ciphertext`.
 */
export class Ciphertext extends Serializable {
  vk: Uint8Array;
  bibeCt: BIBECiphertext;
  associatedDataBytes: Uint8Array;
  signature: Uint8Array;

  constructor(vk: Uint8Array, bibeCt: BIBECiphertext, associatedDataBytes: Uint8Array, signature: Uint8Array) {
    super();
    if (vk.length !== 32) {
      throw new Error(`ed25519 public key must be 32 bytes, got ${vk.length}`);
    }
    if (signature.length !== 64) {
      throw new Error(`ed25519 signature must be 64 bytes, got ${signature.length}`);
    }
    this.vk = vk;
    this.bibeCt = bibeCt;
    this.associatedDataBytes = associatedDataBytes;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    // Rust: ed25519 VKs serialized as variable bytes
    serializer.serializeBytes(this.vk);
    this.bibeCt.serialize(serializer);
    serializer.serializeBytes(this.associatedDataBytes);
    // Rust: signatures serialized as fixed bytes
    serializer.serializeFixedBytes(this.signature);
  }

  static deserialize(deserializer: Deserializer): Ciphertext {
    const vk = deserializer.deserializeBytes();
    const bibeCt = BIBECiphertext.deserialize(deserializer);
    const associatedDataBytes = deserializer.deserializeBytes();
    const signature = deserializer.deserializeFixedBytes(64);
    return new Ciphertext(vk, bibeCt, associatedDataBytes, signature);
  }
}

/**
 * Corresponds to the Rust type `aptos_batch_encryption::shared::encryption_key::EncryptionKey`.
 *
 * Deserialize from hex (API) -> bytes -> BCS -> EncryptionKey.
 */
export class EncryptionKey extends Serializable {
  sigMpkG2: WeierstrassPoint<Fp2>;
  tauG2: WeierstrassPoint<Fp2>;

  constructor(sigMpkG2: WeierstrassPoint<Fp2>, tauG2: WeierstrassPoint<Fp2>) {
    super();
    this.sigMpkG2 = sigMpkG2;
    this.tauG2 = tauG2;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(g2ToBytes(this.sigMpkG2));
    serializer.serializeBytes(g2ToBytes(this.tauG2));
  }

  static deserialize(deserializer: Deserializer): EncryptionKey {
    const sigMpkG2 = bytesToG2(deserializer.deserializeBytes());
    const tauG2 = bytesToG2(deserializer.deserializeBytes());
    return new EncryptionKey(sigMpkG2, tauG2);
  }

  private bibeEncrypt(plaintext: Serializable, id: bigint): BIBECiphertext {
    const G2 = bls12_381.G2.Point;
    const Gt = bls12_381.fields.Fp12;

    const r = [getRandomFr(), getRandomFr()];
    const hashedEncryptionKey = hashG2Element(this.sigMpkG2);

    const ctG2 = [
      G2.BASE.multiply(r[0]).add(this.sigMpkG2.multiply(r[1])),
      G2.BASE.multiply(id).subtract(this.tauG2).multiply(r[0]),
      G2.BASE.negate().multiply(r[1]),
    ];

    // Target group: multiplication instead of addition (contrast with arkworks).
    // hashToCurve returns H2CPoint which is structurally compatible with WeierstrassPoint
    // but TypeScript doesn't unify them, so we cast via unknown.
    const g1Point = hashedEncryptionKey.multiply(r[1]) as unknown as WeierstrassPoint<bigint>;
    const otpSourceGt = Gt.inv(bls12_381.pairing(g1Point, this.sigMpkG2));

    const otpSourceBytes = fp12ToLEBytes(otpSourceGt);
    const otp = OneTimePad.fromSourceBytes(otpSourceBytes);

    const symmetricKey = new SymmetricKey();
    const paddedKey = otp.padKey(symmetricKey);

    const symmetricCiphertext = symmetricKey.encrypt(plaintext);

    return new BIBECiphertext(id, ctG2, paddedKey, symmetricCiphertext);
  }

  /**
   * Encrypts a plaintext with associated data, producing a `Ciphertext`.
   * Matches Rust: Id::from_verifying_key_and_ad(vk, associated_data) then CTEncrypt.
   * The ciphertext Id must equal hash(vk || BCS(associated_data)) with ID_HASH_DST so the node can verify.
   */
  encrypt(plaintext: Serializable, associatedData: Serializable): Ciphertext {
    const secretKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(secretKey);

    // Serialize associated data first (Rust: bcs::to_bytes(associated_data))
    const adSerializer = new Serializer();
    associatedData.serialize(adSerializer);
    const associatedDataBytes = adSerializer.toUint8Array();

    // Id = hash(vk || BCS(associated_data)) with domain separator; must match Rust Id::from_verifying_key_and_ad
    const hashPreimage = new Uint8Array(publicKey.length + associatedDataBytes.length);
    hashPreimage.set(publicKey, 0);
    hashPreimage.set(associatedDataBytes, publicKey.length);
    const hashedId = hashToFr(hashPreimage, ID_HASH_DST);

    const bibeCt = this.bibeEncrypt(plaintext, hashedId);

    // to_sign = (bibe_ct, associated_data_bytes) in Rust; BCS tuple = first element then second
    const toSignSerializer = new Serializer();
    bibeCt.serialize(toSignSerializer);
    toSignSerializer.serializeBytes(associatedDataBytes);
    const toSign = toSignSerializer.toUint8Array();

    const signature = ed25519.sign(toSign, secretKey);

    return new Ciphertext(publicKey, bibeCt, associatedDataBytes, signature);
  }
}
