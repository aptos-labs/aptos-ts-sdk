/* eslint-disable no-await-in-loop */

import EventEmitter from "eventemitter3";
import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../account";
import { waitForTransaction } from "../../internal/transaction";
import { generateTransaction, signAndSubmitTransaction } from "../../internal/transactionSubmission";
import { PendingTransactionResponse, TransactionResponse } from "../../types";
import { InputGenerateTransactionOptions, InputGenerateTransactionPayloadData } from "../types";
import { AccountSequenceNumber } from "./accountSequenceNumber";
import { AsyncQueue, AsyncQueueCancelledError } from "./asyncQueue";
import { SimpleTransaction } from "../instances/simpleTransaction";

export const promiseFulfilledStatus = "fulfilled";

// Event types the worker fires during execution and
// the dapp can listen to
export enum TransactionWorkerEventsEnum {
  // fired after a transaction gets sent to the chain
  TransactionSent = "transactionSent",
  // fired if there is an error sending the transaction to the chain
  TransactionSendFailed = "transactionSendFailed",
  // fired when a single transaction has executed successfully
  TransactionExecuted = "transactionExecuted",
  // fired if a single transaction fails in execution
  TransactionExecutionFailed = "transactionExecutionFailed",
  // fired when the worker has finished its job / when the queue has been emptied
  ExecutionFinish = "executionFinish",
}

// Typed interface of the worker events
export interface TransactionWorkerEvents {
  transactionSent: (data: SuccessEventData) => void;
  transactionSendFailed: (data: FailureEventData) => void;
  transactionExecuted: (data: SuccessEventData) => void;
  transactionExecutionFailed: (data: FailureEventData) => void;
  executionFinish: (data: ExecutionFinishEventData) => void;
}

// Type for when the worker has finished its job
export type ExecutionFinishEventData = {
  message: string;
};

// Type for a success event
export type SuccessEventData = {
  message: string;
  transactionHash: string;
};

// Type for a failure event
export type FailureEventData = {
  message: string;
  error: string;
};

/**
 * TransactionWorker provides a simple framework for receiving payloads to be processed.
 *
 * Once one `start()` the process and pushes a new transaction, the worker acquires
 * the current account's next sequence number (by using the AccountSequenceNumber class),
 * generates a signed transaction and pushes an async submission process into the `outstandingTransactions` queue.
 * At the same time, the worker processes transactions by reading the `outstandingTransactions` queue
 * and submits the next transaction to chain, it
 * 1) waits for resolution of the submission process or get pre-execution validation error
 * and 2) waits for the resolution of the execution process or get an execution error.
 * The worker fires events for any submission and/or execution success and/or failure.
 */
export class TransactionWorker extends EventEmitter<TransactionWorkerEvents> {
  readonly aptosConfig: AptosConfig;

  readonly account: Account;

  // current account sequence number
  readonly accountSequnceNumber: AccountSequenceNumber;

  readonly taskQueue: AsyncQueue<() => Promise<void>> = new AsyncQueue<() => Promise<void>>();

  // process has started
  started: boolean;

  /**
   * transactions payloads waiting to be generated and signed
   *
   * TODO support entry function payload from ABI builder
   */
  transactionsQueue = new AsyncQueue<
    [InputGenerateTransactionPayloadData, InputGenerateTransactionOptions | undefined]
  >();

  /**
   * signed transactions waiting to be submitted
   */
  outstandingTransactions = new AsyncQueue<[Promise<PendingTransactionResponse>, bigint]>();

  /**
   * transactions that have been submitted to chain
   */
  sentTransactions: Array<[string, bigint, any]> = [];

  /**
   * transactions that have been committed to chain
   */
  executedTransactions: Array<[string, bigint, any]> = [];

