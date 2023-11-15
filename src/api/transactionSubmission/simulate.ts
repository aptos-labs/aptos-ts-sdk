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

  transaction(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  transactionWithFeePayer(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    feePayerPublicKey: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  multiAgentTransaction(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    secondarySignersPublicKeys: Array<PublicKey>;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  multiAgentTransactionWithFeePayer(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    secondarySignersPublicKeys: Array<PublicKey>;
    feePayerPublicKey: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }
}
