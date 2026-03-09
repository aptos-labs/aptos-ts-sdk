import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { TransactionArgument } from "../bcs/types.js";
import { ScriptTransactionArgumentVariants } from "../bcs/types.js";
import { ParsingError, type ParsingResult } from "../hex/errors.js";
import type { HexInput } from "../hex/index.js";

/** Describes the reason an account address failed validation. */
export enum AddressInvalidReason {
  /** The byte array is not exactly 32 bytes. */
  INCORRECT_NUMBER_OF_BYTES = "incorrect_number_of_bytes",
  /** The hex string contains non-hex characters. */
  INVALID_HEX_CHARS = "invalid_hex_chars",
  /** The hex string is shorter than the minimum allowed length. */
  TOO_SHORT = "too_short",
  /** The hex string exceeds 64 hex characters. */
  TOO_LONG = "too_long",
  /** The string is missing the required "0x" prefix (strict mode). */
  LEADING_ZERO_X_REQUIRED = "leading_zero_x_required",
  /** Non-special addresses must be in full 64-character form (strict mode). */
  LONG_FORM_REQUIRED_UNLESS_SPECIAL = "long_form_required_unless_special",
  /** A special address has unnecessary padding zeroes (strict mode). */
  INVALID_PADDING_ZEROES = "INVALID_PADDING_ZEROES",
  /** The maxMissingChars parameter is out of the valid range [0, 63]. */
  INVALID_PADDING_STRICTNESS = "INVALID_PADDING_STRICTNESS",
}

/**
 * Accepted input types for constructing or parsing an {@link AccountAddress}.
 * Can be a hex string, a byte array, or an existing AccountAddress instance.
 */
export type AccountAddressInput = HexInput | AccountAddress;

/**
 * Represents a 32-byte Aptos account address.
 *
 * Provides parsing, validation, and serialization of on-chain addresses
 * in both short (special) and long (full 64-char hex) forms.
 */
export class AccountAddress extends Serializable implements TransactionArgument {
  /** The raw 32-byte address data. */
  readonly data: Uint8Array;

  /** The fixed byte length of an Aptos account address. */
  static readonly LENGTH: number = 32;
  /** The number of hex characters in the long (non-prefixed) string form. */
  static readonly LONG_STRING_LENGTH: number = 64;

  /** The special address `0x0`. */
  static readonly ZERO: AccountAddress = AccountAddress.from("0x0");
  /** The special address `0x1` (Aptos framework). */
  static readonly ONE: AccountAddress = AccountAddress.from("0x1");
  /** The special address `0x2`. */
  static readonly TWO: AccountAddress = AccountAddress.from("0x2");
  /** The special address `0x3`. */
  static readonly THREE: AccountAddress = AccountAddress.from("0x3");
  /** The special address `0x4`. */
  static readonly FOUR: AccountAddress = AccountAddress.from("0x4");
  /** The special address `0xA` (fungible asset metadata). */
  static readonly A: AccountAddress = AccountAddress.from("0xA");

  /**
   * Creates an AccountAddress from a 32-byte Uint8Array.
   * @param input - Exactly 32 bytes representing the address.
   * @throws {ParsingError} If the input is not exactly 32 bytes.
   */
  constructor(input: Uint8Array) {
    super();
    if (input.length !== AccountAddress.LENGTH) {
      throw new ParsingError(
        "AccountAddress data should be exactly 32 bytes long",
        AddressInvalidReason.INCORRECT_NUMBER_OF_BYTES,
      );
    }
    this.data = input.slice();
  }

  /**
   * Returns whether this is a "special" address (0x0 through 0xf).
   * Special addresses are displayed in short form (e.g., `0xa` instead of the full 64-char hex).
   */
  isSpecial(): boolean {
    if (this.data[this.data.length - 1] >= 0b10000) return false;
    for (let i = 0; i < this.data.length - 1; i++) {
      if (this.data[i] !== 0) return false;
    }
    return true;
  }

