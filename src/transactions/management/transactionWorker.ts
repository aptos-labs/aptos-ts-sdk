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

/**
 * Events emitted by the transaction worker during its operation, allowing the dapp to respond to various transaction states.
 */
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

/**
 * Defines the events emitted by the transaction worker during various stages of transaction processing. *
 * @event transactionSent - Emitted when a transaction is successfully sent.
 * @event transactionSendFailed - Emitted when sending a transaction fails.
 * @event transactionExecuted - Emitted when a transaction is successfully executed.
 * @event transactionExecutionFailed - Emitted when executing a transaction fails.
 * @event executionFinish - Emitted when the execution process is finished.
 */
export interface TransactionWorkerEvents {
  transactionSent: (data: SuccessEventData) => void;
  transactionSendFailed: (data: FailureEventData) => void;
  transactionExecuted: (data: SuccessEventData) => void;
  transactionExecutionFailed: (data: FailureEventData) => void;
  executionFinish: (data: ExecutionFinishEventData) => void;
}

/**
 * The payload for when the worker has finished its job.
 */
export type ExecutionFinishEventData = {
  message: string;
};

/**
 * The payload for a success event.
 */
export type SuccessEventData = {
  message: string;
  transactionHash: string;
};

/**
 * The payload for a failure event.
 */
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
  // TODO: Rename Sequnce -> Sequence
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
   * Initializes a new instance of the class, providing a framework for receiving payloads to be processed.
   *
   * @param aptosConfig - A configuration object for Aptos.
   * @param account - The account that will be used for sending transactions.
   * @param maxWaitTime - The maximum wait time to wait before re-syncing the sequence number to the current on-chain state,
   * default is 30 seconds.
   * @param maximumInFlight - The maximum number of transactions that can be submitted per account, default is 100.
   * @param sleepTime - The time to wait in seconds before re-evaluating if the maximum number of transactions are in flight,
   * default is 10 seconds.
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
   * This function continues to submit transactions until there are no more to process.
   *
   * @throws {Error} Throws an error if the transaction submission fails.
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
   * Reads the outstanding transaction queue and submits the transactions to the chain.
   * This function processes each transaction, checking their status and emitting events based on whether they were successfully
   * sent or failed.
   *
   * @throws {Error} Throws an error if the process execution fails.
   * @event TransactionWorkerEventsEnum.TransactionSent - Emitted when a transaction has been successfully committed to the chain.
   * @event TransactionWorkerEventsEnum.TransactionSendFailed - Emitted when a transaction fails to commit, along with the error
   * reason.
   * @event TransactionWorkerEventsEnum.ExecutionFinish - Emitted when the execution of transactions is complete.
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
   * @param sentTransaction - The transaction that was sent to the chain and is now waiting to be executed.
   * @param sequenceNumber - The account's sequence number that was sent with the transaction.
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
   * Pushes a transaction to the transactions queue for processing.
   *
   * @param transactionData - The transaction payload containing necessary details.
   * @param transactionData.abi - For all entry function payloads, the ABI to skip remote ABI lookups.
   * @param options - Optional parameters for transaction configuration.
   * @param options.maxGasAmount - Maximum gas amount for the transaction.
   * @param options.gasUnitPrice - Gas unit price for the transaction.
   * @param options.expireTimestamp - Expiration timestamp on the transaction.
   * @param options.accountSequenceNumber - The sequence number for the transaction.
   */
  async push(
    transactionData: InputGenerateTransactionPayloadData,
    options?: InputGenerateTransactionOptions,
  ): Promise<void> {
    this.transactionsQueue.enqueue([transactionData, options]);
  }

  /**
   * Generates a signed transaction that can be submitted to the chain.
   *
   * @param account - An Aptos account used as the sender of the transaction.
   * @param sequenceNumber - A sequence number the transaction will be generated with.
   * @returns A signed transaction object or undefined if the transaction queue is empty.
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
   * Starts transaction submission and processing by executing tasks from the queue until it is cancelled.
   *
   * @throws {Error} Throws an error if unable to start transaction batching.
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
   *
   * @throws {Error} Throws an error if the worker has already started.
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
   * Stops the transaction management process.
   *
   * @throws {Error} Throws an error if the worker has already stopped.
   */
  stop() {
    if (this.taskQueue.isCancelled()) {
      throw new Error("worker has already stopped");
    }
    this.started = false;
    this.taskQueue.cancel();
  }
}
