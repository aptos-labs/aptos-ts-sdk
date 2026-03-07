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

export abstract class AbstractMultiKey extends AccountPublicKey {
  publicKeys: PublicKey[];

  constructor(args: { publicKeys: PublicKey[] }) {
    super();
    this.publicKeys = args.publicKeys;
  }

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

  getIndex(publicKey: PublicKey): number {
    const index = this.publicKeys.findIndex((pk) => pk.toString() === publicKey.toString());
    if (index !== -1) return index;
    throw new Error(`Public key ${publicKey} not found in multi key set ${this.publicKeys}`);
  }

  abstract getSignaturesRequired(): number;
}

export class MultiKey extends AbstractMultiKey {
  public readonly publicKeys: AnyPublicKey[];
  public readonly signaturesRequired: number;

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

  getSignaturesRequired(): number {
    return this.signaturesRequired;
  }

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

  authKey(): unknown {
    return createAuthKey(SigningScheme.MultiKey, this.bcsToBytes());
  }

  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.publicKeys);
    serializer.serializeU8(this.signaturesRequired);
  }

  static deserialize(deserializer: Deserializer): MultiKey {
    const keys = deserializer.deserializeVector(AnyPublicKey);
    const signaturesRequired = deserializer.deserializeU8();
    return new MultiKey({ publicKeys: keys, signaturesRequired });
  }

  getIndex(publicKey: PublicKey): number {
    const anyPublicKey = publicKey instanceof AnyPublicKey ? publicKey : new AnyPublicKey(publicKey);
    return super.getIndex(anyPublicKey);
  }
}

export class MultiKeySignature extends Signature {
  static BITMAP_LEN: number = 4;
  static MAX_SIGNATURES_SUPPORTED = MultiKeySignature.BITMAP_LEN * 8;

  public readonly signatures: AnySignature[];
  public readonly bitmap: Uint8Array;

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

  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.signatures);
    serializer.serializeBytes(this.bitmap);
  }

  static deserialize(deserializer: Deserializer): MultiKeySignature {
    const signatures = deserializer.deserializeVector(AnySignature);
    const bitmap = deserializer.deserializeBytes();
    return new MultiKeySignature({ signatures, bitmap });
  }
}
