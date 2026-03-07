// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Bool, I8, I16, I32, I64, I128, I256, U8, U16, U32, U64, U128, U256 } from "../bcs/move-primitives.js";
import { EntryFunctionBytes, MoveVector, Serialized } from "../bcs/move-structs.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { AnyNumber, EntryFunctionArgument, ScriptFunctionArgument, TransactionArgument } from "../bcs/types.js";
import { ScriptTransactionArgumentVariants } from "../bcs/types.js";
import { AccountAddress } from "../core/account-address.js";
import { Identifier, TypeTag } from "../core/type-tag.js";
import { ModuleId } from "./module-id.js";
import type { MoveModuleId } from "./types.js";
import {
  TransactionExecutableVariants,
  TransactionExtraConfigVariants,
  TransactionInnerPayloadVariants,
  TransactionPayloadVariants,
} from "./types.js";

// ── Script argument deserialization ──

export function deserializeFromScriptArgument(deserializer: Deserializer): TransactionArgument {
  const index = deserializer.deserializeUleb128AsU32();
  switch (index) {
    case ScriptTransactionArgumentVariants.U8:
      return U8.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U64:
      return U64.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U128:
      return U128.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.Address:
      return AccountAddress.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U8Vector:
      return MoveVector.deserialize(deserializer, U8);
    case ScriptTransactionArgumentVariants.Bool:
      return Bool.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U16:
      return U16.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U32:
      return U32.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.U256:
      return U256.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.Serialized:
      return Serialized.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I8:
      return I8.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I16:
      return I16.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I32:
      return I32.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I64:
      return I64.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I128:
      return I128.deserialize(deserializer);
    case ScriptTransactionArgumentVariants.I256:
      return I256.deserialize(deserializer);
    default:
      throw new Error(`Unknown variant index for ScriptTransactionArgument: ${index}`);
  }
}

// ── TransactionPayload ──

