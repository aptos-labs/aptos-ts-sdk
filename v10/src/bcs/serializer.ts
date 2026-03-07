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

export abstract class Serializable {
  abstract serialize(serializer: Serializer): void;

  bcsToBytes(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  bcsToHex(): Hex {
    return Hex.fromHexInput(this.bcsToBytes());
  }

  toStringWithoutPrefix(): string {
    return this.bcsToHex().toStringWithoutPrefix();
  }

  toString(): string {
    return `0x${this.toStringWithoutPrefix()}`;
  }
}

// ── Serializer ──

export class Serializer {
  private buffer: ArrayBuffer;
  private offset: number;
  private dataView: DataView;

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

  serializeStr(value: string) {
    this.serializeBytes(TEXT_ENCODER.encode(value));
  }

  serializeBytes(value: Uint8Array) {
    this.serializeU32AsUleb128(value.length);
    this.appendToBuffer(value);
  }

  serializeFixedBytes(value: Uint8Array) {
    this.appendToBuffer(value);
  }

  // ── Boolean ──

  serializeBool(value: boolean) {
    ensureBoolean(value);
    this.appendToBuffer(new Uint8Array([value ? 1 : 0]));
  }

  // ── Unsigned integers ──

  serializeU8(value: Uint8) {
    validateNumberInRange(value, 0, MAX_U8_NUMBER);
    this.appendToBuffer(new Uint8Array([value]));
  }

  serializeU16(value: Uint16) {
    validateNumberInRange(value, 0, MAX_U16_NUMBER);
    this.serializeWithFunction(DataView.prototype.setUint16, 2, value);
  }

  serializeU32(value: Uint32) {
    validateNumberInRange(value, 0, MAX_U32_NUMBER);
    this.serializeWithFunction(DataView.prototype.setUint32, 4, value);
  }

  serializeU64(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U64_BIG_INT);
    const low = BigInt(value) & BigInt(MAX_U32_NUMBER);
    const high = BigInt(value) >> BigInt(32);
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
  }

  serializeU128(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U128_BIG_INT);
    const low = BigInt(value) & MAX_U64_BIG_INT;
    const high = BigInt(value) >> BigInt(64);
    this.serializeU64(low);
    this.serializeU64(high);
  }

  serializeU256(value: AnyNumber) {
    validateNumberInRange(value, BigInt(0), MAX_U256_BIG_INT);
    const low = BigInt(value) & MAX_U128_BIG_INT;
    const high = BigInt(value) >> BigInt(128);
    this.serializeU128(low);
    this.serializeU128(high);
  }

  // ── Signed integers ──

  serializeI8(value: number) {
    validateNumberInRange(value, MIN_I8_NUMBER, MAX_I8_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt8, 1, value);
  }

  serializeI16(value: number) {
    validateNumberInRange(value, MIN_I16_NUMBER, MAX_I16_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt16, 2, value);
  }

  serializeI32(value: number) {
    validateNumberInRange(value, MIN_I32_NUMBER, MAX_I32_NUMBER);
    this.serializeWithFunction(DataView.prototype.setInt32, 4, value);
  }

  serializeI64(value: AnyNumber) {
    validateNumberInRange(value, MIN_I64_BIG_INT, MAX_I64_BIG_INT);
    const val = BigInt(value);
    const unsigned = val < 0 ? (BigInt(1) << BigInt(64)) + val : val;
    const low = unsigned & BigInt(MAX_U32_NUMBER);
    const high = unsigned >> BigInt(32);
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
  }

  serializeI128(value: AnyNumber) {
    validateNumberInRange(value, MIN_I128_BIG_INT, MAX_I128_BIG_INT);
    const val = BigInt(value);
    const unsigned = val < 0 ? (BigInt(1) << BigInt(128)) + val : val;
    const low = unsigned & MAX_U64_BIG_INT;
    const high = unsigned >> BigInt(64);
    this.serializeU64(low);
    this.serializeU64(high);
  }

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

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset).slice();
  }

  toUint8ArrayView(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.offset);
  }

  reset(): void {
    if (this.offset > 0) {
      new Uint8Array(this.buffer, 0, this.offset).fill(0);
    }
    this.offset = 0;
  }

  getOffset(): number {
    return this.offset;
  }

  // ── Composable serialization ──

  serialize<T extends Serializable>(value: T): void {
    value.serialize(this);
  }

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

  serializeVector<T extends Serializable>(values: Array<T>): void {
    this.serializeU32AsUleb128(values.length);
    for (const item of values) {
      item.serialize(this);
    }
  }

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

export function ensureBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${value} is not a boolean value`);
  }
}

export const outOfRangeErrorMessage = (value: AnyNumber, min: AnyNumber, max: AnyNumber) =>
  `${value} is out of range: [${min}, ${max}]`;

export function validateNumberInRange<T extends AnyNumber>(value: T, minValue: T, maxValue: T) {
  const valueBigInt = BigInt(value);
  if (valueBigInt > BigInt(maxValue) || valueBigInt < BigInt(minValue)) {
    throw new Error(outOfRangeErrorMessage(value, minValue, maxValue));
  }
}
