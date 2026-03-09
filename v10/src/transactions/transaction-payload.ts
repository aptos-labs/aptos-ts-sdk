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

/**
 * Deserializes a single script transaction argument from BCS bytes.
 *
 * Script arguments are prefixed with a ULEB128-encoded variant tag that identifies the
 * concrete Move primitive type.  This function reads that tag and dispatches to the
 * appropriate type's deserializer.
 *
 * @param deserializer - The BCS deserializer positioned at the start of a script argument.
 * @returns The deserialized `TransactionArgument` (a Move primitive or serialized value).
 * @throws Error if the variant index does not correspond to a known script argument type.
 */
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

/**
 * Abstract base class for all transaction payloads.
 *
 * Concrete subclasses represent the different types of actions that can be executed:
 * - {@link TransactionPayloadScript} – a compiled Move script with arbitrary logic.
 * - {@link TransactionPayloadEntryFunction} – a call to a named public entry function.
 * - {@link TransactionPayloadMultiSig} – an action to be executed by a multisig account.
 * - {@link TransactionInnerPayload} – an orderless (v2) payload variant.
 *
 * The variant is encoded as a ULEB128-prefixed discriminant during BCS serialization.
 */
export abstract class TransactionPayload extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `TransactionPayload` from BCS bytes, dispatching to the correct
   * concrete subclass based on the ULEB128 variant prefix.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized payload instance.
   * @throws Error if the variant index is unknown.
   */
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

/**
 * A transaction payload that executes a compiled Move script.
 *
 * Scripts allow arbitrary on-chain logic that is not limited to pre-deployed entry
 * functions.  The compiled bytecode is included directly in the transaction.
 *
 * @example
 * ```typescript
 * const payload = new TransactionPayloadScript(
 *   new Script(bytecode, typeArgs, scriptArgs),
 * );
 * ```
 */
export class TransactionPayloadScript extends TransactionPayload {
  /** The compiled Move script to execute. */
  public readonly script: Script;

  /**
   * Creates a new `TransactionPayloadScript`.
   *
   * @param script - The compiled Move script to execute.
   */
  constructor(script: Script) {
    super();
    this.script = script;
  }

  /**
   * Serializes this payload with its variant prefix followed by the script.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Script);
    this.script.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionPayloadScript` from BCS bytes (after the variant prefix has
   * already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionPayloadScript` instance.
   */
  static load(deserializer: Deserializer): TransactionPayloadScript {
    const script = Script.deserialize(deserializer);
    return new TransactionPayloadScript(script);
  }
}

// ── TransactionPayloadEntryFunction ──

/**
 * A transaction payload that calls a named public entry function on a deployed Move module.
 *
 * This is the most commonly used payload type when interacting with smart contracts on
 * Aptos.  The function is identified by its module and name, and arguments are passed as
 * BCS-encoded bytes.
 *
 * @example
 * ```typescript
 * const payload = new TransactionPayloadEntryFunction(
 *   EntryFunction.build("0x1::coin", "transfer", [coinTypeTag], [recipient, amount]),
 * );
 * ```
 */
export class TransactionPayloadEntryFunction extends TransactionPayload {
  /** The entry function call to execute. */
  public readonly entryFunction: EntryFunction;

  /**
   * Creates a new `TransactionPayloadEntryFunction`.
   *
   * @param entryFunction - The entry function call descriptor.
   */
  constructor(entryFunction: EntryFunction) {
    super();
    this.entryFunction = entryFunction;
  }

  /**
   * Serializes this payload with its variant prefix followed by the entry function.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.EntryFunction);
    this.entryFunction.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionPayloadEntryFunction` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionPayloadEntryFunction` instance.
   */
  static load(deserializer: Deserializer): TransactionPayloadEntryFunction {
    const entryFunction = EntryFunction.deserialize(deserializer);
    return new TransactionPayloadEntryFunction(entryFunction);
  }
}

// ── TransactionPayloadMultiSig ──

/**
 * A transaction payload that submits a multisig action for execution.
 *
 * This payload type interacts with on-chain multisig accounts.  The action to be
 * executed may be stored on-chain (omit `transaction_payload`) or provided inline.
 *
 * @example
 * ```typescript
 * const payload = new TransactionPayloadMultiSig(
 *   new MultiSig(multisigAccountAddress),
 * );
 * ```
 */
