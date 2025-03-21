// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { Serializable, Serializer } from "../bcs/serializer";
import { Deserializer } from "../bcs/deserializer";
import { ParsingError, ParsingResult } from "./common";
import { TransactionArgument } from "../transactions/instances/transactionArgument";
import { HexInput, ScriptTransactionArgumentVariants } from "../types";

/**
 * Provides reasons for an address was invalid.
 * @group Implementation
 * @category Serialization
 */
export enum AddressInvalidReason {
  INCORRECT_NUMBER_OF_BYTES = "incorrect_number_of_bytes",
  INVALID_HEX_CHARS = "invalid_hex_chars",
  TOO_SHORT = "too_short",
  TOO_LONG = "too_long",
  LEADING_ZERO_X_REQUIRED = "leading_zero_x_required",
  LONG_FORM_REQUIRED_UNLESS_SPECIAL = "long_form_required_unless_special",
  INVALID_PADDING_ZEROES = "INVALID_PADDING_ZEROES",
  INVALID_PADDING_STRICTNESS = "INVALID_PADDING_STRICTNESS",
}

/**
 * The input for an account address, which can be either a hexadecimal string or a standard account address.
 * @group Implementation
 * @category Serialization
 */
export type AccountAddressInput = HexInput | AccountAddress;

/**
 * NOTE: Only use this class for account addresses. For other hex data, e.g. transaction
 * hashes, use the Hex class.
 *
 * AccountAddress is used for working with account addresses. Account addresses, when
 * represented as a string, generally look like these examples:
 * - 0x1
 * - 0xaa86fe99004361f747f91342ca13c426ca0cccb0c1217677180c9493bad6ef0c
 *
 * Proper formatting and parsing of account addresses is defined by AIP-40.
 * To learn more about the standard, read the AIP here:
 * https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md.
 *
 * The comments in this class make frequent reference to the LONG and SHORT formats,
 * as well as "special" addresses. To learn what these refer to see AIP-40.
 * @group Implementation
 * @category Serialization
 */
export class AccountAddress extends Serializable implements TransactionArgument {
  /**
   * This is the internal representation of an account address.
   * @group Implementation
   * @category Serialization
   */
  readonly data: Uint8Array;

  /**
   * The number of bytes that make up an account address.
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 32;

  /**
   * The length of an address string in LONG form without a leading 0x.
   * @group Implementation
   * @category Serialization
   */
  static readonly LONG_STRING_LENGTH: number = 64;

  static ZERO: AccountAddress = AccountAddress.from("0x0");

  static ONE: AccountAddress = AccountAddress.from("0x1");

  static TWO: AccountAddress = AccountAddress.from("0x2");

  static THREE: AccountAddress = AccountAddress.from("0x3");

  static FOUR: AccountAddress = AccountAddress.from("0x4");

  static A: AccountAddress = AccountAddress.from("0xA");

  /**
   * Creates an instance of AccountAddress from a Uint8Array.
   *
   * This function ensures that the input data is exactly 32 bytes long, which is required for a valid account address.
   *
   * @param input A Uint8Array representing an account address.
   * @throws ParsingError if the input length is not equal to 32 bytes.
   * @group Implementation
   * @category Serialization
   */
  constructor(input: Uint8Array) {
    super();
    if (input.length !== AccountAddress.LENGTH) {
      throw new ParsingError(
        "AccountAddress data should be exactly 32 bytes long",
        AddressInvalidReason.INCORRECT_NUMBER_OF_BYTES,
      );
    }
    this.data = input;
  }

  /**
   * Determines if the address is classified as special, which is defined as 0x0 to 0xf inclusive.
   * In other words, the last byte of the address must be < 0b10000 (16)
   * and every other byte must be zero.
   *
   * For more information on how special addresses are defined, see AIP-40:
   * https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md.
   *
   * @returns true if the address is special, false otherwise.
   * @group Implementation
   * @category Serialization
   */
  isSpecial(): boolean {
    return (
      this.data.slice(0, this.data.length - 1).every((byte) => byte === 0) && this.data[this.data.length - 1] < 0b10000
    );
  }
  // ===
  // Methods for representing an instance of AccountAddress as other types.
  // ===

