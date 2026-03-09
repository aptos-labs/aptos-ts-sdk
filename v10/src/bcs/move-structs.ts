// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Hex } from "../hex/hex.js";
import type { Deserializable } from "./deserializer.js";
import { Deserializer } from "./deserializer.js";
import { Bool, I8, I16, I32, I64, I128, I256, U8, U16, U32, U64, U128, U256 } from "./move-primitives.js";
import { Serializable, type Serializer } from "./serializer.js";
import type { AnyNumber, EntryFunctionArgument, HexInput, TransactionArgument } from "./types.js";
import { ScriptTransactionArgumentVariants } from "./types.js";

const TEXT_ENCODER = new TextEncoder();

// ── FixedBytes ──

/**
 * A fixed-size byte array that serializes without a length prefix.
 * Implements {@link TransactionArgument} for use in both entry and script functions.
 * Accepts hex string input or raw `Uint8Array`.
 *
 * @example
 * ```typescript
 * const bytes = new FixedBytes("0xdeadbeef");
 * serializer.serialize(bytes); // writes 4 bytes, no length prefix
 * ```
 */
export class FixedBytes extends Serializable implements TransactionArgument {
  /** The raw bytes stored as a `Uint8Array`. */
  public value: Uint8Array;

  /**
   * @param value - A hex string (with or without `0x` prefix) or raw bytes.
   */
  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  /**
   * Deserializes a `FixedBytes` of exactly `length` bytes from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @param length - The exact number of bytes to read.
   * @returns A new `FixedBytes` instance.
   */
  static deserialize(deserializer: Deserializer, length: number): FixedBytes {
    return new FixedBytes(deserializer.deserializeFixedBytes(length));
  }
}

// ── EntryFunctionBytes ──

/**
 * Pre-serialized bytes intended for use as an entry function argument.
 * When calling `serializeForEntryFunction`, the byte payload is written with a
 * ULEB128 length prefix followed by the raw bytes (no additional BCS wrapping).
 *
 * Use this type when you have already BCS-encoded an argument and want to pass
 * it directly to an entry function without double-encoding.
 * Implements {@link EntryFunctionArgument}.
 */
export class EntryFunctionBytes extends Serializable implements EntryFunctionArgument {
  /** The wrapped fixed-size byte payload. */
  public readonly value: FixedBytes;

  private constructor(value: HexInput) {
    super();
    this.value = new FixedBytes(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.value);
  }

  /**
   * Serializes the byte payload for an entry function argument.
   * Writes a ULEB128 length prefix followed by the raw bytes.
   * @param serializer - The serializer to write to.
   */
  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.value.value.length);
    serializer.serialize(this);
  }

  /**
   * Deserializes an `EntryFunctionBytes` of exactly `length` bytes.
   * @param deserializer - The deserializer to read from.
   * @param length - The exact number of bytes to read.
   * @returns A new `EntryFunctionBytes` instance.
   */
  static deserialize(deserializer: Deserializer, length: number): EntryFunctionBytes {
    const fixedBytes = FixedBytes.deserialize(deserializer, length);
    return new EntryFunctionBytes(fixedBytes.value);
  }
}

// ── MoveVector ──

/**
 * A Move `vector<T>` value. Holds an ordered collection of BCS-serializable elements.
 * Implements {@link TransactionArgument} so the whole vector can be passed to entry
 * or script functions.
 *
 * Use the static factory methods (e.g. {@link MoveVector.U8}, {@link MoveVector.Bool})
 * to create typed vectors conveniently.
 *
 * @typeParam T - The element type. Must extend both {@link Serializable} and
 *   {@link EntryFunctionArgument}.
 *
 * @example
 * ```typescript
 * // Create a vector of u8 from a hex string or number array
 * const vec = MoveVector.U8("0xdeadbeef");
 * const vec2 = MoveVector.U8([1, 2, 3]);
 *
 * // Create a vector of strings
 * const strs = MoveVector.MoveString(["hello", "world"]);
 * ```
 */
