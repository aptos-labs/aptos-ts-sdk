// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer } from "../../bcs/serializer";
import { Hex } from "../../core/hex";
import { SimpleEntryFunctionArgumentTypes } from "../types";

export interface TransactionArgument extends EntryFunctionArgument, ScriptFunctionArgument {}

export interface EntryFunctionArgument {
  /**
   * Serialize an argument to BCS-serialized bytes.
   */
  serialize(serializer: Serializer): void;
  /**
   * Serialize an argument as a type-agnostic, fixed byte sequence. The byte sequence contains
   * the number of the following bytes followed by the BCS-serialized bytes for a typed argument.
   */
  serializeForEntryFunction(serializer: Serializer): void;

  /**
   * Helper function to get the inner value for an entry function argument
   * @returns the inner value the class represents
   */
  toSimpleValue(): SimpleEntryFunctionArgumentTypes;
  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}
export interface ScriptFunctionArgument {
  /**
   * Serialize an argument to BCS-serialized bytes.
   */
  serialize(serializer: Serializer): void;
  /**
   * Serialize an argument to BCS-serialized bytes as a type aware byte sequence.
   * The byte sequence contains an enum variant index followed by the BCS-serialized
   * bytes for a typed argument.
   */
  serializeForScriptFunction(serializer: Serializer): void;

  /**
   * Helper function to get the inner value for a script function argument
   * @returns the inner value the class represents
   */
  toSimpleValue(): SimpleEntryFunctionArgumentTypes;
  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}
