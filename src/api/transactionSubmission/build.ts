// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../../core";
import { generateTransaction } from "../../internal/transactionSubmission";
import { InputGenerateTransactionPayloadData, InputGenerateTransactionOptions } from "../../transactions";
import { MultiAgentTransaction } from "../../transactions/instances/multiAgentTransaction";
import { SimpleTransaction } from "../../transactions/instances/simpleTransaction";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Build` transaction operations
 */
export class Build {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

/**
 * Build a simple transaction to facilitate operations on the Aptos blockchain.
 * 
 * @param args The arguments for generating the transaction.
 * @param args.sender The sender account address.
 * @param args.data The transaction data.
 * @param args.options Optional. Additional transaction configurations.
 * @param args.withFeePayer Optional. Indicates if there is a fee payer for the transaction.
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
 *   const sender = Account.generate(); // Generate a new sender account
 *   const destination = Account.generate(); // Generate a new destination account
 * 
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       // All transactions on Aptos are implemented via smart contracts.
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [destination.accountAddress, 100],
 *     },
 *     options: {
 *       // Optional transaction configurations can be specified here
 *     },
 *     withFeePayer: true // Specify if there is a fee payer
 *   });
 * 
 *   console.log(transaction); // Log the generated transaction
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
 * Build a multi-agent transaction that allows multiple signers to authorize a single transaction.
 * This can help facilitate complex transactions requiring approval from multiple parties.
 * 
 * @param args The parameters for building the transaction.
 * @param args.sender The sender account address.
 * @param args.data The transaction data.
 * @param args.secondarySignerAddresses An array of the secondary signers account addresses.
 * @param args.options Optional transaction configurations.
 * @param args.withFeePayer Optional. Whether there is a fee payer for the transaction.
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
 *   const sender = "0x1"; // replace with a real sender account address
 *   const secondarySigners = ["0x2", "0x3"]; // replace with real secondary signer addresses
 *   const transactionData = {
 *     function: "0x1::aptos_account::transfer",
 *     functionArguments: ["0x4", 100], // replace "0x4" with a real destination account address
 *   };
 * 
 *   const multiAgentTransaction = await aptos.multiAgent({
 *     sender,
 *     data: transactionData,
 *     secondarySignerAddresses: secondarySigners,
 *   });
 * 
 *   console.log(multiAgentTransaction);
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