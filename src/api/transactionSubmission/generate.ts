// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../../core";
import { generateTransaction } from "../../internal/transactionSubmission";
import {
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionOptions,
  SingleSignerTransaction,
  FeePayerTransaction,
  MultiAgentTransaction,
} from "../../transactions";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Generate` transaction operations
 */
export class Generate {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  async transaction(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  async transactionWithFeePayer(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
  }): Promise<FeePayerTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args, withFeePayer: true });
  }

  async multiAgentTransaction(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
  }): Promise<MultiAgentTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  async multiAgentTransactionWithFeePayer(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
  }): Promise<FeePayerTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args, withFeePayer: true });
  }
}
