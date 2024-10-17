/**
 * A wrapper that handles and manages an account sequence number.
 *
 * Submit up to `maximumInFlight` transactions per account in parallel with a timeout of `sleepTime`
 * If local assumes `maximumInFlight` are in flight, determine the actual committed state from the network
 * If there are less than `maximumInFlight` due to some being committed, adjust the window
 * If `maximumInFlight` are in flight, wait `sleepTime` seconds before re-evaluating
 * If ever waiting more than `maxWaitTime` restart the sequence number to the current on-chain state
 *
 * Assumptions:
 * Accounts are expected to be managed by a single AccountSequenceNumber and not used otherwise.
 * They are initialized to the current on-chain state, so if there are already transactions in
 * flight, they may take some time to reset.
 * Accounts are automatically initialized if not explicitly
 *
 * Notes:
 * This is co-routine safe, that is many async tasks can be reading from this concurrently.
 * The state of an account cannot be used across multiple AccountSequenceNumber services.
 * The synchronize method will create a barrier that prevents additional nextSequenceNumber
 * calls until it is complete.
 * This only manages the distribution of sequence numbers it does not help handle transaction
 * failures.
 * If a transaction fails, you should call synchronize and wait for timeouts.
 * @group Implementation
 * @category Transactions
 */

import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../account";
import { getInfo } from "../../internal/account";
import { nowInSeconds, sleep } from "../../utils/helpers";

/**
 * Represents an account's sequence number management for transaction handling on the Aptos blockchain.
 * This class provides methods to retrieve the next available sequence number, synchronize with the on-chain sequence number,
 * and manage local sequence numbers while ensuring thread safety.
 *
 * @param aptosConfig - The configuration settings for Aptos.
 * @param account - The account associated with the sequence number.
 * @param maxWaitTime - The maximum time to wait for a transaction to commit.
 * @param maximumInFlight - The maximum number of transactions that can be in flight at once.
 * @param sleepTime - The time to wait before retrying to get the sequence number.
 * @group Implementation
 * @category Transactions
 */
export class AccountSequenceNumber {
  readonly aptosConfig: AptosConfig;

  readonly account: Account;

  // sequence number on chain
  // TODO: Change to Uncommitted
  lastUncommintedNumber: bigint | null = null;

  // local sequence number
  currentNumber: bigint | null = null;

  /**
   * We want to guarantee that we preserve ordering of workers to requests.
   *
   * `lock` is used to try to prevent multiple coroutines from accessing a shared resource at the same time,
   * which can result in race conditions and data inconsistency.
   * This code actually doesn't do it though, since we aren't giving out a slot, it is still somewhat a race condition.
   *
   * The ideal solution is likely that each thread grabs the next number from an incremental integer.
   * When they complete, they increment that number and that entity is able to enter the `lock`.
   * That would guarantee ordering.
   * @group Implementation
   * @category Transactions
   */
  lock = false;

  maxWaitTime: number;

  maximumInFlight: number;

  sleepTime: number;

  /**
   * Creates an instance of the class with the specified configuration and account details.
   * This constructor initializes the necessary parameters for managing Aptos transactions.
   *
   * @param aptosConfig - The configuration settings for Aptos.
   * @param account - The account associated with the Aptos transactions.
   * @param maxWaitTime - The maximum time to wait for a transaction to be processed, in milliseconds.
   * @param maximumInFlight - The maximum number of transactions that can be in flight at the same time.
   * @param sleepTime - The time to sleep between transaction checks, in milliseconds.
   * @group Implementation
   * @category Transactions
   */
  constructor(
    aptosConfig: AptosConfig,
    account: Account,
    maxWaitTime: number,
    maximumInFlight: number,
    sleepTime: number,
  ) {
    this.aptosConfig = aptosConfig;
    this.account = account;
    this.maxWaitTime = maxWaitTime;
    this.maximumInFlight = maximumInFlight;
    this.sleepTime = sleepTime;
  }

  /**
   * Returns the next available sequence number for this account.
   * This function ensures that the sequence number is updated and synchronized, handling potential delays in transaction commits.
   *
   * @returns {BigInt} The next available sequence number.
   * @group Implementation
   * @category Transactions
   */
  async nextSequenceNumber(): Promise<bigint | null> {
    /* eslint-disable no-await-in-loop */
    while (this.lock) {
      await sleep(this.sleepTime);
    }

    this.lock = true;
    let nextNumber = BigInt(0);
    try {
      if (this.lastUncommintedNumber === null || this.currentNumber === null) {
        await this.initialize();
      }

      if (this.currentNumber! - this.lastUncommintedNumber! >= this.maximumInFlight) {
        await this.update();

        const startTime = nowInSeconds();
        while (this.currentNumber! - this.lastUncommintedNumber! >= this.maximumInFlight) {
          await sleep(this.sleepTime);
          if (nowInSeconds() - startTime > this.maxWaitTime) {
            /* eslint-disable no-console */
            console.warn(
              `Waited over 30 seconds for a transaction to commit, re-syncing ${this.account.accountAddress.toString()}`,
            );
            await this.initialize();
          } else {
            await this.update();
          }
        }
      }
      nextNumber = this.currentNumber!;
      this.currentNumber! += BigInt(1);
    } catch (e) {
      console.error("error in getting next sequence number for this account", e);
    } finally {
      this.lock = false;
    }
    return nextNumber;
  }

  /**
   * Initializes this account with the sequence number on chain.
   *
   * @returns {Promise<void>} A promise that resolves when the account has been initialized.
   *
   * @throws {Error} Throws an error if the account information cannot be retrieved.
   * @group Implementation
   * @category Transactions
   */
  async initialize(): Promise<void> {
    const { sequence_number: sequenceNumber } = await getInfo({
      aptosConfig: this.aptosConfig,
      accountAddress: this.account.accountAddress,
    });
    this.currentNumber = BigInt(sequenceNumber);
    this.lastUncommintedNumber = BigInt(sequenceNumber);
  }

  /**
   * Updates this account's sequence number with the one on-chain.
   *
   * @returns The on-chain sequence number for this account.
   * @group Implementation
   * @category Transactions
   */
  async update(): Promise<bigint> {
    const { sequence_number: sequenceNumber } = await getInfo({
      aptosConfig: this.aptosConfig,
      accountAddress: this.account.accountAddress,
    });
    this.lastUncommintedNumber = BigInt(sequenceNumber);
    return this.lastUncommintedNumber;
  }

  /**
   * Synchronizes the local sequence number with the sequence number on-chain for the specified account.
   * This function polls the network until all submitted transactions have either been committed or until the maximum wait time has elapsed.
   *
   * @throws {Error} Throws an error if there is an issue synchronizing the account sequence number with the one on-chain.
   * @group Implementation
   * @category Transactions
   */
  async synchronize(): Promise<void> {
    if (this.lastUncommintedNumber === this.currentNumber) return;

    /* eslint-disable no-await-in-loop */
    while (this.lock) {
      await sleep(this.sleepTime);
    }

    this.lock = true;

    try {
      await this.update();
      const startTime = nowInSeconds();
      while (this.lastUncommintedNumber !== this.currentNumber) {
        if (nowInSeconds() - startTime > this.maxWaitTime) {
          /* eslint-disable no-console */
          console.warn(
            `Waited over 30 seconds for a transaction to commit, re-syncing ${this.account.accountAddress.toString()}`,
          );
          await this.initialize();
        } else {
          await sleep(this.sleepTime);
          await this.update();
        }
      }
    } catch (e) {
      console.error("error in synchronizing this account sequence number with the one on chain", e);
    } finally {
      this.lock = false;
    }
  }
}
