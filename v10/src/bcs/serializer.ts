// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Hex } from "../hex/hex.js";
import {
  MAX_I8_NUMBER,
  MAX_I16_NUMBER,
  MAX_I32_NUMBER,
  MAX_I64_BIG_INT,
  MAX_I128_BIG_INT,
  MAX_I256_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U128_BIG_INT,
  MAX_U256_BIG_INT,
  MIN_I8_NUMBER,
  MIN_I16_NUMBER,
  MIN_I32_NUMBER,
  MIN_I64_BIG_INT,
  MIN_I128_BIG_INT,
  MIN_I256_BIG_INT,
} from "./consts.js";
import type { AnyNumber, Uint8, Uint16, Uint32 } from "./types.js";

const TEXT_ENCODER = new TextEncoder();
const MIN_BUFFER_GROWTH = 256;

// ── Serializer pool ──

const serializerPool: Serializer[] = [];
const MAX_POOL_SIZE = 8;

function acquireSerializer(): Serializer {
  const serializer = serializerPool.pop();
  if (serializer) {
    serializer.reset();
    return serializer;
  }
  return new Serializer();
}

function releaseSerializer(serializer: Serializer): void {
  if (serializerPool.length < MAX_POOL_SIZE) {
    serializerPool.push(serializer);
  }
}

// ── Serializable base class ──

/**
 * Abstract base class for types that can be BCS-serialized.
 *
 * Extend this class and implement {@link serialize} to make a type serializable.
 * The base class provides convenience methods for converting to bytes and hex.
 *
 * @example
 * ```typescript
 * class MyType extends Serializable {
 *   constructor(public value: number) { super(); }
 *
 *   serialize(serializer: Serializer): void {
 *     serializer.serializeU32(this.value);
 *   }
 * }
 *
 * const obj = new MyType(42);
 * const bytes = obj.bcsToBytes();    // Uint8Array
 * const hex   = obj.bcsToHex();     // Hex
 * console.log(obj.toString());       // "0x0000002a"
 * ```
 */
export abstract class Serializable {
  /**
   * Writes this value into the provided serializer using BCS encoding.
   * @param serializer - The serializer to write to.
   */
  abstract serialize(serializer: Serializer): void;

  /**
   * Returns the BCS-encoded bytes for this value.
   * @returns A `Uint8Array` containing the serialized bytes.
   */
  bcsToBytes(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  /**
   * Returns the BCS-encoded bytes as a {@link Hex} object.
   * @returns A `Hex` instance wrapping the serialized bytes.
   */
  bcsToHex(): Hex {
    return Hex.fromHexInput(this.bcsToBytes());
  }

  /**
   * Returns the hex-encoded BCS bytes as a string without the `0x` prefix.
   * @returns A lowercase hex string without leading `0x`.
   */
  toStringWithoutPrefix(): string {
    return this.bcsToHex().toStringWithoutPrefix();
  }

  /**
   * Returns the hex-encoded BCS bytes as a `0x`-prefixed string.
   * @returns A lowercase hex string with leading `0x`.
   */
  toString(): string {
    return `0x${this.toStringWithoutPrefix()}`;
  }
}

// ── Serializer ──

/**
 * BCS (Binary Canonical Serialization) serializer for encoding Move and Aptos data types.
 *
 * Writes values into a growable internal byte buffer in little-endian order.
 * Call {@link toUint8Array} to obtain the serialized bytes when done.
 *
 * @example
 * ```typescript
 * const serializer = new Serializer();
 * serializer.serializeU8(255);
 * serializer.serializeStr("hello");
 * const bytes = serializer.toUint8Array();
 * ```
 */
export class Serializer {
  private buffer: ArrayBuffer;
  private offset: number;
  private dataView: DataView;

  /**
   * Creates a new Serializer with an internal buffer of the specified initial size.
   * The buffer grows automatically as data is written.
   * @param length - Initial buffer capacity in bytes. Defaults to 64. Must be greater than 0.
   */
  constructor(length: number = 64) {
    if (length <= 0) {
      throw new Error("Length needs to be greater than 0");
    }
    this.buffer = new ArrayBuffer(length);
    this.dataView = new DataView(this.buffer);
    this.offset = 0;
  }

