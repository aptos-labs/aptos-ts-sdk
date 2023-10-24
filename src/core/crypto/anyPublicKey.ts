import { Serializer, Deserializer } from "../../bcs";
import { AnyPublicKeyVariant, HexInput } from "../../types";
import { AnySignature } from "./anySignature";
import { PublicKey } from "./asymmetricCrypto";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1";

export class AnyPublicKey extends PublicKey {
  public readonly publicKey: PublicKey;

  constructor(publicKey: PublicKey) {
    super();
    this.publicKey = publicKey;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.publicKey.toUint8Array();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return this.publicKey.toString();
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
    const { message, signature } = args;
    if (this.isED25519Signature(signature)) {
      return this.publicKey.verifySignature({ message, signature: signature.signature });
      // eslint-disable-next-line no-else-return
    } else if (this.isSecp256k1Signature(signature)) {
      return this.publicKey.verifySignature({ message, signature: signature.signature });
    } else {
      throw new Error("Unknown public key type");
    }
  }

  isED25519Signature(signature: AnySignature): boolean {
    return this.publicKey instanceof Ed25519PublicKey && signature.signature instanceof Ed25519Signature;
  }

  isSecp256k1Signature(signature: AnySignature): boolean {
    return this.publicKey instanceof Secp256k1PublicKey && signature.signature instanceof Secp256k1Signature;
  }

  serialize(serializer: Serializer): void {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(AnyPublicKeyVariant.Ed25519);
      this.publicKey.serialize(serializer);
    } else if (this.publicKey instanceof Secp256k1PublicKey) {
      serializer.serializeU32AsUleb128(AnyPublicKeyVariant.Secp256k1);
      this.publicKey.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

  static deserialize(deserializer: Deserializer): AnyPublicKey {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AnyPublicKeyVariant.Ed25519:
        return new AnyPublicKey(Ed25519PublicKey.load(deserializer));
      case AnyPublicKeyVariant.Secp256k1:
        return new AnyPublicKey(Secp256k1PublicKey.load(deserializer));
      default:
        throw new Error(`Unknown variant index for AnyPublicKey: ${index}`);
    }
  }
}
