// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { PublicKey } from "../../core";
import { simulateTransaction } from "../../internal/transactionSubmission";
import { AnyRawTransaction, InputSimulateTransactionOptions } from "../../transactions";
import { UserTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Simulate` transaction operations
 */
export class Simulate {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  @ValidateFeePayerData
  async transaction(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerData
  async multiAgentTransaction(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    secondarySignersPublicKeys: Array<PublicKey>;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }
}

function ValidateFeePayerData(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value = async function (...args: any[]) {
    const [methodArgs] = args;

    if (methodArgs.transaction.feePayerAddress && !methodArgs.feePayerPublicKey) {
      throw new Error("You are simulating a Fee Payer transaction but missing the feePayerPublicKey");
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
