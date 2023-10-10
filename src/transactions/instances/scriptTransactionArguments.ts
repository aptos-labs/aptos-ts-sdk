// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Deserializer, Serializable } from "../../bcs";
import { Bool, U128, U16, U256, U32, U64, U8 } from "../../bcs/serializable/move-primitives";
import { MoveVector } from "../../bcs/serializable/move-structs";
import { AccountAddress } from "../../core";
import { AnyNumber, HexInput, ScriptTransactionArgumentVariants, Uint16, Uint32, Uint8 } from "../../types";
import { ScriptFunctionArgument } from "./transactionArgument";

/**
 * Representation of a Script Transaction Argument that can be serialized and deserialized
 */
export abstract class ScriptTransactionArgument extends Serializable implements ScriptFunctionArgument {
  /**
   * Serialize a Script Transaction Argument to its BCS byte representation.
   */
  abstract serialize(serializer: Serializer): void;

  /**
   * Implemented to satisfy the ScriptFunctionArgument interface.
   * This is exactly the same as `serialize` for all classes that extend ScriptTransactionArgument.
   */
  abstract serializeForScriptFunction(serializer: Serializer): void;

  /**
   * Deserialize a Script Transaction Argument
   */
  static deserialize(deserializer: Deserializer): ScriptTransactionArgument {
    // index enum variant
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case ScriptTransactionArgumentVariants.U8:
        return ScriptTransactionArgumentU8.load(deserializer);
      case ScriptTransactionArgumentVariants.U64:
        return ScriptTransactionArgumentU64.load(deserializer);
      case ScriptTransactionArgumentVariants.U128:
        return ScriptTransactionArgumentU128.load(deserializer);
      case ScriptTransactionArgumentVariants.Address:
        return ScriptTransactionArgumentAddress.load(deserializer);
      case ScriptTransactionArgumentVariants.U8Vector:
        return ScriptTransactionArgumentU8Vector.load(deserializer);
      case ScriptTransactionArgumentVariants.Bool:
        return ScriptTransactionArgumentBool.load(deserializer);
      case ScriptTransactionArgumentVariants.U16:
        return ScriptTransactionArgumentU16.load(deserializer);
      case ScriptTransactionArgumentVariants.U32:
        return ScriptTransactionArgumentU32.load(deserializer);
      case ScriptTransactionArgumentVariants.U256:
        return ScriptTransactionArgumentU256.load(deserializer);
      default:
        throw new Error(`Unknown variant index for ScriptTransactionArgument: ${index}`);
    }
  }
}

export class ScriptTransactionArgumentU8 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U8;

  constructor(value: Uint8) {
    super();
    this.value = new U8(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU8 {
    const value = deserializer.deserializeU8();
    return new ScriptTransactionArgumentU8(value);
  }
}

export class ScriptTransactionArgumentU16 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U16;

  constructor(value: Uint16) {
    super();
    this.value = new U16(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U16);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU16 {
    const value = deserializer.deserializeU16();
    return new ScriptTransactionArgumentU16(value);
  }
}

export class ScriptTransactionArgumentU32 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U32;

  constructor(value: Uint32) {
    super();
    this.value = new U32(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U32);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU32 {
    const value = deserializer.deserializeU32();
    return new ScriptTransactionArgumentU32(value);
  }
}

export class ScriptTransactionArgumentU64 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U64;

  constructor(value: AnyNumber) {
    super();
    this.value = new U64(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U64);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU64 {
    const value = deserializer.deserializeU64();
    return new ScriptTransactionArgumentU64(value);
  }
}

export class ScriptTransactionArgumentU128 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U128;

  constructor(value: AnyNumber) {
    super();
    this.value = new U128(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U128);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU128 {
    const value = deserializer.deserializeU128();
    return new ScriptTransactionArgumentU128(value);
  }
}

export class ScriptTransactionArgumentU256 extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: U256;

  constructor(value: AnyNumber) {
    super();
    this.value = new U256(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U256);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU256 {
    const value = deserializer.deserializeU256();
    return new ScriptTransactionArgumentU256(value);
  }
}

export class ScriptTransactionArgumentAddress extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: AccountAddress;

  constructor(value: AccountAddress) {
    super();
    this.value = value;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Address);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentAddress {
    const value = AccountAddress.deserialize(deserializer);
    return new ScriptTransactionArgumentAddress(value);
  }
}

export class ScriptTransactionArgumentU8Vector extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: MoveVector<U8>;

  constructor(values: Array<number> | HexInput) {
    super();
    this.value = MoveVector.U8(values);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8Vector);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentU8Vector {
    const value = deserializer.deserializeBytes();
    return new ScriptTransactionArgumentU8Vector(value);
  }
}

export class ScriptTransactionArgumentBool extends ScriptTransactionArgument implements ScriptFunctionArgument {
  public readonly value: Bool;

  constructor(value: boolean) {
    super();
    this.value = new Bool(value);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Bool);
    serializer.serialize(this.value);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static load(deserializer: Deserializer): ScriptTransactionArgumentBool {
    const value = deserializer.deserializeBool();
    return new ScriptTransactionArgumentBool(value);
  }
}