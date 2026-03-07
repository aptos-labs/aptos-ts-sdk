// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { ParsingError, type ParsingResult } from "./errors.js";

/** Hex string or raw bytes. */
export type HexInput = string | Uint8Array;

export enum HexInvalidReason {
  TOO_SHORT = "too_short",
  INVALID_LENGTH = "invalid_length",
  INVALID_HEX_CHARS = "invalid_hex_chars",
}

/**
 * A helper class for working with hex data.
 *
 * NOTE: Do not use this class for account addresses — use AccountAddress instead.
 * When accepting hex data as input, prefer `HexInput` and the static helper methods.
 */
export class Hex {
  private readonly data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  // ── Output ──

  toUint8Array(): Uint8Array {
    return this.data;
  }

  toStringWithoutPrefix(): string {
    return bytesToHex(this.data);
  }

  toString(): string {
    return `0x${this.toStringWithoutPrefix()}`;
  }

  // ── Input ──

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

  static fromHexInput(hexInput: HexInput): Hex {
    if (hexInput instanceof Uint8Array) return new Hex(hexInput);
    return Hex.fromHexString(hexInput);
  }

  static hexInputToUint8Array(hexInput: HexInput): Uint8Array {
    if (hexInput instanceof Uint8Array) return hexInput;
    return Hex.fromHexString(hexInput).toUint8Array();
  }

  static hexInputToString(hexInput: HexInput): string {
    return Hex.fromHexInput(hexInput).toString();
  }

  static hexInputToStringWithoutPrefix(hexInput: HexInput): string {
    return Hex.fromHexInput(hexInput).toStringWithoutPrefix();
  }

  // ── Validation ──

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

  equals(other: Hex): boolean {
    if (this.data.length !== other.data.length) return false;
    return this.data.every((value, index) => value === other.data[index]);
  }
}

export const hexToAsciiString = (hex: string): string => new TextDecoder().decode(Hex.fromHexInput(hex).toUint8Array());
