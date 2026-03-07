// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Hex } from "../hex/hex.js";
import type { Deserializable } from "./deserializer.js";
import { Deserializer } from "./deserializer.js";
import { Bool, I8, I16, I32, I64, I128, I256, U8, U16, U32, U64, U128, U256 } from "./move-primitives.js";
import { Serializable, type Serializer } from "./serializer.js";
import type { AnyNumber, EntryFunctionArgument, HexInput, TransactionArgument } from "./types.js";
import { ScriptTransactionArgumentVariants } from "./types.js";

// ── FixedBytes ──

export class FixedBytes extends Serializable implements TransactionArgument {
  public value: Uint8Array;

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

  static deserialize(deserializer: Deserializer, length: number): FixedBytes {
    return new FixedBytes(deserializer.deserializeFixedBytes(length));
  }
}

// ── EntryFunctionBytes ──

export class EntryFunctionBytes extends Serializable implements EntryFunctionArgument {
  public readonly value: FixedBytes;

  private constructor(value: HexInput) {
    super();
    this.value = new FixedBytes(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.value.value.length);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer, length: number): EntryFunctionBytes {
    const fixedBytes = FixedBytes.deserialize(deserializer, length);
    return new EntryFunctionBytes(fixedBytes.value);
  }
}

// ── MoveVector ──

export class MoveVector<T extends Serializable & EntryFunctionArgument>
  extends Serializable
  implements TransactionArgument
{
  public values: Array<T>;

  constructor(values: Array<T>) {
    super();
    this.values = values;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.values);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeAsBytes(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    if (this.values[0] !== undefined && !(this.values[0] instanceof U8)) {
      const serialized = new Serialized(this.bcsToBytes());
      serialized.serializeForScriptFunction(serializer);
      return;
    }
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8Vector);
    serializer.serialize(this);
  }

  // ── Factory methods ──

  static U8(values: Array<number> | HexInput): MoveVector<U8> {
    let numbers: Array<number>;

    if (Array.isArray(values) && values.length === 0) {
      numbers = [];
    } else if (Array.isArray(values) && typeof values[0] === "number") {
      numbers = values;
    } else if (typeof values === "string") {
      numbers = Array.from(Hex.fromHexInput(values).toUint8Array());
    } else if (values instanceof Uint8Array) {
      numbers = Array.from(values);
    } else {
      throw new Error("Invalid input type, must be an number[], Uint8Array, or hex string");
    }

    return new MoveVector<U8>(numbers.map((v) => new U8(v)));
  }

  static U16(values: Array<number>): MoveVector<U16> {
    return new MoveVector<U16>(values.map((v) => new U16(v)));
  }

  static U32(values: Array<number>): MoveVector<U32> {
    return new MoveVector<U32>(values.map((v) => new U32(v)));
  }

  static U64(values: Array<AnyNumber>): MoveVector<U64> {
    return new MoveVector<U64>(values.map((v) => new U64(v)));
  }

  static U128(values: Array<AnyNumber>): MoveVector<U128> {
    return new MoveVector<U128>(values.map((v) => new U128(v)));
  }

  static U256(values: Array<AnyNumber>): MoveVector<U256> {
    return new MoveVector<U256>(values.map((v) => new U256(v)));
  }

  static Bool(values: Array<boolean>): MoveVector<Bool> {
    return new MoveVector<Bool>(values.map((v) => new Bool(v)));
  }

  static I8(values: Array<number>): MoveVector<I8> {
    return new MoveVector<I8>(values.map((v) => new I8(v)));
  }

  static I16(values: Array<number>): MoveVector<I16> {
    return new MoveVector<I16>(values.map((v) => new I16(v)));
  }

  static I32(values: Array<number>): MoveVector<I32> {
    return new MoveVector<I32>(values.map((v) => new I32(v)));
  }

  static I64(values: Array<AnyNumber>): MoveVector<I64> {
    return new MoveVector<I64>(values.map((v) => new I64(v)));
  }

  static I128(values: Array<AnyNumber>): MoveVector<I128> {
    return new MoveVector<I128>(values.map((v) => new I128(v)));
  }

  static I256(values: Array<AnyNumber>): MoveVector<I256> {
    return new MoveVector<I256>(values.map((v) => new I256(v)));
  }

  static MoveString(values: Array<string>): MoveVector<MoveString> {
    return new MoveVector<MoveString>(values.map((v) => new MoveString(v)));
  }

  static deserialize<T extends Serializable & EntryFunctionArgument>(
    deserializer: Deserializer,
    cls: Deserializable<T>,
  ): MoveVector<T> {
    const length = deserializer.deserializeUleb128AsU32();
    const values: T[] = [];
    for (let i = 0; i < length; i += 1) {
      values.push(cls.deserialize(deserializer));
    }
    return new MoveVector(values);
  }
}