  /**
   * Return the AccountAddress as a string as per AIP-40.
   * https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md.
   * This representation returns special addresses in SHORT form (0xf)
   * and other addresses in LONG form (0x + 64 characters).
   *
   * @returns AccountAddress as a string conforming to AIP-40.
   * @group Implementation
   * @category Serialization
   */
  toString(): `0x${string}` {
    return `0x${this.toStringWithoutPrefix()}`;
  }

  /**
   * Return the AccountAddress as a string conforming to AIP-40 but without the leading 0x.
   *
   * NOTE: Prefer to use `toString` where possible.
   *
   * @returns AccountAddress as a string without the leading 0x.
   * @group Implementation
   * @category Serialization
   */
  toStringWithoutPrefix(): string {
    let hex = bytesToHex(this.data);
    if (this.isSpecial()) {
      hex = hex[hex.length - 1];
    }
    return hex;
  }

  /**
   * Convert the account address to a string in LONG format, which is always 0x followed by 64 hex characters.
   *
   * NOTE: Prefer to use `toString` where possible, as it formats special addresses using the SHORT form (no leading 0s).
   *
   * @returns AccountAddress as a string in LONG form.
   * @group Implementation
   * @category Serialization
   */
  toStringLong(): `0x${string}` {
    return `0x${this.toStringLongWithoutPrefix()}`;
  }

  /**
   * Returns the account address as a string in LONG form without a leading 0x.
   * This function will include leading zeroes and will produce a string of 64 hex characters.
   *
   * NOTE: Prefer to use `toString` where possible, as it formats special addresses using the SHORT form (no leading 0s).
   *
   * @returns {string} The account address in LONG form.
   * @group Implementation
   * @category Serialization
   */
  toStringLongWithoutPrefix(): string {
    return bytesToHex(this.data);
  }

  /**
   * Convert the account address to a string in SHORT format, which is 0x followed by the shortest
   * possible representation (no leading zeros).
   *
   * @returns AccountAddress as a string in SHORT form.
   * @group Implementation
   * @category Serialization
   */
  toStringShort(): `0x${string}` {
    return `0x${this.toStringShortWithoutPrefix()}`;
  }

  /**
   * Returns a lossless short string representation of the address by trimming leading zeros.
   * If the address consists of all zeros, returns "0".
   *
   * @returns A string representation of the address without leading zeros
   * @group Implementation
   * @category Serialization
   */
  toStringShortWithoutPrefix(): string {
    const hex = bytesToHex(this.data).replace(/^0+/, "");
    return hex === "" ? "0" : hex;
  }

