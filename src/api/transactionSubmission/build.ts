// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { get_wasm, initSync } from "@wgb5445/aptos-intent-npm";
import { AccountAddressInput } from "../../core";
import { generateTransaction } from "../../internal/transactionSubmission";
import {
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionOptions,
  AptosIntentBuilder,
  TransactionPayloadScript,
  generateRawTransaction,
} from "../../transactions";
import { MultiAgentTransaction } from "../../transactions/instances/multiAgentTransaction";
import { SimpleTransaction } from "../../transactions/instances/simpleTransaction";
import { AptosConfig } from "../aptosConfig";
import { singleSignerED25519 } from "../../../tests/unit/helper";
import { Deserializer } from "../../bcs";

/**
 * A class to handle all `Build` transaction operations
 */
export class Build {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Build a simple transaction
   *
   * @param args.sender The sender account address
   * @param args.data The transaction data
   * @param args.options optional. Optional transaction configurations
   * @param args.withFeePayer optional. Whether there is a fee payer for the transaction
   *
   * @returns SimpleTransaction
   */
  async simple(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<SimpleTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  async batched_intents(args: {
    sender: AccountAddressInput;
    builder: (builder: AptosIntentBuilder) => Promise<AptosIntentBuilder>;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<SimpleTransaction> {
    initSync(await get_wasm());
    let builder = new AptosIntentBuilder(this.config);
    builder = await args.builder(builder);
    const bytes = builder.build();
    let raw_txn = await generateRawTransaction({
      aptosConfig: this.config,
      payload: TransactionPayloadScript.load(new Deserializer(bytes)),
      ...args,
    });
    return new SimpleTransaction(raw_txn);
  }

  /**
   * Build a multi agent transaction
   *
   * @param args.sender The sender account address
   * @param args.data The transaction data
   * @param args.secondarySignerAddresses An array of the secondary signers account addresses
   * @param args.options optional. Optional transaction configurations
   * @param args.withFeePayer optional. Whether there is a fee payer for the transaction
   *
   * @returns MultiAgentTransaction
   */
  async multiAgent(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<MultiAgentTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }
}
