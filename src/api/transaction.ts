// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  getGasPriceEstimation,
  getTransactionByHash,
  getTransactionByVersion,
  getTransactions,
  isTransactionPending,
  waitForTransaction,
} from "../internal/transaction";
import {
  AnyNumber,
  CommittedTransactionResponse,
  GasEstimation,
  HexInput,
  PaginationArgs,
  PendingTransactionResponse,
  TransactionResponse,
  WaitForTransactionOptions,
} from "../types";
import {
  getSigningMessage,
  publicPackageTransaction,
  rotateAuthKey,
  signAndSubmitTransaction,
  signTransaction,
} from "../internal/transactionSubmission";
import {
  AccountAuthenticator,
  AnyRawTransaction,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
} from "../transactions";
import { AccountAddressInput, PrivateKey } from "../core";
import { Account } from "../account";
import { Build } from "./transactionSubmission/build";
import { Simulate } from "./transactionSubmission/simulate";
import { Submit } from "./transactionSubmission/submit";
import { TransactionManagement } from "./transactionSubmission/management";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

export class Transaction {
  readonly config: AptosConfig;

  readonly build: Build;

  readonly simulate: Simulate;

  readonly submit: Submit;

  readonly batch: TransactionManagement;

  constructor(config: AptosConfig) {
    this.config = config;
    this.build = new Build(this.config);
    this.simulate = new Simulate(this.config);
    this.submit = new Submit(this.config);
    this.batch = new TransactionManagement(this.config);
  }

/**
 * Queries on-chain transactions and does not return pending transactions. 
 * 
 * @param args Optional parameters for pagination.
 * @param args.options Optional pagination options.
 * @param args.options.offset The number of transactions to start with. 
 * @param args.options.limit The number of results to return.
 * 
 * @returns Array of on-chain transactions.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch on-chain transactions with pagination
 *   const transactions = await aptos.getTransactions({
 *     options: {
 *       offset: 0, // starting from the first transaction
 *       limit: 10, // limiting to 10 transactions
 *     },
 *   });
 * 
 *   console.log(transactions);
 * }
 * runExample().catch(console.error);
 */


