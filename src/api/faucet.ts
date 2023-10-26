// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { fundAccount } from "../internal/faucet";
import { HexInput, WaitForTransactionOptions } from "../types";

/**
 * A class to query all `Faucet` related queries on Aptos.
 */
export class Faucet {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

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
    accountAddress: HexInput;
    amount: number;
    options?: WaitForTransactionOptions;
  }): Promise<string> {
    return fundAccount({ aptosConfig: this.config, ...args });
  }
}
