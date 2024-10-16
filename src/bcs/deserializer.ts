// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-bitwise */
import { MAX_U32_NUMBER } from "./consts";
import { Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../types";

/**
 * This interface exists to define Deserializable<T> inputs for functions that
 * deserialize a byte buffer into a type T.
 * It is not intended to be implemented or extended, because Typescript has no support
 * for static methods in interfaces.
 *
 * @template T - The type that this will deserialize into.
 */
export interface Deserializable<T> {
  /**
   * Deserializes the buffered bytes into an instance of the specified class type.
   * This function provides an alternative syntax for deserialization, allowing users to call
   * `deserializer.deserialize(MyClass)` instead of `MyClass.deserialize(deserializer)`.
   *
   * @param deserializer - The deserializer instance with the buffered bytes.
   * @returns The deserialized value of class type T.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([1, 2, 3]));
   * const value = deserializer.deserialize(MyClass); // where MyClass has a `deserialize` function
   * // value is now an instance of MyClass
   * // equivalent to `const value = MyClass.deserialize(deserializer)`
   * ```
   */
  deserialize(deserializer: Deserializer): T;
}

/**
 * A class that provides methods for deserializing various data types from a byte buffer.
 * It supports deserialization of primitive types, strings, and complex objects using a BCS (Binary Common Serialization) layout.
 */
export class Deserializer {
  private buffer: ArrayBuffer;

  private offset: number;

  /**
   * Creates a new instance of the class with a copy of the provided data buffer.
   * This prevents outside mutation of the buffer.
   *
   * @param data - The data to be copied into the internal buffer as a Uint8Array.
   */
  constructor(data: Uint8Array) {
    // copies data to prevent outside mutation of buffer.
    this.buffer = new ArrayBuffer(data.length);
    new Uint8Array(this.buffer).set(data, 0);
    this.offset = 0;
  }

  /**
   * Reads a specified number of bytes from the buffer and advances the offset.
   *
   * @param length - The number of bytes to read from the buffer.
   * @throws Throws an error if the read operation exceeds the buffer's length.
   */
  private read(length: number): ArrayBuffer {
    if (this.offset + length > this.buffer.byteLength) {
      throw new Error("Reached to the end of buffer");
    }

    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  /**
   * Returns the number of bytes remaining in the buffer.
   *
   * This information is useful to determine if there's more data to be read.
   *
   * @returns The number of bytes remaining in the buffer.
   */
  remaining(): number {
    return this.buffer.byteLength - this.offset;
  }

  /**
   * Deserializes a UTF-8 encoded string from a byte array. It first reads the length of the string in bytes,
   * followed by the actual byte content, and decodes it into a string.
   *
   * BCS layout for "string": string_length | string_content
   * where string_length is a u32 integer encoded as a uleb128 integer, equal to the number of bytes in string_content.
   *
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([8, 49, 50, 51, 52, 97, 98, 99, 100]));
   * assert(deserializer.deserializeStr() === "1234abcd");
   * ```
   */
  deserializeStr(): string {
    const value = this.deserializeBytes();
    const textDecoder = new TextDecoder();
    return textDecoder.decode(value);
  }

  /**
   * Deserializes an optional string.
   *
   * The BCS layout for Optional<String> is 0 if none, else 1 followed by the string length and string content.
   * @returns The deserialized string if it exists, otherwise undefined.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x00]));
   * assert(deserializer.deserializeOptionStr() === undefined);
   * const deserializer = new Deserializer(new Uint8Array([1, 8, 49, 50, 51, 52, 97, 98, 99, 100]));
   * assert(deserializer.deserializeOptionStr() === "1234abcd");
   * ```
   */
  deserializeOptionStr(): string | undefined {
    const exists = this.deserializeBool();
    return exists ? this.deserializeStr() : undefined;
  }

  /**
   * Deserializes an optional deserializable class.
   *
   * BCS layout for Optional<T>: 0 if none, else 1 | BCS representation of class.
   *
   * @example
   * const deserializer = new Deserializer(new Uint8Array([1, 2, 3]));
   * const value = deserializer.deserializeOption(MyClass); // where MyClass has a `deserialize` function
   * // value is now an instance of MyClass
   *
   * const deserializer = new Deserializer(new Uint8Array([0]));
   * const value = deserializer.deserializeOption(MyClass); // where MyClass has a `deserialize` function
   * // value is undefined
   *
   * @param cls The BCS-deserializable class to deserialize the buffered bytes into.
   *
   * @returns The deserialized value of class type T or undefined if no value exists.
   */
  deserializeOption<T>(cls: Deserializable<T>): T | undefined {
    const exists = this.deserializeBool();
    return exists ? this.deserialize(cls) : undefined;
  }

  /**
   * Deserializes an array of bytes.
   *
   * The BCS layout for "bytes" consists of a bytes_length followed by the bytes themselves, where bytes_length is a u32 integer
   * encoded as a uleb128 integer, indicating the length of the bytes array.
   *
   * @returns {Uint8Array} The deserialized array of bytes.
   */
  deserializeBytes(): Uint8Array {
    const len = this.deserializeUleb128AsU32();
    return new Uint8Array(this.read(len));
  }

  /**
   * Deserializes an array of bytes of a specified length.
   *
   * @param len - The number of bytes to read from the source.
   */
  deserializeFixedBytes(len: number): Uint8Array {
    return new Uint8Array(this.read(len));
  }

  /**
   * Deserializes a boolean value from a byte stream.
   *
   * The BCS layout for a boolean uses one byte, where "0x01" represents true and "0x00" represents false.
   * An error is thrown if the byte value is not valid.
   *
   * @returns The deserialized boolean value.
   * @throws Throws an error if the boolean value is invalid.
   */
  deserializeBool(): boolean {
    const bool = new Uint8Array(this.read(1))[0];
    if (bool !== 1 && bool !== 0) {
      throw new Error("Invalid boolean value");
    }
    return bool === 1;
  }

  /**
   * Deserializes a uint8 number from the binary data.
   *
   * BCS layout for "uint8": One byte. Binary format in little-endian representation.
   *
   * @returns {number} The deserialized uint8 number.
   */
  deserializeU8(): Uint8 {
    return new DataView(this.read(1)).getUint8(0);
  }

  /**
   * Deserializes a uint16 number from a binary format in little-endian representation.
   *
   * BCS layout for "uint16": Two bytes.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x34, 0x12]));
   * assert(deserializer.deserializeU16() === 4660);
   * ```
   */
  deserializeU16(): Uint16 {
    return new DataView(this.read(2)).getUint16(0, true);
  }

  /**
   * Deserializes a uint32 number from a binary format in little-endian representation.
   *
   * BCS layout for "uint32": Four bytes.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
   * assert(deserializer.deserializeU32() === 305419896);
   * ```
   */
  deserializeU32(): Uint32 {
    return new DataView(this.read(4)).getUint32(0, true);
  }

  /**
   * Deserializes a uint64 number.
   *
   * This function combines two 32-bit values to return a 64-bit unsigned integer in little-endian representation.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x00, 0xEF, 0xCD, 0xAB, 0x78, 0x56, 0x34, 0x12]));
   * assert(deserializer.deserializeU64() === 1311768467750121216);
   * ```
   */
  deserializeU64(): Uint64 {
    const low = this.deserializeU32();
    const high = this.deserializeU32();

    // combine the two 32-bit values and return (little endian)
    return BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
  }

  /**
   * Deserializes a uint128 number from its binary representation.
   * This function combines two 64-bit values to return a single uint128 value in little-endian format.
   *
   * @returns {BigInt} The deserialized uint128 number.
   */
  deserializeU128(): Uint128 {
    const low = this.deserializeU64();
    const high = this.deserializeU64();

    // combine the two 64-bit values and return (little endian)
    return BigInt((high << BigInt(64)) | low);
  }

  /**
   * Deserializes a uint256 number from its binary representation.
   *
   * The BCS layout for "uint256" consists of thirty-two bytes in little-endian format.
   *
   * @returns {BigInt} The deserialized uint256 number.
   */
  deserializeU256(): Uint256 {
    const low = this.deserializeU128();
    const high = this.deserializeU128();

    // combine the two 128-bit values and return (little endian)
    return BigInt((high << BigInt(128)) | low);
  }

  /**
   * Deserializes a uleb128 encoded uint32 number.
   *
   * This function is used for interpreting lengths of variable-length sequences and tags of enum values in BCS encoding.
   *
   * @throws {Error} Throws an error if the parsed value exceeds the maximum uint32 number.
   * @returns {number} The deserialized uint32 value.
   */
  deserializeUleb128AsU32(): Uint32 {
    let value: bigint = BigInt(0);
    let shift = 0;

    while (value < MAX_U32_NUMBER) {
      const byte = this.deserializeU8();
      value |= BigInt(byte & 0x7f) << BigInt(shift);

      if ((byte & 0x80) === 0) {
        break;
      }
      shift += 7;
    }

    if (value > MAX_U32_NUMBER) {
      throw new Error("Overflow while parsing uleb128-encoded uint32 value");
    }

    return Number(value);
  }

  /**
   * Helper function that primarily exists to support alternative syntax for deserialization.
   * That is, if we have a `const deserializer: new Deserializer(...)`, instead of having to use
   * `MyClass.deserialize(deserializer)`, we can call `deserializer.deserialize(MyClass)`.
   *
   * @example const deserializer = new Deserializer(new Uint8Array([1, 2, 3]));
   * const value = deserializer.deserialize(MyClass); // where MyClass has a `deserialize` function
   * // value is now an instance of MyClass
   * // equivalent to `const value = MyClass.deserialize(deserializer)`
   * @param cls The BCS-deserializable class to deserialize the buffered bytes into.
   *
   * @returns the deserialized value of class type T
   */
  deserialize<T>(cls: Deserializable<T>): T {
    // NOTE: `deserialize` in `cls.deserialize(this)` here is a static method defined in `cls`,
    // It is separate from the `deserialize` instance method defined here in Deserializer.
    return cls.deserialize(this);
  }

  /**
   * Deserializes an array of BCS Deserializable values given an existing Deserializer instance with a loaded byte buffer.
   *
   * @param cls The BCS-deserializable class to deserialize the buffered bytes into.
   * @returns An array of deserialized values of type T.
   * @example
   * // serialize a vector of addresses
   * const addresses = new Array<AccountAddress>(
   *   AccountAddress.from("0x1"),
   *   AccountAddress.from("0x2"),
   *   AccountAddress.from("0xa"),
   *   AccountAddress.from("0xb"),
   * );
   * const serializer = new Serializer();
   * serializer.serializeVector(addresses);
   * const serializedBytes = serializer.toUint8Array();
   *
   * // deserialize the bytes into an array of addresses
   * const deserializer = new Deserializer(serializedBytes);
   * const deserializedAddresses = deserializer.deserializeVector(AccountAddress);
   * // deserializedAddresses is now an array of AccountAddress instances
   */
  deserializeVector<T>(cls: Deserializable<T>): Array<T> {
    const length = this.deserializeUleb128AsU32();
    const vector = new Array<T>();
    for (let i = 0; i < length; i += 1) {
      vector.push(this.deserialize(cls));
    }
    return vector;
  }
}
