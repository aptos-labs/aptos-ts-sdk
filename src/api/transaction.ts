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
  FeePayerOrFeePayerAuthenticatorOrNeither,
  getSigningMessage,
  publicPackageTransaction,
  signAndSubmitAsFeePayer,
  signAndSubmitTransaction,
  signAsFeePayer,
  signTransaction,
} from "../internal/transactionSubmission";
import {
  AccountAuthenticator,
  AnyRawTransaction,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
} from "../transactions";
import { AccountAddressInput, AuthenticationKey, Ed25519PrivateKey } from "../core";
import { Account } from "../account";
import { Build } from "./transactionSubmission/build";
import { Simulate } from "./transactionSubmission/simulate";
import { Submit } from "./transactionSubmission/submit";
import { TransactionManagement } from "./transactionSubmission/management";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { rotateAuthKey } from "../internal/account";

/**
 * Represents a transaction in the Aptos blockchain,
 * providing methods to build, simulate, submit, and manage transactions.
 * This class encapsulates functionalities for querying transaction details,
 * estimating gas prices, signing transactions, and handling transaction states.
 *
 * This class is used as part of the Aptos object, so should be called like so:
 * @example
 * ```typescript
 * import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
 * const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
 * const ALICE_INITIAL_BALANCE = 100_000_000;
 * const TRANSFER_AMOUNT = 100;
 *
 * async function example() {
 *   console.log(
 *     "This example will create two accounts (Alice and Bob), fund them, and transfer between them.",
 *   );
 *
 *   // Set up the client
 *   const config = new AptosConfig({ network: Network.DEVNET });
 *   const aptos = new Aptos(config);
 *
 *   // Generate two account credentials
 *   // Each account has a private key, a public key, and an address
 *   const alice = Account.generate();
 *   const bob = Account.generate();
 *
 *   console.log("=== Addresses ===\n");
 *   console.log(`Alice's address is: ${alice.accountAddress}`);
 *   console.log(`Bob's address is: ${bob.accountAddress}`);
 *
 *   // Fund the accounts using a faucet
 *   console.log("\n=== Funding accounts ===\n");
 *
 *   await aptos.fundAccount({
 *     accountAddress: alice.accountAddress,
 *     amount: ALICE_INITIAL_BALANCE,
 *   });
 *
 *   // Send a transaction from Alice's account to Bob's account
 *   const txn = await aptos.transaction.build.simple({
 *     sender: alice.accountAddress,
 *     data: {
 *       // All transactions on Aptos are implemented via smart contracts.
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [bob.accountAddress, 100],
 *     },
 *   });
 *
 *   console.log("\n=== Transfer transaction ===\n");
 *   // Both signs and submits
 *   const committedTxn = await aptos.signAndSubmitTransaction({
 *     signer: alice,
 *     transaction: txn,
 *  });
 *   // Waits for Aptos to verify and execute the transaction
 *   const executedTransaction = await aptos.waitForTransaction({
 *     transactionHash: committedTxn.hash,
 *   });
 *   console.log("Transaction hash:", executedTransaction.hash);
 *
 *  console.log("\n=== Balances after transfer ===\n");
 *  const newAliceAccountBalance = await aptos.getAccountResource({
 *    accountAddress: alice.accountAddress,
 *    resourceType: COIN_STORE,
 *  });
 *  const newAliceBalance = Number(newAliceAccountBalance.coin.value);
 *  console.log(`Alice's balance is: ${newAliceBalance}`);
 *
 *  const newBobAccountBalance = await aptos.getAccountResource({
 *    accountAddress: bob.accountAddress,
 *    resourceType: COIN_STORE,
 *  });
 *  const newBobBalance = Number(newBobAccountBalance.coin.value);
 *  console.log(`Bob's balance is: ${newBobBalance}`);
 * }
 *
 * example();
 * ```
 * @group Transaction
 */
export class Transaction {
  readonly config: AptosConfig;

  readonly build: Build;

  readonly simulate: Simulate;

  readonly submit: Submit;

  readonly batch: TransactionManagement;

