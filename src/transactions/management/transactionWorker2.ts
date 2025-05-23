/* eslint-disable no-await-in-loop */

import { Account } from "../../account";
import { Aptos } from "../../api";
import { AptosConfig } from "../../api/aptosConfig";
import { sleep } from "../../utils";
import { SimpleTransaction } from "../instances";
import { AnyRawTransaction, InputGenerateTransactionOptions, InputGenerateTransactionPayloadData } from "../types";

/**
 * A simple signal implementation that allows for waiting for a notification.
 * This is also known as "condition variable" in low-level languages.
 */
class Signal {
  private promise?: Promise<void>;
  private resolve?: () => void;

  async wait() {
    if (this.promise === undefined) {
      this.promise = new Promise<void>((resolve) => {
        this.resolve = resolve;
      });
    }
    await this.promise;
  }

  notify() {
    if (this.resolve) {
      this.resolve();
      this.promise = undefined;
      this.resolve = undefined;
    }
  }
}

/**
 * Simple deferred interface, for deferred promise resolution or rejection.
 */
interface Deferred<T> {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

interface TransactionWorkerInput {
  data: InputGenerateTransactionPayloadData;
  options?: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">;
  deferred: Deferred<string>;
}

interface PendingResponse {
  hash: string;
  sequenceNumber: bigint;
  expirationTimestamp: number;
  deferred: Deferred<string>;
}

export interface TransactionWorkerOptions {
  account: Account;
  aptosConfig: AptosConfig;
  maxPendingResponses?: number;
  pollInterval?: number;
  defaultOptions?: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">;
}

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
export class TransactionWorker2 {
  readonly account: Account;
  readonly defaultOptions: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">;
  readonly maxPendingResponses: number;
  readonly pollInterval: number;

  protected readonly aptosClient: Aptos;

  /**
   * Whether the worker is running.
   * Will be set to true when the worker is started and set to false when the worker is stopped.
   * Any pending submissions and responses will be processed before the worker's thread joins.
   */
  private isRunning = false;

  /**
   * A signal that will be notified when the worker is stopped.
   * This is necessary to wake up the worker's thread when there's no pending response or submission.
   */
  private readonly stopSignal = new Signal();

  /**
   * The transaction input queue.
   * Inputs will be appended to it when the maximum number of pending responses is reached,
   * for later processing, otherwise they will be processed immediately.
   */
  private inputQueue: TransactionWorkerInput[] = [];

  /**
   * Number of currently pending submissions i.e. submission requests that have been sent,
   * but have not been responded to yet.
   * For context, a submission request is expected to return a pending response that indicates
   * the transaction was accepted into the mempool for later execution.
   */
  private pendingSubmissions = 0;

  /**
   * A set of pending responses returned by submission requests.
   * When the set is not empty, the worker will regularly check for the account'scurrent sequence number
   * to determine if some transactions were executed.
   */
  private pendingResponses = new Set<PendingResponse>();

  /**
   * A signal that will be notified when a new pending response is added to the set.
   * This allows the worker's thread to sleep until there's pending responses to check for execution,
   * and avoid unnecessary polling of the account's current sequence number.
   */
  private readonly newPendingResponseSignal = new Signal();

  /**
   * A pool of sequence numbers that have failed to submit i.e. they either never made into
   * the mempool, or were discarded by the node due to expiration or other reasons.
   * The node will not execute a transaction unless all previous sequence numbers have been committed,
   * so we make sure to fill the gap as soon as possible and resume normal operation.
   */
  private failedSequenceNumbers: bigint[] = [];

  private currSequenceNumberPromise: Promise<bigint> | undefined;

  /**
   * Initializes a new instance of the class, providing a framework for receiving payloads to be processed.
   *
   * @param aptosConfig - A configuration object for Aptos.
   * @param account - The account that will be used for sending transactions.
   * @param transactionData - Additional parameters used for building transactions.
   * @param maximumInFlight - The maximum number of transactions that can be submitted per account, default is 100.
   * @param sleepTime - The time to wait in seconds before re-evaluating if the maximum number of transactions are in flight,
   * default is 10 seconds.
   * @group Implementation
   * @category Transactions
   */
  constructor({
    aptosConfig,
    account,
    defaultOptions = {},
    maxPendingResponses = 100,
    pollInterval = 1000,
  }: TransactionWorkerOptions) {
    this.aptosClient = new Aptos(aptosConfig);
    this.account = account;
    this.defaultOptions = defaultOptions;

    this.maxPendingResponses = maxPendingResponses;
    this.pollInterval = pollInterval;
  }

  //#region Internals

  /**
   * The total number of logical pending responses i.e. "inputs being processed"
   * which includes both pending submissions and pending responses.
   */
  private get totalPendingResponses() {
    return this.pendingResponses.size + this.pendingSubmissions;
  }

  /**
   * Simple utility function for getting the current account's sequence number
   */
  private async getCurrSequenceNumber() {
    const accountInfo = await this.aptosClient.getAccountInfo({
      accountAddress: this.account.accountAddress,
    });
    return BigInt(accountInfo.sequence_number);
  }

  /**
   * Get the next sequence number to be used to build a transaction.
   * The first time this is called, it will return the account's current sequence number.
   * Subsequent calls will return the previously returned value, incremented by 1.
   *
   * In case `failedSequenceNumbers` is not empty because of submission errors,
   * the first element will be popped and reclaimed to fill the sequence number gap and resume
   * normal operation.
   */
  private async getNextSequenceNumber() {
    // Reclaim the first failed sequence number, if any
    if (this.failedSequenceNumbers.length > 0) {
      return this.failedSequenceNumbers.shift()!;
    }

    // Initialize the internal iterator with the account's current sequence number
    if (this.currSequenceNumberPromise === undefined) {
      this.currSequenceNumberPromise = this.getCurrSequenceNumber();
      return this.currSequenceNumberPromise;
    }

    // Increment the internal iterator
    this.currSequenceNumberPromise = this.currSequenceNumberPromise.then((sequenceNumber) => sequenceNumber + 1n);
    return this.currSequenceNumberPromise;
  }

