import type { Serializer } from "../../bcs/serializer";

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
}