// ── Serialized ──

export class Serialized extends Serializable implements TransactionArgument {
  public readonly value: Uint8Array;

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

  static deserialize(deserializer: Deserializer): Serialized {
    return new Serialized(deserializer.deserializeBytes());
  }

  toMoveVector<T extends Serializable & EntryFunctionArgument>(cls: Deserializable<T>): MoveVector<T> {
    const deserializer = new Deserializer(this.bcsToBytes());
    deserializer.deserializeUleb128AsU32();
    const vec = deserializer.deserializeVector(cls);
    return new MoveVector(vec);
  }
}

// ── MoveString ──

export class MoveString extends Serializable implements TransactionArgument {
  public value: string;

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
    const fixedStringBytes = new TextEncoder().encode(this.value);
    const vectorU8 = MoveVector.U8(fixedStringBytes);
    vectorU8.serializeForScriptFunction(serializer);
  }

  static deserialize(deserializer: Deserializer): MoveString {
    return new MoveString(deserializer.deserializeStr());
  }
}

// ── MoveOption ──

export class MoveOption<T extends Serializable & EntryFunctionArgument>
  extends Serializable
  implements EntryFunctionArgument
{
  private vec: MoveVector<T>;
  public readonly value?: T;

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

  unwrap(): T {
    if (!this.isSome()) {
      throw new Error("Called unwrap on a MoveOption with no value");
    }
    return this.vec.values[0];
  }

  isSome(): boolean {
    return this.vec.values.length === 1;
  }

  serialize(serializer: Serializer): void {
    this.vec.serialize(serializer);
  }

  // ── Factory methods ──

  static U8(value?: number | null): MoveOption<U8> {
    return new MoveOption<U8>(value !== null && value !== undefined ? new U8(value) : undefined);
  }

  static U16(value?: number | null): MoveOption<U16> {
    return new MoveOption<U16>(value !== null && value !== undefined ? new U16(value) : undefined);
  }

  static U32(value?: number | null): MoveOption<U32> {
    return new MoveOption<U32>(value !== null && value !== undefined ? new U32(value) : undefined);
  }

  static U64(value?: AnyNumber | null): MoveOption<U64> {
    return new MoveOption<U64>(value !== null && value !== undefined ? new U64(value) : undefined);
  }

  static U128(value?: AnyNumber | null): MoveOption<U128> {
    return new MoveOption<U128>(value !== null && value !== undefined ? new U128(value) : undefined);
  }

  static U256(value?: AnyNumber | null): MoveOption<U256> {
    return new MoveOption<U256>(value !== null && value !== undefined ? new U256(value) : undefined);
  }

  static Bool(value?: boolean | null): MoveOption<Bool> {
    return new MoveOption<Bool>(value !== null && value !== undefined ? new Bool(value) : undefined);
  }

  static I8(value?: number | null): MoveOption<I8> {
    return new MoveOption<I8>(value !== null && value !== undefined ? new I8(value) : undefined);
  }

  static I16(value?: number | null): MoveOption<I16> {
    return new MoveOption<I16>(value !== null && value !== undefined ? new I16(value) : undefined);
  }

  static I32(value?: number | null): MoveOption<I32> {
    return new MoveOption<I32>(value !== null && value !== undefined ? new I32(value) : undefined);
  }

  static I64(value?: AnyNumber | null): MoveOption<I64> {
    return new MoveOption<I64>(value !== null && value !== undefined ? new I64(value) : undefined);
  }

  static I128(value?: AnyNumber | null): MoveOption<I128> {
    return new MoveOption<I128>(value !== null && value !== undefined ? new I128(value) : undefined);
  }

  static I256(value?: AnyNumber | null): MoveOption<I256> {
    return new MoveOption<I256>(value !== null && value !== undefined ? new I256(value) : undefined);
  }

  static MoveString(value?: string | null): MoveOption<MoveString> {
    return new MoveOption<MoveString>(value !== null && value !== undefined ? new MoveString(value) : undefined);
  }

  static deserialize<U extends Serializable & EntryFunctionArgument>(
    deserializer: Deserializer,
    cls: Deserializable<U>,
  ): MoveOption<U> {
    const vector = MoveVector.deserialize(deserializer, cls);
    return new MoveOption(vector.values[0]);
  }
}
