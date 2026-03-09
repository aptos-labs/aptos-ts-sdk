import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { AbstractMultiKey } from "./multi-key.js";
import { createAuthKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { SigningScheme } from "./types.js";

/**
 * A K-of-N multi-signature public key using the legacy MultiEd25519 scheme.
 *
 * All constituent keys must be Ed25519 keys.  The `threshold` specifies how
 * many signatures are required to authorise a transaction.
 *
 * @example
 * ```ts
 * const multiKey = new MultiEd25519PublicKey({
 *   publicKeys: [key1, key2, key3],
 *   threshold: 2,
 * });
 * ```
 */
export class MultiEd25519PublicKey extends AbstractMultiKey {
  /** Maximum number of public keys in a MultiEd25519 key set. */
  static readonly MAX_KEYS = 32;
  /** Minimum number of public keys in a MultiEd25519 key set. */
  static readonly MIN_KEYS = 2;
  /** Minimum acceptable signature threshold. */
  static readonly MIN_THRESHOLD = 1;

  /** The ordered list of constituent Ed25519 public keys. */
  public readonly publicKeys: Ed25519PublicKey[];
  /** The minimum number of valid signatures required to authenticate. */
  public readonly threshold: number;

  /**
   * Creates a `MultiEd25519PublicKey`.
   *
   * @param args - Configuration object.
   * @param args.publicKeys - Between 2 and 32 Ed25519 public keys.
   * @param args.threshold - The minimum number of signatures required (1 ≤
   *   threshold ≤ `publicKeys.length`).
   * @throws If the number of keys is not in the range [2, 32].
   * @throws If `threshold` is not in the range [1, `publicKeys.length`].
   */
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

  /**
   * Returns the signature threshold (the minimum number of signatures
   * required to authorise a transaction).
   *
   * @returns The `threshold` value.
   */
  getSignaturesRequired(): number {
    return this.threshold;
  }

  /**
   * Verifies a {@link MultiEd25519Signature} against this multi-key.
   *
   * The bitmap in the signature specifies which keys signed; each corresponding
   * Ed25519 signature is verified individually.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if all signed signatures are valid and the count meets the
   *   threshold, `false` if any signature is invalid.
   * @throws If `signature` is not a `MultiEd25519Signature`.
   * @throws If the bitmap and signature array lengths do not match.
   * @throws If fewer signatures are provided than the threshold requires.
   */
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

  /**
   * Derives the on-chain authentication key for this multi-key using the
   * `MultiEd25519` signing scheme.
   *
   * @returns The `AccountAddress` representing the authentication key.
   */
  authKey(): unknown {
    return createAuthKey(SigningScheme.MultiEd25519, this.toUint8Array());
  }

  /**
   * Returns the raw byte representation: the concatenation of all public key
   * bytes followed by the single-byte threshold.
   *
   * @returns The multi-key bytes as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    const bytes = new Uint8Array(this.publicKeys.length * Ed25519PublicKey.LENGTH + 1);
    this.publicKeys.forEach((k: Ed25519PublicKey, i: number) => {
      bytes.set(k.toUint8Array(), i * Ed25519PublicKey.LENGTH);
    });
    bytes[this.publicKeys.length * Ed25519PublicKey.LENGTH] = this.threshold;
    return bytes;
  }

  /**
   * BCS-serialises the multi-key by writing its raw bytes with a length prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  /**
   * Deserialises a `MultiEd25519PublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiEd25519PublicKey`.
   */
  static deserialize(deserializer: Deserializer): MultiEd25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    if (bytes.length < Ed25519PublicKey.LENGTH + 1) {
      throw new Error(
        `MultiEd25519PublicKey bytes too short: expected at least ${Ed25519PublicKey.LENGTH + 1}, got ${bytes.length}`,
      );
    }
    const keyBytes = bytes.length - 1;
    if (keyBytes % Ed25519PublicKey.LENGTH !== 0) {
      throw new Error(
        `MultiEd25519PublicKey key bytes are not aligned: ${keyBytes} is not a multiple of ${Ed25519PublicKey.LENGTH}`,
      );
    }
    const threshold = bytes[bytes.length - 1];
    const keys: Ed25519PublicKey[] = [];
    for (let i = 0; i < keyBytes; i += Ed25519PublicKey.LENGTH) {
      keys.push(new Ed25519PublicKey(bytes.subarray(i, i + Ed25519PublicKey.LENGTH)));
    }
    return new MultiEd25519PublicKey({ publicKeys: keys, threshold });
  }
}

