// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../serializer";
import { Deserializer } from "../deserializer";
import { FixedBytes } from "./fixedBytes";
import { EntryFunctionArgument } from "../../transactions/instances/transactionArgument";
import { HexInput } from "../../types";

/**
 * This class exists solely to represent a sequence of fixed bytes as a serialized entry function, because
 * serializing an entry function appends a prefix that's *only* used for entry function arguments.
 *
 * NOTE: Using this class for serialized script functions will lead to erroneous and unexpected behavior.
 *
 * If you wish to convert this class back to a TransactionArgument, you must know the type
 * of the argument beforehand, and use the appropriate class to deserialize the bytes within
 * an instance of this class.
 * @group Implementation
 * @category BCS
 */
export class EntryFunctionBytes extends Serializable implements EntryFunctionArgument {
  public readonly value: FixedBytes;

  /**
   * Creates an instance of the class with a specified hexadecimal input value.
   *
   * @param value - The hexadecimal input to be converted into FixedBytes.
   * @group Implementation
   * @category BCS
   */
  private constructor(value: HexInput) {
    super();
    this.value = new FixedBytes(value);
  }

  // Note that to see the Move, BCS-serialized representation of the underlying fixed byte vector,
  // we must not serialize the length prefix.
  //
  // In other words, this class is only used to represent a sequence of bytes that are already
  // BCS-serialized as a type. To represent those bytes accurately, the BCS-serialized form is the same exact
  // representation.

  /**
   * Serializes the value using the provided serializer.
   * This function is essential for accurately representing a sequence of bytes that are already BCS-serialized as a type.
   *
   * Note that to see the Move, BCS-serialized representation of the underlying fixed byte vector,
   * we must not serialize the length prefix.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serialize(serializer: Serializer): void {
    serializer.serialize(this.value);
  }

  // When we serialize these bytes as an entry function argument, we need to
  // serialize the length prefix. This essentially converts the underlying fixed byte vector to a type-agnostic
  // byte vector to an `any` type.
  // NOTE: This, and the lack of a `serializeForScriptFunction`, is the only meaningful difference between this
  // class and FixedBytes.

  /**
   * Serializes the current instance for use as an entry function argument by converting the underlying fixed byte vector to a
   * type-agnostic byte vector.
   * This process includes serializing the length prefix of the byte vector.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.value.value.length);
    serializer.serialize(this);
  }

  /**
   * The only way to create an instance of this class is to use this static method.
   * This function should only be used when deserializing a sequence of EntryFunctionPayload arguments.
   * @param deserializer - The deserializer instance with the buffered bytes.
   * @param length - The length of the bytes to deserialize.
   * @returns An instance of this class, which will now only be usable as an EntryFunctionArgument.
   * @group Implementation
   * @category BCS
   */
  static deserialize(deserializer: Deserializer, length: number): EntryFunctionBytes {
    const fixedBytes = FixedBytes.deserialize(deserializer, length);
    return new EntryFunctionBytes(fixedBytes.value);
  }
}
