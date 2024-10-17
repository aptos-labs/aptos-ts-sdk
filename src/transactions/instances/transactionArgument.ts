// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer } from "../../bcs/serializer";
import { Hex } from "../../core/hex";

export interface TransactionArgument extends EntryFunctionArgument, ScriptFunctionArgument {}

/**
 * Represents an argument for entry functions, providing methods to serialize the argument
 * to BCS-serialized bytes and convert it to different formats.
 * @group Implementation
 * @category Transactions
 */
export interface EntryFunctionArgument {
  /**
   * Serialize an argument to BCS-serialized bytes.
   *
   * @param serializer - The serializer instance used for serialization.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void;

  /**
   * Serialize an argument to BCS-serialized bytes.
   * Serialize an argument as a type-agnostic, fixed byte sequence. The byte sequence contains
   * the number of the following bytes followed by the BCS-serialized bytes for a typed argument.
   *
   * @param serializer - The serializer used to convert the argument.
   * @group Implementation
   * @category Transactions
   */
  serializeForEntryFunction(serializer: Serializer): void;

  /**
   * Convert the argument to BCS-serialized bytes.
   *
   * @returns Uint8Array representing the BCS-serialized bytes of the argument.
   * @group Implementation
   * @category Transactions
   */
  bcsToBytes(): Uint8Array;

  /**
   * Converts the BCS-serialized bytes of an argument into a hexadecimal representation.
   * This function is useful for obtaining a Hex instance that encapsulates the BCS-serialized bytes,
   * allowing for easier manipulation and representation of the data.
   * @returns A Hex instance containing the BCS-serialized bytes.
   * @group Implementation
   * @category Transactions
   */
  bcsToHex(): Hex;
}

/**
 * Represents an argument for script functions, providing methods to serialize and convert to bytes.
 * @group Implementation
 * @category Transactions
 */
export interface ScriptFunctionArgument {
  /**
   * Serialize an argument to BCS-serialized bytes.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void;
  /**
   * Serialize an argument to BCS-serialized bytes as a type aware byte sequence.
   * The byte sequence contains an enum variant index followed by the BCS-serialized
   * bytes for a typed argument.
   * @group Implementation
   * @category Transactions
   */
  serializeForScriptFunction(serializer: Serializer): void;

  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}
