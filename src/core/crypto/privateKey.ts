import { HexInput } from "../../types";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";

/**
 * Represents a private key used for signing messages and deriving the associated public key.
 *
 * @method sign - Signs the given message with the private key.
 * @method publicKey - Derives the public key associated with the private key.
 * @method toUint8Array - Retrieves the private key in bytes.
 */
export interface PrivateKey {
  /**
   * Sign the given message with the private key to create a signature.
   * @param message - The message to be signed, provided in HexInput format.
   * @returns A Signature object representing the signed message.
   */
  sign(message: HexInput): Signature;

  /**
   * Derive the public key associated with the private key.
   */
  publicKey(): PublicKey;

  /**
   * Get the private key in bytes (Uint8Array).
   */
  toUint8Array(): Uint8Array;
}
