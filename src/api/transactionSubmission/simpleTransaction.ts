// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput, PublicKey } from "../../core";
import { generateTransaction, simulateTransaction, submitTransaction } from "../../internal/transactionSubmission";
import {
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionOptions,
  AccountAuthenticator,
  AnyRawTransaction,
  InputSimulateTransactionOptions,
  SingleSignerTransaction,
} from "../../transactions";
import { PendingTransactionResponse, UserTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";
import { ValidateFeePayerDataOnSubmission, ValidateFeePayerDataOnSimulation } from "./helpers";

/**
 * A class to handle all `Build` transaction operations
 */
export class SimpleTransaction {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  async build(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<SingleSignerTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerDataOnSimulation
  async simulate(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerDataOnSubmission
  async submit(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}
