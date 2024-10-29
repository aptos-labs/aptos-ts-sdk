// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-bitwise */
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U256_BIG_INT,
} from "./consts";
import { Hex } from "../core/hex";
import { AnyNumber, Uint16, Uint32, Uint8 } from "../types";

/**
 * This class serves as a base class for all serializable types. It facilitates
 * composable serialization of complex types and enables the serialization of
 * instances to their BCS (Binary Canonical Serialization) representation.
 */
export abstract class Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Serializes a `Serializable` value to its BCS representation.
   * This function is the TypeScript SDK equivalent of `bcs::to_bytes` in Move.
   * @returns the BCS representation of the Serializable instance as a byte buffer.
   */
  bcsToBytes(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  /**
   * Converts the BCS-serialized bytes of a value into a Hex instance.
   * This function provides a Hex representation of the BCS-serialized data for easier handling and manipulation.
   * @returns A Hex instance with the BCS-serialized bytes loaded into its underlying Uint8Array.
   */
  bcsToHex(): Hex {
    const bcsBytes = this.bcsToBytes();
    return Hex.fromHexInput(bcsBytes);
  }

  /**
   * Returns the hex string representation of the `Serializable` value without the 0x prefix.
   * @returns the hex format as a string without `0x` prefix.
   */
  toStringWithoutPrefix(): string {
    return this.bcsToHex().toStringWithoutPrefix();
  }

  /**
   * Returns the hex string representation of the `Serializable` value with the 0x prefix.
   * @returns the hex formatas a string prefixed by `0x`.
   */
  toString(): string {
    return `0x${this.toStringWithoutPrefix()}`;
  }
}

/**
 * A class for serializing various data types into a binary format.
 * It provides methods to serialize strings, bytes, numbers, and other serializable objects
 * using the Binary Coded Serialization (BCS) layout. The serialized data can be retrieved as a
 * Uint8Array.
 */
export class Serializer {
  private buffer: ArrayBuffer;

  private offset: number;

  /**
   * Constructs a serializer with a buffer of size `length` bytes, 64 bytes by default.
   * The `length` must be greater than 0.
   *
   * @param length - The size of the buffer in bytes.
   */
  constructor(length: number = 64) {
    if (length <= 0) {
      throw new Error("Length needs to be greater than 0");
    }
    this.buffer = new ArrayBuffer(length);
    this.offset = 0;
  }

  /**
   * Ensures that the internal buffer can accommodate the specified number of bytes.
   * This function dynamically resizes the buffer if the current size is insufficient.
   *
   * @param bytes - The number of bytes to ensure the buffer can handle.
   */
  private ensureBufferWillHandleSize(bytes: number) {
    while (this.buffer.byteLength < this.offset + bytes) {
      const newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
    }
  }

  /**
   * Appends the specified values to the buffer, ensuring that the buffer can accommodate the new data.
   *
   * @param {Uint8Array} values - The values to be appended to the buffer.
   */
  protected appendToBuffer(values: Uint8Array) {
    this.ensureBufferWillHandleSize(values.length);
    new Uint8Array(this.buffer, this.offset).set(values);
    this.offset += values.length;
  }

  /**
   * Serializes a value into the buffer using the provided function, ensuring the buffer can accommodate the size.
   *
   * @param fn - The function to serialize the value, which takes a byte offset, the value to serialize, and an optional little-endian flag.
   * @param fn.byteOffset - The byte offset at which to write the value.
   * @param fn.value - The numeric value to serialize into the buffer.
   * @param fn.littleEndian - Optional flag indicating whether to use little-endian byte order (defaults to true).
   */
  // TODO: JSDoc bytesLength and value
  private serializeWithFunction(
    fn: (byteOffset: number, value: number, littleEndian?: boolean) => void,
    bytesLength: number,
    value: number,
  ) {
    this.ensureBufferWillHandleSize(bytesLength);
    const dv = new DataView(this.buffer, this.offset);
    fn.apply(dv, [0, value, true]);
    this.offset += bytesLength;
  }

  /**
   * Serializes a string. UTF8 string is supported.
   * The number of bytes in the string content is serialized first, as a uleb128-encoded u32 integer.
   * Then the string content is serialized as UTF8 encoded bytes.
   *
   * BCS layout for "string": string_length | string_content
   * where string_length is a u32 integer encoded as a uleb128 integer, equal to the number of bytes in string_content.
   *
   * @param value - The string to serialize.
   *
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeStr("1234abcd");
   * assert(serializer.toUint8Array() === new Uint8Array([8, 49, 50, 51, 52, 97, 98, 99, 100]));
   * ```
   */
  serializeStr(value: string) {
    const textEncoder = new TextEncoder();
    this.serializeBytes(textEncoder.encode(value));
  }

