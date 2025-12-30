// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U256_BIG_INT,
  MIN_I8_NUMBER,
  MAX_I8_NUMBER,
  MIN_I16_NUMBER,
  MAX_I16_NUMBER,
  MIN_I32_NUMBER,
  MAX_I32_NUMBER,
  MIN_I64_BIG_INT,
  MAX_I64_BIG_INT,
  MIN_I128_BIG_INT,
  MAX_I128_BIG_INT,
  MIN_I256_BIG_INT,
  MAX_I256_BIG_INT,
} from "../consts";
import { Deserializer } from "../deserializer";
import { Serializable, Serializer, ensureBoolean, validateNumberInRange } from "../serializer";
import { TransactionArgument } from "../../transactions/instances/transactionArgument";
import { AnyNumber, Uint16, Uint32, Uint8, Int8, Int16, Int32, ScriptTransactionArgumentVariants } from "../../types";

/**
 * Represents a boolean value that can be serialized and deserialized.
 * This class extends the Serializable class and provides methods to serialize
 * the boolean value for different contexts, such as entry functions and script functions.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
export class Bool extends Serializable implements TransactionArgument {
  public readonly value: boolean;

  /**
   * Constructs a new instance with a specified value.
   * This ensures that the value is validated to be within the acceptable range.
   *
   * @param value - The number to be validated and assigned, which must be between 0 and MAX_U256_BIG_INT.
   * @group Implementation
   * @category BCS
   */
  constructor(value: boolean) {
    super();

    /**
     * Ensures that the provided value is of type boolean.
     * This function throws an error if the value is not a boolean, helping to enforce type safety in your code.
     *
     * @param value - The value to be checked for boolean type.
     * @throws {Error} Throws an error if the value is not a boolean.
     * @group Implementation
     * @category BCS
     */
    ensureBoolean(value);
    this.value = value;
  }

  /**
   * Serializes the value using the provided serializer.
   * This function is essential for converting the value into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBool(this.value);
  }

  /**
   * Serializes the current instance for use in an entry function by converting it to a byte sequence.
   * This allows the instance to be properly formatted for serialization in transactions.
   *
   * @param serializer - The serializer instance used to serialize the byte sequence.
   * @group Implementation
   * @category BCS
   */
  serializeForEntryFunction(serializer: Serializer): void {
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  /**
   * Serializes the current instance for use in a script function.
   * This allows for the conversion of the instance into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.Bool);
    serializer.serialize(this);
  }

  /**
   * Deserializes a U256 value from the provided deserializer.
   *
   * @param deserializer - The deserializer instance used to read the U256 data.
   * @group Implementation
   * @category BCS
   */
  // eslint-disable-next-line class-methods-use-this
  deserialize(deserializer: Deserializer) {
    return new U256(deserializer.deserializeU256());
  }

  static deserialize(deserializer: Deserializer): Bool {
    return new Bool(deserializer.deserializeBool());
  }
}

/**
 * Represents an unsigned 8-bit integer (U8) value.
 * This class extends the Serializable class and provides methods for serialization and deserialization of U8 values.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U8);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U8 {
    return new U8(deserializer.deserializeU8());
  }
}

/**
 * Represents a 16-bit unsigned integer (U16) value.
 * This class extends the Serializable class and provides methods for serialization
 * and deserialization of the U16 value.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U16);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U16 {
    return new U16(deserializer.deserializeU16());
  }
}

/**
 * Represents a 32-bit unsigned integer (U32) that can be serialized and deserialized.
 * This class ensures that the value is within the valid range for a U32.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U32);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U32 {
    return new U32(deserializer.deserializeU32());
  }
}

/**
 * Represents a 64-bit unsigned integer (U64) and provides methods for serialization.
 *
 * This class ensures that the value is within the valid range for a U64 and provides
 * functionality to serialize the value for various use cases, including entry functions
 * and script functions.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U64);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U64 {
    return new U64(deserializer.deserializeU64());
  }
}

/**
 * Represents a 128-bit unsigned integer value.
 * This class provides methods for serialization and deserialization
 * of U128 values, ensuring that the values are within the valid range.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U128);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U128 {
    return new U128(deserializer.deserializeU128());
  }
}

/**
 * Represents a 256-bit unsigned integer (U256) that extends the Serializable class.
 * This class provides methods for serialization and deserialization of U256 values,
 * ensuring that the values are within the valid range.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.U256);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): U256 {
    return new U256(deserializer.deserializeU256());
  }
}

/**
 * Represents an 8-bit signed integer (I8) value.
 * This class extends the Serializable class and provides methods for serialization and deserialization of I8 values.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I8);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I8 {
    return new I8(deserializer.deserializeI8());
  }
}

/**
 * Represents a 16-bit signed integer (I16) value.
 * This class extends the Serializable class and provides methods for serialization
 * and deserialization of the I16 value.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I16);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I16 {
    return new I16(deserializer.deserializeI16());
  }
}

/**
 * Represents a 32-bit signed integer (I32) that can be serialized and deserialized.
 * This class ensures that the value is within the valid range for an I32.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I32);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I32 {
    return new I32(deserializer.deserializeI32());
  }
}

/**
 * Represents a 64-bit signed integer (I64) and provides methods for serialization.
 *
 * This class ensures that the value is within the valid range for an I64 and provides
 * functionality to serialize the value for various use cases, including entry functions
 * and script functions.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I64);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I64 {
    return new I64(deserializer.deserializeI64());
  }
}

/**
 * Represents a 128-bit signed integer value.
 * This class provides methods for serialization and deserialization
 * of I128 values, ensuring that the values are within the valid range.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I128);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I128 {
    return new I128(deserializer.deserializeI128());
  }
}

/**
 * Represents a 256-bit signed integer (I256) that extends the Serializable class.
 * This class provides methods for serialization and deserialization of I256 values,
 * ensuring that the values are within the valid range.
 *
 * @extends Serializable
 * @group Implementation
 * @category BCS
 */
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
    const bcsBytes = this.bcsToBytes();
    serializer.serializeBytes(bcsBytes);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(ScriptTransactionArgumentVariants.I256);
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): I256 {
    return new I256(deserializer.deserializeI256());
  }
}
