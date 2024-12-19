import { Serializable } from "../../bcs";
import { Hex } from "../hex";

/**
 * An abstract representation of a crypto signature,
 * associated with a specific signature scheme, e.g., Ed25519 or Secp256k1.
 *
 * This class represents the product of signing a message directly from a
 * PrivateKey and can be verified against a CryptoPublicKey.
 * @group Implementation
 * @category Serialization
 */
export abstract class Signature extends Serializable {
  /**
   * Get the raw signature bytes
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Get the signature as a hex string with a 0x prefix e.g. 0x123456...
   * @returns The hex string representation of the signature.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}

/**
 * An abstract representation of an account signature,
 * associated to a specific authentication scheme e.g. Ed25519 or SingleKey
 *
 * This is the product of signing a message through an account,
 * and can be verified against an AccountPublicKey.
 * @group Implementation
 * @category Serialization
 */
// export abstract class AccountSignature extends Serializable {
//   /**
//    * Get the raw signature bytes
//    */
//   abstract toUint8Array(): Uint8Array;
//
//   /**
//    * Get the signature as a hex string with a 0x prefix e.g. 0x123456...
//    */
//   toString(): string {
//     const bytes = this.toUint8Array();
//     return Hex.fromHexInput(bytes).toString();
//   }
// }