  /**
   * Get the inner data as a Uint8Array.
   * The inner data is already a Uint8Array, so no conversion takes place.
   *
   * @returns Hex data as Uint8Array
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    return this.data;
  }

  /**
   * Serialize the AccountAddress to a Serializer instance's data buffer.
   * @param serializer The serializer to serialize the AccountAddress to.
   * @returns void
   * @example
   * const serializer = new Serializer();
   * const address = AccountAddress.fromString("0x1");
   * address.serialize(serializer);
   * const bytes = serializer.toUint8Array();
   * // `bytes` is now the BCS-serialized address.
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  /**
   * Serializes the current instance into a byte sequence suitable for entry functions.
   * This allows for the proper encoding of data when interacting with entry functions in the blockchain.
   *
   * @param serializer - The serializer instance used to convert the data into bytes.
   * @group Implementation
   * @category Serialization
   */
  serializeForEntryFunction(serializer: Serializer): void {
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  /**
   * Serializes the current instance for use in a script function by encoding it into a byte sequence.
   * This process involves serializing the variant index and the instance data, making it suitable for transmission.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category Serialization
   */
  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Address);
    serializer.serialize(this);
  }

  /**
   * Deserialize an AccountAddress from the byte buffer in a Deserializer instance.
   * This function allows you to convert a byte representation of an AccountAddress into an instance of AccountAddress.
   * @param deserializer The deserializer to deserialize the AccountAddress from.
   * @returns An instance of AccountAddress.
   * @example
   * const bytes = hexToBytes("0x0102030405060708091011121314151617181920212223242526272829303132");
   * const deserializer = new Deserializer(bytes);
   * const address = AccountAddress.deserialize(deserializer);
   * // `address` is now an instance of AccountAddress.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): AccountAddress {
    const bytes = deserializer.deserializeFixedBytes(AccountAddress.LENGTH);
    return new AccountAddress(bytes);
  }

  // ===
  // Methods for creating an instance of AccountAddress from other types.
  // ===

  /**
   * NOTE: This function has strict parsing behavior. For relaxed behavior, please use
   * the `fromString` function.
   *
   * Creates an instance of AccountAddress from a hex string.
   *
   * This function allows only the strictest formats defined by AIP-40. In short this
   * means only the following formats are accepted:
   *
   * - LONG
   * - SHORT for special addresses
   *
   * Where:
   * - LONG is defined as 0x + 64 hex characters.
   * - SHORT for special addresses is 0x0 to 0xf inclusive without padding zeroes.
   *
   * This means the following are not accepted:
   * - SHORT for non-special addresses.
   * - Any address without a leading 0x.
   *
   * @param input - A hex string representing an account address.
   *
   * @throws {ParsingError} If the hex string does not start with 0x or is not in a valid format.
   *
   * @remarks
   *
   * This function has strict parsing behavior. For relaxed behavior, please use the `fromString` function.
   *
   * @see AIP-40 documentation for more details on address formats:
   * https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md.
   *
   * @returns An instance of AccountAddress.
   * @group Implementation
   * @category Serialization
   */
  static fromStringStrict(input: string): AccountAddress {
    // Assert the string starts with 0x.
    if (!input.startsWith("0x")) {
      throw new ParsingError("Hex string must start with a leading 0x.", AddressInvalidReason.LEADING_ZERO_X_REQUIRED);
    }

    const address = AccountAddress.fromString(input);

    // Check if the address is in LONG form. If it is not, this is only allowed for
    // special addresses, in which case we check it is in proper SHORT form.
    if (input.length !== AccountAddress.LONG_STRING_LENGTH + 2) {
      if (!address.isSpecial()) {
        throw new ParsingError(
          `The given hex string ${input} is not a special address, it must be represented as 0x + 64 chars.`,
          AddressInvalidReason.LONG_FORM_REQUIRED_UNLESS_SPECIAL,
        );
      } else if (input.length !== 3) {
        // 0x + one hex char is the only valid SHORT form for special addresses.
        throw new ParsingError(
          // eslint-disable-next-line max-len
          `The given hex string ${input} is a special address not in LONG form, it must be 0x0 to 0xf without padding zeroes.`,
          AddressInvalidReason.INVALID_PADDING_ZEROES,
        );
      }
    }

    return address;
  }

  /**
   * NOTE: This function has relaxed parsing behavior. For strict behavior, please use
   * the `fromStringStrict` function. Where possible use `fromStringStrict` rather than this
   * function, `fromString`.
   *
   * Creates an instance of AccountAddress from a hex string.
   *
   * This function allows all formats defined by AIP-40. In short this means the
   * following formats are accepted:
   *
   * - LONG, with or without leading 0x
   * - SHORT*, with or without leading 0x
   *
   * Where:
   * - LONG is 64 hex characters.
   * - SHORT* is 1 to 63 hex characters inclusive. The address can have missing values up to `maxMissingChars` before it is padded.
   * - Padding zeroes are allowed, e.g. 0x0123 is valid.
   *
   * Learn more about the different address formats by reading AIP-40:
   * https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md.
   *
   * @param input A hex string representing an account address.
   * @param args.maxMissingChars The number of characters that can be missing in a padded address before it is invalid.
   *
   * @returns An instance of AccountAddress.
   *
   * @throws ParsingError if the hex string is too short, too long, or contains invalid characters.
   * @group Implementation
   * @category Serialization
   */
  static fromString(input: string, { maxMissingChars = 4 }: { maxMissingChars?: number } = {}): AccountAddress {
    let parsedInput = input;
    // Remove leading 0x for parsing.
    if (input.startsWith("0x")) {
      parsedInput = input.slice(2);
    }

    // Ensure the address string is at least 1 character long.
    if (parsedInput.length === 0) {
      throw new ParsingError(
        "Hex string is too short, must be 1 to 64 chars long, excluding the leading 0x.",
        AddressInvalidReason.TOO_SHORT,
      );
    }

    // Ensure the address string is not longer than 64 characters.
    if (parsedInput.length > 64) {
      throw new ParsingError(
        "Hex string is too long, must be 1 to 64 chars long, excluding the leading 0x.",
        AddressInvalidReason.TOO_LONG,
      );
    }

    // Ensure that the maxMissingChars is between or equal to 0 and 63.
    if (maxMissingChars > 63 || maxMissingChars < 0) {
      throw new ParsingError(
        `maxMissingChars must be between or equal to 0 and 63. Received ${maxMissingChars}`,
        AddressInvalidReason.INVALID_PADDING_STRICTNESS,
      );
    }

    let addressBytes: Uint8Array;
    try {
      // Pad the address with leading zeroes, so it is 64 chars long and then convert
      // the hex string to bytes. Every two characters in a hex string constitutes a
      // single byte. So a 64 length hex string becomes a 32 byte array.
      addressBytes = hexToBytes(parsedInput.padStart(64, "0"));
    } catch (error: any) {
      // At this point the only way this can fail is if the hex string contains
      // invalid characters.
      throw new ParsingError(`Hex characters are invalid: ${error?.message}`, AddressInvalidReason.INVALID_HEX_CHARS);
    }

    const address = new AccountAddress(addressBytes);

    // Cannot pad the address if it has more than maxMissingChars missing.
    if (parsedInput.length < 64 - maxMissingChars) {
      if (!address.isSpecial()) {
        throw new ParsingError(
          `Hex string is too short, must be ${64 - maxMissingChars} to 64 chars long, excluding the leading 0x. You may need to fix 
the addresss by padding it with 0s before passing it to \`fromString\` (e.g. <addressString>.padStart(64, '0')). 
Received ${input}`,
          AddressInvalidReason.TOO_SHORT,
        );
      }
    }

    return address;
  }

  /**
   * Convenience method for creating an AccountAddress from various input types.
   * This function accepts a string, Uint8Array, or an existing AccountAddress instance and returns the corresponding
   * AccountAddress.
   *
   * @param input - The input to convert into an AccountAddress. This can be a string representation of an address, a Uint8Array,
   * or an existing AccountAddress.
   * @param args.maxMissingChars The number of characters that can be missing in a padded address before it is invalid.
   * @group Implementation
   * @category Serialization
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
   * Create an AccountAddress from various input types, including strings, Uint8Array, and AccountAddress instances.
   *
   * @param input - The input to convert into an AccountAddress, which can be a string, a Uint8Array, or an AccountAddress.
   * @group Implementation
   * @category Serialization
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
  // ===
  // Methods for checking validity.
  // ===

  /**
   * Check if the provided input is a valid AccountAddress.
   *
   * @param args - The arguments for validation.
   * @param args.input - A hex string representing an account address.
   * @param args.strict - If true, use strict parsing behavior; if false, use relaxed parsing behavior.
   *
   * @returns An object indicating whether the address is valid. If valid, valid = true; if not, valid = false with additional details.
   * If the address is invalid, invalidReason will explain why it is invalid, and invalidReasonMessage will provide the error message.
   * @group Implementation
   * @category Serialization
   */
  static isValid(args: { input: AccountAddressInput; strict?: boolean }): ParsingResult<AddressInvalidReason> {
    try {
      if (args.strict) {
        AccountAddress.fromStrict(args.input);
      } else {
        AccountAddress.from(args.input);
      }
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
   * Determine if two AccountAddresses are equal based on their underlying byte data.
   *
   * @param other - The AccountAddress to compare to.
   * @returns true if the AccountAddresses are equal, false if not.
   * @group Implementation
   * @category Serialization
   */
  equals(other: AccountAddress): boolean {
    if (this.data.length !== other.data.length) return false;
    return this.data.every((value, index) => value === other.data[index]);
  }
}