  /**
   * Serializes an array of bytes.
   *
   * This function encodes the length of the byte array as a u32 integer in uleb128 format, followed by the byte array itself.
   * BCS layout for "bytes": bytes_length | bytes
   * where bytes_length is a u32 integer encoded as a uleb128 integer, equal to the length of the bytes array.
   * @param value - The byte array to serialize.
   */
  serializeBytes(value: Uint8Array) {
    this.serializeU32AsUleb128(value.length);
    this.appendToBuffer(value);
  }

  /**
   * Serializes an array of bytes with a known length, allowing for efficient deserialization without needing to serialize the
   * length itself.
   * When deserializing, the number of bytes to deserialize needs to be passed in.

   * @param value - The Uint8Array to be serialized.
   */
  serializeFixedBytes(value: Uint8Array) {
    this.appendToBuffer(value);
  }

  /**
   * Serializes a boolean value into a byte representation.
   *
   * The BCS layout for a boolean uses one byte, where "0x01" represents true and "0x00" represents false.
   *
   * @param value - The boolean value to serialize.
   */
  serializeBool(value: boolean) {
    /**
     * Ensures that the provided value is a boolean.
     * This function throws an error if the value is not a boolean, helping to enforce type safety in your code.
     *
     * @param value - The value to be checked for boolean type.
     * @throws {Error} Throws an error if the value is not a boolean.
     */
    ensureBoolean(value);
    const byteValue = value ? 1 : 0;
    this.appendToBuffer(new Uint8Array([byteValue]));
  }

  /**
   * Serializes a Uint8 value and appends it to the buffer.
   * BCS layout for "uint8": One byte. Binary format in little-endian representation.
   *
   * @param value - The Uint8 value to serialize.
   */
  @checkNumberRange(0, MAX_U8_NUMBER)
  serializeU8(value: Uint8) {
    this.appendToBuffer(new Uint8Array([value]));
  }

  /**
   * Serializes a uint16 number.
   *

   */

  /**
   * Serializes a 16-bit unsigned integer value into a binary format.
   * BCS layout for "uint16": Two bytes. Binary format in little-endian representation.
   *
   * @param value - The 16-bit unsigned integer value to serialize.
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeU16(4660);
   * assert(serializer.toUint8Array() === new Uint8Array([0x34, 0x12]));
   * ```
   */
  @checkNumberRange(0, MAX_U16_NUMBER)
  serializeU16(value: Uint16) {
    this.serializeWithFunction(DataView.prototype.setUint16, 2, value);
  }

  /**
   * Serializes a 32-bit unsigned integer value into a binary format.
   * This function is useful for encoding data that needs to be stored or transmitted in a compact form.
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeU32(305419896);
   * assert(serializer.toUint8Array() === new Uint8Array([0x78, 0x56, 0x34, 0x12]));
   * ```
   * @param value - The 32-bit unsigned integer value to serialize.
   */
  @checkNumberRange(0, MAX_U32_NUMBER)
  serializeU32(value: Uint32) {
    this.serializeWithFunction(DataView.prototype.setUint32, 4, value);
  }

  /**
   * Serializes a 64-bit unsigned integer into a format suitable for storage or transmission.
   * This function breaks down the value into two 32-bit components and writes them in little-endian order.
   *
   * @param value - The 64-bit unsigned integer to serialize, represented as a number.
   * @example
   * ```ts
   * const serializer = new Serializer();
   * serializer.serializeU64(1311768467750121216);
   * assert(serializer.toUint8Array() === new Uint8Array([0x00, 0xEF, 0xCD, 0xAB, 0x78, 0x56, 0x34, 0x12]));
   * ```
   */
  @checkNumberRange(BigInt(0), MAX_U64_BIG_INT)
  serializeU64(value: AnyNumber) {
    const low = BigInt(value) & BigInt(MAX_U32_NUMBER);
    const high = BigInt(value) >> BigInt(32);

    // write little endian number
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
  }

  /**
   * Serializes a U128 value into a format suitable for storage or transmission.
   *
   * @param value - The U128 value to serialize, represented as a number.
   */
  @checkNumberRange(BigInt(0), MAX_U128_BIG_INT)
  serializeU128(value: AnyNumber) {
    const low = BigInt(value) & MAX_U64_BIG_INT;
    const high = BigInt(value) >> BigInt(64);

    // write little endian number
    this.serializeU64(low);
    this.serializeU64(high);
  }

  /**
   * Serializes a U256 value into a byte representation.
   * This function is essential for encoding large numbers in a compact format suitable for transmission or storage.
   *
   * @param value - The U256 value to serialize, represented as an AnyNumber.
   */
  @checkNumberRange(BigInt(0), MAX_U256_BIG_INT)
  serializeU256(value: AnyNumber) {
    const low = BigInt(value) & MAX_U128_BIG_INT;
    const high = BigInt(value) >> BigInt(128);

    // write little endian number
    this.serializeU128(low);
    this.serializeU128(high);
  }

