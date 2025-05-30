// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../../account";
import { signTransaction } from "../../internal/transactionSubmission";
import { AccountAuthenticator, AnyRawTransaction } from "../../transactions";
import { CedraConfig } from "../cedraConfig";

/**
 * A class to handle all `Sign` transaction operations.
 *
 * @param config - The configuration object for Cedra.
 * @group Implementation
 */
export class Sign {
  readonly config: CedraConfig;

  /**
   * Creates an instance of the Cedra client with the specified configuration.
   *
   * @param config - The configuration settings for the Cedra client.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Cedra client with testnet configuration
   *     const config = new CedraConfig({ network: Network.TESTNET });
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client created with config:", config);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
   */
  constructor(config: CedraConfig) {
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
   * import { Cedra, CedraConfig, Network, Account } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new account for signing
   *   const transaction = await cedra.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::cedra_account::transfer",
   *       functionArguments: [ "0x1", 100 ], // replace with a real account address and amount
   *     },
   *   });
   *
   *   // Sign the transaction
   *   const signedTransaction = await cedra.transaction.sign({
   *     signer: sender,
   *     transaction: transaction,
   *   });
   *
   *   console.log("Signed Transaction:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
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
   * import { Cedra, CedraConfig, Network, Account } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new account for signing
   *   const transaction = await cedra.transaction.build.simple({
   *     sender: sender.accountAddress,
   *     data: {
   *       function: "0x1::cedra_account::transfer",
   *       functionArguments: ["0x1", 100], // replace with a real recipient address
   *     },
   *   });
   *
   *   // Set the fee payer for the transaction
   *   transaction.feePayerAddress = "0x1"; // replace with a real fee payer address
   *
   *   const signedTransaction = await cedra.transactionAsFeePayer({ signer: sender, transaction });
   *
   *   console.log("Signed Transaction:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Implementation
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
