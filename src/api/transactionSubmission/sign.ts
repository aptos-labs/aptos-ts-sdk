// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../../account";
import { signTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { AptosConfig } from "../aptosConfig";

/**
 * A class to handle all `Sign` transaction operations.
 *
 * @param config - The configuration object for Aptos.
 */
export class Sign {
  readonly config: AptosConfig;

  /**
   * Creates an instance of the Aptos client with the specified configuration.
   *
   * @param config - The configuration settings for the Aptos client.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Aptos client with testnet configuration
   *     const config = new AptosConfig({ network: Network.TESTNET });
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client created with config:", config);
   * }
   * runExample().catch(console.error);
   * ```
   */
  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Signs a transaction using the provided account signer. This function is essential for ensuring that transactions are properly
   * authenticated before being sent to the network.
   *
   * @param args - The arguments for signing the transaction.
   * @param args.signer - The account that will sign the transaction.
   * @param args.transaction - The raw transaction data to be signed.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new account for signing
   *   const transaction = await aptos.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: [ "0x1", 100 ], // replace with a real account address and amount
   *     },
   *   });
   *
   *   // Sign the transaction
   *   const signedTransaction = await aptos.transaction.sign({
   *     signer: sender,
   *     transaction: transaction,
   *   });
   *
   *   console.log("Signed Transaction:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  // eslint-disable-next-line class-methods-use-this
  transaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    return signTransaction({
      ...args,
    });
  }

  /**
   * Sets the fee payer address for a transaction and signs it with the provided account.
   * This function is essential for transactions that require a designated fee payer.
   *
   * @param args - The arguments for the function.
   * @param args.signer - The account that will sign the transaction.
   * @param args.transaction - The transaction object that requires a fee payer address.
   *
   * @throws Error if the transaction does not have a feePayerAddress property.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new account for signing
   *   const transaction = await aptos.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::aptos_account::transfer",
   *       functionArguments: ["0x1", 100], // replace with a real recipient address
   *     },
   *   });
   *
   *   // Set the fee payer for the transaction
   *   transaction.feePayerAddress = "0x1"; // replace with a real fee payer address
   *
   *   const signedTransaction = await aptos.transactionAsFeePayer({ signer: sender, transaction });
   *
   *   console.log("Signed Transaction:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  // eslint-disable-next-line class-methods-use-this
  transactionAsFeePayer(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    const { signer, transaction } = args;

    // if transaction doesn't hold a "feePayerAddress" prop it means
    // this is not a fee payer transaction
    if (!transaction.feePayerAddress) {
      throw new Error(`Transaction ${transaction} is not a Fee Payer transaction`);
    }

    // Set the feePayerAddress to the signer account address
    transaction.feePayerAddress = signer.accountAddress;

    return signTransaction({
      signer,
      transaction,
    });
  }
}
