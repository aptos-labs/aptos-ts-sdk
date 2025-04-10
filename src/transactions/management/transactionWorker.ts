/* eslint-disable no-await-in-loop */

import EventEmitter from "eventemitter3";
import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../account";
import { waitForTransaction } from "../../internal/transaction";
import { generateTransaction, signAndSubmitTransaction } from "../../internal/transactionSubmission";
import { TransactionResponse } from "../../types";
import {
  InputGenerateSingleSignerRawTransactionData,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
} from "../types";
import { AccountSequenceNumber } from "./accountSequenceNumber";
import { AsyncQueue, AsyncQueueCancelledError } from "./asyncQueue";
import { SimpleTransaction } from "../instances/simpleTransaction";

/**
 * @group Implementation
 * @category Transactions
 */
export const promiseFulfilledStatus = "fulfilled";

/**
 * Events emitted by the transaction worker during its operation, allowing the dapp to
 * respond to various transaction states.
 *
 * @group Implementation
 * @category Transactions
 */
export enum TransactionWorkerEventsEnum {
  /** Fired after a transaction gets sent to the chain */
  TransactionSent = "transactionSent",
  /** Fired if there is an error sending the transaction to the chain */
  TransactionSendFailed = "transactionSendFailed",
  /** Fired when a single transaction has executed successfully */
  TransactionExecuted = "transactionExecuted",
  /** Fired if a single transaction fails in execution */
  TransactionExecutionFailed = "transactionExecutionFailed",
  /** Fired when the queue is empty. This can fire again if you push more things to the queue. */
  ExecutionFinish = "executionFinish",
}

/**
 * Defines the events emitted by the transaction worker during various stages of
 * transaction processing.
 *
 * @group Implementation
 * @category Transactions
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
 * @group Implementation
 * @category Transactions
 */
export type ExecutionFinishEventData = {
  message: string;
};

/**
 * The payload for a success event.
 * @group Implementation
 * @category Transactions
 */
export type SuccessEventData = {
  message: string;
  transactionHash: string;
};

/**
 * The payload for a failure event.
 * @group Implementation
 * @category Transactions
 */
export type FailureEventData = {
  message: string;
  error: string;
};

/**
 * TransactionWorker provides a simple framework for receiving payloads to be processed.
 *
 * Once you `start()` the worker and push a new transaction, the worker acquires the
 * current account's next sequence number (by using the AccountSequenceNumber class),
 * generates a signed transaction and pushes an async submission process into the
 * `outstandingTransactions` queue. At the same time, the worker processes transactions
 * by reading the `outstandingTransactions` queue and submits the next transaction to
 * chain, it
 * 1) Waits for resolution of the submission process or get pre-execution validation
 *    error and
 * 2) Waits for the resolution of the execution process or get an execution error. The
 *    worker fires events for any submission and/or execution success and/or failure.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const sender = Account.generate();
 *
 * const worker = new TransactionWorker(config, sender);
 *
 * // Register a handler for some TransactionWorkerEvents
 * worker.on(TransactionWorkerEventsEnum.TransactionExecuted, (data) => {
 *   console.log(`Transaction executed successfully: ${data.transactionHash}`);
 * });
 * worker.on(TransactionWorkerEventsEnum.TransactionExecutionFailed, (data) => {
 *   console.log(`Transaction execution failed: ${data.error}`);
 * });
 *
 * // Push a transaction to the worker
 * worker.push({ function: "0x1::aptos_account::transfer", functionArguments: [recipient.accountAddress, 1] });
 *
 * // Start the worker. You can await this Promise if you'd like to handle any errors
 * // that may occur with the worker's internal tasks.
 * worker.start();
 *
 * // Keep pushing transactions as long as you like while the worker runs.
 * worker.push({ function: "0x1::aptos_account::transfer", functionArguments: [recipient.accountAddress, 1] });
 *
 * // Once you're done, you can stop the worker.
 * worker.stop();
 * ```
 *
 * @group Implementation
 * @category Transactions
 */
export class TransactionWorker extends EventEmitter<TransactionWorkerEvents> {
  readonly aptosConfig: AptosConfig;

  readonly account: Account;

  /** These are used to build the transaction payload. */
  readonly transactionData: Partial<InputGenerateSingleSignerRawTransactionData>;

