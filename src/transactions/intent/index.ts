// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { BatchArgument, BatchedFunctionCallBuilder } from "@wgb5445/aptos-intent-npm";
import {
  EntryFunctionArgumentTypes,
  FunctionABI,
  InputBatchedFunctionData,
  SimpleEntryFunctionArgumentTypes,
} from "../types";
import { convertArgument, fetchMoveFunctionAbi, getFunctionParts, standardizeTypeTags } from "../transactionBuilder";
import { TypeTag } from "../typeTag";
import { AptosConfig } from "../../api/aptosConfig";

function convertBatchArgument(
  argument: BatchArgument | EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  functionName: string,
  functionAbi: FunctionABI,
  position: number,
  genericTypeParams: Array<TypeTag>,
): BatchArgument {
  if (argument instanceof BatchArgument) {
    return argument;
  }
  return BatchArgument.new_bytes(
    convertArgument(functionName, functionAbi, argument, position, genericTypeParams).bcsToBytes(),
  );
}

export class AptosIntentBuilder {
  private builder: BatchedFunctionCallBuilder;

  private config: AptosConfig;

  constructor(aptos_config: AptosConfig) {
    this.builder = BatchedFunctionCallBuilder.single_signer();
    this.config = aptos_config;
  }

  async add_batched_calls(input: InputBatchedFunctionData): Promise<BatchArgument[]> {
    const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
    // console.log(this.config);
    await this.builder.load_module(this.config.fullnode!, `${moduleAddress} ${moduleName}`);
    const typeArguments = standardizeTypeTags(input.typeArguments);
    const functionAbi = await fetchMoveFunctionAbi(moduleAddress, moduleName, functionName, this.config);
    // Check the type argument count against the ABI
    if (typeArguments.length !== functionAbi.typeParameters.length) {
      throw new Error(
        `Type argument count mismatch, expected ${functionAbi.typeParameters.length}, received ${typeArguments.length}`,
      );
    }

    const functionArguments: BatchArgument[] = input.functionArguments.map((arg, i) =>
      convertBatchArgument(arg, functionName, functionAbi, i, typeArguments),
    );

    return this.builder.add_batched_call(
      `${moduleAddress}::${moduleName}`,
      functionName,
      typeArguments.map((arg) => arg.toString()),
      functionArguments,
    );
  }

  build(): Uint8Array {
    return this.builder.generate_batched_calls();
  }
}
