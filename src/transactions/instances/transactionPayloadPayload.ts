import { Deserializer, Serializer } from "../../bcs";
import { AnyNumber, TransactionPayloadVariants } from "../../types";
import {
  EntryFunction,
  MultiSig,
  Script,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultiSig,
  TransactionPayloadScript,
} from "./transactionPayload";
import { AccountAddress } from "../../core";

export enum TransactionInnerPayloadVariants {
  V1 = 0,
}

/**
 * Represents any transaction payload that can be submitted to the Aptos chain for execution.
 *
 * This is specifically used for orderless transactions.
 */
export class TransactionPayloadPayload extends TransactionPayload {
  public readonly innerPayload: TransactionInnerPayload;

  constructor(innerPayload: TransactionInnerPayload) {
    super();
    this.innerPayload = innerPayload;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Payload);
    this.innerPayload.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionPayloadPayload {
    const value = TransactionInnerPayload.deserialize(deserializer);
    return new TransactionPayloadPayload(value);
  }
}

export abstract class TransactionInnerPayload {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionInnerPayload {
    // index enum variant
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionInnerPayloadVariants.V1:
        return TransactionInnerPayloadV1.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionInnerPayload: ${index}`);
    }
  }
}

export class TransactionInnerPayloadV1 extends TransactionInnerPayload {
  executable: TransactionExecutable;
  extra_config: TransactionExtraConfig;

  constructor(executable: TransactionExecutable, extra_config: TransactionExtraConfig) {
    super();
    this.executable = executable;
    this.extra_config = extra_config;
  }

  serialize(serializer: Serializer): void {
    // V1 is serialized as 0
    serializer.serializeU32AsUleb128(TransactionInnerPayloadVariants.V1);
    this.executable.serialize(serializer);
    this.extra_config.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionInnerPayloadV1 {
    deserializer.deserializeUleb128AsU32();
    let executable = TransactionExecutable.deserialize(deserializer);
    let extra_config = TransactionExtraConfig.deserialize(deserializer);
    return new TransactionInnerPayloadV1(executable, extra_config);
  }
}

export enum TransactionExecutableVariants {
  Script = 0,
  EntryFunction = 1,
  Empty = 2,
}

export abstract class TransactionExecutable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionExecutable {
    // index enum variant
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionExecutableVariants.Script:
        return TransactionExecutableScript.load(deserializer);
      case TransactionExecutableVariants.EntryFunction:
        return TransactionExecutableEntryFunction.load(deserializer);
      case TransactionExecutableVariants.Empty:
        return TransactionExecutableEmpty.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionExecutable: ${index}`);
    }
  }
}

export class TransactionExecutableScript extends TransactionExecutable {
  script: Script;

  constructor(script: Script) {
    super();
    this.script = script;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.Script);
    this.script.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionExecutableScript {
    deserializer.deserializeUleb128AsU32();
    let script = Script.deserialize(deserializer);
    return new TransactionExecutableScript(script);
  }
}

export class TransactionExecutableEntryFunction extends TransactionExecutable {
  entryFunction: EntryFunction;

  constructor(entryFunction: EntryFunction) {
    super();
    this.entryFunction = entryFunction;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.EntryFunction);
    this.entryFunction.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionExecutableEntryFunction {
    deserializer.deserializeUleb128AsU32();
    let entryFunction = EntryFunction.deserialize(deserializer);
    return new TransactionExecutableEntryFunction(entryFunction);
  }
}

export class TransactionExecutableEmpty extends TransactionExecutable {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.Empty);
  }

  static load(deserializer: Deserializer): TransactionExecutableEmpty {
    deserializer.deserializeUleb128AsU32();
    return new TransactionExecutableEmpty();
  }
}

export enum TransactionExtraConfigVariants {
  V1 = 0,
}

export abstract class TransactionExtraConfig {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionExecutable {
    // index enum variant
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionExtraConfigVariants.V1:
        return TransactionExecutableScript.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionExtraConfig: ${index}`);
    }
  }
}

export class TransactionExtraConfigV1 extends TransactionExtraConfig {
  multisigAddress?: AccountAddress;
  replayProtectionNonce?: bigint;

  constructor(multisigAddress?: AccountAddress, replayProtectionNonce?: AnyNumber) {
    super();
    this.multisigAddress = multisigAddress;
    this.replayProtectionNonce = replayProtectionNonce !== undefined ? BigInt(replayProtectionNonce) : undefined;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExtraConfigVariants.V1);
  }

  static load(deserializer: Deserializer): TransactionExtraConfigV1 {
    deserializer.deserializeUleb128AsU32();
    return new TransactionExtraConfigV1();
  }
}