export class MoveVector<T extends Serializable & EntryFunctionArgument>
  extends Serializable
  implements TransactionArgument
{
  /** The underlying array of elements. */
  public values: Array<T>;

  /**
   * @param values - The array of elements to wrap.
   */
  constructor(values: Array<T>, isU8 = false) {
    super();
    this.values = values;
    this._isU8 = isU8;
  }

  /** @internal Tracks whether this vector was created as a U8 vector, for correct script function serialization. */
  readonly _isU8: boolean;

  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.values);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    // U8 vectors use a dedicated tag; all other types (including empty non-U8 vectors) use Serialized
    if (this._isU8 || (this.values.length > 0 && this.values[0] instanceof U8)) {
      serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8Vector);
      serializer.serialize(this);
      return;
    }
    const serialized = new Serialized(this.bcsToBytes());
    serialized.serializeForScriptFunction(serializer);
  }

  // ── Factory methods ──

  /**
   * Creates a `MoveVector<U8>` from a `number[]`, `Uint8Array`, or hex string.
   * @param values - The source data.
   * @returns A new `MoveVector<U8>`.
   * @throws {Error} If the input type is not recognized.
   */
  static U8(values: Array<number> | HexInput): MoveVector<U8> {
    let numbers: Array<number>;

    if (Array.isArray(values) && values.length === 0) {
      numbers = [];
    } else if (Array.isArray(values) && typeof values[0] === "number") {
      numbers = values;
    } else if (typeof values === "string") {
      const bytes = Hex.fromHexInput(values).toUint8Array();
      return new MoveVector<U8>(
        Array.from({ length: bytes.length }, (_, i) => new U8(bytes[i])),
        true,
      );
    } else if (values instanceof Uint8Array) {
      return new MoveVector<U8>(
        Array.from({ length: values.length }, (_, i) => new U8(values[i])),
        true,
      );
    } else {
      throw new Error("Invalid input type, must be an number[], Uint8Array, or hex string");
    }

    return new MoveVector<U8>(
      numbers.map((v) => new U8(v)),
      true,
    );
  }

  /**
   * Creates a `MoveVector<U16>` from an array of numbers.
   * @param values - Array of numbers in the range [0, 65535].
   * @returns A new `MoveVector<U16>`.
   */
  static U16(values: Array<number>): MoveVector<U16> {
    return new MoveVector<U16>(values.map((v) => new U16(v)));
  }

  /**
   * Creates a `MoveVector<U32>` from an array of numbers.
   * @param values - Array of numbers in the range [0, 4294967295].
   * @returns A new `MoveVector<U32>`.
   */
  static U32(values: Array<number>): MoveVector<U32> {
    return new MoveVector<U32>(values.map((v) => new U32(v)));
  }

  /**
   * Creates a `MoveVector<U64>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [0, 2^64 - 1].
   * @returns A new `MoveVector<U64>`.
   */
  static U64(values: Array<AnyNumber>): MoveVector<U64> {
    return new MoveVector<U64>(values.map((v) => new U64(v)));
  }

  /**
   * Creates a `MoveVector<U128>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [0, 2^128 - 1].
   * @returns A new `MoveVector<U128>`.
   */
  static U128(values: Array<AnyNumber>): MoveVector<U128> {
    return new MoveVector<U128>(values.map((v) => new U128(v)));
  }

  /**
   * Creates a `MoveVector<U256>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [0, 2^256 - 1].
   * @returns A new `MoveVector<U256>`.
   */
  static U256(values: Array<AnyNumber>): MoveVector<U256> {
    return new MoveVector<U256>(values.map((v) => new U256(v)));
  }

  /**
   * Creates a `MoveVector<Bool>` from an array of booleans.
   * @param values - Array of boolean values.
   * @returns A new `MoveVector<Bool>`.
   */
  static Bool(values: Array<boolean>): MoveVector<Bool> {
    return new MoveVector<Bool>(values.map((v) => new Bool(v)));
  }

  /**
   * Creates a `MoveVector<I8>` from an array of numbers.
   * @param values - Array of numbers in the range [-128, 127].
   * @returns A new `MoveVector<I8>`.
   */
  static I8(values: Array<number>): MoveVector<I8> {
    return new MoveVector<I8>(values.map((v) => new I8(v)));
  }

  /**
   * Creates a `MoveVector<I16>` from an array of numbers.
   * @param values - Array of numbers in the range [-32768, 32767].
   * @returns A new `MoveVector<I16>`.
   */
  static I16(values: Array<number>): MoveVector<I16> {
    return new MoveVector<I16>(values.map((v) => new I16(v)));
  }

  /**
   * Creates a `MoveVector<I32>` from an array of numbers.
   * @param values - Array of numbers in the range [-2147483648, 2147483647].
   * @returns A new `MoveVector<I32>`.
   */
  static I32(values: Array<number>): MoveVector<I32> {
    return new MoveVector<I32>(values.map((v) => new I32(v)));
  }

  /**
   * Creates a `MoveVector<I64>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [-2^63, 2^63 - 1].
   * @returns A new `MoveVector<I64>`.
   */
  static I64(values: Array<AnyNumber>): MoveVector<I64> {
    return new MoveVector<I64>(values.map((v) => new I64(v)));
  }

  /**
   * Creates a `MoveVector<I128>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [-2^127, 2^127 - 1].
   * @returns A new `MoveVector<I128>`.
   */
  static I128(values: Array<AnyNumber>): MoveVector<I128> {
    return new MoveVector<I128>(values.map((v) => new I128(v)));
  }

  /**
   * Creates a `MoveVector<I256>` from an array of `number | bigint` values.
   * @param values - Array of values in the range [-2^255, 2^255 - 1].
   * @returns A new `MoveVector<I256>`.
   */
  static I256(values: Array<AnyNumber>): MoveVector<I256> {
    return new MoveVector<I256>(values.map((v) => new I256(v)));
  }

  /**
   * Creates a `MoveVector<MoveString>` from an array of strings.
   * @param values - Array of UTF-8 strings.
   * @returns A new `MoveVector<MoveString>`.
   */
  static MoveString(values: Array<string>): MoveVector<MoveString> {
    return new MoveVector<MoveString>(values.map((v) => new MoveString(v)));
  }

  /**
   * Deserializes a `MoveVector<T>` from the given deserializer.
   * Reads a ULEB128 length, then deserializes that many elements using `cls.deserialize`.
   *
   * @typeParam T - The element type.
   * @param deserializer - The deserializer to read from.
   * @param cls - A {@link Deserializable} class for the element type.
   * @returns A new `MoveVector<T>`.
   */
  /**
   * Maximum number of elements allowed when deserializing a `MoveVector`.
   * Prevents resource exhaustion from malicious or corrupted BCS data.
   */
  static readonly MAX_DESERIALIZE_LENGTH = 1_048_576;

  static deserialize<T extends Serializable & EntryFunctionArgument>(
    deserializer: Deserializer,
    cls: Deserializable<T>,
  ): MoveVector<T> {
    const length = deserializer.deserializeUleb128AsU32();
    if (length > MoveVector.MAX_DESERIALIZE_LENGTH) {
      throw new Error(
        `MoveVector deserialization length ${length} exceeds maximum allowed ${MoveVector.MAX_DESERIALIZE_LENGTH}`,
      );
    }
    const values: T[] = [];
    for (let i = 0; i < length; i += 1) {
      values.push(cls.deserialize(deserializer));
    }
    return new MoveVector(values);
  }
}