  private ensureBufferWillHandleSize(bytes: number) {
    const requiredSize = this.offset + bytes;
    if (this.buffer.byteLength >= requiredSize) return;

    const growthSize = Math.max(Math.floor(this.buffer.byteLength * 1.5), requiredSize + MIN_BUFFER_GROWTH);
    const newBuffer = new ArrayBuffer(growthSize);
    new Uint8Array(newBuffer).set(new Uint8Array(this.buffer, 0, this.offset));
    this.buffer = newBuffer;
    this.dataView = new DataView(this.buffer);
  }

  protected appendToBuffer(values: Uint8Array) {
    this.ensureBufferWillHandleSize(values.length);
    new Uint8Array(this.buffer, this.offset).set(values);
    this.offset += values.length;
  }

  private serializeWithFunction(
    fn: (byteOffset: number, value: number, littleEndian?: boolean) => void,
    bytesLength: number,
    value: number,
  ) {
    this.ensureBufferWillHandleSize(bytesLength);
    fn.apply(this.dataView, [this.offset, value, true]);
    this.offset += bytesLength;
  }

  // ── String / Bytes ──

  /**
   * Serializes a UTF-8 string with a ULEB128 length prefix.
   * @param value - The string to serialize.
   */
  serializeStr(value: string) {
    this.serializeBytes(TEXT_ENCODER.encode(value));
  }

  /**
   * Serializes a byte array with a ULEB128 length prefix.
   * @param value - The bytes to serialize.
   */
  serializeBytes(value: Uint8Array) {
    this.serializeU32AsUleb128(value.length);
    this.appendToBuffer(value);
  }

  /**
   * Serializes a byte array without a length prefix (fixed-size encoding).
   * The deserializer must know the expected length in advance.
   * @param value - The bytes to serialize.
   */
  serializeFixedBytes(value: Uint8Array) {
    this.appendToBuffer(value);
  }

  // ── Boolean ──

  /**
   * Serializes a boolean as a single byte (`1` for true, `0` for false).
   * @param value - The boolean value to serialize.
   */
  serializeBool(value: boolean) {
    ensureBoolean(value);
    this.appendToBuffer(new Uint8Array([value ? 1 : 0]));
  }

  // ── Unsigned integers ──

  /**
   * Serializes an unsigned 8-bit integer (u8).
   * @param value - A number in the range [0, 255].
   */
  serializeU8(value: Uint8) {
    validateNumberInRange(value, 0, MAX_U8_NUMBER);
    this.appendToBuffer(new Uint8Array([value]));
  }

  /**
   * Serializes an unsigned 16-bit integer (u16) in little-endian byte order.
   * @param value - A number in the range [0, 65535].
   */
  serializeU16(value: Uint16) {
    validateNumberInRange(value, 0, MAX_U16_NUMBER);
    this.serializeWithFunction(DataView.prototype.setUint16, 2, value);
  }

  /**
   * Serializes an unsigned 32-bit integer (u32) in little-endian byte order.
   * @param value - A number in the range [0, 4294967295].
   */
  serializeU32(value: Uint32) {
    validateNumberInRange(value, 0, MAX_U32_NUMBER);
    this.serializeWithFunction(DataView.prototype.setUint32, 4, value);
  }

  /**
   * Serializes an unsigned 64-bit integer (u64) in little-endian byte order.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [0, 2^64 - 1].
   */
  serializeU64(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U64_BIG_INT);
    const low = BigInt(value) & BigInt(MAX_U32_NUMBER);
    const high = BigInt(value) >> BigInt(32);
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
  }

