import { HexInput } from "../../types";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";

/**
 * Represents a private key used for signing messages and deriving the associated public key.
 *
 * @method sign - Signs the given message with the private key.
 * @method publicKey - Derives the public key associated with the private key.
 * @method toUint8Array - Retrieves the private key in bytes.
 * @group Implementation
 * @category Serialization
 */
export interface PrivateKey {
  /**
   * Sign the given message with the private key to create a signature.
   * @param message - The message to be signed, provided in HexInput format.
   * @returns A Signature object representing the signed message.
   * @group Implementation
   * @category Serialization
   */
  sign(message: HexInput): Signature;

  /**
   * Derive the public key associated with the private key.
   * @group Implementation
   * @category Serialization
   */
  publicKey(): PublicKey;

  /**
   * Get the private key in bytes (Uint8Array).
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array;
}
