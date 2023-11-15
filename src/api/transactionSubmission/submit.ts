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

  @ValidateFeePayerData
  async transaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerData
  async multiAgentTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}

function ValidateFeePayerData(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value = async function (...args: any[]) {
    const [methodArgs] = args;

    if (methodArgs.transaction.feePayerAddress && !methodArgs.feePayerAuthenticator) {
      throw new Error("You are submitting a Fee Payer transaction but missing the feePayerAuthenticator");
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