  /**
   * Serializes an unsigned 128-bit integer (u128) in little-endian byte order.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [0, 2^128 - 1].
   */
  serializeU128(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U128_BIG_INT);
    const low = BigInt(value) & MAX_U64_BIG_INT;
    const high = BigInt(value) >> BigInt(64);
    this.serializeU64(low);
    this.serializeU64(high);
  }

  /**
   * Serializes an unsigned 256-bit integer (u256) in little-endian byte order.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [0, 2^256 - 1].
   */
  serializeU256(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U256_BIG_INT);
    const low = BigInt(value) & MAX_U128_BIG_INT;
    const high = BigInt(value) >> BigInt(128);
    this.serializeU128(low);
    this.serializeU128(high);
  }

  // ── Signed integers ──

  /**
   * Serializes a signed 8-bit integer (i8).
   * @param value - A number in the range [-128, 127].
   */
  serializeI8(value: number) {
    validateNumberInRange(value, MIN_I8_NUMBER, MAX_I8_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt8, 1, value);
  }

  /**
   * Serializes a signed 16-bit integer (i16) in little-endian byte order.
   * @param value - A number in the range [-32768, 32767].
   */
  serializeI16(value: number) {
    validateNumberInRange(value, MIN_I16_NUMBER, MAX_I16_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt16, 2, value);
  }

  /**
   * Serializes a signed 32-bit integer (i32) in little-endian byte order.
   * @param value - A number in the range [-2147483648, 2147483647].
   */
  serializeI32(value: number) {
    validateNumberInRange(value, MIN_I32_NUMBER, MAX_I32_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt32, 4, value);
  }

  /**
   * Serializes a signed 64-bit integer (i64) in little-endian byte order using two's complement.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [-2^63, 2^63 - 1].
   */
  serializeI64(value: AnyNumber) {
    validateNumberInRange(value, MIN_I64_BIG_INT, MAX_I64_BIG_INT);
    const val = BigInt(value);
    const unsigned = val < 0 ? (BigInt(1) << BigInt(64)) + val : val;
    const low = unsigned & BigInt(MAX_U32_NUMBER);
    const high = unsigned >> BigInt(32);
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
  }

  /**
   * Serializes a signed 128-bit integer (i128) in little-endian byte order using two's complement.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [-2^127, 2^127 - 1].
   */
  serializeI128(value: AnyNumber) {
    validateNumberInRange(value, MIN_I128_BIG_INT, MAX_I128_BIG_INT);
    const val = BigInt(value);
    const unsigned = val < 0 ? (BigInt(1) << BigInt(128)) + val : val;
    const low = unsigned & MAX_U64_BIG_INT;
    const high = unsigned >> BigInt(64);
    this.serializeU64(low);
    this.serializeU64(high);
  }

  /**
   * Serializes a signed 256-bit integer (i256) in little-endian byte order using two's complement.
   * Accepts both `number` and `bigint` input.
   * @param value - A value in the range [-2^255, 2^255 - 1].
   */
  serializeI256(value: AnyNumber) {
    validateNumberInRange(value, MIN_I256_BIG_INT, MAX_I256_BIG_INT);
    const val = BigInt(value);
    const unsigned = val < 0 ? (BigInt(1) << BigInt(256)) + val : val;
    const low = unsigned & MAX_U128_BIG_INT;
    const high = unsigned >> BigInt(128);
    this.serializeU128(low);
    this.serializeU128(high);
  }

  // ── ULEB128 ──

  /**
   * Serializes a `u32` value using unsigned LEB128 (ULEB128) variable-length encoding.
   * ULEB128 is used in BCS to encode vector lengths and enum variants.
   * @param val - A value in the range [0, 4294967295].
   */
  serializeU32AsUleb128(val: Uint32) {
    validateNumberInRange(val, 0, MAX_U32_NUMBER);
    let value = val;
    const valueArray = [];
    while (value >>> 7 !== 0) {
      valueArray.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    valueArray.push(value);
    this.appendToBuffer(new Uint8Array(valueArray));
  }

  // ── Output / management ──

  /**
   * Returns a copy of the serialized bytes written so far.
   * @returns A new `Uint8Array` containing the serialized data.
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset).slice();
  }

  /**
   * Returns a non-copying view of the serialized bytes written so far.
   * The view is invalidated if the serializer writes more data that causes a buffer resize.
   * Prefer {@link toUint8Array} for most use cases.
   * @returns A `Uint8Array` view into the internal buffer.
   */
  toUint8ArrayView(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset);
  }

  /**
   * Resets the serializer to an empty state, zeroing existing bytes and resetting the write offset.
   * The internal buffer capacity is retained. Useful when reusing a serializer from a pool.
   */
  reset(): void {
    if (this.offset > 0) {
      new Uint8Array(this.buffer, 0, this.offset).fill(0);
    }
    this.offset = 0;
  }

  /**
   * Returns the current write offset (i.e. the number of bytes written so far).
   * @returns The number of bytes written.
   */
  getOffset(): number {
    return this.offset;
  }

  // ── Composable serialization ──

  /**
   * Serializes a {@link Serializable} value by delegating to its `serialize` method.
   * @param value - The serializable object to write.
   */
  serialize<T extends Serializable>(value: T): void {
    value.serialize(this);
  }

  /**
   * Serializes a {@link Serializable} value as a length-prefixed byte blob.
   * First serializes `value` to a temporary buffer, then writes the result
   * with a ULEB128 length prefix (equivalent to `serializeBytes(value.bcsToBytes())`).
   * @param value - The serializable object to wrap in a byte blob.
   */
  serializeAsBytes<T extends Serializable>(value: T): void {
    const tempSerializer = acquireSerializer();
    try {
      value.serialize(tempSerializer);
      const bytes = tempSerializer.toUint8ArrayView();
      this.serializeBytes(bytes);
    } finally {
      releaseSerializer(tempSerializer);
    }
  }

  /**
   * Serializes an array of {@link Serializable} values as a BCS vector.
   * Writes a ULEB128 length prefix followed by each element serialized in order.
   * @param values - The array of serializable objects to write.
   */
  serializeVector<T extends Serializable>(values: Array<T>): void {
    this.serializeU32AsUleb128(values.length);
    for (const item of values) {
      item.serialize(this);
    }
  }

  /**
   * Serializes an optional value as a BCS `Option<T>`.
   * Writes a boolean presence flag (`true` = some, `false` = none), followed by
   * the value itself if present.
   *
   * @param value - The optional value to serialize. Pass `undefined` to encode `None`.
   * @param len - Required when `value` is a `Uint8Array` and should be written without
   *   a length prefix (fixed bytes). Omit for length-prefixed bytes.
   */
  serializeOption<T extends Serializable | string | Uint8Array>(value?: T, len?: number): void {
    const hasValue = value !== undefined;
    this.serializeBool(hasValue);
    if (hasValue) {
      if (typeof value === "string") {
        this.serializeStr(value);
      } else if (value instanceof Uint8Array) {
        if (len !== undefined) {
          this.serializeFixedBytes(value);
        } else {
          this.serializeBytes(value);
        }
      } else {
        value.serialize(this);
      }
    }
  }

  /** @deprecated Use `serializeOption` instead. */
  serializeOptionStr(value?: string): void {
    if (value === undefined) {
      this.serializeU32AsUleb128(0);
    } else {
      this.serializeU32AsUleb128(1);
      this.serializeStr(value);
    }
  }
}

