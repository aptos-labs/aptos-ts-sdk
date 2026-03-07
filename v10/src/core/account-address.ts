import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { TransactionArgument } from "../bcs/types.js";
import { ScriptTransactionArgumentVariants } from "../bcs/types.js";
import { ParsingError, type ParsingResult } from "../hex/errors.js";
import type { HexInput } from "../hex/index.js";

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

export type AccountAddressInput = HexInput | AccountAddress;

export class AccountAddress extends Serializable implements TransactionArgument {
  readonly data: Uint8Array;

  static readonly LENGTH: number = 32;
  static readonly LONG_STRING_LENGTH: number = 64;

  static ZERO: AccountAddress = AccountAddress.from("0x0");
  static ONE: AccountAddress = AccountAddress.from("0x1");
  static TWO: AccountAddress = AccountAddress.from("0x2");
  static THREE: AccountAddress = AccountAddress.from("0x3");
  static FOUR: AccountAddress = AccountAddress.from("0x4");
  static A: AccountAddress = AccountAddress.from("0xA");

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

  isSpecial(): boolean {
    return (
      this.data.slice(0, this.data.length - 1).every((byte) => byte === 0) && this.data[this.data.length - 1] < 0b10000
    );
  }

  toString(): `0x${string}` {
    return `0x${this.toStringWithoutPrefix()}`;
  }

  toStringWithoutPrefix(): string {
    let hex = bytesToHex(this.data);
    if (this.isSpecial()) {
      hex = hex[hex.length - 1];
    }
    return hex;
  }

  toStringLong(): `0x${string}` {
    return `0x${this.toStringLongWithoutPrefix()}`;
  }

  toStringLongWithoutPrefix(): string {
    return bytesToHex(this.data);
  }

  toStringShort(): `0x${string}` {
    return `0x${this.toStringShortWithoutPrefix()}`;
  }

  toStringShortWithoutPrefix(): string {
    const hex = bytesToHex(this.data).replace(/^0+/, "");
    return hex === "" ? "0" : hex;
  }

  toUint8Array(): Uint8Array {
    return this.data;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Address);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): AccountAddress {
    const bytes = deserializer.deserializeFixedBytes(AccountAddress.LENGTH);
    return new AccountAddress(bytes);
  }

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
    } catch (error: any) {
      throw new ParsingError(`Hex characters are invalid: ${error?.message}`, AddressInvalidReason.INVALID_HEX_CHARS);
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

  static from(input: AccountAddressInput, { maxMissingChars = 4 }: { maxMissingChars?: number } = {}): AccountAddress {
    if (typeof input === "string") {
      return AccountAddress.fromString(input, { maxMissingChars });
    }
    if (input instanceof Uint8Array) {
      return new AccountAddress(input);
    }
    return input;
  }

  static fromStrict(input: AccountAddressInput): AccountAddress {
    if (typeof input === "string") {
      return AccountAddress.fromStringStrict(input);
    }
    if (input instanceof Uint8Array) {
      return new AccountAddress(input);
    }
    return input;
  }

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

  equals(other: AccountAddress): boolean {
    if (this.data.length !== other.data.length) return false;
    return this.data.every((value, index) => value === other.data[index]);
  }
}
