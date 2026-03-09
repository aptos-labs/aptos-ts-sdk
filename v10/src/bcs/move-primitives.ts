// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  BIGINT_0,
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
import type { Deserializer } from "./deserializer.js";
import { ensureBoolean, Serializable, type Serializer, validateNumberInRange } from "./serializer.js";
import type { AnyNumber, Int8, Int16, Int32, TransactionArgument, Uint8, Uint16, Uint32 } from "./types.js";
import { ScriptTransactionArgumentVariants } from "./types.js";

// ── Bool ──

/**
 * A Move `bool` value. Serializes as a single byte (`1` for true, `0` for false).
 * Implements {@link TransactionArgument} so it can be passed to both entry functions
 * and script functions.
 *
 * @example
 * ```typescript
 * const flag = new Bool(true);
 * const bytes = flag.bcsToBytes(); // Uint8Array([1])
 * ```
 */
export class Bool extends Serializable implements TransactionArgument {
  /** The underlying boolean value. */
  public readonly value: boolean;

  /**
   * @param value - The boolean value. Must be a JavaScript `boolean`.
   * @throws {Error} If `value` is not a boolean.
   */
  constructor(value: boolean) {
    super();
    ensureBoolean(value);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBool(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Bool);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `Bool` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `Bool` instance.
   */
  static deserialize(deserializer: Deserializer): Bool {
    return new Bool(deserializer.deserializeBool());
  }
}

// ── Unsigned integers ──

/**
 * A Move `u8` value (unsigned 8-bit integer, range [0, 255]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const byte = new U8(42);
 * ```
 */
export class U8 extends Serializable implements TransactionArgument {
  /** The underlying u8 value. */
  public readonly value: Uint8;

  /**
   * @param value - A number in the range [0, 255].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Uint8) {
    super();
    validateNumberInRange(value, 0, MAX_U8_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU8(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U8` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U8` instance.
   */
  static deserialize(deserializer: Deserializer): U8 {
    return new U8(deserializer.deserializeU8());
  }
}

/**
 * A Move `u16` value (unsigned 16-bit integer, range [0, 65535]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new U16(1000);
 * ```
 */
export class U16 extends Serializable implements TransactionArgument {
  /** The underlying u16 value. */
  public readonly value: Uint16;

  /**
   * @param value - A number in the range [0, 65535].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Uint16) {
    super();
    validateNumberInRange(value, 0, MAX_U16_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU16(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U16);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U16` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U16` instance.
   */
  static deserialize(deserializer: Deserializer): U16 {
    return new U16(deserializer.deserializeU16());
  }
}

/**
 * A Move `u32` value (unsigned 32-bit integer, range [0, 4294967295]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new U32(100000);
 * ```
 */
export class U32 extends Serializable implements TransactionArgument {
  /** The underlying u32 value. */
  public readonly value: Uint32;

  /**
   * @param value - A number in the range [0, 4294967295].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Uint32) {
    super();
    validateNumberInRange(value, 0, MAX_U32_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U32);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U32` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U32` instance.
   */
  static deserialize(deserializer: Deserializer): U32 {
    return new U32(deserializer.deserializeU32());
  }
}

/**
 * A Move `u64` value (unsigned 64-bit integer, range [0, 2^64 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new U64(9999999999n);
 * ```
 */
export class U64 extends Serializable implements TransactionArgument {
  /** The underlying u64 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [0, 2^64 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BIGINT_0, MAX_U64_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU64(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U64);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U64` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U64` instance.
   */
  static deserialize(deserializer: Deserializer): U64 {
    return new U64(deserializer.deserializeU64());
  }
}

/**
 * A Move `u128` value (unsigned 128-bit integer, range [0, 2^128 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new U128(340282366920938463463374607431768211455n);
 * ```
 */
export class U128 extends Serializable implements TransactionArgument {
  /** The underlying u128 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [0, 2^128 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BIGINT_0, MAX_U128_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU128(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U128);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U128` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U128` instance.
   */
  static deserialize(deserializer: Deserializer): U128 {
    return new U128(deserializer.deserializeU128());
  }
}

/**
 * A Move `u256` value (unsigned 256-bit integer, range [0, 2^256 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new U256(1n);
 * ```
 */
export class U256 extends Serializable implements TransactionArgument {
  /** The underlying u256 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [0, 2^256 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BIGINT_0, MAX_U256_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU256(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U256);
    serializer.serialize(this);
  }

  /**
   * Deserializes a `U256` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `U256` instance.
   */
  static deserialize(deserializer: Deserializer): U256 {
    return new U256(deserializer.deserializeU256());
  }
}

// ── Signed integers ──

/**
 * A Move `i8` value (signed 8-bit integer, range [-128, 127]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I8(-1);
 * ```
 */
export class I8 extends Serializable implements TransactionArgument {
  /** The underlying i8 value. */
  public readonly value: Int8;

