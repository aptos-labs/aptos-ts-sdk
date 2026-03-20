import { AptosConfig } from "../../api";
import { Serializable } from "../../bcs";
import { HexInput } from "../../types";
import { AuthenticationKey } from "../authenticationKey";
import { Hex } from "../hex";
import { Signature } from "./signature";

/**
 * Represents the arguments required to verify a digital signature.
 *
 * @param message - The original message that was signed.
 * @param signature - The signature to be verified against the message.
 * @group Implementation
 * @category Serialization
 */
export interface VerifySignatureArgs {
  message: HexInput;
  signature: Signature;
}

/**
 * Represents the arguments required to verify a digital signature asynchronously.
 *
 * The validity of certain types of signatures are dependent on network state.  This is the case for
 * Keyless signatures which need to lookup the verification key and keyless configuration.
 *
 * @param aptosConfig - The Aptos configuration to use
 * @param message - The original message that was signed.
 * @param signature - The signature to be verified against the message.
 * @group Implementation
 * @category Serialization
 */
export type VerifySignatureAsyncArgs = VerifySignatureArgs & {
  aptosConfig: AptosConfig;
  options?: any;
};

/**
 * Represents an abstract public key.
 *
 * This class provides a common interface for verifying signatures associated with the public key.
 * It allows for the retrieval of the raw public key bytes and the public key in a hexadecimal string format.
 * @group Implementation
 * @category Serialization
 */
export abstract class PublicKey extends Serializable {
  /**
   * Verifies that the private key associated with this public key signed the message with the given signature.
   * @param args.message The message that was signed
   * @param args.signature The signature to verify
   * @group Implementation
   * @category Serialization
   */
  abstract verifySignature(args: VerifySignatureArgs): boolean;

  /**
   * Verifies signature with the public key and makes any network calls required to get state required to verify the signature.
   * @param args.aptosConfig The Aptos configuration
   * @param args.message The message that was signed
   * @param args.signature The signature to verify
   * @group Implementation
   * @category Serialization
   */
  async verifySignatureAsync(args: VerifySignatureAsyncArgs): Promise<boolean> {
    return this.verifySignature(args);
  }

  /**
   * Get the raw public key bytes
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Get the public key as a hex string with a 0x prefix.
   *
   * @returns The public key in hex format.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}

/**
 * An abstract representation of an account public key.
 *
 * Provides a common interface for deriving an authentication key.
 *
 * @abstract
 * @group Implementation
 * @category Serialization
 */
export abstract class AccountPublicKey extends PublicKey {
  /**
   * Get the authentication key associated with this public key
   * @group Implementation
   * @category Serialization
   */
  abstract authKey(): AuthenticationKey;
}
