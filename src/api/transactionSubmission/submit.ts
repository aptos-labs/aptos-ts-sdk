// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { submitTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction, InputTransactionPluginData } from "../../transactions";
import { PendingTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";
import { validateFeePayerDataOnSubmission } from "./helpers";

/**
 * A class to handle all `Submit` transaction operations.
 * @group Implementation
 */
export class Submit {
  readonly config: AptosConfig;

  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   * @param config.faucetUrl - The URL of the faucet for obtaining test tokens.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({
   *         network: Network.TESTNET, // Use the TESTNET for testing
   *         nodeUrl: "https://testnet.aptos.dev", // Specify the node URL
   *         faucetUrl: "https://faucet.testnet.aptos.dev" // Specify the faucet URL
   *     });
   *
   *     // Initialize the Aptos client with the configuration
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
   */
  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Submits a transaction to the Aptos blockchain using the provided transaction details and authenticators.
   * This function allows you to execute transactions securely by specifying the sender and optional fee payer authenticators.
   *
   * @param args - The arguments for submitting the transaction.
   * @param args.transaction - The raw transaction data to be submitted.
   * @param args.senderAuthenticator - The authenticator for the sender's account.
   * @param [args.feePayerAuthenticator] - The optional authenticator for the fee payer's account.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new sender account
   *   const transaction = await aptos.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: [Account.generate().accountAddress, 100], // Replace with a real destination account
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
   * @group Implementation
   */
  async simple(
    args: {
      transaction: AnyRawTransaction;
      senderAuthenticator: AccountAuthenticator;
      feePayerAuthenticator?: AccountAuthenticator;
    } & InputTransactionPluginData,
  ): Promise<PendingTransactionResponse> {
    validateFeePayerDataOnSubmission(this.config, args);
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Submits a multi-agent transaction to the Aptos network, allowing multiple signers to authorize the transaction.
   * This function is useful for scenarios where a transaction requires approval from multiple accounts.
   *
   * @param args - The parameters for the multi-agent transaction.
   * @param args.transaction - The raw transaction to be submitted.
   * @param args.senderAuthenticator - The authenticator for the sender account.
   * @param args.additionalSignersAuthenticators - An array of authenticators for additional signers.
   * @param [args.feePayerAuthenticator] - An optional authenticator for the fee payer account.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new sender account
   *   const additionalSigner1 = Account.generate(); // Generate an additional signer account
   *   const additionalSigner2 = Account.generate(); // Generate another additional signer account
   *
   *   const transaction = await aptos.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: [additionalSigner1.accountAddress, 100],
   *     },
   *   });
   *
   *   const response = await aptos.multiAgent({
   *     transaction,
   *     senderAuthenticator: sender.getAuthenticator(), // Use the sender's authenticator
   *     additionalSignersAuthenticators: [
   *       additionalSigner1.getAuthenticator(), // Use the first additional signer's authenticator
   *       additionalSigner2.getAuthenticator(), // Use the second additional signer's authenticator
   *     ],
   *   });
   *
   *   console.log(response); // Log the response from the transaction submission
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
   */
  async multiAgent(
    args: {
      transaction: AnyRawTransaction;
      senderAuthenticator: AccountAuthenticator;
      additionalSignersAuthenticators: Array<AccountAuthenticator>;
      feePayerAuthenticator?: AccountAuthenticator;
    } & InputTransactionPluginData,
  ): Promise<PendingTransactionResponse> {
    validateFeePayerDataOnSubmission(this.config, args);
    return submitTransaction({ aptosConfig: this.config, ...args });
  }
}