  /**
   * Creates an instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., Testnet, Mainnet).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Aptos client instance
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify the network
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client created successfully:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  constructor(config: AptosConfig) {
    this.config = config;
    this.build = new Build(this.config);
    this.simulate = new Simulate(this.config);
    this.submit = new Submit(this.config);
    this.batch = new TransactionManagement(this.config);
  }

  /**
   * Queries on-chain transactions, excluding pending transactions.
   * Use this function to retrieve historical transactions from the blockchain.
   *
   * @param args Optional parameters for pagination.
   * @param args.options Optional pagination options.
   * @param args.options.offset The number of the transaction to start with.
   * @param args.options.limit The number of results to return.
   *
   * @returns An array of on-chain transactions.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetch transactions with pagination
   *   const transactions = await aptos.getTransactions({
   *     options: {
   *       offset: 0, // Start from the first transaction
   *       limit: 10, // Limit to 10 results
   *     },
   *   });
   *
   *   console.log(transactions);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async getTransactions(args?: { options?: PaginationArgs }): Promise<TransactionResponse[]> {
    return getTransactions({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries on-chain transaction by version. This function will not return pending transactions.
   *
   * @param args - The arguments for querying the transaction.
   * @param args.ledgerVersion - Transaction version is an unsigned 64-bit number.
   * @returns On-chain transaction. Only on-chain transactions have versions, so this
   * function cannot be used to query pending transactions.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching a transaction by its version
   *   const transaction = await aptos.getTransactionByVersion({ ledgerVersion: 1 }); // replace 1 with a real version
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async getTransactionByVersion(args: { ledgerVersion: AnyNumber }): Promise<TransactionResponse> {
    return getTransactionByVersion({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries on-chain transactions by their transaction hash, returning both pending and committed transactions.
   *
   * @param args - The arguments for querying the transaction.
   * @param args.transactionHash - The transaction hash should be a hex-encoded bytes string with a 0x prefix.
   * @returns The transaction from the mempool (pending) or the on-chain (committed) transaction.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetch a transaction by its hash
   *   const transaction = await aptos.getTransactionByHash({ transactionHash: "0x123" }); // replace with a real transaction hash
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async getTransactionByHash(args: { transactionHash: HexInput }): Promise<TransactionResponse> {
    return getTransactionByHash({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Defines if the specified transaction is currently in a pending state.
   * This function helps you determine the status of a transaction using its hash.
   *
   * @param args - The arguments for the function.
   * @param args.transactionHash - A hash of the transaction in hexadecimal format.
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
   *   // Check if the transaction is pending using its hash
   *   const isPendingTransaction = await aptos.isPendingTransaction({ transactionHash: "0x123" }); // replace with a real transaction hash
   *   console.log("Is the transaction pending?", isPendingTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async isPendingTransaction(args: { transactionHash: HexInput }): Promise<boolean> {
    return isTransactionPending({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Waits for a transaction to move past the pending state and provides the transaction response.
   * There are 4 cases.
   * 1. Transaction is successfully processed and committed to the chain.
   *    - The function will resolve with the transaction response from the API.
   * 2. Transaction is rejected for some reason, and is therefore not committed to the blockchain.
   *    - The function will throw an AptosApiError with an HTTP status code indicating some problem with the request.
   * 3. Transaction is committed but execution failed, meaning no changes were
   *    written to the blockchain state.
   *    - If `checkSuccess` is true, the function will throw a FailedTransactionError
   *      If `checkSuccess` is false, the function will resolve with the transaction response where the `success` field is false.
   * 4. Transaction does not move past the pending state within `args.options.timeoutSecs` seconds.
   *    - The function will throw a WaitForTransactionError
   *
   * @param args.transactionHash - The hash of a transaction previously submitted to the blockchain.
   * @param args.options - Optional parameters for waiting behavior.
   * @param args.options.timeoutSecs - Timeout in seconds. Defaults to 20 seconds.
   * @param args.options.checkSuccess - A boolean which controls whether the function will error if the transaction failed.
   * Defaults to true.
   * @returns The transaction on-chain response.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Wait for a transaction to complete using its hash
   *   const transactionHash = "0x123"; // replace with a real transaction hash
   *   const transactionResponse = await aptos.waitForTransaction({
   *     transactionHash,
   *     options: {
   *       timeoutSecs: 30, // specify your own timeout if needed
   *       checkSuccess: true,
   *     },
   *   });
   *
   *   console.log(transactionResponse);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
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
   * Estimates the gas unit price required to process a transaction on the Aptos blockchain in a timely manner.
   * This helps users to understand the cost associated with their transactions.
   * {@link https://api.mainnet.aptoslabs.com/v1/spec#/operations/estimate_gas_price}
   *
   * @returns An object containing the estimated gas price.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET }); // Specify your network
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Getting the gas price estimation
   *   const gasPriceEstimation = await aptos.getGasPriceEstimation();
   *
   *   console.log("Estimated Gas Price:", gasPriceEstimation);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async getGasPriceEstimation(): Promise<GasEstimation> {
    return getGasPriceEstimation({
      aptosConfig: this.config,
    });
  }

  /**
   * Returns a signing message for a transaction, allowing a user to sign it using their preferred method before submission to the network.
   *
   * @param args - The arguments for obtaining the signing message.
   * @param args.transaction - A raw transaction for signing elsewhere.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *     const transaction = await aptos.transaction.build.simple({
   *         sender: "0x1", // replace with a real sender address
   *         data: {
   *             function: "0x1::aptos_account::transfer",
   *             functionArguments: ["0x2", 100], // replace with a real destination address
   *         },
   *     });
   *
   *     const message = await aptos.getSigningMessage({ transaction });
   *     console.log(message);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  // eslint-disable-next-line class-methods-use-this
  getSigningMessage(args: { transaction: AnyRawTransaction }): Uint8Array {
    return getSigningMessage(args);
  }

  /**
   * Generates a transaction to publish a Move package to the blockchain.
   * This function helps you create a transaction that can be simulated or submitted to the chain for publishing a package.
   *
   * To get the `metadataBytes` and `byteCode`, can compile using Aptos CLI with command
   * `aptos move compile --save-metadata ...`,
   *
   * {@link https://aptos.dev/tutorials/your-first-dapp/#step-4-publish-a-move-module}
   *
   * @param args The arguments for publishing the package.
   * @param args.account The publisher account.
   * @param args.metadataBytes The package metadata bytes.
   * @param args.moduleBytecode An array of the bytecode of each module in the package in compiler output order.
   * @param args.options Optional settings for generating the transaction.
   *
   * @returns A SimpleTransaction that can be simulated or submitted to the chain.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Replace with a real account address
   *   const account = "0x1";
   *   const metadataBytes = "0x..."; // replace with real metadata bytes
   *   const byteCode = "0x..."; // replace with real module bytecode
   *
   *   const transaction = await aptos.publishPackageTransaction({
   *     account,
   *     metadataBytes,
   *     moduleBytecode: [byteCode],
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
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
   * Rotates the authentication key for a given account.  Once an account is rotated, only the new private key
   * or keyless signing scheme can be used to sign transactions for the account.
   *
   * @param args - The arguments for rotating the authentication key.
   * @param args.fromAccount - The account from which the authentication key will be rotated.
   * @param args.toAccount - (Optional) The target account to rotate to. Required if not using toNewPrivateKey or toAuthKey.
   * @param args.toNewPrivateKey - (Optional) The new private key to rotate to. Required if not using toAccount or toAuthKey.
   * @param args.toAuthKey - (Optional) The new authentication key to rotate to. Can only be used with dangerouslySkipVerification=true.
   * @param args.dangerouslySkipVerification - (Optional) If true, skips verification steps after rotation. Required when using toAuthKey.
   *
   * @remarks
   * This function supports three modes of rotation:
   * 1. Using a target Account object (toAccount)
   * 2. Using a new private key (toNewPrivateKey)
   * 3. Using a raw authentication key (toAuthKey) - requires dangerouslySkipVerification=true
   *
   * When not using dangerouslySkipVerification, the function performs additional safety checks and account setup.
   *
   * If the new key is a multi key, skipping verification is dangerous because verification will publish the public key onchain and
   * prevent users from being locked out of the account from loss of knowledge of one of the public keys.
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
   *   // Rotate the authentication key for an account
   *   const response = await aptos.rotateAuthKey({
   *     // replace with a real account
   *     fromAccount: Account.generate(),
   *     // replace with a real private key
   *     toNewPrivateKey: new PrivateKey("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"),
   *   });
   *
   *   console.log(response);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  async rotateAuthKey(
    args: {
      fromAccount: Account;
    } & (
      | { toAccount: Account; dangerouslySkipVerification?: never }
      | { toNewPrivateKey: Ed25519PrivateKey; dangerouslySkipVerification?: never }
      | { toAuthKey: AuthenticationKey; dangerouslySkipVerification: true }
    ),
  ): Promise<PendingTransactionResponse> {
    return rotateAuthKey({ aptosConfig: this.config, ...args });
  }

  /**
   * Sign a transaction that can later be submitted to the chain.
   * This function is essential for ensuring the authenticity of the transaction by using the provided account's signing capabilities.
   *
   * @param args - The arguments for signing the transaction.
   * @param args.signer - The account that will sign the transaction.
   * @param args.transaction - A raw transaction to sign.
   *
   * @returns AccountAuthenticator - The authenticator for the signed transaction.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
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
   *   const signedTransaction = await aptos.transaction.sign({
   *     signer: sender,
   *     transaction,
   *   }); // Sign the transaction
   *
   *   console.log("Signed Transaction:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  // eslint-disable-next-line class-methods-use-this
  sign(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    return signTransaction({
      ...args,
    });
  }

  /**
   * Sign a transaction as a fee payer that can later be submitted to the chain.
   * This function ensures that the transaction is marked with the fee payer's address, allowing it to be processed correctly.
   *
   * @param args - The arguments for signing the transaction.
   * @param args.signer - The fee payer signer account.
   * @param args.transaction - A raw transaction to sign on. This transaction must include a `feePayerAddress` property.
   *
   * @returns AccountAuthenticator - The authenticator for the signed transaction.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   const sender = Account.generate(); // Generate a new account for the fee payer
   *   const transaction = await aptos.transaction.build.simple({
   *     // All transactions on Aptos are implemented via smart contracts.
   *     function: "0x1::aptos_account::transfer",
   *     functionArguments: [sender.accountAddress, 100],
   *     feePayerAddress: sender.accountAddress, // Set the fee payer address
   *   });
   *
   *   const signedTransaction = await aptos.transaction.signAsFeePayer({
   *     signer: sender,
   *     transaction,
   *   });
   *
   *   console.log("Signed transaction as fee payer:", signedTransaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
   */
  // eslint-disable-next-line class-methods-use-this
  signAsFeePayer(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    return signAsFeePayer({
      ...args,
    });
  }

