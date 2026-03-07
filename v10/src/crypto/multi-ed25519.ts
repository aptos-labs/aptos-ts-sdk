import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { AbstractMultiKey } from "./multi-key.js";
import { createAuthKey, type VerifySignatureArgs } from "./public-key.js";
import { SigningScheme } from "./types.js";
import { Signature } from "./signature.js";

export class MultiEd25519PublicKey extends AbstractMultiKey {
  static readonly MAX_KEYS = 32;
  static readonly MIN_KEYS = 2;
  static readonly MIN_THRESHOLD = 1;

  public readonly publicKeys: Ed25519PublicKey[];
  public readonly threshold: number;

  constructor(args: { publicKeys: Ed25519PublicKey[]; threshold: number }) {
    const { publicKeys, threshold } = args;
    super({ publicKeys });

    if (publicKeys.length > MultiEd25519PublicKey.MAX_KEYS || publicKeys.length < MultiEd25519PublicKey.MIN_KEYS) {
      throw new Error(
        `Must have between ${MultiEd25519PublicKey.MIN_KEYS} and ${MultiEd25519PublicKey.MAX_KEYS} public keys, inclusive`,
      );
    }
    if (threshold < MultiEd25519PublicKey.MIN_THRESHOLD || threshold > publicKeys.length) {
      throw new Error(
        `Threshold must be between ${MultiEd25519PublicKey.MIN_THRESHOLD} and ${publicKeys.length}, inclusive`,
      );
    }

    this.publicKeys = publicKeys;
    this.threshold = threshold;
  }

  getSignaturesRequired(): number {
    return this.threshold;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (!(signature instanceof MultiEd25519Signature)) return false;

    const indices: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 8; j += 1) {
        if ((signature.bitmap[i] & (1 << (7 - j))) !== 0) {
          indices.push(i * 8 + j);
        }
      }
    }

    if (indices.length !== signature.signatures.length) {
      throw new Error("Bitmap and signatures length mismatch");
    }
    if (indices.length < this.threshold) {
      throw new Error("Not enough signatures");
    }

    for (let i = 0; i < indices.length; i += 1) {
      const publicKey = this.publicKeys[indices[i]];
      if (!publicKey.verifySignature({ message, signature: signature.signatures[i] })) {
        return false;
      }
    }
    return true;
  }

  authKey(): unknown {
    return createAuthKey(SigningScheme.MultiEd25519, this.toUint8Array());
  }

  toUint8Array(): Uint8Array {
    const bytes = new Uint8Array(this.publicKeys.length * Ed25519PublicKey.LENGTH + 1);
    this.publicKeys.forEach((k: Ed25519PublicKey, i: number) => {
      bytes.set(k.toUint8Array(), i * Ed25519PublicKey.LENGTH);
    });
    bytes[this.publicKeys.length * Ed25519PublicKey.LENGTH] = this.threshold;
    return bytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): MultiEd25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    const threshold = bytes[bytes.length - 1];
    const keys: Ed25519PublicKey[] = [];
    for (let i = 0; i < bytes.length - 1; i += Ed25519PublicKey.LENGTH) {
      keys.push(new Ed25519PublicKey(bytes.subarray(i, i + Ed25519PublicKey.LENGTH)));
    }
    return new MultiEd25519PublicKey({ publicKeys: keys, threshold });
  }
}

export class MultiEd25519Signature extends Signature {
  static MAX_SIGNATURES_SUPPORTED = 32;
  static BITMAP_LEN: number = 4;

  public readonly signatures: Ed25519Signature[];
  public readonly bitmap: Uint8Array;

  constructor(args: { signatures: Ed25519Signature[]; bitmap: Uint8Array | number[] }) {
    super();
    const { signatures, bitmap } = args;

    if (signatures.length > MultiEd25519Signature.MAX_SIGNATURES_SUPPORTED) {
      throw new Error(
        `The number of signatures cannot be greater than ${MultiEd25519Signature.MAX_SIGNATURES_SUPPORTED}`,
      );
    }
    this.signatures = signatures;

    if (!(bitmap instanceof Uint8Array)) {
      this.bitmap = MultiEd25519Signature.createBitmap({ bits: bitmap });
    } else if (bitmap.length !== MultiEd25519Signature.BITMAP_LEN) {
      throw new Error(`"bitmap" length should be ${MultiEd25519Signature.BITMAP_LEN}`);
    } else {
      this.bitmap = bitmap;
    }
  }

  toUint8Array(): Uint8Array {
    const bytes = new Uint8Array(this.signatures.length * Ed25519Signature.LENGTH + MultiEd25519Signature.BITMAP_LEN);
    this.signatures.forEach((k: Ed25519Signature, i: number) => {
      bytes.set(k.toUint8Array(), i * Ed25519Signature.LENGTH);
    });
    bytes.set(this.bitmap, this.signatures.length * Ed25519Signature.LENGTH);
    return bytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): MultiEd25519Signature {
    const bytes = deserializer.deserializeBytes();
    const bitmap = bytes.subarray(bytes.length - 4);
    const signatures: Ed25519Signature[] = [];
    for (let i = 0; i < bytes.length - bitmap.length; i += Ed25519Signature.LENGTH) {
      signatures.push(new Ed25519Signature(bytes.subarray(i, i + Ed25519Signature.LENGTH)));
    }
    return new MultiEd25519Signature({ signatures, bitmap });
  }

  static createBitmap(args: { bits: number[] }): Uint8Array {
    const { bits } = args;
    const firstBitInByte = 128;
    const bitmap = new Uint8Array([0, 0, 0, 0]);
    const dupCheckSet = new Set<number>();

    bits.forEach((bit: number, index) => {
      if (bit >= MultiEd25519Signature.MAX_SIGNATURES_SUPPORTED) {
        throw new Error(`Cannot have a signature larger than ${MultiEd25519Signature.MAX_SIGNATURES_SUPPORTED - 1}.`);
      }
      if (dupCheckSet.has(bit)) {
        throw new Error("Duplicate bits detected.");
      }
      if (index > 0 && bit <= bits[index - 1]) {
        throw new Error("The bits need to be sorted in ascending order.");
      }
      dupCheckSet.add(bit);
      const byteOffset = Math.floor(bit / 8);
      let byte = bitmap[byteOffset];
      byte |= firstBitInByte >> (bit % 8);
      bitmap[byteOffset] = byte;
    });

    return bitmap;
  }
}
