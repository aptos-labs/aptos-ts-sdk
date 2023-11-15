// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { submitTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { PendingTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Submit` transaction operations
 */
export class Submit {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  transaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  transactionWithFeePayer(args: {
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

  multiAgentTransactionWithFeePayer(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}