export class TransactionPayloadMultiSig extends TransactionPayload {
  /** The multisig execution descriptor. */
  public readonly multiSig: MultiSig;

  /**
   * Creates a new `TransactionPayloadMultiSig`.
   *
   * @param multiSig - The multisig execution descriptor.
   */
  constructor(multiSig: MultiSig) {
    super();
    this.multiSig = multiSig;
  }

  /**
   * Serializes this payload with its variant prefix followed by the multisig descriptor.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Multisig);
    this.multiSig.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionPayloadMultiSig` from BCS bytes (after the variant prefix
   * has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionPayloadMultiSig` instance.
   */
  static load(deserializer: Deserializer): TransactionPayloadMultiSig {
    const value = MultiSig.deserialize(deserializer);
    return new TransactionPayloadMultiSig(value);
  }
}

// ── EntryFunction ──

/**
 * Describes a call to a public entry function on a deployed Move module.
 *
 * An `EntryFunction` captures the fully-qualified function reference (module + name),
 * any type arguments (generics), and the BCS-encoded argument values.
 *
 * Prefer the static {@link EntryFunction.build} factory method over the constructor when
 * working with string-based identifiers.
 *
 * @example
 * ```typescript
 * const entryFunction = EntryFunction.build(
 *   "0x1::coin",
 *   "transfer",
 *   [new TypeTagStruct(coinStructTag)],
 *   [recipient, new U64(amount)],
 * );
 * ```
 */
export class EntryFunction {
  /** The module that contains the entry function. */
  public readonly module_name: ModuleId;

  /** The name of the entry function within the module. */
  public readonly function_name: Identifier;

  /** Type arguments supplied to the generic function parameters. */
  public readonly type_args: Array<TypeTag>;

  /** BCS-encoded argument values for the function parameters. */
  public readonly args: Array<EntryFunctionArgument>;

  /**
   * Creates a new `EntryFunction` from already-parsed components.
   *
   * @param module_name - The module identifier.
   * @param function_name - The function name identifier.
   * @param type_args - Generic type arguments.
   * @param args - BCS-encoded function arguments.
   */
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

  /**
   * Creates an `EntryFunction` from string-based identifiers.
   *
   * This factory method is more ergonomic than the constructor when module and function
   * names are known at compile time as string literals.
   *
   * @param module_id - The module identifier in `<address>::<module>` format.
   * @param function_name - The name of the entry function.
   * @param type_args - Generic type arguments.
   * @param args - BCS-encodable function arguments.
   * @returns A new `EntryFunction` instance.
   *
   * @example
   * ```typescript
   * const fn = EntryFunction.build("0x1::coin", "transfer", [typeTag], [recipient, amount]);
   * ```
   */
  static build(
    module_id: MoveModuleId,
    function_name: string,
    type_args: Array<TypeTag>,
    args: Array<EntryFunctionArgument>,
  ): EntryFunction {
    return new EntryFunction(ModuleId.fromStr(module_id), new Identifier(function_name), type_args, args);
  }

  /**
   * Serializes this entry function call to BCS bytes.
   *
   * Each argument is serialized using its `serializeForEntryFunction` method, which
   * length-prefixes the raw BCS bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.module_name.serialize(serializer);
    this.function_name.serialize(serializer);
    serializer.serializeVector<TypeTag>(this.type_args);
    serializer.serializeU32AsUleb128(this.args.length);
    this.args.forEach((item: EntryFunctionArgument) => {
      item.serializeForEntryFunction(serializer);
    });
  }

  /**
   * Deserializes an `EntryFunction` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `EntryFunction` instance.
   */
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

/**
 * A compiled Move script along with its type arguments and runtime arguments.
 *
 * Scripts are arbitrary on-chain programs that are compiled to Move bytecode and included
 * directly in a transaction.  Unlike entry functions they are not stored on-chain, which
 * makes them suitable for one-off or complex multi-step operations.
 *
 * @example
 * ```typescript
 * const script = new Script(compiledBytecode, [typeArg], [new U64(100n)]);
 * ```
 */
export class Script {
  /** The compiled Move bytecode of the script. */
  public readonly bytecode: Uint8Array;

  /** Type arguments supplied to the generic script parameters. */
  public readonly type_args: Array<TypeTag>;

