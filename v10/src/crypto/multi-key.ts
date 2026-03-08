import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { AccountPublicKey, createAuthKey, type PublicKey } from "./public-key.js";
import { Signature } from "./signature.js";
import { AnyPublicKey, AnySignature } from "./single-key.js";
import { AnyPublicKeyVariant, SigningScheme } from "./types.js";

function bitCount(byte: number) {
  let n = byte;
  n -= (n >> 1) & 0x55555555;
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

const MAX_NUM_KEYLESS_PUBLIC_FOR_MULTI_KEY = 3;

/**
 * Abstract base class shared by {@link MultiKey} and {@link MultiEd25519PublicKey}.
 *
 * Provides bitmap construction and key-index lookup utilities used by both
 * multi-signature scheme implementations.
 */
export abstract class AbstractMultiKey extends AccountPublicKey {
  /** The ordered list of public keys that make up this multi-key set. */
  publicKeys: PublicKey[];

  /**
   * Creates an `AbstractMultiKey` with the given set of public keys.
   *
   * @param args - Object containing the `publicKeys` array.
   */
  constructor(args: { publicKeys: PublicKey[] }) {
    super();
    this.publicKeys = args.publicKeys;
  }

  /**
   * Constructs a 4-byte bitmap where each set bit corresponds to a signer
   * index within `publicKeys`.
   *
   * @param args - Object with a `bits` array of signer indices (0-based).
   * @returns A 4-byte `Uint8Array` bitmap with the specified bits set.
   * @throws If any index exceeds the number of public keys.
   * @throws If the same index appears more than once.
   *
   * @example
   * ```ts
   * const bitmap = multiKey.createBitmap({ bits: [0, 2] });
   * ```
   */
  createBitmap(args: { bits: number[] }): Uint8Array {
    const { bits } = args;
    const firstBitInByte = 128;
    const bitmap = new Uint8Array([0, 0, 0, 0]);
    const dupCheckSet = new Set<number>();

    bits.forEach((bit: number, idx: number) => {
      if (idx + 1 > this.publicKeys.length) {
        throw new Error(`Signature index ${idx + 1} is out of public keys range, ${this.publicKeys.length}.`);
      }
      if (dupCheckSet.has(bit)) {
        throw new Error(`Duplicate bit ${bit} detected.`);
      }
      dupCheckSet.add(bit);
      const byteOffset = Math.floor(bit / 8);
      let byte = bitmap[byteOffset];
      byte |= firstBitInByte >> (bit % 8);
      bitmap[byteOffset] = byte;
    });

    return bitmap;
  }

  /**
   * Returns the index of a public key within this multi-key set.
   *
   * @param publicKey - The public key to look up.
   * @returns The 0-based index of the key.
   * @throws If the public key is not found in the set.
   */
  getIndex(publicKey: PublicKey): number {
    const index = this.publicKeys.findIndex((pk) => pk.toString() === publicKey.toString());
    if (index !== -1) return index;
    throw new Error(`Public key ${publicKey} not found in multi key set ${this.publicKeys}`);
  }

  /**
   * Returns the number of signatures required to authorise a transaction.
   */
  abstract getSignaturesRequired(): number;
}

/**
 * A K-of-N multi-key public key that supports any combination of signing
 * schemes supported by {@link AnyPublicKey} (Ed25519, Secp256k1, Keyless, etc.).
 *
 * On-chain this corresponds to the `MultiKey` authenticator introduced in
 * AIP-55.
 *
 * @example
 * ```ts
 * const multiKey = new MultiKey({
 *   publicKeys: [ed25519Key, secp256k1Key],
 *   signaturesRequired: 2,
 * });
 * ```
 */
export class MultiKey extends AbstractMultiKey {
  /** The ordered list of {@link AnyPublicKey} wrappers. */
  public readonly publicKeys: AnyPublicKey[];
  /** The minimum number of valid signatures required to authenticate. */
  public readonly signaturesRequired: number;

  /**
   * Creates a `MultiKey` from an array of public keys and a required-
   * signatures threshold.
   *
   * @param args - Configuration object.
   * @param args.publicKeys - The public keys that form the multi-key set.
   *   Each key may be any concrete {@link PublicKey}; they are wrapped in
   *   {@link AnyPublicKey} automatically if not already.
   * @param args.signaturesRequired - The minimum number of signatures needed
   *   to authorise a transaction (must be ≥ 1 and ≤ `publicKeys.length`).
   * @throws If `signaturesRequired` is less than 1.
   * @throws If `publicKeys.length` is less than `signaturesRequired`.
   * @throws If `signaturesRequired > 3` and the set contains more than 3
   *   Keyless public keys.
   */
  constructor(args: { publicKeys: Array<PublicKey>; signaturesRequired: number }) {
    const { publicKeys, signaturesRequired } = args;
    super({ publicKeys });

    if (signaturesRequired < 1) {
      throw new Error("The number of required signatures needs to be greater than 0");
    }
    if (publicKeys.length < signaturesRequired) {
      throw new Error(
        `Provided ${publicKeys.length} public keys is smaller than the ${signaturesRequired} required signatures`,
      );
    }

    this.publicKeys = publicKeys.map((pk) => (pk instanceof AnyPublicKey ? pk : new AnyPublicKey(pk)));

    if (signaturesRequired > MAX_NUM_KEYLESS_PUBLIC_FOR_MULTI_KEY) {
      const keylessCount = this.publicKeys.filter(
        (pk) => pk.variant === AnyPublicKeyVariant.Keyless || pk.variant === AnyPublicKeyVariant.FederatedKeyless,
      ).length;
      if (keylessCount > MAX_NUM_KEYLESS_PUBLIC_FOR_MULTI_KEY) {
        throw new Error(
          `Construction of MultiKey with more than ${MAX_NUM_KEYLESS_PUBLIC_FOR_MULTI_KEY} keyless public keys is not allowed when signaturesRequired is greater than ${MAX_NUM_KEYLESS_PUBLIC_FOR_MULTI_KEY}.`,
        );
      }
    }

    this.signaturesRequired = signaturesRequired;
  }

  /**
   * Returns the minimum number of signatures required to authorise a
   * transaction with this multi-key.
   *
   * @returns The `signaturesRequired` threshold.
   */
  getSignaturesRequired(): number {
    return this.signaturesRequired;
  }

  /**
   * Verifies a {@link MultiKeySignature} against this multi-key public key.
   *
   * The number of signatures in `signature` must equal `signaturesRequired`,
   * and each signature must be valid for its corresponding public key as
   * indicated by the bitmap.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if all required signatures are valid, `false` otherwise.
   * @throws If the signature count does not match `signaturesRequired`.
   */
  verifySignature(args: { message: HexInput; signature: MultiKeySignature }): boolean {
    const { message, signature } = args;
    if (signature.signatures.length !== this.signaturesRequired) {
      throw new Error("The number of signatures does not match the number of required signatures");
    }
    const signerIndices = signature.bitMapToSignerIndices();
    for (let i = 0; i < signature.signatures.length; i += 1) {
      const singleSignature = signature.signatures[i];
      const publicKey = this.publicKeys[signerIndices[i]];
      if (!publicKey.verifySignature({ message, signature: singleSignature })) {
        return false;
      }
    }
    return true;
  }

  /**
   * Derives the on-chain authentication key for this multi-key using the
   * `MultiKey` signing scheme.
   *
   * @returns The `AccountAddress` representing the authentication key.
   */
  authKey(): unknown {
    return createAuthKey(SigningScheme.MultiKey, this.bcsToBytes());
  }

  /**
   * BCS-serialises the multi-key by writing the public key vector followed by
   * the `signaturesRequired` byte.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.publicKeys);
    serializer.serializeU8(this.signaturesRequired);
  }

  /**
   * Deserialises a `MultiKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiKey`.
   */
  static deserialize(deserializer: Deserializer): MultiKey {
    const keys = deserializer.deserializeVector(AnyPublicKey);
    const signaturesRequired = deserializer.deserializeU8();
    return new MultiKey({ publicKeys: keys, signaturesRequired });
  }

  /**
   * Returns the index of a public key within this multi-key set.
   *
   * The key is wrapped in {@link AnyPublicKey} before lookup if it is not
   * already an `AnyPublicKey` instance.
   *
   * @param publicKey - The public key to locate.
   * @returns The 0-based index of the key.
   * @throws If the key is not found.
   */
  getIndex(publicKey: PublicKey): number {
    const anyPublicKey = publicKey instanceof AnyPublicKey ? publicKey : new AnyPublicKey(publicKey);
    return super.getIndex(anyPublicKey);
  }
}

/**
 * A multi-signature over a single message, produced by K-of-N signers from a
 * {@link MultiKey} key set.
 *
 * The `bitmap` field encodes which keys in the set signed; the `signatures`
 * array contains the corresponding signatures in the same order.
 *
 * @example
 * ```ts
 * const sig = new MultiKeySignature({
 *   signatures: [anySignature1, anySignature2],
 *   bitmap: multiKey.createBitmap({ bits: [0, 1] }),
 * });
 * ```
 */
export class MultiKeySignature extends Signature {
  /** The byte length of the bitmap (supports up to 32 signers). */
  static BITMAP_LEN: number = 4;
  /** Maximum number of signers supported by the bitmap. */
  static MAX_SIGNATURES_SUPPORTED = MultiKeySignature.BITMAP_LEN * 8;

  /** The individual signatures from each signer. */
  public readonly signatures: AnySignature[];
  /** A 4-byte bitmap indicating which key indices signed. */
  public readonly bitmap: Uint8Array;

  /**
   * Creates a `MultiKeySignature`.
   *
   * @param args - Configuration object.
   * @param args.signatures - The individual signatures.  Each may be a
   *   concrete {@link Signature} or an {@link AnySignature}; plain signatures
   *   are wrapped automatically.
   * @param args.bitmap - Either a pre-built 4-byte `Uint8Array` or an array
   *   of signer index numbers from which the bitmap is constructed.
   * @throws If the number of signatures exceeds {@link MAX_SIGNATURES_SUPPORTED}.
   * @throws If the bitmap length is not 4 bytes.
   * @throws If the number of set bits in the bitmap does not match the number
   *   of signatures.
   */
  constructor(args: { signatures: Array<Signature | AnySignature>; bitmap: Uint8Array | number[] }) {
    super();
    const { signatures, bitmap } = args;

    if (signatures.length > MultiKeySignature.MAX_SIGNATURES_SUPPORTED) {
      throw new Error(`The number of signatures cannot be greater than ${MultiKeySignature.MAX_SIGNATURES_SUPPORTED}`);
    }

    this.signatures = signatures.map((sig) => (sig instanceof AnySignature ? sig : new AnySignature(sig)));

    if (!(bitmap instanceof Uint8Array)) {
      this.bitmap = MultiKeySignature.createBitmap({ bits: bitmap });
    } else if (bitmap.length !== MultiKeySignature.BITMAP_LEN) {
      throw new Error(`"bitmap" length should be ${MultiKeySignature.BITMAP_LEN}`);
    } else {
      this.bitmap = bitmap;
    }

    const nSignatures = this.bitmap.reduce((acc, byte) => acc + bitCount(byte), 0);
    if (nSignatures !== this.signatures.length) {
      throw new Error(`Expecting ${nSignatures} signatures from the bitmap, but got ${this.signatures.length}`);
    }
  }

  /**
   * Builds a 4-byte bitmap from an array of signer index numbers.
   *
   * @param args - Object containing the `bits` array of signer indices.
   * @returns A 4-byte `Uint8Array` with the corresponding bits set.
   * @throws If any index is ≥ {@link MAX_SIGNATURES_SUPPORTED}.
   * @throws If any index appears more than once.
   *
   * @example
   * ```ts
   * const bitmap = MultiKeySignature.createBitmap({ bits: [0, 3] });
   * ```
   */
  static createBitmap(args: { bits: number[] }): Uint8Array {
    const { bits } = args;
    const firstBitInByte = 128;
    const bitmap = new Uint8Array([0, 0, 0, 0]);
    const dupCheckSet = new Set<number>();

    bits.forEach((bit: number) => {
      if (bit >= MultiKeySignature.MAX_SIGNATURES_SUPPORTED) {
        throw new Error(`Cannot have a signature larger than ${MultiKeySignature.MAX_SIGNATURES_SUPPORTED - 1}.`);
      }
      if (dupCheckSet.has(bit)) {
        throw new Error("Duplicate bits detected.");
      }
      dupCheckSet.add(bit);
      const byteOffset = Math.floor(bit / 8);
      let byte = bitmap[byteOffset];
      byte |= firstBitInByte >> (bit % 8);
      bitmap[byteOffset] = byte;
    });

    return bitmap;
  }

  /**
   * Decodes the bitmap into an ordered list of signer indices.
   *
   * @returns An array of 0-based key indices corresponding to the set bits in
   *   the bitmap, in ascending order.
   */
  bitMapToSignerIndices(): number[] {
    const signerIndices: number[] = [];
    for (let i = 0; i < this.bitmap.length; i += 1) {
      const byte = this.bitmap[i];
      for (let bit = 0; bit < 8; bit += 1) {
        if ((byte & (128 >> bit)) !== 0) {
          signerIndices.push(i * 8 + bit);
        }
      }
    }
    return signerIndices;
  }

  /**
   * BCS-serialises the multi-key signature by writing the signature vector
   * followed by the bitmap bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.signatures);
    serializer.serializeBytes(this.bitmap);
  }

  /**
   * Deserialises a `MultiKeySignature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiKeySignature`.
   */
  static deserialize(deserializer: Deserializer): MultiKeySignature {
    const signatures = deserializer.deserializeVector(AnySignature);
    const bitmap = deserializer.deserializeBytes();
    return new MultiKeySignature({ signatures, bitmap });
  }
}
