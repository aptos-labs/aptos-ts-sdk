import { Serializer, Deserializer, Serializable } from "../../bcs";
import { HexInput } from "../../types";
import { FixedBytes } from "../../bcs/serializable/fixed-bytes";

export interface TransactionArgument
  extends EntryFunctionArgument,
    ScriptFunctionArgument {}

export interface EntryFunctionArgument {
  /**
   * Serialize an argument to BCS-serialized bytes.
   */
  serialize(serializer: Serializer): void;
  /**
   * Serialize an argument as a type-agnostic, fixed byte sequence. The byte sequence contains
   * the number of the following bytes followed by the BCS-serialized bytes for a typed argument.
   * @example asfasdf
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
/**
 * This class exists solely to represent a sequence of fixed bytes as a serialized entry function, because
 * serializing an entry function appends a prefix that's *only* used for entry function arguments.
 *
 * NOTE: Attempting to use this class for a serialized script function will result in erroneous
 * and unexpected behavior.
 *
 * If you wish to convert this class back to a TransactionArgument, you must know the type
 * of the argument beforehand, and use the appropriate class to deserialize the bytes within
 * an instance of this class.
 */
export class EntryFunctionBytes
  extends Serializable
  implements EntryFunctionArgument
{
  public readonly value: FixedBytes;

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
  serialize(serializer: Serializer): void {
    serializer.serialize(this.value);
  }

  // When we serialize these bytes as an entry function argument, we need to
  // serialize the length prefix. This essentially converts the underlying fixed byte vector to a type-agnostic
  // byte vector to an `any` type.
  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.value.value.length);
    serializer.serialize(this);
  }
  /**
   * The only way to create an instance of this class is to use this static method.
   *
   * This function should only be used when deserializing a sequence of EntryFunctionPayload arguments.
   * @param deserializer the deserializer instance with the buffered bytes
   * @param length the length of the bytes to deserialize
   * @returns an instance of this class, which will now only be usable as an EntryFunctionArgument
   */
  static deserialize(
    deserializer: Deserializer,
    length: number
  ): EntryFunctionBytes {
    const fixedBytes = FixedBytes.deserialize(deserializer, length);
    return new EntryFunctionBytes(fixedBytes.value);
  }
}
