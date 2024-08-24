import { Serializer, Deserializer } from "../../bcs";
import { EphemeralPublicKeyVariant, EphemeralSignatureVariant, HexInput } from "../../types";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { Hex } from "../hex";

/**
 * Represents ephemeral public keys for Aptos Keyless accounts.
 *
 * These are not public keys used as a public key on an account.  They are only used ephemerally on Keyless accounts.
 */
export class EphemeralPublicKey extends PublicKey {
  /**
   * The public key itself
   */
  public readonly publicKey: PublicKey;

  /**
   * An enum indicating the scheme of the ephemeral public key
   */
  public readonly variant: EphemeralPublicKeyVariant;

  constructor(publicKey: PublicKey) {
    super();
    const publicKeyType = publicKey.constructor.name;
    switch (publicKeyType) {
      case Ed25519PublicKey.name:
        this.publicKey = publicKey;
        this.variant = EphemeralPublicKeyVariant.Ed25519;
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
    return this.bcsToBytes();
  }

  /**
   * Verifies a signed data with a the ephemeral public key
   *
   * @param args.message message
   * @param args.signature The signature that was signed by the private key of the ephemeral public key
   * @returns true if the signature is valid
   */
  verifySignature(args: { message: HexInput; signature: EphemeralSignature }): boolean {
    const { message, signature } = args;
    return this.publicKey.verifySignature({ message, signature: signature.signature });
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
        return new EphemeralPublicKey(Ed25519PublicKey.deserialize(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${index}`);
    }
  }

  static isPublicKey(publicKey: PublicKey): publicKey is EphemeralPublicKey {
    return publicKey instanceof EphemeralPublicKey;
  }
}

/**
 * Represents ephemeral signatures used in Aptos Keyless accounts.
 *
 * These signatures are used inside of KeylessSignature
 */
export class EphemeralSignature extends Signature {
  /**
   * The signature signed by the private key of an EphemeralKeyPair
   */
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
    return this.bcsToBytes();
  }

  static fromHex(hexInput: HexInput): EphemeralSignature {
    const data = Hex.fromHexInput(hexInput);
    const deserializer = new Deserializer(data.toUint8Array());
    return EphemeralSignature.deserialize(deserializer);
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
        return new EphemeralSignature(Ed25519Signature.deserialize(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralSignature: ${index}`);
    }
  }
}
