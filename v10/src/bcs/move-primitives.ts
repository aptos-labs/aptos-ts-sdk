// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

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
import type { Deserializer } from "./deserializer.js";
import { ensureBoolean, Serializable, type Serializer, validateNumberInRange } from "./serializer.js";
import type { AnyNumber, Int8, Int16, Int32, TransactionArgument, Uint8, Uint16, Uint32 } from "./types.js";
import { ScriptTransactionArgumentVariants } from "./types.js";

// ── Bool ──

export class Bool extends Serializable implements TransactionArgument {
  public readonly value: boolean;

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

  static deserialize(deserializer: Deserializer): Bool {
    return new Bool(deserializer.deserializeBool());
  }
}

// ── Unsigned integers ──

export class U8 extends Serializable implements TransactionArgument {
  public readonly value: Uint8;

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

  static deserialize(deserializer: Deserializer): U8 {
    return new U8(deserializer.deserializeU8());
  }
}

export class U16 extends Serializable implements TransactionArgument {
  public readonly value: Uint16;

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

  static deserialize(deserializer: Deserializer): U16 {
    return new U16(deserializer.deserializeU16());
  }
}

export class U32 extends Serializable implements TransactionArgument {
  public readonly value: Uint32;

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

  static deserialize(deserializer: Deserializer): U32 {
    return new U32(deserializer.deserializeU32());
  }
}

export class U64 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BigInt(0), MAX_U64_BIG_INT);
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

  static deserialize(deserializer: Deserializer): U64 {
    return new U64(deserializer.deserializeU64());
  }
}

export class U128 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BigInt(0), MAX_U128_BIG_INT);
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

  static deserialize(deserializer: Deserializer): U128 {
    return new U128(deserializer.deserializeU128());
  }
}

export class U256 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

  constructor(value: AnyNumber) {
    super();
    validateNumberInRange(value, BigInt(0), MAX_U256_BIG_INT);
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

  static deserialize(deserializer: Deserializer): U256 {
    return new U256(deserializer.deserializeU256());
  }
}

// ── Signed integers ──

export class I8 extends Serializable implements TransactionArgument {
  public readonly value: Int8;

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

  static deserialize(deserializer: Deserializer): I8 {
    return new I8(deserializer.deserializeI8());
  }
}

export class I16 extends Serializable implements TransactionArgument {
  public readonly value: Int16;

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

  static deserialize(deserializer: Deserializer): I16 {
    return new I16(deserializer.deserializeI16());
  }
}

export class I32 extends Serializable implements TransactionArgument {
  public readonly value: Int32;

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

  static deserialize(deserializer: Deserializer): I32 {
    return new I32(deserializer.deserializeI32());
  }
}

export class I64 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

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

  static deserialize(deserializer: Deserializer): I64 {
    return new I64(deserializer.deserializeI64());
  }
}

export class I128 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

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

  static deserialize(deserializer: Deserializer): I128 {
    return new I128(deserializer.deserializeI128());
  }
}

export class I256 extends Serializable implements TransactionArgument {
  public readonly value: bigint;

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

  static deserialize(deserializer: Deserializer): I256 {
    return new I256(deserializer.deserializeI256());
  }
}
