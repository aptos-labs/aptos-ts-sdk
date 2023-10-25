// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  GenerateTransactionPayloadData,
  TransactionPayload,
} from "../transactions/types";
import { generateTransactionPayload } from "../transactions/transaction_builder/transaction_builder";

export class TransactionBuilder {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  async generateTransactionPayload(args: GenerateTransactionPayloadData): Promise<TransactionPayload> {
    return generateTransactionPayload(args);
  }
}