  /**
   * @param value - A number in the range [-128, 127].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Int8) {
    super();
    validateNumberInRange(value, MIN_I8_NUMBER, MAX_I8_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI8(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I8);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I8` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I8` instance.
   */
  static deserialize(deserializer: Deserializer): I8 {
    return new I8(deserializer.deserializeI8());
  }
}

/**
 * A Move `i16` value (signed 16-bit integer, range [-32768, 32767]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I16(-1000);
 * ```
 */
export class I16 extends Serializable implements TransactionArgument {
  /** The underlying i16 value. */
  public readonly value: Int16;

  /**
   * @param value - A number in the range [-32768, 32767].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Int16) {
    super();
    validateNumberInRange(value, MIN_I16_NUMBER, MAX_I16_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI16(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I16);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I16` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I16` instance.
   */
  static deserialize(deserializer: Deserializer): I16 {
    return new I16(deserializer.deserializeI16());
  }
}

/**
 * A Move `i32` value (signed 32-bit integer, range [-2147483648, 2147483647]).
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I32(-50000);
 * ```
 */
export class I32 extends Serializable implements TransactionArgument {
  /** The underlying i32 value. */
  public readonly value: Int32;

  /**
   * @param value - A number in the range [-2147483648, 2147483647].
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: Int32) {
    super();
    validateNumberInRange(value, MIN_I32_NUMBER, MAX_I32_NUMBER);
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI32(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I32);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I32` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I32` instance.
   */
  static deserialize(deserializer: Deserializer): I32 {
    return new I32(deserializer.deserializeI32());
  }
}

/**
 * A Move `i64` value (signed 64-bit integer, range [-2^63, 2^63 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I64(-9223372036854775808n);
 * ```
 */
export class I64 extends Serializable implements TransactionArgument {
  /** The underlying i64 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [-2^63, 2^63 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, MIN_I64_BIG_INT, MAX_I64_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI64(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I64);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I64` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I64` instance.
   */
  static deserialize(deserializer: Deserializer): I64 {
    return new I64(deserializer.deserializeI64());
  }
}

/**
 * A Move `i128` value (signed 128-bit integer, range [-2^127, 2^127 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I128(-1n);
 * ```
 */
export class I128 extends Serializable implements TransactionArgument {
  /** The underlying i128 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [-2^127, 2^127 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, MIN_I128_BIG_INT, MAX_I128_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI128(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I128);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I128` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I128` instance.
   */
  static deserialize(deserializer: Deserializer): I128 {
    return new I128(deserializer.deserializeI128());
  }
}

/**
 * A Move `i256` value (signed 256-bit integer, range [-2^255, 2^255 - 1]).
 * The internal value is stored as a `bigint`.
 * Accepts both `number` and `bigint` as constructor input.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const val = new I256(-1n);
 * ```
 */
export class I256 extends Serializable implements TransactionArgument {
  /** The underlying i256 value, stored as `bigint`. */
  public readonly value: bigint;

  /**
   * @param value - A value in the range [-2^255, 2^255 - 1]. Accepts `number` or `bigint`.
   * @throws {Error} If `value` is out of range.
   */
  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, MIN_I256_BIG_INT, MAX_I256_BIG_INT);
    this.value = BigInt(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeI256(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I256);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `I256` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `I256` instance.
   */
  static deserialize(deserializer: Deserializer): I256 {
    return new I256(deserializer.deserializeI256());
  }
}