  /** Runtime arguments passed to the script's `main` function. */
  public readonly args: Array<ScriptFunctionArgument>;

  /**
   * Creates a new `Script`.
   *
   * @param bytecode - The compiled Move bytecode.
   * @param type_args - Generic type arguments.
   * @param args - Runtime arguments for the script.
   */
  constructor(bytecode: Uint8Array, type_args: Array<TypeTag>, args: Array<ScriptFunctionArgument>) {
    this.bytecode = bytecode;
    this.type_args = type_args;
    this.args = args;
  }

  /**
   * Serializes this script to BCS bytes.
   *
   * Each argument is serialized using its `serializeForScriptFunction` method.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.bytecode);
    serializer.serializeVector<TypeTag>(this.type_args);
    serializer.serializeU32AsUleb128(this.args.length);
    this.args.forEach((item: ScriptFunctionArgument) => {
      item.serializeForScriptFunction(serializer);
    });
  }

  /**
   * Deserializes a `Script` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Script` instance.
   */
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

/**
 * Descriptor for an action to be executed through an on-chain multisig account.
 *
 * A `MultiSig` payload points to the multisig account address that should execute the
 * action.  The actual payload may be stored on-chain (omit `transaction_payload`) or
 * supplied inline for immediate execution.
 *
 * @example
 * ```typescript
 * // Execute with an on-chain stored payload
 * const multiSig = new MultiSig(multisigAccountAddress);
 *
 * // Execute with an inline payload
 * const multiSig = new MultiSig(multisigAccountAddress, new MultiSigTransactionPayload(entryFn));
 * ```
 */
export class MultiSig {
  /** The on-chain address of the multisig account that will execute the action. */
  public readonly multisig_address: AccountAddress;

  /**
   * Optional inline payload to execute.
   *
   * When `undefined` the multisig account's next queued transaction is executed.
   */
  public readonly transaction_payload?: MultiSigTransactionPayload;

  /**
   * Creates a new `MultiSig` descriptor.
   *
   * @param multisig_address - The address of the multisig account.
   * @param transaction_payload - Optional inline payload to execute.
   */
  constructor(multisig_address: AccountAddress, transaction_payload?: MultiSigTransactionPayload) {
    this.multisig_address = multisig_address;
    this.transaction_payload = transaction_payload;
  }

  /**
   * Serializes this multisig descriptor to BCS bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.multisig_address.serialize(serializer);
    if (this.transaction_payload === undefined) {
      serializer.serializeBool(false);
    } else {
      serializer.serializeBool(true);
      this.transaction_payload.serialize(serializer);
    }
  }

  /**
   * Deserializes a `MultiSig` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiSig` instance.
   */
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

/**
 * An inline payload for a multisig account transaction.
 *
 * Currently only {@link EntryFunction} payloads are supported.  This class wraps an
 * `EntryFunction` and BCS-serializes it with a variant prefix that the multisig account
 * Move module uses to dispatch the call.
 *
 * @example
 * ```typescript
 * const payload = new MultiSigTransactionPayload(
 *   EntryFunction.build("0x1::coin", "transfer", [typeTag], [recipient, amount]),
 * );
 * ```
 */
export class MultiSigTransactionPayload extends Serializable {
  /** The entry function call to execute through the multisig account. */
  public readonly transaction_payload: EntryFunction;

  /**
   * Creates a new `MultiSigTransactionPayload`.
   *
   * @param transaction_payload - The entry function call to execute.
   */
  constructor(transaction_payload: EntryFunction) {
    super();
    this.transaction_payload = transaction_payload;
  }

