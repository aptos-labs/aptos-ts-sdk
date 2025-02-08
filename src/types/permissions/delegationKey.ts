import { Deserializer } from "../../bcs/deserializer";
import { Serializer, Serializable } from "../../bcs/serializer";
import { Ed25519PublicKey, PublicKey } from "../../core";
import { EntryFunctionArgument } from "../../transactions/instances/transactionArgument";

export class DelegationKey extends Serializable implements EntryFunctionArgument {
  readonly publicKey: Ed25519PublicKey;

  constructor({ publicKey }: { publicKey: PublicKey }) {
    super();
    if (publicKey instanceof Ed25519PublicKey) {
      this.publicKey = publicKey;
    } else {
      throw new Error("Invalid public key");
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(0);
    this.publicKey.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): DelegationKey {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== 0) {
      throw new Error("Invalid delegation key variant");
    }
    const publicKey = Ed25519PublicKey.deserialize(deserializer);
    return new DelegationKey({ publicKey });
  }

  serializeForEntryFunction(serializer: Serializer): void {
    this.serialize(serializer);
  }
}