  async getTransactions(args?: { options?: PaginationArgs }): Promise<TransactionResponse[]> {
    return getTransactions({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries on-chain transaction by its version. This function will not return pending transactions.
 *
 * @param args - The parameters for retrieving the transaction.
 * @param args.ledgerVersion - Transaction version is an unsigned 64-bit number.
 * @returns The on-chain transaction associated with the specified version. Only on-chain transactions have versions, so this function cannot be used to query pending transactions.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Retrieve the transaction by its version
 *   const transaction = await aptos.getTransactionByVersion({ ledgerVersion: 1 }); // replace with a real ledger version
 *
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getTransactionByVersion(args: { ledgerVersion: AnyNumber }): Promise<TransactionResponse> {
    return getTransactionByVersion({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries on-chain transactions using a transaction hash and returns either pending or committed transactions.
 * 
 * @param args - The arguments for the transaction query.
 * @param args.transactionHash - Transaction hash should be a hex-encoded bytes string with a 0x prefix.
 * @returns Transaction from mempool (pending) or on-chain (committed) transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching a transaction by its hash
 *   const transaction = await aptos.getTransactionByHash({
 *     transactionHash: "0x123" // replace with a real transaction hash
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getTransactionByHash(args: { transactionHash: HexInput }): Promise<TransactionResponse> {
    return getTransactionByHash({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Determines if the specified transaction is currently in a pending state.
 * This can help you verify the status of a transaction before proceeding with further actions.
 * 
 * @param args - The arguments for the function.
 * @param args.transactionHash - A hash of the transaction to check.
 * @returns `true` if the transaction is in a pending state and `false` otherwise.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Check if the transaction is pending
 *   const isPending = await aptos.isPendingTransaction({ transactionHash: "0x123" }); // replace with a real transaction hash
 *   console.log(`Is the transaction pending? ${isPending}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async isPendingTransaction(args: { transactionHash: HexInput }): Promise<boolean> {
    return isTransactionPending({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Waits for a transaction to move past the pending state and returns the transaction response.
 * This function is useful for ensuring that a transaction has been processed and committed to the blockchain.
 * 
 * @param args.transactionHash The hash of a transaction previously submitted to the blockchain.
 * @param args.options Optional settings for waiting on the transaction.
 * @param args.options.timeoutSecs Timeout in seconds. Defaults to 20 seconds.
 * @param args.options.checkSuccess A boolean which controls whether the function will error if the transaction failed. Defaults to true.
 * @returns The transaction on-chain, which includes details about its execution status.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Build a transaction to fund an account
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: "0x1", // replace with a real sender address
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: ["0x2", 100], // replace with a real destination address
 *     },
 *   });
 * 
 *   // Submit the transaction
 *   const response = await aptos.transaction.submit(transaction);
 *   const txnHash = response.txn_hash; // Get the transaction hash
 * 
 *   // Wait for the transaction to be processed
 *   const txnResponse = await aptos.waitForTransaction({
 *     transactionHash: txnHash,
 *     options: {
 *       timeoutSecs: 30, // specify your own timeout if needed
 *     },
 *   });
 * 
 *   console.log("Transaction processed:", txnResponse);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async waitForTransaction(args: {
    transactionHash: HexInput;
    options?: WaitForTransactionOptions;
  }): Promise<CommittedTransactionResponse> {
    return waitForTransaction({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Retrieves an estimate of the gas unit price required to get a transaction on chain in a reasonable amount of time.
 * This can help you determine the appropriate gas price for your transactions to ensure they are processed quickly.
 *
 * @returns Object holding the outputs of the estimate gas API, including the estimated gas price.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Getting the gas price estimation
 *   const gasPriceEstimation = await aptos.getGasPriceEstimation();
 *
 *   console.log("Estimated gas price:", gasPriceEstimation);
 * }
 * runExample().catch(console.error);
 */


  async getGasPriceEstimation(): Promise<GasEstimation> {
    return getGasPriceEstimation({
      aptosConfig: this.config,
    });
  }

  /**
   * Returns a signing message for a transaction.
   *
   * This allows a user to sign a transaction using their own preferred signing method, and
   * then submit it to the network.
   *
   * @example
   * const transaction = await aptos.transaction.build.simple({...})
   * const message = await aptos.getSigningMessage({transaction})
   *
   * @param args.transaction A raw transaction for signing elsewhere
   */
  // eslint-disable-next-line class-methods-use-this
  getSigningMessage(args: { transaction: AnyRawTransaction }): Uint8Array {
    return getSigningMessage(args);
  }

/**
 * Generates a transaction to publish a Move package to the blockchain.
 * This function allows you to deploy your Move modules and their associated metadata to the Aptos network.
 *
 * @param args The arguments for publishing the package.
 * @param args.account The publisher account.
 * @param args.metadataBytes The package metadata bytes.
 * @param args.moduleBytecode An array of the bytecode of each module in the package in compiler output order.
 * @param args.options Optional settings for generating the transaction.
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = "0x1"; // replace with a real account address
 *   const metadataBytes = "0xabcdef"; // replace with real metadata bytes
 *   const byteCode = "0x123456"; // replace with real module bytecode
 * 
 *   // Generate a transaction to publish a Move package
 *   const transaction = await aptos.publishPackageTransaction({
 *     account: alice,
 *     metadataBytes,
 *     moduleBytecode: [byteCode],
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 */


  async publishPackageTransaction(args: {
    account: AccountAddressInput;
    metadataBytes: HexInput;
    moduleBytecode: Array<HexInput>;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return publicPackageTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Rotate an account's auth key, allowing the use of a new private key for signing transactions. 
 * After rotation, only the new private key can be used to sign transactions for the account.
 * Note: Only legacy Ed25519 scheme is supported for now.
 * More info: {@link https://aptos.dev/guides/account-management/key-rotation/}
 *
 * @param args The arguments for rotating the auth key.
 * @param args.fromAccount The account to rotate the auth key for.
 * @param args.toNewPrivateKey The new private key to rotate to.
 *
 * @returns PendingTransactionResponse
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PrivateKey } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account
 *   const newPrivateKey = new PrivateKey("0x123"); // Replace with a real private key
 * 
 *   // Rotate the auth key for Alice's account
 *   const response = await aptos.rotateAuthKey({
 *     fromAccount: alice,
 *     toNewPrivateKey: newPrivateKey,
 *   });
 * 
 *   console.log(response);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async rotateAuthKey(args: { fromAccount: Account; toNewPrivateKey: PrivateKey }): Promise<TransactionResponse> {
    return rotateAuthKey({ aptosConfig: this.config, ...args });
  }

  /**
   * Sign a transaction that can later be submitted to chain
   *
   * @example
   * const transaction = await aptos.transaction.build.simple({...})
   * const transaction = await aptos.transaction.sign({
   *  signer: alice,
   *  transaction
   * })
   *
   * @param args.signer The signer account
   * @param args.transaction A raw transaction to sign on
   *
   * @returns AccountAuthenticator
   */
  // eslint-disable-next-line class-methods-use-this
  sign(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    return signTransaction({
      ...args,
    });
  }

  /**
   * Sign a transaction as a fee payer that can later be submitted to chain
   *
   * @example
   * const transaction = await aptos.transaction.build.simple({...})
   * const transaction = await aptos.transaction.signAsFeePayer({
   *  signer: alice,
   *  transaction
   * })
   *
   * @param args.signer The fee payer signer account
   * @param args.transaction A raw transaction to sign on
   *
   * @returns AccountAuthenticator
   */
  // eslint-disable-next-line class-methods-use-this
  signAsFeePayer(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    const { signer, transaction } = args;

    // if transaction doesnt hold a "feePayerAddress" prop it means
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

  // TRANSACTION SUBMISSION //

/**
 * Batch transactions for a single account by processing multiple transaction payloads.
 * This function is useful for submitting multiple independent transactions, such as batch fund transfers or token mints.
 * 
 * @param args - The arguments for batching transactions.
 * @param args.sender - The sender account to sign and submit the transactions.
 * @param args.data - An array of transaction payloads to be processed.
 * @param args.options - Optional. Transaction generation configurations (excluding accountSequenceNumber).
 * 
 * @throws Error if any worker failure occurs during the submission of transactions.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Generate a new account for sending transactions
 * 
 *   const transactionPayloads = [
 *     {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [Account.generate().accountAddress, 100],
 *     },
 *     {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [Account.generate().accountAddress, 200],
 *     },
 *   ];
 * 
 *   await aptos.transaction.batchTransactionsForSingleAccount({
 *     sender,
 *     data: transactionPayloads,
 *   });
 * 
 *   console.log("Batch transactions submitted successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async batchTransactionsForSingleAccount(args: {
    sender: Account;
    data: InputGenerateTransactionPayloadData[];
    options?: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">;
  }): Promise<void> {
    try {
      const { sender, data, options } = args;
      this.batch.forSingleAccount({ sender, data, options });
    } catch (error: any) {
      throw new Error(`failed to submit transactions with error: ${error}`);
    }
  }

/**
 * Sign and submit a single signer transaction to the blockchain.
 * 
 * @param args The arguments for signing and submitting the transaction.
 * @param args.signer The signer account to sign the transaction.
 * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
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
 *       functionArguments: [ "0x1", 100 ], // Replace with a real recipient address
 *     },
 *   });
 * 
 *   // Sign and submit the transaction
 *   const pendingTransaction = await aptos.signAndSubmitTransaction({
 *     signer: sender,
 *     transaction,
 *   });
 * 
 *   console.log(pendingTransaction);
 * }
 * runExample().catch(console.error);
 */


  async signAndSubmitTransaction(args: {
    signer: Account;
    transaction: AnyRawTransaction;
  }): Promise<PendingTransactionResponse> {
    const { signer, transaction } = args;
    return signAndSubmitTransaction({
      aptosConfig: this.config,
      signer,
      transaction,
    });
  }
}