  /**
   * Serializes this payload with a variant prefix (always 0 for `EntryFunction`).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    // Currently only EntryFunction is supported
    serializer.serializeU32AsUleb128(0);
    this.transaction_payload.serialize(serializer);
  }

  /**
   * Deserializes a `MultiSigTransactionPayload` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiSigTransactionPayload` instance.
   */
  static deserialize(deserializer: Deserializer): MultiSigTransactionPayload {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== 0) {
      throw new Error(`Unknown MultiSigTransactionPayload variant: ${variant}. Only EntryFunction (0) is supported.`);
    }
    return new MultiSigTransactionPayload(EntryFunction.deserialize(deserializer));
  }
}

// ── Orderless transaction types ──

/**
 * Abstract base class for orderless (v2) transaction inner payloads.
 *
 * Orderless transactions do not use a sequence number for replay protection; instead they
 * use a nonce or are identified by their content.  The inner payload carries both the
 * executable (entry function, script, or empty) and extra configuration.
 *
 * Concrete subclasses: {@link TransactionInnerPayloadV1}.
 */
export abstract class TransactionInnerPayload extends TransactionPayload {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `TransactionInnerPayload` from BCS bytes, dispatching to the correct
   * versioned subclass.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized inner payload instance.
   * @throws Error if the version variant is unknown.
   */
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

/**
 * Version 1 of the orderless transaction inner payload.
 *
 * Combines a {@link TransactionExecutable} (what to run) with a
 * {@link TransactionExtraConfig} (replay protection nonce and optional multisig address).
 *
 * @example
 * ```typescript
 * const payload = new TransactionInnerPayloadV1(
 *   new TransactionExecutableEntryFunction(entryFunction),
 *   new TransactionExtraConfigV1(undefined, replayProtectionNonce),
 * );
 * ```
 */
export class TransactionInnerPayloadV1 extends TransactionInnerPayload {
  /** The executable portion of the payload. */
  executable: TransactionExecutable;

  /** Extra configuration such as replay-protection nonce and multisig address. */
  extra_config: TransactionExtraConfig;

  /**
   * Creates a new `TransactionInnerPayloadV1`.
   *
   * @param executable - The executable (entry function, script, or empty).
   * @param extra_config - Additional configuration for the orderless transaction.
   */
  constructor(executable: TransactionExecutable, extra_config: TransactionExtraConfig) {
    super();
    this.executable = executable;
    this.extra_config = extra_config;
  }

  /**
   * Serializes this payload with the outer `Payload` variant prefix, the inner `V1` version
   * prefix, then the executable and extra config.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionPayloadVariants.Payload);
    serializer.serializeU32AsUleb128(TransactionInnerPayloadVariants.V1);
    this.executable.serialize(serializer);
    this.extra_config.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionInnerPayloadV1` from BCS bytes (after both the outer and
   * inner variant prefixes have already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionInnerPayloadV1` instance.
   */
  static load(deserializer: Deserializer): TransactionInnerPayloadV1 {
    const executable = TransactionExecutable.deserialize(deserializer);
    const extra_config = TransactionExtraConfig.deserialize(deserializer);
    return new TransactionInnerPayloadV1(executable, extra_config);
  }
}

/**
 * Abstract base class for the executable portion of an orderless transaction payload.
 *
 * Concrete subclasses:
 * - {@link TransactionExecutableScript} – executes a compiled Move script.
 * - {@link TransactionExecutableEntryFunction} – calls a deployed entry function.
 * - {@link TransactionExecutableEmpty} – carries no executable content.
 */
export abstract class TransactionExecutable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `TransactionExecutable` from BCS bytes, dispatching to the correct
   * concrete subclass based on the ULEB128 variant prefix.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized executable instance.
   * @throws Error if the variant index is unknown.
   */
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

/**
 * An orderless transaction executable that runs a compiled Move script.
 *
 * @example
 * ```typescript
 * const executable = new TransactionExecutableScript(
 *   new Script(bytecode, typeArgs, scriptArgs),
 * );
 * ```
 */
export class TransactionExecutableScript extends TransactionExecutable {
  /** The compiled Move script to execute. */
  script: Script;

  /**
   * Creates a new `TransactionExecutableScript`.
   *
   * @param script - The compiled Move script to execute.
   */
  constructor(script: Script) {
    super();
    this.script = script;
  }

  /**
   * Serializes this executable with its variant prefix followed by the script.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.Script);
    this.script.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionExecutableScript` from BCS bytes (after the variant prefix
   * has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionExecutableScript` instance.
   */
  static load(deserializer: Deserializer): TransactionExecutableScript {
    const script = Script.deserialize(deserializer);
    return new TransactionExecutableScript(script);
  }
}

/**
 * An orderless transaction executable that calls a deployed entry function.
 *
 * @example
 * ```typescript
 * const executable = new TransactionExecutableEntryFunction(
 *   EntryFunction.build("0x1::coin", "transfer", [typeTag], [recipient, amount]),
 * );
 * ```
 */
export class TransactionExecutableEntryFunction extends TransactionExecutable {
  /** The entry function call descriptor. */
  entryFunction: EntryFunction;

