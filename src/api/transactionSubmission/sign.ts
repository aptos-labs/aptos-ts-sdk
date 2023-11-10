// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../../core";
import { signTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Coin` operations
 */
export class Sign {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  transaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    const { signer, transaction } = args;
    return signTransaction({
      signer,
      transaction,
    });
  }

  transactionAsFeePayer(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    const { signer, transaction } = args;
    transaction.feePayerAddress = signer.accountAddress;
    return signTransaction({
      signer,
      transaction,
    });
  }
}
