// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Hex } from "../hex/hex.js";
import { MAX_U32_NUMBER } from "./consts.js";
import type { HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "./types.js";

const TEXT_DECODER = new TextDecoder();

/** Max 10MB to prevent memory exhaustion from malformed BCS data. */
const MAX_DESERIALIZE_BYTES_LENGTH = 10 * 1024 * 1024;

/**
 * Interface for types that have a static `deserialize` method.
 */
export interface Deserializable<T> {
  deserialize(deserializer: Deserializer): T;
}

/**
 * BCS Deserializer — reads typed values from a byte buffer.
 */
export class Deserializer {
  private buffer: ArrayBuffer;
  private offset: number;

  constructor(data: Uint8Array) {
    // Copy to prevent outside mutation
    this.buffer = new ArrayBuffer(data.length);
    new Uint8Array(this.buffer).set(data, 0);
    this.offset = 0;
  }

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

  remaining(): number {
    return this.buffer.byteLength - this.offset;
  }

  assertFinished(): void {
    if (this.remaining() !== 0) {
      throw new Error("Buffer has remaining bytes");
    }
  }

  // ── String / Bytes ──

  deserializeStr(): string {
    return TEXT_DECODER.decode(this.deserializeBytes());
  }

  deserializeBytes(): Uint8Array {
    const len = this.deserializeUleb128AsU32();
    if (len > MAX_DESERIALIZE_BYTES_LENGTH) {
      throw new Error(
        `Deserialization error: byte array length ${len} exceeds maximum allowed ${MAX_DESERIALIZE_BYTES_LENGTH}`,
      );
    }
    return this.read(len).slice();
  }

  deserializeFixedBytes(len: number): Uint8Array {
    return this.read(len).slice();
  }

  // ── Boolean ──

  deserializeBool(): boolean {
    const bool = this.read(1)[0];
    if (bool !== 1 && bool !== 0) {
      throw new Error("Invalid boolean value");
    }
    return bool === 1;
  }

  // ── Unsigned integers ──

  deserializeU8(): Uint8 {
    return this.read(1)[0];
  }

  deserializeU16(): Uint16 {
    const bytes = this.read(2);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(0, true);
  }

  deserializeU32(): Uint32 {
    const bytes = this.read(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
  }

  deserializeU64(): Uint64 {
    const low = this.deserializeU32();
    const high = this.deserializeU32();
    return BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
  }

  deserializeU128(): Uint128 {
    const low = this.deserializeU64();
    const high = this.deserializeU64();
    return BigInt((high << BigInt(64)) | low);
  }

  deserializeU256(): Uint256 {
    const low = this.deserializeU128();
    const high = this.deserializeU128();
    return BigInt((high << BigInt(128)) | low);
  }

  // ── Signed integers ──

  deserializeI8(): number {
    const bytes = this.read(1);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt8(0);
  }

  deserializeI16(): number {
    const bytes = this.read(2);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt16(0, true);
  }

  deserializeI32(): number {
    const bytes = this.read(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(0, true);
  }

  deserializeI64(): bigint {
    const low = this.deserializeU32();
    const high = this.deserializeU32();
    const unsigned = BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
    const signBit = BigInt(1) << BigInt(63);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(64)) : unsigned;
  }

  deserializeI128(): bigint {
    const low = this.deserializeU64();
    const high = this.deserializeU64();
    const unsigned = BigInt((high << BigInt(64)) | low);
    const signBit = BigInt(1) << BigInt(127);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(128)) : unsigned;
  }

  deserializeI256(): bigint {
    const low = this.deserializeU128();
    const high = this.deserializeU128();
    const unsigned = BigInt((high << BigInt(128)) | low);
    const signBit = BigInt(1) << BigInt(255);
    return unsigned >= signBit ? unsigned - (BigInt(1) << BigInt(256)) : unsigned;
  }

  // ── ULEB128 ──

  deserializeUleb128AsU32(): Uint32 {
    let value: bigint = BigInt(0);
    let shift = 0;
    const MAX_ULEB128_BYTES = 5;
    let bytesRead = 0;

    while (bytesRead < MAX_ULEB128_BYTES) {
      const byte = this.deserializeU8();
      bytesRead += 1;
      value |= BigInt(byte & 0x7f) << BigInt(shift);

      if (value > MAX_U32_NUMBER) {
        throw new Error("Overflow while parsing uleb128-encoded uint32 value");
      }

      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    if (bytesRead === MAX_ULEB128_BYTES && value > MAX_U32_NUMBER) {
      throw new Error("Overflow while parsing uleb128-encoded uint32 value");
    }

    return Number(value);
  }

  // ── Composable deserialization ──

  deserialize<T>(cls: Deserializable<T>): T {
    return cls.deserialize(this);
  }

  deserializeVector<T>(cls: Deserializable<T>): Array<T> {
    const length = this.deserializeUleb128AsU32();
    const vector: T[] = [];
    for (let i = 0; i < length; i += 1) {
      vector.push(this.deserialize(cls));
    }
    return vector;
  }

  // ── Optional ──

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
