import { Serializer, Deserializer } from "../../bcs";
import { EphemeralPublicKeyVariant, HexInput } from "../../types";
import { PublicKey } from "./asymmetricCrypto";
import { Ed25519PublicKey } from "./ed25519";
import { EphemeralSignature } from "./ephemeralSignature";

/**
 * Represents any public key supported by Aptos.
 *
 * TODO
 */
export class EphemeralPublicKey extends PublicKey {
  /**
   * Reference to the inner public key
   */
  public readonly publicKey: PublicKey;

  constructor(publicKey: PublicKey) {
    super();
    const publicKeyType = publicKey.constructor.name;
    switch (publicKeyType) {
      case Ed25519PublicKey.name:
        this.publicKey = publicKey;
        break;
      default:
        throw new Error(`Unsupported key for EphemeralPublicKey - ${publicKeyType}`);
    }
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
  verifySignature(args: { message: HexInput; signature: EphemeralSignature }): boolean {
    const { message, signature } = args;
    return this.publicKey.verifySignature({ message, signature });
  }

  serialize(serializer: Serializer): void {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(EphemeralPublicKeyVariant.Ed25519);
      this.publicKey.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

  static deserialize(deserializer: Deserializer): EphemeralPublicKey {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralPublicKeyVariant.Ed25519:
        return new EphemeralPublicKey(Ed25519PublicKey.load(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${index}`);
    }
  }

  static isPublicKey(publicKey: PublicKey): publicKey is EphemeralPublicKey {
    return publicKey instanceof EphemeralPublicKey;
  }

  isEd25519(): this is Ed25519PublicKey {
    return this.publicKey instanceof Ed25519PublicKey;
  }
}
