// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { submitTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { PendingTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";
import { ValidateFeePayerDataOnSubmission } from "./helpers";

/**
 * A class to handle all `Submit` transaction operations
 */
export class Submit {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

/**
 * Submits a transaction to the Aptos blockchain using the specified sender and transaction details.
 * This function allows you to execute a transaction by providing the necessary authentication and transaction data.
 * 
 * @param args - The arguments for submitting the transaction.
 * @param args.transaction - The raw transaction data to be submitted.
 * @param args.senderAuthenticator - The authenticator for the sender's account.
 * @param [args.feePayerAuthenticator] - An optional authenticator for the fee payer's account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Generate a new account for sending the transaction
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [Account.generate().accountAddress, 100], // Replace with a real recipient account address
 *     },
 *   });
 * 
 *   // Submit the transaction
 *   const response = await aptos.simple({
 *     transaction,
 *     senderAuthenticator: sender.getAuthenticator(), // Use the sender's authenticator
 *   });
 * 
 *   console.log("Transaction submitted:", response);
 * }
 * runExample().catch(console.error);
 * ```
 */


  @ValidateFeePayerDataOnSubmission
  async simple(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Submits a multi-agent transaction to the Aptos blockchain, allowing multiple signers to authenticate the transaction.
 * This function is useful for scenarios where multiple parties need to approve a transaction before it is executed.
 * 
 * @param args - The parameters for the multi-agent transaction.
 * @param args.transaction - The raw transaction to be submitted.
 * @param args.senderAuthenticator - The authenticator for the sender of the transaction.
 * @param args.additionalSignersAuthenticators - An array of authenticators for additional signers.
 * @param args.feePayerAuthenticator - An optional authenticator for the fee payer. If not specified, the sender will pay the fees.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, AccountAuthenticator } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Generate a new sender account
 *   const additionalSigner = Account.generate(); // Generate an additional signer account
 * 
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [additionalSigner.accountAddress, 100],
 *     },
 *   });
 * 
 *   const senderAuthenticator = new AccountAuthenticator(sender);
 *   const additionalSignersAuthenticators = [new AccountAuthenticator(additionalSigner)];
 * 
 *   // Submit the multi-agent transaction
 *   const response = await aptos.multiAgent({
 *     transaction,
 *     senderAuthenticator,
 *     additionalSignersAuthenticators,
 *   });
 * 
 *   console.log("Transaction submitted:", response);
 * }
 * runExample().catch(console.error);
 * ```
 */


  @ValidateFeePayerDataOnSubmission
  async multiAgent(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}