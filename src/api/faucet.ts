// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { fundAccount } from "../internal/faucet";
import { UserTransactionResponse, WaitForTransactionOptions } from "../types";
import { AccountAddressInput } from "../core";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexer } from "../internal/transaction";
import { ProcessorType } from "../utils";

/**
 * A class to query all `Faucet` related queries on Aptos.
 */
export class Faucet {
  constructor(readonly config: AptosConfig) {}

  /**
   * This creates an account if it does not exist and mints the specified amount of
   * coins into that account
   *
   * @example
   * const transaction = await aptos.fundAccount({accountAddress:"0x123", amount: 100})
   *
   * @param args.accountAddress Address of the account to fund
   * @param args.amount Amount of tokens to fund the account with
   * @param args.options Configuration options for waitForTransaction
   * @returns Transaction hash of the transaction that funded the account
   */
  async fundAccount(args: {
    accountAddress: AccountAddressInput;
    amount: number;
    options?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const fundTxn = await fundAccount({ aptosConfig: this.config, ...args });

    // If the user explicitly says to NOT wait by setting waitForIndexer to false, then we skip this.
    // But, by default we want to wait for the indexer.
    if (args.options?.waitForIndexer === undefined || args.options?.waitForIndexer) {
      await waitForIndexer({
        aptosConfig: this.config,
        minimumLedgerVersion: BigInt(fundTxn.version),
        processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
      });
    }

    return fundTxn;
  }
}