// ── Serialized ──

/**
 * A pre-serialized BCS blob stored as a length-prefixed byte array.
 * Useful for passing already-encoded data through the transaction argument pipeline.
 *
 * When used as a script function argument, serializes with the
 * {@link ScriptTransactionArgumentVariants.Serialized} variant tag.
 *
 * Implements {@link TransactionArgument}.
 *
 * @example
 * ```typescript
 * const blob = new Serialized(someObject.bcsToBytes());
 * ```
 */
export class Serialized extends Serializable implements TransactionArgument {
  /** The raw bytes of the pre-serialized value. */
  public readonly value: Uint8Array;

  /**
   * @param value - A hex string or raw bytes representing a pre-serialized BCS payload.
   */
  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    this.serialize(serializer);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Serialized);
    this.serialize(serializer);
  }

  /**
   * Deserializes a `Serialized` value from the given deserializer.
   * Reads a length-prefixed byte array.
   * @param deserializer - The deserializer to read from.
   * @returns A new `Serialized` instance.
   */
  static deserialize(deserializer: Deserializer): Serialized {
    return new Serialized(deserializer.deserializeBytes());
  }

  /**
   * Decodes the stored bytes as a `MoveVector<T>` using the given element deserializer.
   * The bytes are expected to contain a length-prefixed BCS-encoded vector.
   *
   * @typeParam T - The element type.
   * @param cls - A {@link Deserializable} class for the element type.
   * @returns A new `MoveVector<T>` decoded from the stored bytes.
   */
  toMoveVector<T extends Serializable & EntryFunctionArgument>(cls: Deserializable<T>): MoveVector<T> {
    const deserializer = new Deserializer(this.value);
    const vec = deserializer.deserializeVector(cls);
    deserializer.assertFinished();
    return new MoveVector(vec);
  }
}

