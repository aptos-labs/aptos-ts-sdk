// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {BatchArgument, BatchedFunctionCallBuilder, BatchedFunctionCall, BatchArgumentType} from "aptos-intent";
import { Network } from "../../utils";
import { AptosConfig } from "../../api";
import { EntryFunctionArgumentTypes, InputBatchedFunctionData, } from "../types";
import { getFunctionParts,standardizeTypeTags } from "../transactionBuilder";

function convert_batch_argument(argument: BatchArgument | EntryFunctionArgumentTypes): BatchArgument {
    if(argument instanceof BatchArgument) {
        return argument 
    } else {
        return BatchArgument.new_bytes(argument.bcsToBytes())
    }
}

export class AptosIntentBuilder {
    private builder: BatchedFunctionCallBuilder;
    private network: Network;

    constructor(aptos_config: AptosConfig) {
        this.builder = BatchedFunctionCallBuilder.single_signer();
        this.network = aptos_config.network;
    
    }

    async add_batched_calls(input: InputBatchedFunctionData): Promise<BatchArgument[]> {
        const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
        await this.builder.load_module(this.network, moduleName);
        const typeArguments = standardizeTypeTags(input.typeArguments).map((arg) => arg.toString());

        const functionArguments: BatchArgument[] = input.functionArguments.map((arg) => convert_batch_argument(arg));

        return this.builder.add_batched_call(
            `${moduleAddress}::${moduleName}`,
            functionName,
            typeArguments,
            functionArguments
        )
    }

    build(): Uint8Array {
        return this.builder.generate_batched_calls()
    }
}