  /**
   * Returns the canonical string representation with "0x" prefix.
   * Special addresses use short form (e.g., `"0xa"`); others use full 64-char hex.
   */
  toString(): `0x${string}` {
    return `0x${this.toStringWithoutPrefix()}`;
  }

  /** Returns the canonical string representation without the "0x" prefix. */
  toStringWithoutPrefix(): string {
    if (this.data[this.data.length - 1] < 0x10) {
      let special = true;
      for (let i = 0; i < this.data.length - 1; i++) {
        if (this.data[i] !== 0) {
          special = false;
          break;
        }
      }
      if (special) return this.data[this.data.length - 1].toString(16);
    }
    return bytesToHex(this.data);
  }

  /** Returns the full 64-character hex representation with "0x" prefix (always zero-padded). */
  toStringLong(): `0x${string}` {
    return `0x${this.toStringLongWithoutPrefix()}`;
  }

  /** Returns the full 64-character hex representation without the "0x" prefix. */
  toStringLongWithoutPrefix(): string {
    return bytesToHex(this.data);
  }

  /** Returns the shortest hex representation with "0x" prefix (leading zeroes stripped). */
  toStringShort(): `0x${string}` {
    return `0x${this.toStringShortWithoutPrefix()}`;
  }

  /** Returns the shortest hex representation without the "0x" prefix (leading zeroes stripped). */
  toStringShortWithoutPrefix(): string {
    const hex = bytesToHex(this.data).replace(/^0+/, "");
    return hex === "" ? "0" : hex;
  }

  /** Returns the underlying 32-byte array. */
  toUint8Array(): Uint8Array {
    return this.data;
  }

