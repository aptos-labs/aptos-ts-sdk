// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U256_BIG_INT,
} from "../consts";
import { AnyNumber, Uint16, Uint32, Uint8 } from "../../types";
import { Deserializer } from "../deserializer";
import {
  Serializable,
  Serializer,
  ensureBoolean,
  validateNumberInRange,
} from "../serializer";
import { TransactionArgument } from "../../transactions/instances/transactionArgument";
import {
  ScriptTransactionArgumentBool,
  ScriptTransactionArgumentU128,
  ScriptTransactionArgumentU16,
  ScriptTransactionArgumentU256,
  ScriptTransactionArgumentU32,
  ScriptTransactionArgumentU64,
  ScriptTransactionArgumentU8,
} from "../../transactions/instances";

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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentBool(this.value);
    serializer.serialize(scriptTxArg);
  }

  static deserialize(deserializer: Deserializer): Bool {
    return new Bool(deserializer.deserializeBool());
  }
}

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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU8(this.value);
    serializer.serialize(scriptTxArg);
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU16(this.value);
    serializer.serialize(scriptTxArg);
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU32(this.value);
    serializer.serialize(scriptTxArg);
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU64(this.value);
    serializer.serialize(scriptTxArg);
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU128(this.value);
    serializer.serialize(scriptTxArg);
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    const scriptTxArg = new ScriptTransactionArgumentU256(this.value);
    serializer.serialize(scriptTxArg);
  }

  static deserialize(deserializer: Deserializer): U256 {
    return new U256(deserializer.deserializeU256());
  }
}
