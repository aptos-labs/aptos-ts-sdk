import { Serializer, Deserializer } from "../../bcs";
import { EphemeralSignatureVariant } from "../../types";
import { Signature } from "./asymmetricCrypto";
import { Ed25519Signature } from "./ed25519";

export class EphemeralSignature extends Signature {
  public readonly signature: Signature;

  constructor(signature: Signature) {
    super();
    const signatureType = signature.constructor.name;
    switch (signatureType) {
      case Ed25519Signature.name:
        this.signature = signature;
        break;
      default:
        throw new Error(`Unsupported signature for EphemeralSignature - ${signatureType}`);
    }
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
      serializer.serializeU32AsUleb128(EphemeralSignatureVariant.Ed25519);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Unknown signature type");
    }
  }

  static deserialize(deserializer: Deserializer): EphemeralSignature {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralSignatureVariant.Ed25519:
        return new EphemeralSignature(Ed25519Signature.load(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralSignature: ${index}`);
    }
  }
}