  /** Serializes the address as fixed-length bytes via BCS. */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  /** Serializes this address for use as an entry function argument. */
  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  /** Serializes this address for use as a script function argument. */
  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Address);
    serializer.serialize(this);
  }

  /**
   * Deserializes an AccountAddress from BCS bytes.
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new AccountAddress instance.
   */
  static deserialize(deserializer: Deserializer): AccountAddress {
    const bytes = deserializer.deserializeFixedBytes(AccountAddress.LENGTH);
    return new AccountAddress(bytes);
  }

  /**
   * Parses an address from a hex string using strict validation rules.
   * Requires "0x" prefix, full 64-character form for non-special addresses,
   * and no padding zeroes for special addresses.
   * @param input - The hex string to parse (must start with "0x").
   * @returns A new AccountAddress instance.
   * @throws {ParsingError} If the input does not satisfy strict formatting rules.
   */
  static fromStringStrict(input: string): AccountAddress {
    if (!input.startsWith("0x")) {
      throw new ParsingError("Hex string must start with a leading 0x.", AddressInvalidReason.LEADING_ZERO_X_REQUIRED);
    }

    const address = AccountAddress.fromString(input);

    if (input.length !== AccountAddress.LONG_STRING_LENGTH + 2) {
      if (!address.isSpecial()) {
        throw new ParsingError(
          `The given hex string ${input} is not a special address, it must be represented as 0x + 64 chars.`,
          AddressInvalidReason.LONG_FORM_REQUIRED_UNLESS_SPECIAL,
        );
      } else if (input.length !== 3) {
        throw new ParsingError(
          `The given hex string ${input} is a special address not in LONG form, it must be 0x0 to 0xf without padding zeroes.`,
          AddressInvalidReason.INVALID_PADDING_ZEROES,
        );
      }
    }

    return address;
  }

  /**
   * Parses an address from a hex string with relaxed validation.
   * Allows optional "0x" prefix and short-form addresses.
   * @param input - The hex string to parse (with or without "0x" prefix).
   * @param options - Options for parsing.
   * @param options.maxMissingChars - Maximum leading zeroes that may be omitted (default 4).
   *   Special addresses (0x0-0xf) are always accepted regardless of this setting.
   * @returns A new AccountAddress instance.
   * @throws {ParsingError} If the input cannot be parsed as a valid address.
   */
  static fromString(input: string, { maxMissingChars = 4 }: { maxMissingChars?: number } = {}): AccountAddress {
    let parsedInput = input;
    if (input.startsWith("0x")) {
      parsedInput = input.slice(2);
    }

    if (parsedInput.length === 0) {
      throw new ParsingError(
        "Hex string is too short, must be 1 to 64 chars long, excluding the leading 0x.",
        AddressInvalidReason.TOO_SHORT,
      );
    }

    if (parsedInput.length > 64) {
      throw new ParsingError(
        "Hex string is too long, must be 1 to 64 chars long, excluding the leading 0x.",
        AddressInvalidReason.TOO_LONG,
      );
    }

    if (maxMissingChars > 63 || maxMissingChars < 0) {
      throw new ParsingError(
        `maxMissingChars must be between or equal to 0 and 63. Received ${maxMissingChars}`,
        AddressInvalidReason.INVALID_PADDING_STRICTNESS,
      );
    }

    let addressBytes: Uint8Array;
    try {
      addressBytes = hexToBytes(parsedInput.padStart(64, "0"));
    } catch (error: unknown) {
      throw new ParsingError(
        `Hex characters are invalid: ${error instanceof Error ? error.message : String(error)}`,
        AddressInvalidReason.INVALID_HEX_CHARS,
      );
    }

    const address = new AccountAddress(addressBytes);

    if (parsedInput.length < 64 - maxMissingChars) {
      if (!address.isSpecial()) {
        throw new ParsingError(
          `Hex string is too short, must be ${64 - maxMissingChars} to 64 chars long, excluding the leading 0x. Received ${input}`,
          AddressInvalidReason.TOO_SHORT,
        );
      }
    }

    return address;
  }

  /**
   * Creates an AccountAddress from a string, byte array, or existing AccountAddress.
   * @param input - The address input (hex string, Uint8Array, or AccountAddress).
   * @param options - Options for string parsing.
   * @param options.maxMissingChars - Maximum leading zeroes that may be omitted (default 4).
   * @returns A new or existing AccountAddress instance.
   */
  static from(input: AccountAddressInput, { maxMissingChars = 4 }: { maxMissingChars?: number } = {}): AccountAddress {
    if (typeof input === "string") {
      return AccountAddress.fromString(input, { maxMissingChars });
    }
    if (input instanceof Uint8Array) {
      return new AccountAddress(input);
    }
    return input;
  }

  /**
   * Creates an AccountAddress from any accepted input using strict validation for strings.
   * @param input - The address input (hex string, Uint8Array, or AccountAddress).
   * @returns A new or existing AccountAddress instance.
   * @throws {ParsingError} If a string input does not satisfy strict formatting rules.
   */
  static fromStrict(input: AccountAddressInput): AccountAddress {
    if (typeof input === "string") {
      return AccountAddress.fromStringStrict(input);
    }
    if (input instanceof Uint8Array) {
      return new AccountAddress(input);
    }
    return input;
  }

  /**
   * Checks whether the given input is a valid account address without throwing.
   * @param args.input - The address input to validate.
   * @param args.strict - If true, applies strict formatting rules (default false).
   * @returns A {@link ParsingResult} indicating validity, or the reason for invalidity.
   */
  static isValid(args: { input: AccountAddressInput; strict?: boolean }): ParsingResult<AddressInvalidReason> {
    try {
      if (args.strict) {
        AccountAddress.fromStrict(args.input);
      } else {
        AccountAddress.from(args.input);
      }
      return { valid: true };
    } catch (error: unknown) {
      if (error instanceof ParsingError) {
        return {
          valid: false,
          invalidReason: error.invalidReason as AddressInvalidReason,
          invalidReasonMessage: error.message,
        };
      }
      return { valid: false, invalidReasonMessage: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Compares this address to another for byte-level equality.
   * @param other - The address to compare against.
   * @returns True if both addresses contain identical bytes.
   */
  /**
   * Constant-time comparison to avoid timing side-channels when comparing addresses.
   */
  equals(other: AccountAddress): boolean {
    if (this.data.length !== other.data.length) return false;
    let result = 0;
    for (let i = 0; i < this.data.length; i++) {
      result |= this.data[i] ^ other.data[i];
    }
    return result === 0;
  }
}