/**
 * A multi-signature for the legacy `MultiEd25519` scheme, consisting of
 * individual Ed25519 signatures and a bitmap indicating which keys signed.
 *
 * @example
 * ```ts
 * const multiSig = new MultiEd25519Signature({
 *   signatures: [sig0, sig1],
 *   bitmap: MultiEd25519Signature.createBitmap({ bits: [0, 1] }),
 * });
 * ```
 */
export class MultiEd25519Signature extends Signature {
  /** Maximum number of signatures supported. */
  static MAX_SIGNATURES_SUPPORTED = 32;
  /** Byte length of the bitmap. */
  static BITMAP_LEN: number = 4;

  /** The individual Ed25519 signatures from each signer. */
  public readonly signatures: Ed25519Signature[];
  /** A 4-byte bitmap indicating which key indices signed. */
  public readonly bitmap: Uint8Array;

  /**
   * Creates a `MultiEd25519Signature`.
   *
   * @param args - Configuration object.
   * @param args.signatures - The individual Ed25519 signatures.
   * @param args.bitmap - Either a pre-built 4-byte `Uint8Array` or an array of
   *   signer index numbers from which the bitmap is constructed.
   * @throws If the number of signatures exceeds `MAX_SIGNATURES_SUPPORTED`.
   * @throws If the bitmap length is not 4 bytes.
   */
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

  /**
   * Returns the raw byte representation: the concatenation of all signature
   * bytes followed by the 4-byte bitmap.
   *
   * @returns The multi-signature bytes as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    const bytes = new Uint8Array(this.signatures.length * Ed25519Signature.LENGTH + MultiEd25519Signature.BITMAP_LEN);
    this.signatures.forEach((k: Ed25519Signature, i: number) => {
      bytes.set(k.toUint8Array(), i * Ed25519Signature.LENGTH);
    });
    bytes.set(this.bitmap, this.signatures.length * Ed25519Signature.LENGTH);
    return bytes;
  }

  /**
   * BCS-serialises the multi-signature by writing its raw bytes with a length
   * prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  /**
   * Deserialises a `MultiEd25519Signature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiEd25519Signature`.
   */
  static deserialize(deserializer: Deserializer): MultiEd25519Signature {
    const bytes = deserializer.deserializeBytes();
    if (bytes.length < MultiEd25519Signature.BITMAP_LEN) {
      throw new Error(
        `MultiEd25519Signature bytes too short: expected at least ${MultiEd25519Signature.BITMAP_LEN}, got ${bytes.length}`,
      );
    }
    const sigBytes = bytes.length - MultiEd25519Signature.BITMAP_LEN;
    if (sigBytes % Ed25519Signature.LENGTH !== 0) {
      throw new Error(
        `MultiEd25519Signature signature bytes are not aligned: ${sigBytes} is not a multiple of ${Ed25519Signature.LENGTH}`,
      );
    }
    const bitmap = bytes.subarray(bytes.length - MultiEd25519Signature.BITMAP_LEN);
    const signatures: Ed25519Signature[] = [];
    for (let i = 0; i < sigBytes; i += Ed25519Signature.LENGTH) {
      signatures.push(new Ed25519Signature(bytes.subarray(i, i + Ed25519Signature.LENGTH)));
    }
    return new MultiEd25519Signature({ signatures, bitmap });
  }

  /**
   * Builds a 4-byte bitmap from an array of signer index numbers.
   *
   * Indices must be in strictly ascending order.
   *
   * @param args - Object containing the `bits` array of signer indices.
   * @returns A 4-byte `Uint8Array` with the corresponding bits set.
   * @throws If any index is ≥ `MAX_SIGNATURES_SUPPORTED`.
   * @throws If any index appears more than once.
   * @throws If the indices are not in strictly ascending order.
   *
   * @example
   * ```ts
   * const bitmap = MultiEd25519Signature.createBitmap({ bits: [0, 2] });
   * ```
   */
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
