// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { ParsingError, type ParsingResult } from "./errors.js";

/**
 * A value that can be interpreted as hex data: either a hex-encoded string
 * (with or without a `0x` prefix) or a raw `Uint8Array`.
 *
 * Most public APIs accept `HexInput` and convert it internally, so you rarely
 * need to construct a {@link Hex} instance directly.
 */
export type HexInput = string | Uint8Array;

/**
 * Programmatic reasons why a hex string fails validation.
 * Returned inside a {@link ParsingResult} by {@link Hex.isValid}.
 */
export enum HexInvalidReason {
  /** The string (after stripping `0x`) is empty. */
  TOO_SHORT = "too_short",
  /** The string has an odd number of hex characters. */
  INVALID_LENGTH = "invalid_length",
  /** The string contains characters that are not valid hex digits. */
  INVALID_HEX_CHARS = "invalid_hex_chars",
}

/**
 * A helper class for working with hex-encoded binary data.
 *
 * Wraps a `Uint8Array` and provides conversions to/from hex strings.
 * Accepts input with or without a `0x` prefix.
 *
 * NOTE: Do not use this class for Aptos account addresses — use `AccountAddress` instead.
 * When accepting hex data as input, prefer `HexInput` and the static helper methods
 * ({@link Hex.hexInputToUint8Array}, {@link Hex.hexInputToString}) for zero-allocation paths.
 *
 * @example
 * ```typescript
 * const hex = Hex.fromHexInput("0xdeadbeef");
 * console.log(hex.toString());                  // "0xdeadbeef"
 * console.log(hex.toStringWithoutPrefix());     // "deadbeef"
 * console.log(hex.toUint8Array());              // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 *
 * // Validate without throwing
 * const result = Hex.isValid("0xgg");
 * console.log(result.valid);           // false
 * console.log(result.invalidReason);   // HexInvalidReason.INVALID_HEX_CHARS
 * ```
 */
export class Hex {
  private readonly data: Uint8Array;

  /**
   * Constructs a `Hex` instance from raw bytes.
   * Prefer the static factory methods ({@link Hex.fromHexInput}, {@link Hex.fromHexString})
   * when starting from a string.
   * @param data - The raw bytes to wrap.
   */
  constructor(data: Uint8Array) {
    this.data = data;
  }

  // ── Output ──

  /**
   * Returns the underlying raw bytes.
   * @returns The `Uint8Array` wrapped by this instance.
   */
  toUint8Array(): Uint8Array {
    return this.data;
  }

  /**
   * Returns the hex-encoded bytes as a lowercase string **without** a `0x` prefix.
   * @returns A lowercase hex string, e.g. `"deadbeef"`.
   */
  toStringWithoutPrefix(): string {
    return bytesToHex(this.data);
  }

  /**
   * Returns the hex-encoded bytes as a lowercase `0x`-prefixed string.
   * @returns A lowercase hex string, e.g. `"0xdeadbeef"`.
   */
  toString(): string {
    return `0x${this.toStringWithoutPrefix()}`;
  }

  // ── Input ──

