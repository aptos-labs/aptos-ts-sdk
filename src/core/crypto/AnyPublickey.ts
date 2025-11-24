import { AptosConfig } from "../../api";
import { Serializer } from "../../bcs";
import { HexInput } from "../../types";
import { AuthenticationKey } from "../authenticationKey";
import { SigningScheme } from "../../types";
import { Ed25519PublicKey } from "./ed25519";
import { AccountPublicKey, PublicKey } from "./publicKey";
import { Secp256k1PublicKey } from "./secp256k1";
import { Signature } from "./signature";
import { AnySignature } from "./singleKey";

/**
 * Represents any public key supported by Aptos.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentication keys.
 *
 * Any unified authentication key is represented in the SDK as `AnyPublicKey`.
 * @group Implementation
 * @category Serialization
 */
export class AnyPublicKey extends AccountPublicKey {
    /**
     * Reference to the inner public key
     * @group Implementation
     * @category Serialization
     */
    public readonly publicKey: PublicKey;
  
    // region Constructors
  
    /**
     * Creates an instance of the signature class based on the provided signature type.
     * This allows for the handling of different signature variants such as Ed25519, Secp256k1, and Keyless.
     *
     * @param publicKey - The publicKey object which determines the variant to be used.
     * @throws Error if the provided signature type is unsupported.
     * @group Implementation
     * @category Serialization
     */
    constructor(publicKey: PublicKey) {
      super();
      this.publicKey = publicKey;
    }
  
    // endregion
  
    // region AccountPublicKey
  
    /**
     * Verifies the provided signature against the given message.
     * This function helps ensure the integrity and authenticity of the message by confirming that the signature is valid.
     *
     * @param args - The arguments for signature verification.
     * @param args.message - The message that was signed.
     * @param args.signature - The signature to verify, which must be an instance of AnySignature.
     * @returns A boolean indicating whether the signature is valid for the given message.
     * @group Implementation
     * @category Serialization
     */
    verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
      const { message, signature } = args;
      return this.publicKey.verifySignature({
        message,
        signature: signature.signature,
      });
    }
  
    /**
     * Verifies the provided signature against the given message.
     * This function helps ensure the integrity and authenticity of the message by confirming that the signature is valid.
     *
     * @param args - The arguments for signature verification.
     * @param args.aptosConfig - The configuration object for connecting to the Aptos network
     * @param args.message - The message that was signed.
     * @param args.signature - The signature to verify, which must be an instance of AnySignature.
     * @returns A boolean indicating whether the signature is valid for the given message.
     * @group Implementation
     * @category Serialization
     */
    async verifySignatureAsync(args: {
      aptosConfig: AptosConfig;
      message: HexInput;
      signature: Signature;
      options?: { throwErrorWithReason?: boolean };
    }): Promise<boolean> {
      if (!(args.signature instanceof AnySignature)) {
        if (args.options?.throwErrorWithReason) {
          throw new Error("Signature must be an instance of AnySignature");
        }
        return false;
      }
      return await this.publicKey.verifySignatureAsync({
        ...args,
        signature: args.signature.signature,
      });
    }
  
    /**
     * Generates an authentication key from the current instance's byte representation.
     * This function is essential for creating a unique identifier for authentication purposes.
     *
     * @returns {AuthenticationKey} The generated authentication key.
     * @group Implementation
     * @category Serialization
     */
    authKey(): AuthenticationKey {
      return AuthenticationKey.fromSchemeAndBytes({
        scheme: SigningScheme.SingleKey,
        input: this.toUint8Array(),
      });
    }
  
    /**
     * Get the signature in bytes (Uint8Array).
     *
     * This function is a warning that it will soon return the underlying signature bytes directly.
     * Use AnySignature.bcsToBytes() instead.
     *
     * @returns Uint8Array representation of the signature.
     * @group Implementation
     * @category Serialization
     */
    toUint8Array(): Uint8Array {
      return this.bcsToBytes();
    }
  
    // endregion
  
    // region Serializable
  
    /**
     * Serializes the current object using the provided serializer.
     * This function helps in converting the object into a format suitable for transmission or storage.
     *
     * @param serializer - The serializer instance used to perform the serialization.
     * @group Implementation
     * @category Serialization
     */
    serialize(serializer: Serializer): void {
      if (this.publicKey.AnyPublicKeyVariant) {
        serializer.serializeU32AsUleb128(this.publicKey.AnyPublicKeyVariant);
      } else {
        throw new Error("Public key variant is not supported");
      }
      serializer.serializeU32AsUleb128(this.publicKey.AnyPublicKeyVariant);
      this.publicKey.serialize(serializer);
    }
  
    // endregion
  
    /**
     * Determines if the provided public key is an instance of AnyPublicKey.
     *
     * @param publicKey - The public key to check.
     * @deprecated Use `instanceof AnyPublicKey` instead.
     * @group Implementation
     * @category Serialization
     */
    static isPublicKey(publicKey: AccountPublicKey): publicKey is AnyPublicKey {
      return publicKey instanceof AnyPublicKey;
    }
  
    /**
     * Determines if the current public key is an instance of Ed25519PublicKey.
     *
     * @deprecated use `publicKey instanceof Ed25519PublicKey` instead.
     * @group Implementation
     * @category Serialization
     */
    isEd25519(): boolean {
      return this.publicKey instanceof Ed25519PublicKey;
    }
  
    /**
     * Checks if the public key is an instance of Secp256k1PublicKey.
     *
     * @deprecated use `publicKey instanceof Secp256k1PublicKey` instead.
     * @group Implementation
     * @category Serialization
     */
    isSecp256k1PublicKey(): boolean {
      return this.publicKey instanceof Secp256k1PublicKey;
    }
  
    /**
     * Determines if the provided publicKey is an instance of a valid PublicKey object.
     *
     * @param publicKey - The publicKey to be checked for validity.
     * @param publicKey.publicKey - The actual publicKey object that needs to be validated.
     * @returns True if the signature is a valid instance; otherwise, false.
     * @group Implementation
     * @category Serialization
     */
    static isInstance(publicKey: PublicKey): publicKey is AnyPublicKey {
      return "publicKey" in publicKey && "variant" in publicKey;
    }
  }