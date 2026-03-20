// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../../api/aptosConfig";
import { AccountAddressInput } from "../../core";
import { getModule } from "../../internal/account";
import { MoveFunction, MoveFunctionGenericTypeParam } from "../../types";
import { parseTypeTag } from "../typeTag/parser";
import { TypeTag } from "../typeTag";
import { EntryFunctionABI, ViewFunctionABI } from "../types";
import { findFirstNonSignerArg } from "./helpers";

/**
 * JSON-serializable representation of an entry function ABI.
 * Uses string type tags instead of TypeTag objects so the output
 * can be serialized with `JSON.stringify` and stored or embedded in source code.
 *
 * @group Implementation
 * @category Transactions
 */
export type EntryFunctionAbiJSON = {
  typeParameters: Array<{ constraints: string[] }>;
  parameters: string[];
  signers?: number;
};

/**
 * JSON-serializable representation of a view function ABI.
 * Uses string type tags instead of TypeTag objects so the output
 * can be serialized with `JSON.stringify` and stored or embedded in source code.
 *
 * @group Implementation
 * @category Transactions
 */
export type ViewFunctionAbiJSON = {
  typeParameters: Array<{ constraints: string[] }>;
  parameters: string[];
  returnTypes: string[];
};

/**
 * JSON-serializable representation of all entry and view function ABIs in a module.
 *
 * @group Implementation
 * @category Transactions
 */
export type ModuleAbiJSON = {
  address: string;
  name: string;
  entryFunctions: Record<string, EntryFunctionAbiJSON>;
  viewFunctions: Record<string, ViewFunctionAbiJSON>;
};

function serializeGenericTypeParams(params: Array<MoveFunctionGenericTypeParam>): Array<{ constraints: string[] }> {
  return params.map((p) => ({ constraints: [...p.constraints] }));
}

function moveFunctionToEntryAbiJSON(func: MoveFunction): EntryFunctionAbiJSON {
  const numSigners = findFirstNonSignerArg(func);
  const parameters = func.params.slice(numSigners);

  return {
    typeParameters: serializeGenericTypeParams(func.generic_type_params),
    parameters,
    ...(numSigners > 0 ? { signers: numSigners } : {}),
  };
}

function moveFunctionToViewAbiJSON(func: MoveFunction): ViewFunctionAbiJSON {
  return {
    typeParameters: serializeGenericTypeParams(func.generic_type_params),
    parameters: [...func.params],
    returnTypes: [...func.return],
  };
}

/**
 * Fetches a module's ABI from on-chain state and generates JSON-serializable
 * ABIs for all of its entry functions and view functions.
 *
 * The returned object can be serialized with `JSON.stringify` and later
 * converted back into SDK-native `EntryFunctionABI` / `ViewFunctionABI`
 * objects using {@link parseEntryFunctionAbiJSON} and {@link parseViewFunctionAbiJSON}.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, generateModuleAbiJSON } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.MAINNET });
 * const aptos = new Aptos(config);
 *
 * const moduleAbi = await generateModuleAbiJSON({
 *   aptosConfig: aptos.config,
 *   accountAddress: "0x1",
 *   moduleName: "coin",
 * });
 *
 * console.log(JSON.stringify(moduleAbi, null, 2));
 * ```
 *
 * @param args.aptosConfig - The Aptos configuration (network, endpoints, etc.).
 * @param args.accountAddress - The on-chain address that published the module.
 * @param args.moduleName - The name of the Move module.
 * @returns A JSON-serializable object containing entry and view function ABIs.
 * @group Implementation
 * @category Transactions
 */
export async function generateModuleAbiJSON(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
}): Promise<ModuleAbiJSON> {
  const { aptosConfig, accountAddress, moduleName } = args;

  const moduleBytecode = await getModule({ aptosConfig, accountAddress, moduleName });
  const moduleAbi = moduleBytecode.abi;

  if (!moduleAbi) {
    throw new Error(`No ABI found for module '${String(accountAddress)}::${moduleName}'`);
  }

  const entryFunctions: Record<string, EntryFunctionAbiJSON> = {};
  const viewFunctions: Record<string, ViewFunctionAbiJSON> = {};

  for (const func of moduleAbi.exposed_functions) {
    if (func.is_entry) {
      entryFunctions[func.name] = moveFunctionToEntryAbiJSON(func);
    }
    if (func.is_view) {
      viewFunctions[func.name] = moveFunctionToViewAbiJSON(func);
    }
  }

  return {
    address: moduleAbi.address,
    name: moduleAbi.name,
    entryFunctions,
    viewFunctions,
  };
}

/**
 * Fetches the ABI for a single entry function from on-chain state and
 * returns a JSON-serializable representation.
 *
 * @param args.aptosConfig - The Aptos configuration.
 * @param args.accountAddress - The module's account address.
 * @param args.moduleName - The Move module name.
 * @param args.functionName - The entry function name.
 * @returns A JSON-serializable entry function ABI.
 * @throws If the module or function cannot be found, or if the function is not an entry function.
 * @group Implementation
 * @category Transactions
 */
