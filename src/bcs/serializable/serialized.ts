import { Serializer, Serializable } from "../serializer";
import { Deserializer } from "../deserializer";
import { HexInput } from "../../types";
import { Hex } from "../../core/hex";
import { TransactionArgument } from "../../transactions/instances/transactionArgument";

export class Serialized extends Serializable implements TransactionArgument {
  public readonly value: Uint8Array;

  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeSerializedBytes(this.value);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  serializeForScriptFunction(serializer: Serializer): void {
    serializer.serialize(this);
  }

  static deserialize(deserializer: Deserializer): Serialized {
    return new Serialized(deserializer.deserializeSerializedBytes());
  }
}