  /**
   * Provides a simple framework for receiving payloads to be processed.
   *
   * @param aptosConfig - a config object
   * @param sender - a sender as Account
   * @param maxWaitTime - the max wait time to wait before resyncing the sequence number
   * to the current on-chain state, default to 30
   * @param maximumInFlight - submit up to `maximumInFlight` transactions per account.
   * Mempool limits the number of transactions per account to 100, hence why we default to 100.
   * @param sleepTime - If `maximumInFlight` are in flight, wait `sleepTime` seconds before re-evaluating, default to 10
   */
  constructor(
    aptosConfig: AptosConfig,
    account: Account,
    maxWaitTime: number = 30,
    maximumInFlight: number = 100,
    sleepTime: number = 10,
  ) {
    super();
    this.aptosConfig = aptosConfig;
    this.account = account;
    this.started = false;
    this.accountSequnceNumber = new AccountSequenceNumber(
      aptosConfig,
      account,
      maxWaitTime,
      maximumInFlight,
      sleepTime,
    );
  }

/**
 * Submits the next transaction for the account by generating it with the current sequence number 
 * and adding it to the outstanding transaction queue for processing. 
 * This function will continue to submit transactions until there are no more to process.
 * 
 * @throws {Error} Throws an error if the transaction submission fails.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Submit the next transaction for the account
 *   await aptos.submitNextTransaction();
 *   console.log("Transaction submitted successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async submitNextTransaction() {
    try {
      /* eslint-disable no-constant-condition */
      while (true) {
        const sequenceNumber = await this.accountSequnceNumber.nextSequenceNumber();
        if (sequenceNumber === null) return;
        const transaction = await this.generateNextTransaction(this.account, sequenceNumber);
        if (!transaction) return;
        const pendingTransaction = signAndSubmitTransaction({
          aptosConfig: this.aptosConfig,
          transaction,
          signer: this.account,
        });
        await this.outstandingTransactions.enqueue([pendingTransaction, sequenceNumber]);
      }
    } catch (error: any) {
      if (error instanceof AsyncQueueCancelledError) {
        return;
      }
      throw new Error(`Submit transaction failed for ${this.account.accountAddress.toString()} with error ${error}`);
    }
  }

/**
 * Reads the outstanding transaction queue and submits the transactions to the blockchain. 
 * This function helps ensure that all pending transactions are processed and their statuses are tracked.
 * 
 * @throws {Error} Throws an error if the process execution fails.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Process outstanding transactions
 *   await aptos.processTransactions();
 * 
 *   console.log("Transactions processed successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async processTransactions() {
    try {
      /* eslint-disable no-constant-condition */
      while (true) {
        const awaitingTransactions = [];
        const sequenceNumbers = [];
        let [pendingTransaction, sequenceNumber] = await this.outstandingTransactions.dequeue();

        awaitingTransactions.push(pendingTransaction);
        sequenceNumbers.push(sequenceNumber);

        while (!this.outstandingTransactions.isEmpty()) {
          [pendingTransaction, sequenceNumber] = await this.outstandingTransactions.dequeue();

          awaitingTransactions.push(pendingTransaction);
          sequenceNumbers.push(sequenceNumber);
        }
        // send awaiting transactions to chain
        const sentTransactions = await Promise.allSettled(awaitingTransactions);
        for (let i = 0; i < sentTransactions.length && i < sequenceNumbers.length; i += 1) {
          // check sent transaction status
          const sentTransaction = sentTransactions[i];
          sequenceNumber = sequenceNumbers[i];
          if (sentTransaction.status === promiseFulfilledStatus) {
            // transaction sent to chain
            this.sentTransactions.push([sentTransaction.value.hash, sequenceNumber, null]);
            // check sent transaction execution
            this.emit(TransactionWorkerEventsEnum.TransactionSent, {
              message: `transaction hash ${sentTransaction.value.hash} has been committed to chain`,
              transactionHash: sentTransaction.value.hash,
            });
            await this.checkTransaction(sentTransaction, sequenceNumber);
          } else {
            // send transaction failed
            this.sentTransactions.push([sentTransaction.status, sequenceNumber, sentTransaction.reason]);
            this.emit(TransactionWorkerEventsEnum.TransactionSendFailed, {
              message: `failed to commit transaction ${this.sentTransactions.length} with error ${sentTransaction.reason}`,
              error: sentTransaction.reason,
            });
          }
        }
        this.emit(TransactionWorkerEventsEnum.ExecutionFinish, {
          message: `execute ${sentTransactions.length} transactions finished`,
        });
      }
    } catch (error: any) {
      if (error instanceof AsyncQueueCancelledError) {
        return;
      }
      throw new Error(`Process execution failed for ${this.account.accountAddress.toString()} with error ${error}`);
    }
  }

