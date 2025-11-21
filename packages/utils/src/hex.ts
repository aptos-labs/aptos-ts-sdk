// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { ParsingError, ParsingResult } from "./parsing";

/**
 * HexInput can be a string (with or without 0x prefix) or a Uint8Array.
 */
export type HexInput = string | Uint8Array;

/**
 * Provides reasons for parsing failures related to hexadecimal values.
 */
export enum HexInvalidReason {
  TOO_SHORT = "too_short",
  INVALID_LENGTH = "invalid_length",
  INVALID_HEX_CHARS = "invalid_hex_chars",
}

// ===
// Functions for converting hex strings to Uint8Array
// ===

/**
 * Converts a hex string into a Uint8Array, allowing for both prefixed and non-prefixed formats.
 *
 * @param str - A hex string, with or without the 0x prefix.
 *
 * @throws ParsingError - If the hex string is too short, has an odd number of characters, or contains invalid hex characters.
 *
 * @returns Uint8Array - The resulting Uint8Array created from the provided string.
 *
 * @example
 * ```typescript
 * fromHexString("0x1f")        // returns Uint8Array([0x1f])
 * fromHexString("1f")          // returns Uint8Array([0x1f])
 * ```
 */
export function fromHexString(str: string): Uint8Array {
  let input = str;

  if (input.startsWith("0x")) {
    input = input.slice(2);
  }

  if (input.length === 0) {
    throw new ParsingError(
      "Hex string is too short, must be at least 1 char long, excluding the optional leading 0x.",
      HexInvalidReason.TOO_SHORT,
    );
  }

  if (input.length % 2 !== 0) {
    throw new ParsingError("Hex string must be an even number of hex characters.", HexInvalidReason.INVALID_LENGTH);
  }

  try {
    return hexToBytes(input);
  } catch (error: any) {
    throw new ParsingError(
      `Hex string contains invalid hex characters: ${error?.message}`,
      HexInvalidReason.INVALID_HEX_CHARS,
    );
  }
}

/**
 * Converts an instance of HexInput, which can be a string or a Uint8Array, into a Uint8Array.
 * This function is useful for transforming hexadecimal representations into a Uint8Array for further manipulation.
 *
 * @param hexInput - A HexInput which can be a string or Uint8Array.
 * @returns A Uint8Array created from the provided hexInput.
 *
 * @example
 * ```typescript
 * fromHexInput("0x1f")                    // returns Uint8Array([0x1f])
 * fromHexInput(new Uint8Array([0x1f]))    // returns Uint8Array([0x1f])
 * ```
 */
export function fromHexInput(hexInput: HexInput): Uint8Array {
  if (hexInput instanceof Uint8Array) return hexInput;
  return fromHexString(hexInput);
}

// ===
// Functions for converting Uint8Array to hex strings
// ===

/**
 * Converts a Uint8Array to a hex string without the 0x prefix.
 *
 * @param data - The Uint8Array to convert.
 * @returns Hex string without 0x prefix
 *
 * @example
 * ```typescript
 * toHexStringWithoutPrefix(new Uint8Array([0x1f]))  // returns "1f"
 * ```
 */
export function toHexStringWithoutPrefix(data: Uint8Array): string {
  return bytesToHex(data);
}

/**
 * Converts a Uint8Array to a hex string with the 0x prefix.
 *
 * @param data - The Uint8Array to convert.
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * toHexString(new Uint8Array([0x1f]))  // returns "0x1f"
 * ```
 */
export function toHexString(data: Uint8Array): string {
  return `0x${toHexStringWithoutPrefix(data)}`;
}

// ===
// Functions for converting HexInput to hex strings
// ===

/**
 * Converts a HexInput (string or Uint8Array) to a hex string with '0x' prefix.
 *
 * @param hexInput - The input to convert, either a hex string (with/without '0x' prefix) or Uint8Array
 * @returns A hex string with '0x' prefix (e.g., "0x1234")
 *
 * @example
 * ```typescript
 * hexInputToString("1234")        // returns "0x1234"
 * hexInputToString("0x1234")      // returns "0x1234"
 * hexInputToString(new Uint8Array([0x12, 0x34])) // returns "0x1234"
 * ```
 */
export function hexInputToString(hexInput: HexInput): string {
  return toHexString(fromHexInput(hexInput));
}

/**
 * Converts a HexInput (string or Uint8Array) to a hex string without '0x' prefix.
 *
 * @param hexInput - The input to convert, either a hex string (with/without '0x' prefix) or Uint8Array
 * @returns A hex string without '0x' prefix (e.g., "1234")
 *
 * @example
 * ```typescript
 * hexInputToStringWithoutPrefix("1234")        // returns "1234"
 * hexInputToStringWithoutPrefix("0x1234")      // returns "1234"
 * hexInputToStringWithoutPrefix(new Uint8Array([0x12, 0x34])) // returns "1234"
 * ```
 */
export function hexInputToStringWithoutPrefix(hexInput: HexInput): string {
  return toHexStringWithoutPrefix(fromHexInput(hexInput));
}

/**
 * Converts an instance of HexInput, which can be a string or a Uint8Array, into a Uint8Array.
 * This is an alias for fromHexInput for consistency with the original class API.
 *
 * @param hexInput - A HexInput which can be a string or Uint8Array.
 * @returns A Uint8Array created from the provided hexInput.
 */
export function hexInputToUint8Array(hexInput: HexInput): Uint8Array {
  return fromHexInput(hexInput);
}

// ===
// Functions for checking validity
// ===

/**
 * Check if the provided string is a valid hexadecimal representation.
 *
 * @param str - A hex string representing byte data.
 *
 * @returns An object containing:
 *  - valid: A boolean indicating whether the string is valid.
 *  - invalidReason: The reason for invalidity if the string is not valid.
 *  - invalidReasonMessage: A message explaining why the string is invalid.
 *
 * @example
 * ```typescript
 * isValidHex("0x1f")     // returns { valid: true }
 * isValidHex("1g")       // returns { valid: false, invalidReason: "invalid_hex_chars", ... }
 * ```
 */
export function isValidHex(str: string): ParsingResult<HexInvalidReason> {
  try {
    fromHexString(str);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      invalidReason: error?.invalidReason,
      invalidReasonMessage: error?.message,
    };
  }
}

/**
 * Determine if two Uint8Arrays are equal by comparing their byte data.
 *
 * @param data1 - The first Uint8Array to compare.
 * @param data2 - The second Uint8Array to compare.
 * @returns true if the Uint8Arrays are equal, false if not.
 *
 * @example
 * ```typescript
 * equals(new Uint8Array([0x1f]), new Uint8Array([0x1f]))  // returns true
 * equals(new Uint8Array([0x1f]), new Uint8Array([0x20]))   // returns false
 * ```
 */
export function equals(data1: Uint8Array, data2: Uint8Array): boolean {
  if (data1.length !== data2.length) return false;
  return data1.every((value, index) => value === data2[index]);
}

/**
 * Converts a hex string to an ASCII string.
 *
 * @param hex - A hex string (with or without 0x prefix) or Uint8Array.
 * @returns The ASCII string representation of the hex data.
 *
 * @example
 * ```typescript
 * hexToAsciiString("0x48656c6c6f")  // returns "Hello"
 * ```
 */
export function hexToAsciiString(hex: HexInput): string {
  return new TextDecoder().decode(fromHexInput(hex));
}


