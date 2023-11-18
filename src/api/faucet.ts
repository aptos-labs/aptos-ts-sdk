// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { fundAccount } from "../internal/faucet";
import { UserTransactionResponse, WaitForTransactionOptions } from "../types";
import { AccountAddressInput } from "../core";
import { Api } from "./api";

/**
 * A class to query all `Faucet` related queries on Aptos.
 */
export class Faucet extends Api {
  /**
   * This creates an account if it does not exist and mints the specified amount of
   * coins into that account
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
    const fundTxn = fundAccount({ aptosConfig: this.config, ...args });

    if (args.options?.waitForIndexer !== false) {
      await this.waitForIndexer({ minimumLedgerVersion: (await fundTxn).version });
    }

    return fundTxn;
  }
}