  /**
   * Build a transaction from a given input using the internal Aptos client.
   * This can be overridden by subclasses to provide custom logic.
   */
  protected async buildTransaction(
    data: InputGenerateTransactionPayloadData,
    options: InputGenerateTransactionOptions,
  ): Promise<AnyRawTransaction> {
    return this.aptosClient.transaction.build.simple({
      sender: this.account.accountAddress,
      data,
      options: { ...this.defaultOptions, ...options },
    });
  }

  /**
   * Sign and submit the provided transaction using the internal Aptos client.
   * This can be overridden by subclasses to provide custom logic.
   */
  protected async signAndSubmitTransaction(transaction: AnyRawTransaction): Promise<string> {
    const pendingResponse = await this.aptosClient.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });
    return pendingResponse.hash;
  }

  /**
   * Process a transaction input.
   * This will internally:
   * - assign a sequence number to the transaction
   * - build the transaction from the input and the sequence number
   * - sign and submit the transaction
   * - add the returned hash to the set of pending responses
   * - handle any errors by allowing the sequence number to be reclaimed
   */
  private async processInput(input: TransactionWorkerInput) {
    const { data, options, deferred } = input;
    let sequenceNumber: bigint | undefined;

    this.pendingSubmissions += 1;
    try {
      sequenceNumber = await this.getNextSequenceNumber();

      const transaction = await this.buildTransaction(data, {
        ...this.defaultOptions,
        ...options,
        accountSequenceNumber: sequenceNumber,
      });
      const transactionHash = await this.signAndSubmitTransaction(transaction);

      const expirationTimestamp = Number(transaction.rawTransaction.expiration_timestamp_secs);

      this.pendingResponses.add({
        deferred,
        hash: transactionHash,
        expirationTimestamp,
        sequenceNumber,
      });
      this.pendingSubmissions -= 1;
      this.newPendingResponseSignal.notify();
    } catch (err) {
      // Add sequence number to pool of failed sequence numbers to be reused
      if (sequenceNumber !== undefined) {
        this.failedSequenceNumbers.push(sequenceNumber);
        console.log("Adding sequence number to pool of failed sequence numbers to be reused", sequenceNumber);
      }
      this.pendingSubmissions -= 1;
      deferred.reject(err);
    }
  }

  //#endregion

  //#region API

  /**
   * Starts the transaction management process. You can await the Promise returned by
   * this method if you want to handle any errors that may occur with the worker's
   * internal tasks.
   *
   * @throws {Error} Throws an error if the worker has already started.
   * @group Implementation
   * @category Transactions
   */
  async start() {
    if (this.isRunning) {
      throw new Error("Worker is already running");
    }
    this.isRunning = true;

    // main loop
    while (true) {
      // sleep until there are pending responses or the worker is stopped
      while (this.pendingResponses.size === 0 && (this.isRunning || this.pendingSubmissions > 0)) {
        await Promise.race([this.newPendingResponseSignal.wait(), this.stopSignal.wait()]);
      }

      // possible states:
      // - not stopped, pending responses -> process pending responses
      // - stopped, pending responses -> process pending responses until exit
      // - stopped, no pending responses -> exit

      if (!this.isRunning && this.totalPendingResponses === 0) {
        break;
      }

      const sequenceNumber = await this.getCurrSequenceNumber();

      for (const response of this.pendingResponses) {
        if (sequenceNumber > response.sequenceNumber) {
          response.deferred.resolve(response.hash);
          this.pendingResponses.delete(response);
        } else if (Math.floor(Date.now() / 1000) > response.expirationTimestamp) {
          response.deferred.reject(new Error("transaction expired"));
          this.pendingResponses.delete(response);
          // Add sequence number to pool of failed sequence numbers to be reused
          console.log(
            "Adding sequence number to pool of failed sequence numbers to be reused",
            response.sequenceNumber,
          );
          this.failedSequenceNumbers.push(response.sequenceNumber);
        }
      }

      if (this.isRunning) {
        while (this.inputQueue.length > 0 && this.totalPendingResponses < this.maxPendingResponses) {
          const input = this.inputQueue.shift()!;
          void this.processInput(input);
        }
      }

      await sleep(this.pollInterval);
    }
  }

  /**
   * Signal the worker to stop submitting transactions.
   * All pending submission and responses will be processed before the worker's thread joins.
   */
  stop() {
    if (!this.isRunning) {
      throw new Error("Worker is already stopped");
    }
    this.isRunning = false;
    this.stopSignal.notify();
  }

  /**
   * Push a transaction input for processing.
   * If the number of pending responses is less than `maxPendingResponses`, the
   * input will be processed immediately. Otherwise, it will be added to the input queue
   * and dequeued when a slot becomes available.
   *
   * This function returns a promise that is resolved with the transaction hash once the transaction is committed,
   * or rejected if there is a submission error.
   */
  async push(
    data: InputGenerateTransactionPayloadData,
    options?: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">,
  ) {
    let deferred!: Deferred<string>;
    const promise = new Promise<string>((resolve, reject) => {
      deferred = { resolve, reject };
    });

    const input: TransactionWorkerInput = { data, options, deferred };
    if (this.isRunning && this.totalPendingResponses < this.maxPendingResponses) {
      void this.processInput(input);
    } else {
      this.inputQueue.push(input);
    }

    return promise;
  }

  /**
   * Clear the input queue
   */
  clear() {
    this.inputQueue = [];
  }

  //#endregion
}