// ── MoveString ──

/**
 * A Move `0x1::string::String` value. Serializes as a UTF-8 string with a
 * ULEB128-encoded byte-length prefix.
 * Implements {@link TransactionArgument} for use in entry and script functions.
 *
 * @example
 * ```typescript
 * const greeting = new MoveString("hello");
 * const bytes = greeting.bcsToBytes();
 * ```
 */
export class MoveString extends Serializable implements TransactionArgument {
  /** The underlying string value. */
  public value: string;

  /**
   * @param value - The UTF-8 string to wrap.
   */
  constructor(value: string) {
    super();
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const fixedStringBytes = TEXT_ENCODER.encode(this.value);
    const vectorU8 = MoveVector.U8(fixedStringBytes);
    vectorU8.serializeForScriptFunction(serializer);
  }

  /**
   * Deserializes a `MoveString` from the given deserializer.
   * @param deserializer - The deserializer to read from.
   * @returns A new `MoveString` instance.
   */
  static deserialize(deserializer: Deserializer): MoveString {
    return new MoveString(deserializer.deserializeStr());
  }
}

// ── MoveOption ──

/**
 * A Move `0x1::option::Option<T>` value. Internally represented as a vector
 * with zero elements (None) or one element (Some).
 *
 * Implements {@link EntryFunctionArgument} for use in entry function calls.
 *
 * Use the static factory methods (e.g. {@link MoveOption.U8}, {@link MoveOption.MoveString})
 * for convenient construction of typed options.
 *
 * @typeParam T - The inner type. Must extend both {@link Serializable} and
 *   {@link EntryFunctionArgument}.
 *
 * @example
 * ```typescript
 * const some = new MoveOption(new U64(42n)); // Some(42)
 * const none = new MoveOption<U64>();         // None
 *
 * // Factory methods
 * const optStr  = MoveOption.MoveString("hello");
 * const optNone = MoveOption.U8(null);
 * ```
 */