/**
 * Once a transaction has been sent to the chain, this function checks for its execution status.
 * It helps you determine whether the transaction was executed successfully or if it failed.
 * 
 * @param sentTransaction - The transaction that was sent to the chain and is now waiting to be executed.
 * @param sequenceNumber - The account's sequence number that was sent with the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Generate a new account
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [destination.accountAddress, 100],
 *     },
 *   });
 * 
 *   const sentTransaction = await aptos.transaction.send(transaction);
 * 
 *   // Check the transaction execution status
 *   await aptos.checkTransaction(sentTransaction, sender.sequenceNumber);
 * 
 *   console.log(`Transaction ${sentTransaction.value.hash} checked successfully.`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async checkTransaction(sentTransaction: PromiseFulfilledResult<PendingTransactionResponse>, sequenceNumber: bigint) {
    try {
      const waitFor: Array<Promise<TransactionResponse>> = [];
      waitFor.push(waitForTransaction({ aptosConfig: this.aptosConfig, transactionHash: sentTransaction.value.hash }));
      const sentTransactions = await Promise.allSettled(waitFor);

      for (let i = 0; i < sentTransactions.length; i += 1) {
        const executedTransaction = sentTransactions[i];
        if (executedTransaction.status === promiseFulfilledStatus) {
          // transaction executed to chain
          this.executedTransactions.push([executedTransaction.value.hash, sequenceNumber, null]);
          this.emit(TransactionWorkerEventsEnum.TransactionExecuted, {
            message: `transaction hash ${executedTransaction.value.hash} has been executed on chain`,
            transactionHash: sentTransaction.value.hash,
          });
        } else {
          // transaction execution failed
          this.executedTransactions.push([executedTransaction.status, sequenceNumber, executedTransaction.reason]);
          this.emit(TransactionWorkerEventsEnum.TransactionExecutionFailed, {
            message: `failed to execute transaction ${this.executedTransactions.length} with error ${executedTransaction.reason}`,
            error: executedTransaction.reason,
          });
        }
      }
    } catch (error: any) {
      throw new Error(`Check transaction failed for ${this.account.accountAddress.toString()} with error ${error}`);
    }
  }

/**
 * Push a transaction to the transactions queue for processing.
 * 
 * @param transactionData - The transaction payload to be pushed to the queue.
 * @param transactionData.abi - The ABI for all entry function payloads to skip remote ABI lookups.
 * @param options - Optional parameters for transaction processing.
 * @param options.maxGasAmount - The maximum gas amount for the transaction.
 * @param options.gasUnitPrice - The gas unit price for the transaction.
 * @param options.expireTimestamp - The expiration timestamp for the transaction.
 * @param options.accountSequenceNumber - The sequence number for the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Prepare transaction data
 *   const transactionData = {
 *     abi: { /* ABI details here */ }, // replace with actual ABI details
 *   };
 * 
 *   // Specify options for the transaction
 *   const options = {
 *     maxGasAmount: 10000, // specify your own if needed
 *     gasUnitPrice: 1, // specify your own if needed
 *     expireTimestamp: Date.now() + 60000, // 1 minute from now
 *     accountSequenceNumber: 0, // specify your own if needed
 *   };
 * 
 *   // Push the transaction to the queue
 *   await aptos.push(transactionData, options);
 * 
 *   console.log("Transaction pushed to the queue successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async push(
    transactionData: InputGenerateTransactionPayloadData,
    options?: InputGenerateTransactionOptions,
  ): Promise<void> {
    this.transactionsQueue.enqueue([transactionData, options]);
  }

/**
 * Generates a signed transaction that can be submitted to the chain using the provided account and sequence number.
 * 
 * @param account - An Aptos account used to sign the transaction.
 * @param sequenceNumber - A sequence number that the transaction will be generated with.
 * @returns A signed transaction or undefined if the transaction queue is empty.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const account = Account.generate(); // Generate a new account
 * const sequenceNumber = BigInt(0); // Replace with the actual sequence number for the account
 * 
 * async function runExample() {
 *   // Generate the next transaction for the account
 *   const transaction = await aptos.generateNextTransaction(account, sequenceNumber);
 *   console.log(transaction); // Log the generated transaction
 * }
 * runExample().catch(console.error);
 * ```
 */


  async generateNextTransaction(account: Account, sequenceNumber: bigint): Promise<SimpleTransaction | undefined> {
    if (this.transactionsQueue.isEmpty()) return undefined;
    const [transactionData, options] = await this.transactionsQueue.dequeue();
    return generateTransaction({
      aptosConfig: this.aptosConfig,
      sender: account.accountAddress,
      data: transactionData,
      options: { ...options, accountSequenceNumber: sequenceNumber },
    });
  }

/**
 * Starts transaction submission and processing, allowing for efficient batching of transactions.
 * 
 * @throws {Error} Throws an error if unable to start transaction batching.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Start processing transactions in a loop
 *   await aptos.run();
 * }
 * runExample().catch(console.error);
 * ```
 */


  async run() {
    try {
      while (!this.taskQueue.isCancelled()) {
        const task = await this.taskQueue.dequeue();
        await task();
      }
    } catch (error: any) {
      throw new Error(`Unable to start transaction batching: ${error}`);
    }
  }

  /**
   * Starts the transaction management process.
   */
  start() {
    if (this.started) {
      throw new Error("worker has already started");
    }
    this.started = true;
    this.taskQueue.enqueue(() => this.submitNextTransaction());
    this.taskQueue.enqueue(() => this.processTransactions());
    this.run();
  }

  /**
   * Stops the the transaction management process.
   */
  stop() {
    if (this.taskQueue.isCancelled()) {
      throw new Error("worker has already stopped");
    }
    this.started = false;
    this.taskQueue.cancel();
  }
}