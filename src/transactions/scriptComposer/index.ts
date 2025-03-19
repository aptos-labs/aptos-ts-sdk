// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ScriptComposerWasm } from "@aptos-labs/script-composer-pack";
import { AptosApiType, getFunctionParts } from "../../utils";
import { AptosConfig } from "../../api/aptosConfig";
import { InputBatchedFunctionData } from "../types";
import { standardizeTypeTags } from "../transactionBuilder";
import { CallArgument } from "../../types";
import { convertArgument, fetchModuleAbi } from "../transactionBuilder/remoteAbi";

/**
 * A wrapper class around TransactionComposer, which is a WASM library compiled
 * from aptos-core/aptos-move/script-composer.
 * This class allows the SDK caller to build a transaction that invokes multiple Move functions
 * and allow for arguments to be passed around.
 * */
export class AptosScriptComposer {
  private config: AptosConfig;

  private builder?: any;

  private static transactionComposer?: any;

  constructor(aptosConfig: AptosConfig) {
    this.config = aptosConfig;
    this.builder = undefined;
  }

  // Initializing the wasm needed for the script composer, must be called
  // before using the composer.
  async init() {
    if (!AptosScriptComposer.transactionComposer) {
      const module = await import("@aptos-labs/script-composer-pack");
      const { TransactionComposer, initSync } = module;
      if (!ScriptComposerWasm.isInitialized) {
        ScriptComposerWasm.init();
      }
      initSync({ module: ScriptComposerWasm.wasm });
      AptosScriptComposer.transactionComposer = TransactionComposer;
    }
    this.builder = AptosScriptComposer.transactionComposer.single_signer();
  }

  // Add a move function invocation to the TransactionComposer.
  //
  // Similar to how to create an entry function, the difference is that input arguments could
  // either be a `CallArgument` which represents an abstract value returned from a previous Move call
  // or the regular entry function arguments.
  //
  // The function would also return a list of `CallArgument` that can be passed on to future calls.
  async addBatchedCalls(input: InputBatchedFunctionData): Promise<CallArgument[]> {
    const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
    const nodeUrl = this.config.getRequestUrl(AptosApiType.FULLNODE);

    // Load the calling module into the builder.
    await this.builder.load_module(nodeUrl, `${moduleAddress}::${moduleName}`);

    // Load the calling type arguments into the loader.
    if (input.typeArguments !== undefined) {
      for (const typeArgument of input.typeArguments) {
        await this.builder.load_type_tag(nodeUrl, typeArgument.toString());
      }
    }
    const typeArguments = standardizeTypeTags(input.typeArguments);
    const moduleAbi = await fetchModuleAbi(moduleAddress, moduleName, this.config);
    if (!moduleAbi) {
      throw new Error(`Could not find module ABI for '${moduleAddress}::${moduleName}'`);
    }

    // Check the type argument count against the ABI
    const functionAbi = moduleAbi?.exposed_functions.find((func) => func.name === functionName);
    if (!functionAbi) {
      throw new Error(`Could not find function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
    }

    if (typeArguments.length !== functionAbi.generic_type_params.length) {
      throw new Error(
        `Type argument count mismatch, expected ${functionAbi?.generic_type_params.length}, received ${typeArguments.length}`,
      );
    }

    const functionArguments: CallArgument[] = input.functionArguments.map((arg, i) =>
      arg instanceof CallArgument
        ? arg
        : CallArgument.newBytes(
            convertArgument(functionName, moduleAbi, arg, i, typeArguments, { allowUnknownStructs: true }).bcsToBytes(),
          ),
    );

    return this.builder.add_batched_call(
      `${moduleAddress}::${moduleName}`,
      functionName,
      typeArguments.map((arg) => arg.toString()),
      functionArguments,
    );
  }

  build(): Uint8Array {
    return this.builder.generate_batched_calls(true);
  }
}
