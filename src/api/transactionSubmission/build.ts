// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../../core";
import { generateTransaction } from "../../internal/transactionSubmission";
import { InputGenerateTransactionPayloadData, InputGenerateTransactionOptions } from "../../transactions";
import { MultiAgentTransaction } from "../../transactions/instances/multiAgentTransaction";
import { SimpleTransaction } from "../../transactions/instances/simpleTransaction";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Build` transaction operations.
 */
export class Build {
  readonly config: AptosConfig;

  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   * @param config.account - The account details for authentication.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({
   *         network: Network.TESTNET, // specify the network
   *         nodeUrl: "https://testnet.aptos.dev", // specify the node URL
   *     });
   *
   *     // Initialize the Aptos client
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   */
  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Build a simple transaction.
   *
   * This function allows you to create a transaction with specified sender and data.
   *
   * @param args.sender - The sender account address.
   * @param args.data - The transaction data.
   * @param args.options - Optional transaction configurations.
   * @param args.withFeePayer - Whether there is a fee payer for the transaction.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Build a simple transaction
   *   const transaction = await aptos.transaction.simple({
   *     sender: "0x1", // replace with a real sender account address
   *     data: {
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: ["0x2", 100], // replace with a real destination account address
   *     },
   *     options: {
   *       gasUnitPrice: 100, // specify your own gas unit price if needed
   *       maxGasAmount: 1000, // specify your own max gas amount if needed
   *     },
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async simple(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<SimpleTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Build a multi-agent transaction that allows multiple signers to authorize a transaction.
   *
   * @param args - The parameters for creating the multi-agent transaction.
   * @param args.sender - The sender account address.
   * @param args.data - The transaction data.
   * @param args.secondarySignerAddresses - An array of the secondary signers' account addresses.
   * @param args.options - Optional transaction configurations.
   * @param args.withFeePayer - Whether there is a fee payer for the transaction.
   *
   * @returns MultiAgentTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Build a multi-agent transaction
   *   const transaction = await aptos.multiAgent({
   *     sender: "0x1", // replace with a real sender account address
   *     data: {
   *       // Transaction data structure
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: ["0x2", 100], // replace with a real destination account address and amount
   *     },
   *     secondarySignerAddresses: ["0x3", "0x4"], // replace with real secondary signer addresses
   *     options: {
   *       // Optional transaction configurations
   *       maxGasAmount: "1000",
   *       gasUnitPrice: "1",
   *     },
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async multiAgent(args: {
    sender: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    secondarySignerAddresses: AccountAddressInput[];
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }): Promise<MultiAgentTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }
}