  /**
   * Creates a new `TransactionExecutableEntryFunction`.
   *
   * @param entryFunction - The entry function call to execute.
   */
  constructor(entryFunction: EntryFunction) {
    super();
    this.entryFunction = entryFunction;
  }

  /**
   * Serializes this executable with its variant prefix followed by the entry function.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.EntryFunction);
    this.entryFunction.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionExecutableEntryFunction` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionExecutableEntryFunction` instance.
   */
  static load(deserializer: Deserializer): TransactionExecutableEntryFunction {
    const entryFunction = EntryFunction.deserialize(deserializer);
    return new TransactionExecutableEntryFunction(entryFunction);
  }
}

/**
 * An orderless transaction executable that carries no executable content.
 *
 * Used when the transaction payload consists solely of extra configuration without an
 * associated script or entry function call.
 */
export class TransactionExecutableEmpty extends TransactionExecutable {
  /**
   * Serializes this executable with its variant prefix (no additional bytes).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExecutableVariants.Empty);
  }

  /**
   * Deserializes a `TransactionExecutableEmpty` from BCS bytes (after the variant prefix
   * has already been consumed).
   *
   * @param _ - The BCS deserializer (not read from, included for interface consistency).
   * @returns A new `TransactionExecutableEmpty` instance.
   */
  static load(_: Deserializer): TransactionExecutableEmpty {
    return new TransactionExecutableEmpty();
  }
}

/**
 * Abstract base class for extra configuration attached to orderless transaction payloads.
 *
 * Concrete subclasses: {@link TransactionExtraConfigV1}.
 */
export abstract class TransactionExtraConfig {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `TransactionExtraConfig` from BCS bytes, dispatching to the correct
   * versioned subclass.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized extra config instance.
   * @throws Error if the version variant is unknown.
   */
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

/**
 * Version 1 of the orderless transaction extra configuration.
 *
 * Optionally carries a multisig account address (for multisig orderless transactions) and
 * a replay-protection nonce that uniquely identifies the transaction without requiring a
 * sequence number.
 *
 * @example
 * ```typescript
 * // With a replay protection nonce only
 * const extraConfig = new TransactionExtraConfigV1(undefined, 42n);
 *
 * // With both multisig address and nonce
 * const extraConfig = new TransactionExtraConfigV1(multisigAddress, 42n);
 * ```
 */
export class TransactionExtraConfigV1 extends TransactionExtraConfig {
  /**
   * Optional on-chain multisig account address.
   *
   * When set, the transaction is executed through the specified multisig account.
   */
  multisigAddress?: AccountAddress;

  /**
   * Optional replay-protection nonce.
   *
   * Replaces the sequence number for orderless transactions.  Must be unique per sender
   * within the nonce's validity window.
   */
  replayProtectionNonce?: bigint;

  /**
   * Creates a new `TransactionExtraConfigV1`.
   *
   * @param multisigAddress - Optional address of the multisig account to execute through.
   * @param replayProtectionNonce - Optional nonce for replay protection (replaces sequence number).
   */
  constructor(multisigAddress?: AccountAddress, replayProtectionNonce?: AnyNumber) {
    super();
    this.multisigAddress = multisigAddress;
    this.replayProtectionNonce = replayProtectionNonce !== undefined ? BigInt(replayProtectionNonce) : undefined;
  }

  /**
   * Serializes this extra config with its version prefix and optional fields.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionExtraConfigVariants.V1);
    serializer.serializeOption<AccountAddress>(this.multisigAddress);
    serializer.serializeOption<U64>(
      this.replayProtectionNonce !== undefined ? new U64(this.replayProtectionNonce) : undefined,
    );
  }

  /**
   * Deserializes a `TransactionExtraConfigV1` from BCS bytes (after the version prefix has
   * already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionExtraConfigV1` instance.
   */
  static load(deserializer: Deserializer): TransactionExtraConfigV1 {
    const multisigAddress = deserializer.deserializeOption(AccountAddress);
    const replayProtectionNonce = deserializer.deserializeOption(U64);
    return new TransactionExtraConfigV1(multisigAddress, replayProtectionNonce?.value);
  }
}
