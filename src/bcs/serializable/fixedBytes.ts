// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../serializer";
import { Deserializer } from "../deserializer";
import { HexInput } from "../../types";
import { Hex } from "../../core/hex";
import { TransactionArgument } from "../../transactions/instances/transactionArgument";

/**
 * Represents a contiguous sequence of already serialized BCS bytes.
 * 
 * This class differs from most other Serializable classes in that its internal byte buffer is serialized to BCS
 * bytes exactly as-is, without prepending the length of the bytes. It is ideal for scenarios where custom serialization
 * is required, such as passing serialized bytes as transaction arguments. Additionally, it serves as a representation 
 * of type-agnostic BCS bytes, akin to a vector<u8>.
 * 
 * An example use case includes handling bytes resulting from entry function arguments that have been serialized 
 * for an entry function.
 * 
 * @example
 * const yourCustomSerializedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
 * const fixedBytes = new FixedBytes(yourCustomSerializedBytes);
 * const payload = await generateTransactionPayload({
 *   function: "0xbeefcafe::your_module::your_function_that_requires_custom_serialization",
 *   functionArguments: [yourCustomBytes],
 * });
 * 
 * This class is particularly useful when you want to handle a fixed-size byte array without the overhead of 
 * length prepending, such as when dealing with 32-byte addresses stored as U8 in a MoveVector<U8>.

 *  For example, if you store each of the 32 bytes for an address as a U8 in a MoveVector<U8>, when you
 *  serialize that MoveVector<U8>, it will be serialized to 33 bytes. If you solely want to pass around
 *  the 32 bytes as a Serializable class that *does not* prepend the length to the BCS-serialized representation,
 *  use this class.* 
 * @param value - HexInput representing a sequence of Uint8 bytes.
 * @returns A Serializable FixedBytes instance, which when serialized, does not prepend the length of the bytes.
 * @see EntryFunctionBytes
 * @group Implementation
 * @category BCS
 */
export class FixedBytes extends Serializable implements TransactionArgument {
  public value: Uint8Array;

  /**
   * Creates an instance of the class with a specified hexadecimal input.
   * The value is converted from hexadecimal format to a Uint8Array.
   *
   * @param value - The hexadecimal input to be converted.
   * @group Implementation
   * @category BCS
   */
  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  /**
   * Serializes the fixed bytes value using the provided serializer.
   * This function is essential for converting the fixed bytes into a format suitable for storage or transmission.
   *
   * @param serializer - The serializer instance used for serialization.
   * @group Implementation
   * @category BCS
   */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.value);
  }

  /**
   * Serializes the current instance for an entry function using the provided serializer.
   * This allows the instance to be converted into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  /**
   * Serializes the current instance using the provided serializer.
   * This function is essential for preparing data to be passed as arguments in script functions.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category BCS
   */
  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  /**
   * Deserializes a fixed-length byte array from the provided deserializer.
   * This function helps in reconstructing a FixedBytes object from the serialized data.
   *
   * @param deserializer - The deserializer instance used to read the byte data.
   * @param length - The length of the byte array to be deserialized.
   * @group Implementation
   * @category BCS
   */
  static deserialize(deserializer: Deserializer, length: number): FixedBytes {
    const bytes = deserializer.deserializeFixedBytes(length);
    return new FixedBytes(bytes);
  }
}
