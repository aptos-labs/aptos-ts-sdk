// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { submitTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { PendingTransactionResponse } from "../../types";
import { CedraConfig } from "../cedraConfig";
import { ValidateFeePayerDataOnSubmission } from "./helpers";

/**
 * A class to handle all `Submit` transaction operations.
 * @group Implementation
 */
export class Submit {
  readonly config: CedraConfig;

  /**
   * Initializes a new instance of the Cedra client with the specified configuration.
   * This allows you to interact with the Cedra blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Cedra client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Cedra node to connect to.
   * @param config.faucetUrl - The URL of the faucet for obtaining test tokens.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Cedra client
   *     const config = new CedraConfig({
   *         network: Network.TESTNET, // Use the TESTNET for testing
   *         nodeUrl: "https://testnet.cedra.dev", // Specify the node URL
   *         faucetUrl: "https://faucet.testnet.cedra.dev" // Specify the faucet URL
   *     });
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
   */
  constructor(config: CedraConfig) {
    this.config = config;
  }

  /**
   * Submits a transaction to the Cedra blockchain using the provided transaction details and authenticators.
   * This function allows you to execute transactions securely by specifying the sender and optional fee payer authenticators.
   *
   * @param args - The arguments for submitting the transaction.
   * @param args.transaction - The raw transaction data to be submitted.
   * @param args.senderAuthenticator - The authenticator for the sender's account.
   * @param [args.feePayerAuthenticator] - The optional authenticator for the fee payer's account.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network, Account } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new sender account
   *   const transaction = await cedra.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::cedra_account::transfer",
   *       functionArguments: [Account.generate().accountAddress, 100], // Replace with a real destination account
   *     },
   *   });
   *
   *   // Submit the transaction
   *   const response = await cedra.simple({
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
  @ValidateFeePayerDataOnSubmission
  async simple(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ cedraConfig: this.config, ...args });
  }

  /**
   * Submits a multi-agent transaction to the Cedra network, allowing multiple signers to authorize the transaction.
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
   * import { Cedra, CedraConfig, Network, Account } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new sender account
   *   const additionalSigner1 = Account.generate(); // Generate an additional signer account
   *   const additionalSigner2 = Account.generate(); // Generate another additional signer account
   *
   *   const transaction = await cedra.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::cedra_account::transfer",
   *       functionArguments: [additionalSigner1.accountAddress, 100],
   *     },
   *   });
   *
   *   const response = await cedra.multiAgent({
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
  @ValidateFeePayerDataOnSubmission
  async multiAgent(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    additionalSignersAuthenticators: Array<AccountAuthenticator>;
    feePayerAuthenticator?: AccountAuthenticator;
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ cedraConfig: this.config, ...args });
  }
}
