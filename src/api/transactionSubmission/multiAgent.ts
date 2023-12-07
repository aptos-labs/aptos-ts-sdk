// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput, PublicKey } from "../../core";
import { generateTransaction, simulateTransaction, submitTransaction } from "../../internal/transactionSubmission";
import {
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionOptions,
  MultiAgentTransaction,
  AccountAuthenticator,
  AnyRawTransaction,
  InputSimulateTransactionOptions,
} from "../../transactions";
import { PendingTransactionResponse, UserTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";
import { ValidateFeePayerDataOnSubmission, ValidateFeePayerDataOnSimulation } from "./helpers";

/**
 * A class to handle all `Build` transaction operations
 */
export class MultiAgent {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  async build(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<MultiAgentTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerDataOnSimulation
  async simulate(args: {
    signerPublicKey: PublicKey;
    transaction: AnyRawTransaction;
    secondarySignersPublicKeys: Array<PublicKey>;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  @ValidateFeePayerDataOnSubmission
  async submit(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}
