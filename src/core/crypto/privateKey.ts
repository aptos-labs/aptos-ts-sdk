/* eslint-disable max-len */

import { HexInput } from "../../types";
import { Hex } from "../hex";
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

export class PrivateKey {
  /**
   * Returns the AIP-80 compliant prefix for a given private key type. Append this to a PrivateKey HexString
   * to get an AIP-80 compliant string.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param type
   * @returns
   */
  public static getAIP80Prefix(type: "ed25519" | "secp256k1"): string {
    switch (type) {
      case "ed25519":
        return "ed25519-priv-";
      case "secp256k1":
        return "secp256k1-priv-";
      default:
        throw new Error(
          `Invalid standard provided when retrieving AIP-80 compliant prefix. Received ${type} but expected "ed25519" or "secp256k1"`,
        );
    }
  }

  /**
   * Format a HexInput to an AIP-80 compliant string.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param privateKey - The HexString or Uint8Array format of the private key.
   * @param privateKeyType - The private key type
   */
  public static formatPrivateKey(privateKey: HexInput, type: "ed25519" | "secp256k1"): string {
    const aip80Prefix = PrivateKey.getAIP80Prefix(type);
    return `${aip80Prefix}${Hex.fromHexInput(privateKey).toString()}`;
  }

  /**
   * Parse a HexInput that may be a HexString, Uint8Array, or a AIP-80 compliant string to a Hex instance.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param value - A HexString, Uint8Array, or a AIP-80 compliant string.
   * @param privateKeyType - The private key type
   * @param strict - If true, the value MUST be compliant with AIP-80.
   */
  public static parseHexInput(value: HexInput, type: "ed25519" | "secp256k1", strict?: boolean): Hex {
    let data: Hex;

    const aip80Prefix = PrivateKey.getAIP80Prefix(type);
    if (typeof value === "string") {
      if (strict !== true && !value.startsWith(aip80Prefix)) {
        // HexString input
        data = Hex.fromHexInput(value);
        // If the strictness is false, the user has opted into non-AIP-80 compliant private keys.
        if (strict !== false) {
          // eslint-disable-next-line no-console
          console.warn(
            "[Aptos SDK] It is recommended that private keys are AIP-80 compliant (https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md). You can fix the private key by formatting it with `PrivateKey.formatPrivateKey(privateKey: string, type: 'ed25519' | 'secp256k1'): string`.",
          );
        }
      } else if (value.startsWith(aip80Prefix)) {
        // AIP-80 Compliant String input
        data = Hex.fromHexString(value.split("-")[2]);
      } else {
        if (strict) {
          // The value does not start with the AIP-80 prefix, and strict is true.
          throw new Error("Invalid HexString input while parsing private key. Must AIP-80 compliant string.");
        }

        // This condition should never be reached.
        throw new Error("Invalid HexString input while parsing private key.");
      }
    } else {
      // The value is an Uint8Array
      data = Hex.fromHexInput(value);
      // If the strictness is false, the user has opted into non-AIP-80 compliant private keys.
      if (strict !== false) {
        // eslint-disable-next-line no-console
        console.warn(
          "[Aptos SDK] It is recommended that private keys are parsed as AIP-80 compliant strings instead of Uint8Array (https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md). You can fix the private key by formatting it with `PrivateKey.formatPrivateKey(privateKey: Uint8Array, type: 'ed25519' | 'secp256k1'): string`.",
        );
      }
    }

    return data;
  }
}
