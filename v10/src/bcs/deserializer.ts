// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Hex } from "../hex/hex.js";
import type { HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "./types.js";

const TEXT_DECODER = new TextDecoder();

/** Max 10MB to prevent memory exhaustion from malformed BCS data. */
const MAX_DESERIALIZE_BYTES_LENGTH = 10 * 1024 * 1024;

/**
 * Interface for types that expose a static `deserialize` factory method.
 *
 * Implement this interface on the class (not an instance) to allow
 * {@link Deserializer.deserialize} and {@link Deserializer.deserializeVector} to
 * reconstruct values from a byte stream.
 *
 * @typeParam T - The type that `deserialize` produces.
 *
 * @example
 * ```typescript
 * class MyType implements Deserializable<MyType> {
 *   static deserialize(deserializer: Deserializer): MyType {
 *     const value = deserializer.deserializeU32();
 *     return new MyType(value);
 *   }
 * }
 * ```
 */
export interface Deserializable<T> {
  /**
   * Reads bytes from `deserializer` and constructs an instance of `T`.
   * @param deserializer - The deserializer to read from.
   * @returns A newly constructed `T`.
   */
  deserialize(deserializer: Deserializer): T;
}

/**
 * BCS (Binary Canonical Serialization) deserializer for decoding Move and Aptos data types.
 *
 * Reads typed values sequentially from a fixed byte buffer. The buffer is copied
 * on construction so outside mutations do not affect in-progress deserialization.
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
 * const deserializer = new Deserializer(bytes);
 * const num = deserializer.deserializeU8();    // 255
 * const str = deserializer.deserializeStr();   // "hello"
 * deserializer.assertFinished();
 * ```
 */
export class Deserializer {
  private buffer: ArrayBuffer;
  private offset: number;

  /**
   * Creates a new Deserializer that reads from a copy of the given bytes.
   * @param data - The bytes to deserialize.
   */
  constructor(data: Uint8Array) {
    // Copy to prevent outside mutation
    this.buffer = new ArrayBuffer(data.length);
    new Uint8Array(this.buffer).set(data, 0);
    this.offset = 0;
  }

  /**
   * Creates a Deserializer from a hex-encoded string or `Uint8Array`.
   * @param hex - A hex string (with or without `0x` prefix) or raw bytes.
   * @returns A new `Deserializer` wrapping the decoded bytes.
   */
  static fromHex(hex: HexInput): Deserializer {
    return new Deserializer(Hex.hexInputToUint8Array(hex));
  }

  private read(length: number): Uint8Array {
    if (this.offset + length > this.buffer.byteLength) {
      throw new Error("Reached to the end of buffer");
    }
    const bytes = new Uint8Array(this.buffer, this.offset, length);
    this.offset += length;
    return bytes;
  }

  /**
   * Returns the number of bytes remaining in the buffer that have not yet been read.
   * @returns The remaining byte count.
   */
  remaining(): number {
    return this.buffer.byteLength - this.offset;
  }

  /**
   * Asserts that all bytes in the buffer have been consumed.
   * Call this after deserialization is complete to detect trailing bytes that
   * indicate a malformed or truncated payload.
   * @throws {Error} If there are unread bytes remaining.
   */
  assertFinished(): void {
    if (this.remaining() !== 0) {
      throw new Error("Buffer has remaining bytes");
    }
  }

  // ── String / Bytes ──

  /**
   * Deserializes a UTF-8 string that was serialized with a ULEB128 length prefix.
   * @returns The decoded string.
   */
  deserializeStr(): string {
    return TEXT_DECODER.decode(this.deserializeBytes());
  }

  /**
   * Deserializes a length-prefixed byte array.
   * Reads a ULEB128 length, then reads that many bytes.
   * @returns A copy of the deserialized bytes.
   * @throws {Error} If the encoded length exceeds 10 MB.
   */
  deserializeBytes(): Uint8Array {
    const len = this.deserializeUleb128AsU32();
    if (len > MAX_DESERIALIZE_BYTES_LENGTH) {
      throw new Error(
        `Deserialization error: byte array length ${len} exceeds maximum allowed ${MAX_DESERIALIZE_BYTES_LENGTH}`,
      );
    }
    return this.read(len).slice();
  }

  /**
   * Deserializes exactly `len` bytes (no length prefix).
   * The caller is responsible for knowing the expected byte count.
   * @param len - The number of bytes to read.
   * @returns A copy of the deserialized bytes.
   */
  deserializeFixedBytes(len: number): Uint8Array {
    return this.read(len).slice();
  }

  // ── Boolean ──

  /**
   * Deserializes a single byte as a boolean (`1` → `true`, `0` → `false`).
   * @returns The boolean value.
   * @throws {Error} If the byte is not `0` or `1`.
   */
  deserializeBool(): boolean {
    const bool = this.read(1)[0];
    if (bool !== 1 && bool !== 0) {
      throw new Error("Invalid boolean value");
    }
    return bool === 1;
  }

  // ── Unsigned integers ──

  /**
   * Deserializes an unsigned 8-bit integer (u8).
   * @returns A number in the range [0, 255].
   */
  deserializeU8(): Uint8 {
    return this.read(1)[0];
  }

  /**
   * Deserializes an unsigned 16-bit integer (u16) in little-endian byte order.
   * @returns A number in the range [0, 65535].
   */
  deserializeU16(): Uint16 {
    const bytes = this.read(2);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(0, true);
  }

  /**
   * Deserializes an unsigned 32-bit integer (u32) in little-endian byte order.
   * @returns A number in the range [0, 4294967295].
   */
  deserializeU32(): Uint32 {
    const bytes = this.read(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
  }

  /**
   * Deserializes an unsigned 64-bit integer (u64) in little-endian byte order.
   * @returns A `bigint` in the range [0, 2^64 - 1].
   */
  deserializeU64(): Uint64 {
    const low = this.deserializeU32();
    const high = this.deserializeU32();
    return BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
  }

  /**
   * Deserializes an unsigned 128-bit integer (u128) in little-endian byte order.
   * @returns A `bigint` in the range [0, 2^128 - 1].
   */
  deserializeU128(): Uint128 {
    const low = this.deserializeU64();
    const high = this.deserializeU64();
    return BigInt((high << BigInt(64)) | low);
  }

  /**
   * Deserializes an unsigned 256-bit integer (u256) in little-endian byte order.
   * @returns A `bigint` in the range [0, 2^256 - 1].
   */
  deserializeU256(): Uint256 {
    const low = this.deserializeU128();
    const high = this.deserializeU128();
    return BigInt((high << BigInt(128)) | low);
  }

  // ── Signed integers ──

  /**
   * Deserializes a signed 8-bit integer (i8).
   * @returns A number in the range [-128, 127].
   */
  deserializeI8(): number {
    const bytes = this.read(1);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt8(0);
  }

  /**
   * Deserializes a signed 16-bit integer (i16) in little-endian byte order.
   * @returns A number in the range [-32768, 32767].
   */
  deserializeI16(): number {
    const bytes = this.read(2);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt16(0, true);
  }

  /**
   * Deserializes a signed 32-bit integer (i32) in little-endian byte order.
   * @returns A number in the range [-2147483648, 2147483647].
   */
  deserializeI32(): number {
    const bytes = this.read(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(0, true);
  }

  /**
   * Deserializes a signed 64-bit integer (i64) in little-endian byte order using two's complement.
   * @returns A `bigint` in the range [-2^63, 2^63 - 1].
   */
  deserializeI64(): bigint {
    const low = this.deserializeU32();
    const high = this.deserializeU32();
    const unsigned = BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
    const signBit = BigInt(1) << BigInt(63);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(64)) : unsigned;
  }

  /**
   * Deserializes a signed 128-bit integer (i128) in little-endian byte order using two's complement.
   * @returns A `bigint` in the range [-2^127, 2^127 - 1].
   */
  deserializeI128(): bigint {
    const low = this.deserializeU64();
    const high = this.deserializeU64();
    const unsigned = BigInt((high << BigInt(64)) | low);
    const signBit = BigInt(1) << BigInt(127);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(128)) : unsigned;
  }

  /**
   * Deserializes a signed 256-bit integer (i256) in little-endian byte order using two's complement.
   * @returns A `bigint` in the range [-2^255, 2^255 - 1].
   */
  deserializeI256(): bigint {
    const low = this.deserializeU128();
    const high = this.deserializeU128();
    const unsigned = BigInt((high << BigInt(128)) | low);
    const signBit = BigInt(1) << BigInt(255);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(256)) : unsigned;
  }

  // ── ULEB128 ──

  /**
   * Deserializes a ULEB128-encoded value as a `u32`.
   * ULEB128 is used in BCS to encode vector lengths and enum variant tags.
   * @returns A number in the range [0, 4294967295].
   * @throws {Error} If the encoded value overflows a u32.
   */
  deserializeUleb128AsU32(): Uint32 {
    let value = 0;
    let shift = 0;

    for (let i = 0; i < 5; i++) {
      const byte = this.deserializeU8();

      // On the 5th byte (shift=28), only bits 0-3 can contribute to u32
      if (i === 4 && (byte & 0x70) !== 0) {
        throw new Error("Overflow while parsing uleb128-encoded uint32 value");
      }

      value = (value | ((byte & 0x7f) << shift)) >>> 0;

      if ((byte & 0x80) === 0) {
        return value;
      }
      shift += 7;
    }

    throw new Error("Malformed ULEB128: continuation bit set on terminal byte");
  }

  // ── Composable deserialization ──

  /**
   * Deserializes a value of type `T` using the static `deserialize` method of `cls`.
   * This is the primary way to read complex types from a byte stream.
   *
   * @typeParam T - The type to deserialize.
   * @param cls - An object (typically a class constructor) with a static `deserialize` method.
   * @returns The deserialized value.
   *
   * @example
   * ```typescript
   * const myValue = deserializer.deserialize(MyType);
   * ```
   */
  deserialize<T>(cls: Deserializable<T>): T {
    return cls.deserialize(this);
  }

  /**
   * Deserializes a BCS vector of values of type `T`.
   * Reads a ULEB128 length, then deserializes that many elements using `cls.deserialize`.
   *
   * @typeParam T - The element type.
   * @param cls - An object with a static `deserialize` method for the element type.
   * @returns An array of deserialized values.
   *
   * @example
   * ```typescript
   * const items = deserializer.deserializeVector(MyType);
   * ```
   */
  deserializeVector<T>(cls: Deserializable<T>, maxLen = 65_536): Array<T> {
    const length = this.deserializeUleb128AsU32();
    if (length > maxLen) {
      throw new Error(`BCS vector length ${length} exceeds maximum allowed ${maxLen}`);
    }
    const vector: T[] = [];
    for (let i = 0; i < length; i += 1) {
      vector.push(this.deserialize(cls));
    }
    return vector;
  }

  // ── Optional ──

  /**
   * Deserializes a BCS `Option<T>` value.
   *
   * Reads a boolean presence flag. If `true`, reads the value using the specified type.
   * Returns `undefined` when the option is absent.
   *
   * Overloads allow specifying the type as `"string"`, `"bytes"`, `"fixedBytes"`,
   * or a {@link Deserializable} class.
   *
   * @param type - `"string"` to read a UTF-8 string; `"bytes"` to read a length-prefixed
   *   byte array; `"fixedBytes"` to read an exact number of bytes (requires `len`);
   *   or a `Deserializable<T>` class for structured types.
   * @param len - Required when `type` is `"fixedBytes"`: the number of bytes to read.
   * @returns The deserialized value, or `undefined` if the option was absent.
   *
   * @example
   * ```typescript
   * const name   = deserializer.deserializeOption("string");      // string | undefined
   * const data   = deserializer.deserializeOption("bytes");       // Uint8Array | undefined
   * const fixed  = deserializer.deserializeOption("fixedBytes", 32); // Uint8Array | undefined
   * const myObj  = deserializer.deserializeOption(MyType);        // MyType | undefined
   * ```
   */
  deserializeOption(type: "string"): string | undefined;
  deserializeOption(type: "bytes"): Uint8Array | undefined;
  deserializeOption(type: "fixedBytes", len: number): Uint8Array | undefined;
  deserializeOption<T>(type: Deserializable<T>): T | undefined;
  deserializeOption<T>(
    type: Deserializable<T> | "string" | "bytes" | "fixedBytes",
    len?: number,
  ): T | string | Uint8Array | undefined {
    const exists = this.deserializeBool();
    if (!exists) return undefined;

    if (type === "string") return this.deserializeStr();
    if (type === "bytes") return this.deserializeBytes();
    if (type === "fixedBytes") {
      if (len === undefined) throw new Error("Fixed bytes length not provided");
      return this.deserializeFixedBytes(len);
    }
    return this.deserialize(type);
  }

  /** @deprecated Use `deserializeOption("string")` instead. */
  deserializeOptionStr(): string | undefined {
    return this.deserializeOption("string");
  }
}