export abstract class TransactionPayload extends Serializable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionPayload {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionPayloadVariants.Script:
        return TransactionPayloadScript.load(deserializer);
      case TransactionPayloadVariants.EntryFunction:
        return TransactionPayloadEntryFunction.load(deserializer);
      case TransactionPayloadVariants.Multisig:
        return TransactionPayloadMultiSig.load(deserializer);
      case TransactionPayloadVariants.Payload:
        return TransactionInnerPayload.deserialize(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionPayload: ${index}`);
    }
  }
}

// ── TransactionPayloadScript ──

export class TransactionPayloadScript extends TransactionPayload {
  public readonly script: Script;

  constructor(script: Script) {
    super();
    this.script = script;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Script);
    this.script.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionPayloadScript {
    const script = Script.deserialize(deserializer);
    return new TransactionPayloadScript(script);
  }
}

// ── TransactionPayloadEntryFunction ──

export class TransactionPayloadEntryFunction extends TransactionPayload {
  public readonly entryFunction: EntryFunction;

  constructor(entryFunction: EntryFunction) {
    super();
    this.entryFunction = entryFunction;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.EntryFunction);
    this.entryFunction.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionPayloadEntryFunction {
    const entryFunction = EntryFunction.deserialize(deserializer);
    return new TransactionPayloadEntryFunction(entryFunction);
  }
}

// ── TransactionPayloadMultiSig ──

export class TransactionPayloadMultiSig extends TransactionPayload {
  public readonly multiSig: MultiSig;

  constructor(multiSig: MultiSig) {
    super();
    this.multiSig = multiSig;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Multisig);
    this.multiSig.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionPayloadMultiSig {
    const value = MultiSig.deserialize(deserializer);
    return new TransactionPayloadMultiSig(value);
  }
}

// ── EntryFunction ──

export class EntryFunction {
  public readonly module_name: ModuleId;
  public readonly function_name: Identifier;
  public readonly type_args: Array<TypeTag>;
  public readonly args: Array<EntryFunctionArgument>;

  constructor(
    module_name: ModuleId,
    function_name: Identifier,
    type_args: Array<TypeTag>,
    args: Array<EntryFunctionArgument>,
  ) {
    this.module_name = module_name;
    this.function_name = function_name;
    this.type_args = type_args;
    this.args = args;
  }

  static build(
    module_id: MoveModuleId,
    function_name: string,
    type_args: Array<TypeTag>,
    args: Array<EntryFunctionArgument>,
  ): EntryFunction {
    return new EntryFunction(ModuleId.fromStr(module_id), new Identifier(function_name), type_args, args);
  }

  serialize(serializer: Serializer): void {
    this.module_name.serialize(serializer);
    this.function_name.serialize(serializer);
    serializer.serializeVector<TypeTag>(this.type_args);
    serializer.serializeU32AsUleb128(this.args.length);
    this.args.forEach((item: EntryFunctionArgument) => {
      item.serializeForEntryFunction(serializer);
    });
  }

  static deserialize(deserializer: Deserializer): EntryFunction {
    const module_name = ModuleId.deserialize(deserializer);
    const function_name = Identifier.deserialize(deserializer);
    const type_args = deserializer.deserializeVector(TypeTag);

    const length = deserializer.deserializeUleb128AsU32();
    const args: Array<EntryFunctionArgument> = [] as EntryFunctionBytes[];

    for (let i = 0; i < length; i += 1) {
      const fixedBytesLength = deserializer.deserializeUleb128AsU32();
      const fixedBytes = EntryFunctionBytes.deserialize(deserializer, fixedBytesLength);
      args.push(fixedBytes);
    }

    return new EntryFunction(module_name, function_name, type_args, args);
  }
}

// ── Script ──

export class Script {
  public readonly bytecode: Uint8Array;
  public readonly type_args: Array<TypeTag>;
  public readonly args: Array<ScriptFunctionArgument>;

  constructor(bytecode: Uint8Array, type_args: Array<TypeTag>, args: Array<ScriptFunctionArgument>) {
    this.bytecode = bytecode;
    this.type_args = type_args;
    this.args = args;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.bytecode);
    serializer.serializeVector<TypeTag>(this.type_args);
    serializer.serializeU32AsUleb128(this.args.length);
    this.args.forEach((item: ScriptFunctionArgument) => {
      item.serializeForScriptFunction(serializer);
    });
  }

  static deserialize(deserializer: Deserializer): Script {
    const bytecode = deserializer.deserializeBytes();
    const type_args = deserializer.deserializeVector(TypeTag);
    const length = deserializer.deserializeUleb128AsU32();
    const args: ScriptFunctionArgument[] = [];
    for (let i = 0; i < length; i += 1) {
      const scriptArgument = deserializeFromScriptArgument(deserializer);
      args.push(scriptArgument);
    }
    return new Script(bytecode, type_args, args);
  }
}

// ── MultiSig ──

export class MultiSig {
  public readonly multisig_address: AccountAddress;
  public readonly transaction_payload?: MultiSigTransactionPayload;

  constructor(multisig_address: AccountAddress, transaction_payload?: MultiSigTransactionPayload) {
    this.multisig_address = multisig_address;
    this.transaction_payload = transaction_payload;
  }

  serialize(serializer: Serializer): void {
    this.multisig_address.serialize(serializer);
    if (this.transaction_payload === undefined) {
      serializer.serializeBool(false);
    } else {
      serializer.serializeBool(true);
      this.transaction_payload.serialize(serializer);
    }
  }

  static deserialize(deserializer: Deserializer): MultiSig {
    const multisig_address = AccountAddress.deserialize(deserializer);
    const payloadPresent = deserializer.deserializeBool();
    let transaction_payload: MultiSigTransactionPayload | undefined;
    if (payloadPresent) {
      transaction_payload = MultiSigTransactionPayload.deserialize(deserializer);
    }
    return new MultiSig(multisig_address, transaction_payload);
  }
}

// ── MultiSigTransactionPayload ──

export class MultiSigTransactionPayload extends Serializable {
  public readonly transaction_payload: EntryFunction;

  constructor(transaction_payload: EntryFunction) {
    super();
    this.transaction_payload = transaction_payload;
  }

  serialize(serializer: Serializer): void {
    // Currently only EntryFunction is supported
    serializer.serializeU32AsUleb128(0);
    this.transaction_payload.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): MultiSigTransactionPayload {
    // Consume the variant index (currently always 0 for EntryFunction)
    deserializer.deserializeUleb128AsU32();
    return new MultiSigTransactionPayload(EntryFunction.deserialize(deserializer));
  }
}

// ── Orderless transaction types ──

export abstract class TransactionInnerPayload extends TransactionPayload {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionInnerPayload {
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
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Payload);
    serializer.serializeU32AsUleb128(TransactionInnerPayloadVariants.V1);
    this.executable.serialize(serializer);
    this.extra_config.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionInnerPayloadV1 {
    const executable = TransactionExecutable.deserialize(deserializer);
    const extra_config = TransactionExtraConfig.deserialize(deserializer);
    return new TransactionInnerPayloadV1(executable, extra_config);
  }
}

export abstract class TransactionExecutable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionExecutable {
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
    const script = Script.deserialize(deserializer);
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
    const entryFunction = EntryFunction.deserialize(deserializer);
    return new TransactionExecutableEntryFunction(entryFunction);
  }
}

export class TransactionExecutableEmpty extends TransactionExecutable {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.Empty);
  }

  static load(_: Deserializer): TransactionExecutableEmpty {
    return new TransactionExecutableEmpty();
  }
}

export abstract class TransactionExtraConfig {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionExtraConfig {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionExtraConfigVariants.V1:
        return TransactionExtraConfigV1.load(deserializer);
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
    serializer.serializeOption<AccountAddress>(this.multisigAddress);
    serializer.serializeOption<U64>(
      this.replayProtectionNonce !== undefined ? new U64(this.replayProtectionNonce) : undefined,
    );
  }

  static load(deserializer: Deserializer): TransactionExtraConfigV1 {
    const multisigAddress = deserializer.deserializeOption(AccountAddress);
    const replayProtectionNonce = deserializer.deserializeOption(U64);
    return new TransactionExtraConfigV1(multisigAddress, replayProtectionNonce?.value);
  }
}