  /**
   * Serializes a 32-bit unsigned integer as a variable-length ULEB128 encoded byte array.
   * BCS uses uleb128 encoding in two cases: (1) lengths of variable-length sequences and (2) tags of enum values
   *
   * @param val - The 32-bit unsigned integer value to be serialized.
   */
  @checkNumberRange(0, MAX_U32_NUMBER)
  serializeU32AsUleb128(val: Uint32) {
    let value = val;
    const valueArray = [];
    while (value >>> 7 !== 0) {
      valueArray.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    valueArray.push(value);
    this.appendToBuffer(new Uint8Array(valueArray));
  }

  /**
   * Returns the buffered bytes as a Uint8Array.
   *
   * This function allows you to retrieve the byte representation of the buffer up to the current offset.
   *
   * @returns Uint8Array - The byte array representation of the buffer.
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer).slice(0, this.offset);
  }

  /**
   * Serializes a `Serializable` value, facilitating composable serialization.
   *
   * @param value The Serializable value to serialize.
   *
   * @returns the serializer instance
   */
  serialize<T extends Serializable>(value: T): void {
    // NOTE: The `serialize` method called by `value` is defined in `value`'s
    // Serializable interface, not the one defined in this class.
    value.serialize(this);
  }

  /**
   * Serializes an array of BCS Serializable values to a serializer instance.
   * The bytes are added to the serializer instance's byte buffer.
   *
   * @param values The array of BCS Serializable values
   * @example
   * const addresses = new Array<AccountAddress>(
   *   AccountAddress.from("0x1"),
   *   AccountAddress.from("0x2"),
   *   AccountAddress.from("0xa"),
   *   AccountAddress.from("0xb"),
   * );
   * const serializer = new Serializer();
   * serializer.serializeVector(addresses);
   * const serializedBytes = serializer.toUint8Array();
   * // serializedBytes is now the BCS-serialized bytes
   * // The equivalent value in Move would be:
   * // `bcs::to_bytes(&vector<address> [@0x1, @0x2, @0xa, @0xb])`;
   */
  serializeVector<T extends Serializable>(values: Array<T>): void {
    this.serializeU32AsUleb128(values.length);
    values.forEach((item) => {
      item.serialize(this);
    });
  }

  /**
   * Serializes a BCS Serializable value into a serializer instance or handles the case when the value is undefined.
   * This function allows you to efficiently add serialized data to the serializer's byte buffer.
   *
   * @param value The BCS Serializable value to serialize, or undefined if there is no value.
   *
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeOption(new AccountAddress(...));
   * const serializedBytes = serializer.toUint8Array();
   * // serializedBytes is now the BCS-serialized byte representation of AccountAddress
   *
   * const serializer = new Serializer();
   * serializer.serializeOption(undefined);
   * assert(serializer.toUint8Array() === new Uint8Array([0x00]));
   * ```
   */
  serializeOption<T extends Serializable>(value?: T): void {
    const hasValue = value !== undefined;
    this.serializeBool(hasValue);
    if (hasValue) {
      value.serialize(this);
    }
  }

  /**
   * Serializes an optional string, supporting UTF8 encoding.
   * The function encodes the existence of the string first, followed by the length and content if it exists.
   *
   * BCS layout for optional "string": 1 | string_length | string_content
   * where string_length is a u32 integer encoded as a uleb128 integer, equal to the number of bytes in string_content.
   * BCS layout for undefined: 0
   *
   * @param value - The optional string to serialize. If undefined, it will serialize as 0.
   */
  serializeOptionStr(value?: string): void {
    if (value === undefined) {
      this.serializeU32AsUleb128(0);
    } else {
      this.serializeU32AsUleb128(1);
      this.serializeStr(value);
    }
  }
}

export function ensureBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${value} is not a boolean value`);
  }
}

export const outOfRangeErrorMessage = (value: AnyNumber, min: AnyNumber, max: AnyNumber) =>
  `${value} is out of range: [${min}, ${max}]`;

/**
 * Validates that a given number is within a specified range.
 * This function throws an error if the value is outside the defined minimum and maximum bounds.
 *
 * @param value - The number to validate.
 * @param minValue - The minimum allowable value (inclusive).
 * @param maxValue - The maximum allowable value (inclusive).
 */
export function validateNumberInRange<T extends AnyNumber>(value: T, minValue: T, maxValue: T) {
  const valueBigInt = BigInt(value);
  if (valueBigInt > BigInt(maxValue) || valueBigInt < BigInt(minValue)) {
    throw new Error(outOfRangeErrorMessage(value, minValue, maxValue));
  }
}

/**
 * A decorator that validates that the input argument for a function is within a specified range.
 * This ensures that the function is only called with valid input values, preventing potential errors.
 *
 * @param minValue - The input argument must be greater than or equal to this value.
 * @param maxValue - The input argument must be less than or equal to this value.
 */
function checkNumberRange<T extends AnyNumber>(minValue: T, maxValue: T) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const childFunction = descriptor.value;
    // eslint-disable-next-line no-param-reassign
    descriptor.value = function deco(value: AnyNumber) {
      validateNumberInRange(value, minValue, maxValue);
      return childFunction.apply(this, [value]);
    };

    return descriptor;
  };
}
