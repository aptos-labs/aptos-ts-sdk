import { Serializer, Deserializer, Serializable } from "../../bcs";
import { SigningSchemeInput } from "../../types";
import { Signature } from "./asymmetricCrypto";
import { Ed25519Signature } from "./ed25519";
import { Secp256k1Signature } from "./secp256k1";

export class AnySignature extends Serializable {
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
    if (this.signature instanceof Ed25519Signature) {
      serializer.serializeU32AsUleb128(SigningSchemeInput.Ed25519);
      this.signature.serialize(serializer);
    } else if (this.signature instanceof Secp256k1Signature) {
      serializer.serializeU32AsUleb128(SigningSchemeInput.Secp256k1Ecdsa);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Unknown signature type");
    }
  }

  static deserialize(deserializer: Deserializer): AnySignature {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case SigningSchemeInput.Ed25519:
        return new AnySignature(Ed25519Signature.deserialize(deserializer));
      case SigningSchemeInput.Secp256k1Ecdsa:
        return new AnySignature(Secp256k1Signature.deserialize(deserializer));
      default:
        throw new Error(`Unknown signature scheme for AnySignature: ${index}`);
    }
  }
}
