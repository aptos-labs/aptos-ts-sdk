// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../../core";
import { generateTransaction } from "../../internal/transactionSubmission";
import {
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionOptions,
  SingleSignerTransaction,
  MultiAgentTransaction,
} from "../../transactions";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Build` transaction operations
 */
export class Build {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  async transaction(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<SingleSignerTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  async multiAgentTransaction(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<MultiAgentTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }
}