  /**
   * Parses a hex string (with or without `0x` prefix) into a `Hex` instance.
   * @param str - The hex string to parse.
   * @returns A new `Hex` instance.
   * @throws {ParsingError} If the string is empty, has an odd length, or contains invalid characters.
   *
   * @example
   * ```typescript
   * const hex = Hex.fromHexString("deadbeef");
   * const hex2 = Hex.fromHexString("0xdeadbeef");
   * ```
   */
  static fromHexString(str: string): Hex {
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
      return new Hex(hexToBytes(input));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ParsingError(
        `Hex string contains invalid hex characters: ${message}`,
        HexInvalidReason.INVALID_HEX_CHARS,
      );
    }
  }

  /**
   * Creates a `Hex` instance from a {@link HexInput} (hex string or `Uint8Array`).
   * If `hexInput` is already a `Uint8Array`, it is wrapped without copying.
   * @param hexInput - A hex string or raw bytes.
   * @returns A new `Hex` instance.
   * @throws {ParsingError} If `hexInput` is a string that fails to parse.
   *
   * @example
   * ```typescript
   * const a = Hex.fromHexInput("0xabcd");
   * const b = Hex.fromHexInput(new Uint8Array([0xab, 0xcd]));
   * ```
   */
  static fromHexInput(hexInput: HexInput): Hex {
    if (hexInput instanceof Uint8Array) return new Hex(hexInput);
    return Hex.fromHexString(hexInput);
  }

  /**
   * Converts a {@link HexInput} directly to a `Uint8Array`.
   * A convenience shorthand for `Hex.fromHexInput(hexInput).toUint8Array()`.
   * @param hexInput - A hex string or raw bytes.
   * @returns The decoded bytes.
   * @throws {ParsingError} If `hexInput` is a string that fails to parse.
   */
  static hexInputToUint8Array(hexInput: HexInput): Uint8Array {
    if (hexInput instanceof Uint8Array) return hexInput;
    return Hex.fromHexString(hexInput).toUint8Array();
  }

  /**
   * Converts a {@link HexInput} to a `0x`-prefixed hex string.
   * A convenience shorthand for `Hex.fromHexInput(hexInput).toString()`.
   * @param hexInput - A hex string or raw bytes.
   * @returns A `0x`-prefixed lowercase hex string.
   */
  static hexInputToString(hexInput: HexInput): string {
    return Hex.fromHexInput(hexInput).toString();
  }

  /**
   * Converts a {@link HexInput} to a hex string without a `0x` prefix.
   * A convenience shorthand for `Hex.fromHexInput(hexInput).toStringWithoutPrefix()`.
   * @param hexInput - A hex string or raw bytes.
   * @returns A lowercase hex string without a leading `0x`.
   */
  static hexInputToStringWithoutPrefix(hexInput: HexInput): string {
    return Hex.fromHexInput(hexInput).toStringWithoutPrefix();
  }

  // ── Validation ──

  /**
   * Validates a hex string without throwing.
   * @param str - The string to validate.
   * @returns A {@link ParsingResult} describing whether the string is valid,
   *   and if not, the reason why.
   *
   * @example
   * ```typescript
   * const result = Hex.isValid("0xgg");
   * if (!result.valid) {
   *   console.log(result.invalidReason); // "invalid_hex_chars"
   * }
   * ```
   */
  static isValid(str: string): ParsingResult<HexInvalidReason> {
    try {
      Hex.fromHexString(str);
      return { valid: true };
    } catch (error: unknown) {
      if (error instanceof ParsingError) {
        return {
          valid: false,
          invalidReason: error.invalidReason as HexInvalidReason,
          invalidReasonMessage: error.message,
        };
      }
      return { valid: false, invalidReasonMessage: String(error) };
    }
  }

  /**
   * Returns `true` if this `Hex` instance contains the same bytes as `other`.
   * @param other - The `Hex` instance to compare against.
   * @returns Whether the two instances have identical byte content.
   */
  /**
   * Constant-time comparison to avoid timing side-channels when comparing
   * secret or security-sensitive data.
   */
  equals(other: Hex): boolean {
    if (this.data.length !== other.data.length) return false;
    let result = 0;
    for (let i = 0; i < this.data.length; i++) {
      result |= this.data[i] ^ other.data[i];
    }
    return result === 0;
  }
}

/**
 * Decodes a hex string to a UTF-8 ASCII string.
 * Useful for reading on-chain string data stored as hex-encoded bytes.
 *
 * @param hex - A hex string (with or without `0x` prefix) or raw bytes.
 * @returns The decoded ASCII/UTF-8 string.
 *
 * @example
 * ```typescript
 * hexToAsciiString("0x68656c6c6f"); // "hello"
 * ```
 */
const TEXT_DECODER = new TextDecoder();

export const hexToAsciiString = (hex: string): string => TEXT_DECODER.decode(Hex.fromHexInput(hex).toUint8Array());
