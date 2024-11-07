// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { CallArgument, TransactionComposer, initSync, create_wasm} from "@wgb5445/aptos-intent-npm";
import { AptosApiType, Network } from "../../utils";
import { AptosConfig } from "../../api";
import {
  EntryFunctionArgumentTypes,
  FunctionABI,
  InputBatchedFunctionData,
  SimpleEntryFunctionArgumentTypes,
} from "../types";
import { convertArgument, fetchMoveFunctionAbi, getFunctionParts, standardizeTypeTags } from "../transactionBuilder";
import { TypeTag } from "../typeTag";
let wasm = null;

(async ()=>{
  wasm = initSync(await create_wasm());
})();

function convert_batch_argument(
  argument: CallArgument | EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  functionName: string,
  functionAbi: FunctionABI,
  position: number,
  genericTypeParams: Array<TypeTag>,
): CallArgument {
  if (argument instanceof CallArgument) {
    return argument;
  } else {
    return CallArgument.new_bytes(
      convertArgument(functionName, functionAbi, argument, position, genericTypeParams).bcsToBytes(),
    );
  }
}

export class AptosScriptComposer {
  private builder: TransactionComposer;
  private config: AptosConfig;

  constructor(aptos_config: AptosConfig) {
    this.builder = TransactionComposer.single_signer();
    this.config = aptos_config;
  }

  async add_batched_calls(input: InputBatchedFunctionData): Promise<CallArgument[]> {
    const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
    const node_url = this.config.getRequestUrl(AptosApiType.FULLNODE);
    await this.builder.load_module(node_url, moduleAddress + "::" + moduleName);
    if(input.typeArguments != undefined) {
      for (const type_tag of input.typeArguments) {
        await this.builder.load_type_tag(node_url, type_tag.toString());
      }
    }
    const typeArguments = standardizeTypeTags(input.typeArguments);
    const functionAbi = await fetchMoveFunctionAbi(moduleAddress, moduleName, functionName, this.config);
    // Check the type argument count against the ABI
    if (typeArguments.length !== functionAbi.typeParameters.length) {
      throw new Error(
        `Type argument count mismatch, expected ${functionAbi.typeParameters.length}, received ${typeArguments.length}`,
      );
    }

    const functionArguments: CallArgument[] = input.functionArguments.map((arg, i) =>
      convert_batch_argument(arg, functionName, functionAbi, i, typeArguments),
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