  // current account sequence number
  // TODO: Rename Sequnce -> Sequence
  readonly accountSequenceNumber: AccountSequenceNumber;

  readonly internalTasks: AsyncQueue<() => Promise<void>> = new AsyncQueue<() => Promise<void>>();

  // process has started
  started: boolean;

  /**
   * transactions payloads waiting to be generated and signed
   *
   * TODO support entry function payload from ABI builder
   * @group Implementation
   * @category Transactions
   */
  transactionsQueue = new AsyncQueue<
    [InputGenerateTransactionPayloadData, InputGenerateTransactionOptions | undefined]
  >();

  /**
   * Transaction hashes and sequence numbers waiting to be submitted.
   * @group Implementation
   * @category Transactions
   */
  outstandingTransactions = new AsyncQueue<[Promise<string>, bigint]>();

  /**
   * transactions that have been submitted to chain
   * @group Implementation
   * @category Transactions
   */
  sentTransactions: Array<[string, bigint, any]> = [];

  /**
   * transactions that have been committed to chain
   * @group Implementation
   * @category Transactions
   */
  executedTransactions: Array<[string, bigint, any]> = [];

  /**
   * Initializes a new instance of the class, providing a framework for receiving payloads to be processed.
   *
   * @param aptosConfig - A configuration object for Aptos.
   * @param account - The account that will be used for sending transactions.
   * @param transactionData - Additional parameters used for building transactions.
   * @param maxWaitTime - The maximum wait time to wait before re-syncing the sequence number to the current on-chain state,
   * default is 30 seconds.
   * @param maximumInFlight - The maximum number of transactions that can be submitted per account, default is 100.
   * @param sleepTime - The time to wait in seconds before re-evaluating if the maximum number of transactions are in flight,
   * default is 10 seconds.
   * @group Implementation
   * @category Transactions
   */
  constructor(
    aptosConfig: AptosConfig,
    account: Account,
    transactionData: Partial<InputGenerateSingleSignerRawTransactionData> = {},
    maxWaitTime: number = 30,
    maximumInFlight: number = 100,
    sleepTime: number = 10,
  ) {
    super();
    this.aptosConfig = aptosConfig;
    this.account = account;
    this.transactionData = transactionData;
    this.started = false;
    this.accountSequenceNumber = new AccountSequenceNumber(
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
   * @group Implementation
   * @category Transactions
   */
  async submitNextTransaction() {
    try {
      /* eslint-disable no-constant-condition */
      while (true) {
        const sequenceNumber = await this.accountSequenceNumber.nextSequenceNumber();
        // If the transaction queue is empty, we wait for a new transaction to be pushed.
        const transaction = await this.generateNextTransaction(this.account, sequenceNumber);
        const pendingTransaction = this.buildSignAndSubmitTransactionPromise(transaction);
        this.outstandingTransactions.enqueue([pendingTransaction, sequenceNumber]);
      }
    } catch (error: any) {
      if (error instanceof AsyncQueueCancelledError) {
        return;
      }
      throw new Error(`Submit transaction failed for ${this.account.accountAddress.toString()} with error ${error}`);
    }
  }

  /**
   * Signs and submits a transaction to the chain.
   *
   * @param transaction - The transaction to sign and submit.
   * @returns A promise that resolves to the transaction hash.
   * @group Implementation
   * @category Transactions
   */
  buildSignAndSubmitTransactionPromise(transaction: SimpleTransaction): Promise<string> {
    const pendingTransaction = signAndSubmitTransaction({
      aptosConfig: this.aptosConfig,
      transaction,
      signer: this.account,
    });
    return pendingTransaction.then((tx) => tx.hash);
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
   * @group Implementation
   * @category Transactions
   */
  async processTransactions() {
    try {
      /* eslint-disable no-constant-condition */
      while (true) {
        // Dequeue all outstanding transaction hashes and sequence numbers. If there are
        // no outstanding transactions, it will wait until an item is enqueued.
        const items = await this.outstandingTransactions.dequeueAll();

        // Extract transaction promises and sequence numbers.
        const awaitingTransactions: Promise<string>[] = [];
        const sequenceNumbers: bigint[] = [];
        for (const [pendingTransactionHash, sequenceNumber] of items) {
          awaitingTransactions.push(pendingTransactionHash);
          sequenceNumbers.push(sequenceNumber);
        }

        // send awaiting transactions to chain
        const sentTransactions = await Promise.allSettled(awaitingTransactions);
        for (let i = 0; i < sentTransactions.length && i < sequenceNumbers.length; i += 1) {
          // check sent transaction status
          const sentTransaction = sentTransactions[i];
          const sequenceNumber = sequenceNumbers[i];
          if (sentTransaction.status === promiseFulfilledStatus) {
            // transaction sent to chain
            this.sentTransactions.push([sentTransaction.value, sequenceNumber, null]);
            // check sent transaction execution
            this.emit(TransactionWorkerEventsEnum.TransactionSent, {
              message: `transaction hash ${sentTransaction.value} has been committed to chain`,
              transactionHash: sentTransaction.value,
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
   * @group Implementation
   * @category Transactions
   */
  async checkTransaction(sentTransactionHash: PromiseFulfilledResult<string>, sequenceNumber: bigint) {
    try {
      const waitFor: Array<Promise<TransactionResponse>> = [];
      waitFor.push(waitForTransaction({ aptosConfig: this.aptosConfig, transactionHash: sentTransactionHash.value }));
      const sentTransactions = await Promise.allSettled(waitFor);

      for (let i = 0; i < sentTransactions.length; i += 1) {
        const executedTransaction = sentTransactions[i];
        if (executedTransaction.status === promiseFulfilledStatus) {
          // transaction executed to chain
          this.executedTransactions.push([executedTransaction.value.hash, sequenceNumber, null]);
          this.emit(TransactionWorkerEventsEnum.TransactionExecuted, {
            message: `transaction hash ${executedTransaction.value.hash} has been executed on chain`,
            transactionHash: sentTransactionHash.value,
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
   * @group Implementation
   * @category Transactions
   */
  push(transactionData: InputGenerateTransactionPayloadData, options?: InputGenerateTransactionOptions) {
    this.transactionsQueue.enqueue([transactionData, options]);
  }

  /**
   * Pushes multiple transactions to the transactions queue for processing. See {@link push} for more details.
   */
  pushMany(items: [InputGenerateTransactionPayloadData, InputGenerateTransactionOptions | undefined][]) {
    this.transactionsQueue.enqueueMany(items);
  }

  /**
   * Generates a signed transaction that can be submitted to the chain.
   *
   * @param account - An Aptos account used as the sender of the transaction.
   * @param sequenceNumber - A sequence number the transaction will be generated with.
   * @returns A signed transaction object.
   * @group Implementation
   * @category Transactions
   */
  async generateNextTransaction(account: Account, sequenceNumber: bigint): Promise<SimpleTransaction> {
    const [transactionData, options] = await this.transactionsQueue.dequeue();
    const tx = await generateTransaction({
      aptosConfig: this.aptosConfig,
      sender: account.accountAddress,
      data: transactionData,
      options: { ...options, accountSequenceNumber: sequenceNumber },
      ...this.transactionData,
    });
    return tx;
  }

  /**
   * Starts the transaction management process. You can await the Promise returned by
   * this method if you want to handle any errors that may occur with the worker's
   * internal tasks.
   *
   * @throws {Error} Throws an error if the worker has already started.
   * @group Implementation
   * @category Transactions
   */
  start(): Promise<[void, void]> {
    if (this.started) {
      throw new Error("worker has already started");
    }
    this.started = true;

    return Promise.all([this.submitNextTransaction(), this.processTransactions()]).catch((error) => {
      console.error(`One of the TransactionWorker tasks failed: ${error?.message ?? error}`);
      throw new Error(`One of the TransactionWorker tasks failed: ${error?.message ?? error}`);
    });
  }

  /**
   * Stops the transaction management process.
   *
   * @throws {Error} Throws an error if the worker has already stopped.
   * @group Implementation
   * @category Transactions
   */
  stop() {
    if (this.internalTasks.isCancelled()) {
      throw new Error("worker has already stopped");
    }
    this.started = false;
    this.internalTasks.cancel();
  }

  /**
   * Call this to clear any state for sent / executed transactions.
   */
  clear() {
    this.sentTransactions = [];
    this.executedTransactions = [];
  }
}