// ── Validation helpers ──

/**
 * Asserts that the given value is a boolean. Throws if it is not.
 * Used as a type guard: after this call TypeScript knows `value` is `boolean`.
 * @param value - The value to check.
 * @throws {Error} If `value` is not a boolean.
 */
export function ensureBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${value} is not a boolean value`);
  }
}

/**
 * Builds a human-readable error message for an out-of-range numeric value.
 * @param value - The value that is out of range.
 * @param min - The minimum allowed value (inclusive).
 * @param max - The maximum allowed value (inclusive).
 * @returns A descriptive error string.
 */
export const outOfRangeErrorMessage = (value: AnyNumber, min: AnyNumber, max: AnyNumber) =>
  `${value} is out of range: [${min}, ${max}]`;

/**
 * Validates that `value` falls within the inclusive range `[minValue, maxValue]`.
 * Throws with a descriptive message if the value is out of range.
 * Both `number` and `bigint` values are supported via `AnyNumber`.
 *
 * @param value - The value to validate.
 * @param minValue - The minimum allowed value (inclusive).
 * @param maxValue - The maximum allowed value (inclusive).
 * @throws {Error} If `value` is less than `minValue` or greater than `maxValue`.
 */
export function validateNumberInRange<T extends AnyNumber>(value: T, minValue: T, maxValue: T) {
  const valueBigInt = BigInt(value);
  if (valueBigInt > BigInt(maxValue) || valueBigInt < BigInt(minValue)) {
    throw new Error(outOfRangeErrorMessage(value, minValue, maxValue));
  }
}