export async function generateEntryFunctionAbiJSON(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  functionName: string;
}): Promise<EntryFunctionAbiJSON> {
  const { aptosConfig, accountAddress, moduleName, functionName } = args;

  const moduleBytecode = await getModule({ aptosConfig, accountAddress, moduleName });
  const moduleAbi = moduleBytecode.abi;

  if (!moduleAbi) {
    throw new Error(`No ABI found for module '${String(accountAddress)}::${moduleName}'`);
  }

  const func = moduleAbi.exposed_functions.find((f) => f.name === functionName);
  if (!func) {
    throw new Error(`Could not find function '${functionName}' in module '${String(accountAddress)}::${moduleName}'`);
  }
  if (!func.is_entry) {
    throw new Error(`'${String(accountAddress)}::${moduleName}::${functionName}' is not an entry function`);
  }

  return moveFunctionToEntryAbiJSON(func);
}

/**
 * Fetches the ABI for a single view function from on-chain state and
 * returns a JSON-serializable representation.
 *
 * @param args.aptosConfig - The Aptos configuration.
 * @param args.accountAddress - The module's account address.
 * @param args.moduleName - The Move module name.
 * @param args.functionName - The view function name.
 * @returns A JSON-serializable view function ABI.
 * @throws If the module or function cannot be found, or if the function is not a view function.
 * @group Implementation
 * @category Transactions
 */
export async function generateViewFunctionAbiJSON(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  functionName: string;
}): Promise<ViewFunctionAbiJSON> {
  const { aptosConfig, accountAddress, moduleName, functionName } = args;

  const moduleBytecode = await getModule({ aptosConfig, accountAddress, moduleName });
  const moduleAbi = moduleBytecode.abi;

  if (!moduleAbi) {
    throw new Error(`No ABI found for module '${String(accountAddress)}::${moduleName}'`);
  }

  const func = moduleAbi.exposed_functions.find((f) => f.name === functionName);
  if (!func) {
    throw new Error(`Could not find function '${functionName}' in module '${String(accountAddress)}::${moduleName}'`);
  }
  if (!func.is_view) {
    throw new Error(`'${String(accountAddress)}::${moduleName}::${functionName}' is not a view function`);
  }

  return moveFunctionToViewAbiJSON(func);
}

function parseTypeTags(tags: string[]): TypeTag[] {
  return tags.map((t) => parseTypeTag(t, { allowGenerics: true }));
}

/**
 * Converts a JSON-serializable entry function ABI back into an
 * SDK-native `EntryFunctionABI` with parsed `TypeTag` objects.
 *
 * Use this to hydrate ABIs that were previously generated with
 * {@link generateModuleAbiJSON} or {@link generateEntryFunctionAbiJSON}.
 *
 * @example
 * ```typescript
 * import { parseEntryFunctionAbiJSON, EntryFunctionAbiJSON } from "@aptos-labs/ts-sdk";
 *
 * const json: EntryFunctionAbiJSON = {
 *   typeParameters: [{ constraints: [] }],
 *   parameters: ["address", "u64"],
 *   signers: 1,
 * };
 *
 * const abi = parseEntryFunctionAbiJSON(json);
 * // abi.parameters => [TypeTagAddress, TypeTagU64]
 * ```
 *
 * @param json - A JSON-serializable entry function ABI.
 * @returns An `EntryFunctionABI` with parsed `TypeTag` parameters.
 * @group Implementation
 * @category Transactions
 */
export function parseEntryFunctionAbiJSON(json: EntryFunctionAbiJSON): EntryFunctionABI {
  return {
    typeParameters: json.typeParameters.map((tp) => ({
      constraints: [...tp.constraints] as EntryFunctionABI["typeParameters"][0]["constraints"],
    })),
    parameters: parseTypeTags(json.parameters),
    ...(json.signers != null ? { signers: json.signers } : {}),
  };
}

/**
 * Converts a JSON-serializable view function ABI back into an
 * SDK-native `ViewFunctionABI` with parsed `TypeTag` objects.
 *
 * Use this to hydrate ABIs that were previously generated with
 * {@link generateModuleAbiJSON} or {@link generateViewFunctionAbiJSON}.
 *
 * @example
 * ```typescript
 * import { parseViewFunctionAbiJSON, ViewFunctionAbiJSON } from "@aptos-labs/ts-sdk";
 *
 * const json: ViewFunctionAbiJSON = {
 *   typeParameters: [{ constraints: [] }],
 *   parameters: ["address"],
 *   returnTypes: ["u64"],
 * };
 *
 * const abi = parseViewFunctionAbiJSON(json);
 * // abi.parameters => [TypeTagAddress]
 * // abi.returnTypes => [TypeTagU64]
 * ```
 *
 * @param json - A JSON-serializable view function ABI.
 * @returns A `ViewFunctionABI` with parsed `TypeTag` parameters and return types.
 * @group Implementation
 * @category Transactions
 */
export function parseViewFunctionAbiJSON(json: ViewFunctionAbiJSON): ViewFunctionABI {
  return {
    typeParameters: json.typeParameters.map((tp) => ({
      constraints: [...tp.constraints] as ViewFunctionABI["typeParameters"][0]["constraints"],
    })),
    parameters: parseTypeTags(json.parameters),
    returnTypes: parseTypeTags(json.returnTypes),
  };
}