  // TRANSACTION SUBMISSION //

  /**
   * @deprecated Prefer to use `aptos.transaction.batch.forSingleAccount()`
   *
   * Batch transactions for a single account by submitting multiple transaction payloads.
   * This function is useful for efficiently processing and submitting transactions that do not depend on each other, such as
   * batch funding or batch token minting.
   *
   * @param args - The arguments for batching transactions.
   * @param args.sender - The sender account to sign and submit the transactions.
   * @param args.data - An array of transaction payloads to be processed.
   * @param args.options - Optional. Transaction generation configurations (excluding accountSequenceNumber).
   *
   * @throws Error if any worker failure occurs during submission.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   * const sender = Account.generate(); // Generate a new account for sending transactions
   *
   * async function runExample() {
   *   const transactions = [
   *     { }, // Build your first transaction payload
   *     { }, // Build your second transaction payload
   *   ];
   *
   *   // Batch transactions for the single account
   *   await aptos.batchTransactionsForSingleAccount({
   *     sender,
   *     data: transactions,
   *   });
   *
   *   console.log("Batch transactions submitted successfully.");
   * }
   * runExample().catch(console.error);
   * ```
   * @group Transaction
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
   * This function allows you to execute a transaction after signing it with the specified account.
   *
   * @param args The arguments for signing and submitting the transaction.
   * @param args.signer The signer account to sign the transaction.
   * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses.
   *
   * @example
   * ```typescript
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
   *       functionArguments: [ "0x1", 100 ], // replace with a real account address
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
   * ```
   * @return PendingTransactionResponse
   * @group Transaction
   */
  async signAndSubmitTransaction(
    args: FeePayerOrFeePayerAuthenticatorOrNeither & {
      signer: Account;
      transaction: AnyRawTransaction;
    },
  ): Promise<PendingTransactionResponse> {
    return signAndSubmitTransaction({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Sign and submit a single signer transaction as the fee payer to chain given an authenticator by the sender of the transaction.
   *
   * @param args.feePayer The fee payer account to sign the transaction
   * @param args.senderAuthenticator The AccountAuthenticator signed by the sender of the transaction
   * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses
   *
   * @example
   * const transaction = await aptos.transaction.build.simple({sender: alice.accountAddress, feePayer: true ...})
   * const senderAuthenticator = alice.signTransactionWithAuthenticator(transaction)
   * const pendingTransaction = await aptos.signAndSubmitAsFeePayer({
   *  senderAuthenticator,
   *  feePayer: bob,
   *  transaction,
   * })
   *
   * @return PendingTransactionResponse
   * @group Transaction
   */
  async signAndSubmitAsFeePayer(args: {
    feePayer: Account;
    senderAuthenticator: AccountAuthenticator;
    transaction: AnyRawTransaction;
  }): Promise<PendingTransactionResponse> {
    return signAndSubmitAsFeePayer({
      aptosConfig: this.config,
      ...args,
    });
  }
}
