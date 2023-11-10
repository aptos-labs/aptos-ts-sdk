// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { PublicKey } from "../../core";
import { simulateTransaction, submitTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction, InputSimulateTransactionOptions } from "../../transactions";
import { PendingTransactionResponse, UserTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Coin` operations
 */
export class Submit {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  singleSignerTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  singleSignerWithfeePayerTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  multiAgentTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  multiAgentWithfeePayerTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}
