// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { PublicKey } from "../../core";
import { simulateTransaction } from "../../internal/transactionSubmission";
import { AnyRawTransaction, InputSimulateTransactionOptions } from "../../transactions";
import { UserTransactionResponse } from "../../types";
import { AptosConfig } from "../aptosConfig";
import { ValidateFeePayerDataOnSimulation } from "./helpers";

/**
 * A class to handle all `Simulate` transaction operations.
 */
export class Simulate {
  readonly config: AptosConfig;

  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your desired network
   *
   *     // Initialize the Aptos client with the configuration
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
   * Simulates a transaction based on the provided parameters and returns the result.
   * This function helps you understand the outcome of a transaction before executing it on the blockchain.
   *
   * @param args - The parameters for simulating the transaction.
   * @param args.signerPublicKey - The public key of the signer for the transaction (optional).
   * @param args.transaction - The raw transaction data to simulate.
   * @param args.feePayerPublicKey - The public key of the fee payer (optional).
   * @param args.options - Additional options for simulating the transaction (optional).
   *
   * @example
   * ```typescript
   * import {
   *     Account,
   *     Aptos,
   *     AptosConfig,
   *     Network,
   * } from "@aptos-labs/ts-sdk";
   *
   * async function example() {
   *     let sender = Account.generate();
   *     let receiver = Account.generate();
   *
   *     // 0. Set up the client and test accounts
   *     const config = new AptosConfig({ network: Network.DEVNET });
   *     const aptos = new Aptos(config);
   *
   *     await aptos.fundAccount({
   *         accountAddress: sender.accountAddress,
   *         amount: 100_000_000,
   *     });
   *
   *     // 1. Build the transaction to preview the impact of it
   *     const transaction = await aptos.transaction.build.simple({
   *         sender: sender.accountAddress,
   *         data: {
   *             // All transactions on Aptos are implemented via smart contracts.
   *             function: "0x1::aptos_account::transfer",
   *             functionArguments: [receiver.accountAddress, 100],
   *         },
   *     });
   *
   *     // 2. Simulate to see what would happen if we execute this transaction
   *     const [userTransactionResponse] = await aptos.transaction.simulate.simple({
   *         signerPublicKey: sender.publicKey,
   *         transaction,
   *     });
   *     console.log(userTransactionResponse);
   *
   *     // If the fee looks ok, continue to signing!
   *     // ...
   * }
   *
   * example();
   * ```
   */
  @ValidateFeePayerDataOnSimulation
  async simple(args: {
    signerPublicKey?: PublicKey;
    transaction: AnyRawTransaction;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Simulates a multi-agent transaction by generating a signed transaction and posting it to the Aptos full node.
   * This function helps in understanding the outcome of a transaction involving multiple signers before it is executed.
   *
   * @param args - The parameters for simulating the transaction.
   * @param args.signerPublicKey - The public key of the primary signer (optional).
   * @param args.transaction - The raw transaction to be simulated.
   * @param args.secondarySignersPublicKeys - An array of public keys for secondary signers (optional).
   *        Each element of the array can be optional, allowing the corresponding key check to be skipped.
   * @param args.feePayerPublicKey - The public key of the fee payer (optional).
   * @param args.options - Options for simulating the transaction (optional).
   *
   * @example
   * ```typescript
   * import {
   *     Account,
   *     Aptos,
   *     AptosConfig,
   *     Network,
   * } from "@aptos-labs/ts-sdk";
   *
   * async function example() {
   *     let sender1 = Account.generate();
   *     let sender2 = Account.generate();
   *     let receiver = Account.generate();
   *
   *     // 0. Set up the client and test accounts
   *     const config = new AptosConfig({ network: Network.DEVNET });
   *     const aptos = new Aptos(config);
   *
   *     await aptos.fundAccount({
   *         accountAddress: sender.accountAddress,
   *         amount: 100_000_000,
   *     });
   *
   *     // 1. Build
   *     console.log("\n=== 1. Building the transaction ===\n");
   *     const transaction = await aptos.transaction.build.multiAgent({
   *     sender: sender1.accountAddress,
   *     secondarySignerAddresses: [sender2.accountAddress],
   *     data: {
   *        // REPLACE WITH YOUR MULTI-AGENT FUNCTION HERE
   *        function:
   *          "<REPLACE WITH YOUR MULTI AGENT MOVE ENTRY FUNCTION> (Syntax {address}::{module}::{function})",
   *          functionArguments: [],
   *        },
   *      });
   *      console.log("Transaction:", transaction);
   *
   *      // 2. Simulate (Optional)
   *      console.log("\n === 2. Simulating Response (Optional) === \n");
   *      const [userTransactionResponse] = await aptos.transaction.simulate.multiAgent(
   *        {
   *          signerPublicKey: sender1.publicKey,
   *          secondarySignersPublicKeys: [sender2.publicKey],
   *          transaction,
   *        },
   *      );
   *      console.log(userTransactionResponse);
   *
   *      // If the fee looks ok, continue to signing!
   *      // ...
   * }
   *
   * example();
   * ```
   */
  @ValidateFeePayerDataOnSimulation
  async multiAgent(args: {
    signerPublicKey?: PublicKey;
    transaction: AnyRawTransaction;
    secondarySignersPublicKeys?: Array<PublicKey | undefined>;
    feePayerPublicKey?: PublicKey;
    options?: InputSimulateTransactionOptions;
  }): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }
}
