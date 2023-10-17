import { Serializer, Deserializer } from "../../bcs";
import { AnySignatureVariant } from "../../types";
import { Signature } from "./asymmetric_crypto";
import { Ed25519PublicKey } from "./ed25519";
import { Secp256k1PublicKey } from "./secp256k1";

export class AnySignature extends Signature {
  public readonly signature: Signature;

  constructor(signature: Signature) {
    super();
    this.signature = signature;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.signature.toUint8Array();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return this.signature.toString();
  }

  serialize(serializer: Serializer): void {
    if (this.signature instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(AnySignatureVariant.Ed25519);
      this.signature.serialize(serializer);
    } else if (this.signature instanceof Secp256k1PublicKey) {
      serializer.serializeU32AsUleb128(AnySignatureVariant.Secp256k1);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

  static deserialize(deserializer: Deserializer): AnySignature {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AnySignatureVariant.Ed25519:
        return new AnySignature(Ed25519PublicKey.load(deserializer));
      case AnySignatureVariant.Secp256k1:
        return new AnySignature(Secp256k1PublicKey.load(deserializer));
      default:
        throw new Error(`Unknown variant index for AnyPublicKey: ${index}`);
    }
  }
}
