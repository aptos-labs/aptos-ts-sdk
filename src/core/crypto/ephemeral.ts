import { Serializer, Deserializer } from "../../bcs";
import { EphemeralPublicKeyVariant, EphemeralSignatureVariant, HexInput } from "../../types";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { Hex } from "../hex";

/**
 * Represents ephemeral public keys for Aptos Keyless accounts.
 *
 * These keys are used only temporarily within Keyless accounts and are not utilized as public keys for account identification.
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

  /**
   * Creates an instance of EphemeralPublicKey using the provided public key.
   * This constructor ensures that only supported signature types are accepted.
   *
   * @param publicKey - The public key to be used for the ephemeral public key.
   * @throws Error if the signature type is unsupported.
   */
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
   * Verifies a signed message using the ephemeral public key.
   *
   * @param args - The arguments for the verification.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature that was signed by the private key of the ephemeral public key.
   * @returns true if the signature is valid, otherwise false.
   */
  verifySignature(args: { message: HexInput; signature: EphemeralSignature }): boolean {
    const { message, signature } = args;
    return this.publicKey.verifySignature({ message, signature: signature.signature });
  }

  /**
   * Serializes the current instance, specifically handling the Ed25519 signature type.
   * This function ensures that the signature is properly serialized using the provided serializer.
   *
   * @param serializer - The serializer instance used to serialize the signature.
   * @throws Error if the signature type is unknown.
   */
  serialize(serializer: Serializer): void {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(EphemeralPublicKeyVariant.Ed25519);
      this.publicKey.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

  /**
   * Deserializes an EphemeralSignature from the provided deserializer.
   * This function allows you to retrieve an EphemeralSignature based on the deserialized data.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   */
  static deserialize(deserializer: Deserializer): EphemeralPublicKey {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralPublicKeyVariant.Ed25519:
        return new EphemeralPublicKey(Ed25519PublicKey.deserialize(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${index}`);
    }
  }

  /**
   * Determines if the provided public key is an instance of `EphemeralPublicKey`.
   *
   * @param publicKey - The public key to check.
   * @returns A boolean indicating whether the public key is an ephemeral type.
   */
  static isPublicKey(publicKey: PublicKey): publicKey is EphemeralPublicKey {
    return publicKey instanceof EphemeralPublicKey;
  }
}

/**
 * Represents ephemeral signatures used in Aptos Keyless accounts.
 *
 * These signatures are utilized within the KeylessSignature framework.
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
   * Deserializes an ephemeral signature from a hexadecimal input.
   * This function allows you to convert a hexadecimal representation of an ephemeral signature into its deserialized form for
   * further processing.
   *
   * @param hexInput - The hexadecimal input representing the ephemeral signature.
   */
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
