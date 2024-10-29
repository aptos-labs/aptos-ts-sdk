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
 */
export interface VerifySignatureArgs {
  message: HexInput;
  signature: Signature;
}

/**
 * Represents an abstract public key.
 *
 * This class provides a common interface for verifying signatures associated with the public key.
 * It allows for the retrieval of the raw public key bytes and the public key in a hexadecimal string format.
 */
export abstract class PublicKey extends Serializable {
  /**
   * Verifies that the private key associated with this public key signed the message with the given signature.
   * @param args.message The message that was signed
   * @param args.signature The signature to verify
   */
  abstract verifySignature(args: VerifySignatureArgs): boolean;

  /**
   * Get the raw public key bytes
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Get the public key as a hex string with a 0x prefix.
   *
   * @returns The public key in hex format.
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
 */
export abstract class AccountPublicKey extends PublicKey {
  /**
   * Get the authentication key associated with this public key
   */
  abstract authKey(): AuthenticationKey;
}