export class MoveOption<T extends Serializable & EntryFunctionArgument>
  extends Serializable
  implements EntryFunctionArgument
{
  private vec: MoveVector<T>;
  /**
   * The contained value, or `undefined` if this option is `None`.
   */
  public readonly value?: T;

  /**
   * Creates a new `MoveOption`.
   * @param value - The inner value, or `undefined` / `null` for `None`.
   */
  constructor(value?: T | null) {
    super();
    if (typeof value !== "undefined" && value !== null) {
      this.vec = new MoveVector([value]);
    } else {
      this.vec = new MoveVector([]);
    }
    [this.value] = this.vec.values;
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  /**
   * Returns the inner value, throwing if this option is `None`.
   * @returns The contained value.
   * @throws {Error} If the option does not contain a value.
   */
  unwrap(): T {
    if (!this.isSome()) {
      throw new Error("Called unwrap on a MoveOption with no value");
    }
    return this.vec.values[0];
  }

  /**
   * Returns `true` if this option contains a value (`Some`), `false` otherwise (`None`).
   * @returns Whether the option has a value.
   */
  isSome(): boolean {
    return this.vec.values.length === 1;
  }

  serialize(serializer: Serializer): void {
    this.vec.serialize(serializer);
  }

  // ── Factory methods ──

  /**
   * Creates a `MoveOption<U8>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [0, 255].
   * @returns A new `MoveOption<U8>`.
   */
  static U8(value?: number | null): MoveOption<U8> {
    return new MoveOption<U8>(value !== null && value !== undefined ? new U8(value) : undefined);
  }

  /**
   * Creates a `MoveOption<U16>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [0, 65535].
   * @returns A new `MoveOption<U16>`.
   */
  static U16(value?: number | null): MoveOption<U16> {
    return new MoveOption<U16>(value !== null && value !== undefined ? new U16(value) : undefined);
  }

  /**
   * Creates a `MoveOption<U32>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [0, 4294967295].
   * @returns A new `MoveOption<U32>`.
   */
  static U32(value?: number | null): MoveOption<U32> {
    return new MoveOption<U32>(value !== null && value !== undefined ? new U32(value) : undefined);
  }

  /**
   * Creates a `MoveOption<U64>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [0, 2^64 - 1].
   * @returns A new `MoveOption<U64>`.
   */
  static U64(value?: AnyNumber | null): MoveOption<U64> {
    return new MoveOption<U64>(value !== null && value !== undefined ? new U64(value) : undefined);
  }

  /**
   * Creates a `MoveOption<U128>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [0, 2^128 - 1].
   * @returns A new `MoveOption<U128>`.
   */
  static U128(value?: AnyNumber | null): MoveOption<U128> {
    return new MoveOption<U128>(value !== null && value !== undefined ? new U128(value) : undefined);
  }

  /**
   * Creates a `MoveOption<U256>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [0, 2^256 - 1].
   * @returns A new `MoveOption<U256>`.
   */
  static U256(value?: AnyNumber | null): MoveOption<U256> {
    return new MoveOption<U256>(value !== null && value !== undefined ? new U256(value) : undefined);
  }

  /**
   * Creates a `MoveOption<Bool>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional boolean.
   * @returns A new `MoveOption<Bool>`.
   */
  static Bool(value?: boolean | null): MoveOption<Bool> {
    return new MoveOption<Bool>(value !== null && value !== undefined ? new Bool(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I8>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [-128, 127].
   * @returns A new `MoveOption<I8>`.
   */
  static I8(value?: number | null): MoveOption<I8> {
    return new MoveOption<I8>(value !== null && value !== undefined ? new I8(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I16>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [-32768, 32767].
   * @returns A new `MoveOption<I16>`.
   */
  static I16(value?: number | null): MoveOption<I16> {
    return new MoveOption<I16>(value !== null && value !== undefined ? new I16(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I32>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional number in the range [-2147483648, 2147483647].
   * @returns A new `MoveOption<I32>`.
   */
  static I32(value?: number | null): MoveOption<I32> {
    return new MoveOption<I32>(value !== null && value !== undefined ? new I32(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I64>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [-2^63, 2^63 - 1].
   * @returns A new `MoveOption<I64>`.
   */
  static I64(value?: AnyNumber | null): MoveOption<I64> {
    return new MoveOption<I64>(value !== null && value !== undefined ? new I64(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I128>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [-2^127, 2^127 - 1].
   * @returns A new `MoveOption<I128>`.
   */
  static I128(value?: AnyNumber | null): MoveOption<I128> {
    return new MoveOption<I128>(value !== null && value !== undefined ? new I128(value) : undefined);
  }

  /**
   * Creates a `MoveOption<I256>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional value in the range [-2^255, 2^255 - 1].
   * @returns A new `MoveOption<I256>`.
   */
  static I256(value?: AnyNumber | null): MoveOption<I256> {
    return new MoveOption<I256>(value !== null && value !== undefined ? new I256(value) : undefined);
  }

  /**
   * Creates a `MoveOption<MoveString>`. Pass `null` or `undefined` to create `None`.
   * @param value - An optional UTF-8 string.
   * @returns A new `MoveOption<MoveString>`.
   */
  static MoveString(value?: string | null): MoveOption<MoveString> {
    return new MoveOption<MoveString>(value !== null && value !== undefined ? new MoveString(value) : undefined);
  }

  /**
   * Deserializes a `MoveOption<U>` from the given deserializer.
   * Reads the underlying vector (0 or 1 elements) and wraps in a `MoveOption`.
   *
   * @typeParam U - The inner element type.
   * @param deserializer - The deserializer to read from.
   * @param cls - A {@link Deserializable} class for the inner type.
   * @returns A new `MoveOption<U>`.
   */
  static deserialize<U extends Serializable & EntryFunctionArgument>(
    deserializer: Deserializer,
    cls: Deserializable<U>,
  ): MoveOption<U> {
    const vector = MoveVector.deserialize(deserializer, cls);
    return new MoveOption(vector.values[0]);
  }
}
