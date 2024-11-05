// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/transaction}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { getAptosFullNode, paginateWithCursor } from "../client";
import { AptosApiError } from "../errors";
import {
  TransactionResponseType,
  type AnyNumber,
  type GasEstimation,
  type HexInput,
  type PaginationArgs,
  type TransactionResponse,
  WaitForTransactionOptions,
  CommittedTransactionResponse,
  Block,
} from "../types";
import { DEFAULT_TXN_TIMEOUT_SEC, ProcessorType } from "../utils/const";
import { sleep } from "../utils/helpers";
import { memoizeAsync } from "../utils/memoize";
import { getIndexerLastSuccessVersion, getProcessorStatus } from "./general";

/**
 * Retrieve a list of transactions based on the specified options.
 *
 * @param {Object} args - The parameters for retrieving transactions.
 * @param {Object} args.aptosConfig - The configuration object for Aptos.
 * @param {Object} args.options - The options for pagination.
 * @param {number} args.options.offset - The number of transactions to skip before starting to collect the result set.
 * @param {number} args.options.limit - The maximum number of transactions to return.
 */
export async function getTransactions(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs;
}): Promise<TransactionResponse[]> {
  const { aptosConfig, options } = args;
  return paginateWithCursor<{}, TransactionResponse[]>({
    aptosConfig,
    originMethod: "getTransactions",
    path: "transactions",
    params: { start: options?.offset, limit: options?.limit },
  });
}

/**
 * Retrieves the estimated gas price for transactions on the Aptos network.
 * This function helps users understand the current gas price, which is essential for transaction planning and cost estimation.
 *
 * @param args - The configuration parameters for the Aptos network.
 * @param args.aptosConfig - The configuration object containing network details.
 */
export async function getGasPriceEstimation(args: { aptosConfig: AptosConfig }) {
  const { aptosConfig } = args;

  return memoizeAsync(
    async () => {
      const { data } = await getAptosFullNode<{}, GasEstimation>({
        aptosConfig,
        originMethod: "getGasPriceEstimation",
        path: "estimate_gas_price",
      });
      return data;
    },
    `gas-price-${aptosConfig.network}`,
    1000 * 60 * 5, // 5 minutes
  )();
}

/**
 * Retrieves the transaction details associated with a specific ledger version.
 *
 * @param args - The arguments for the transaction retrieval.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.ledgerVersion - The ledger version for which to retrieve the transaction.
 * @returns The transaction details for the specified ledger version.
 */
export async function getTransactionByVersion(args: {
  aptosConfig: AptosConfig;
  ledgerVersion: AnyNumber;
}): Promise<TransactionResponse> {
  const { aptosConfig, ledgerVersion } = args;
  const { data } = await getAptosFullNode<{}, TransactionResponse>({
    aptosConfig,
    originMethod: "getTransactionByVersion",
    path: `transactions/by_version/${ledgerVersion}`,
  });
  return data;
}

/**
 * Retrieves transaction details using the specified transaction hash.
 *
 * @param args - The arguments for retrieving the transaction.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.transactionHash - The hash of the transaction to retrieve.
 * @returns A promise that resolves to the transaction details.
 */
export async function getTransactionByHash(args: {
  aptosConfig: AptosConfig;
  transactionHash: HexInput;
}): Promise<TransactionResponse> {
  const { aptosConfig, transactionHash } = args;
  const { data } = await getAptosFullNode<{}, TransactionResponse>({
    aptosConfig,
    path: `transactions/by_hash/${transactionHash}`,
    originMethod: "getTransactionByHash",
  });
  return data;
}

/**
 * Checks if a transaction is currently pending based on its hash.
 * This function helps determine the status of a transaction in the Aptos network.
 *
 * @param args - The arguments for checking the transaction status.
 * @param args.aptosConfig - The configuration settings for connecting to the Aptos network.
 * @param args.transactionHash - The hash of the transaction to check.
 * @returns A boolean indicating whether the transaction is pending.
 * @throws An error if the transaction cannot be retrieved due to reasons other than a 404 status.
 */
export async function isTransactionPending(args: {
  aptosConfig: AptosConfig;
  transactionHash: HexInput;
}): Promise<boolean> {
  const { aptosConfig, transactionHash } = args;
  try {
    const transaction = await getTransactionByHash({ aptosConfig, transactionHash });
    return transaction.type === TransactionResponseType.Pending;
  } catch (e: any) {
    if (e?.status === 404) {
      return true;
    }
    throw e;
  }
}

/**
 * Waits for a transaction to be confirmed by its hash.
 * This function allows you to monitor the status of a transaction until it is finalized.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.transactionHash - The hash of the transaction to wait for.
 */
export async function longWaitForTransaction(args: {
  aptosConfig: AptosConfig;
  transactionHash: HexInput;
}): Promise<TransactionResponse> {
  const { aptosConfig, transactionHash } = args;
  const { data } = await getAptosFullNode<{}, TransactionResponse>({
    aptosConfig,
    path: `transactions/wait_by_hash/${transactionHash}`,
    originMethod: "longWaitForTransaction",
  });
  return data;
}

/**
 * Waits for a transaction to be confirmed on the blockchain and handles potential errors during the process.
 * This function allows you to monitor the status of a transaction until it is either confirmed or fails.
 *
 * @param args - The arguments for waiting for a transaction.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.transactionHash - The hash of the transaction to wait for.
 * @param args.options - Optional settings for waiting, including timeout and success check.
 * @param args.options.timeoutSecs - The maximum time to wait for the transaction in seconds. Defaults to a predefined value.
 * @param args.options.checkSuccess - A flag indicating whether to check the success status of the transaction. Defaults to true.
 * @returns A promise that resolves to the transaction response once the transaction is confirmed.
 * @throws WaitForTransactionError if the transaction times out or remains pending.
 * @throws FailedTransactionError if the transaction fails.
 */
export async function waitForTransaction(args: {
  aptosConfig: AptosConfig;
  transactionHash: HexInput;
  options?: WaitForTransactionOptions;
}): Promise<CommittedTransactionResponse> {
  const { aptosConfig, transactionHash, options } = args;
  const timeoutSecs = options?.timeoutSecs ?? DEFAULT_TXN_TIMEOUT_SEC;
  const checkSuccess = options?.checkSuccess ?? true;

  let isPending = true;
  let timeElapsed = 0;
  let lastTxn: TransactionResponse | undefined;
  let lastError: AptosApiError | undefined;
  let backoffIntervalMs = 200;
  const backoffMultiplier = 1.5;

  /**
   * Handles API errors by throwing the last error or a timeout error for a failed transaction.
   *
   * @param e - The error object that occurred during the API call.
   * @throws {Error} Throws the last error if it exists; otherwise, throws a WaitForTransactionError indicating a timeout.
   */
  function handleAPIError(e: any) {
    // In short, this means we will retry if it was an AptosApiError and the code was 404 or 5xx.
    const isAptosApiError = e instanceof AptosApiError;
    if (!isAptosApiError) {
      throw e; // This would be unexpected
    }
    lastError = e;
    const isRequestError = e.status !== 404 && e.status >= 400 && e.status < 500;
    if (isRequestError) {
      throw e;
    }
  }

  // check to see if the txn is already on the blockchain
  try {
    lastTxn = await getTransactionByHash({ aptosConfig, transactionHash });
    isPending = lastTxn.type === TransactionResponseType.Pending;
  } catch (e) {
    handleAPIError(e);
  }

  // If the transaction is pending, we do a long wait once to avoid polling
  if (isPending) {
    const startTime = Date.now();
    try {
      lastTxn = await longWaitForTransaction({ aptosConfig, transactionHash });
      isPending = lastTxn.type === TransactionResponseType.Pending;
    } catch (e) {
      handleAPIError(e);
    }
    timeElapsed = (Date.now() - startTime) / 1000;
  }

  // Now we do polling to see if the transaction is still pending
  while (isPending) {
    if (timeElapsed >= timeoutSecs) {
      break;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      lastTxn = await getTransactionByHash({ aptosConfig, transactionHash });

      isPending = lastTxn.type === TransactionResponseType.Pending;

      if (!isPending) {
        break;
      }
    } catch (e) {
      handleAPIError(e);
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(backoffIntervalMs);
    timeElapsed += backoffIntervalMs / 1000; // Convert to seconds
    backoffIntervalMs *= backoffMultiplier;
  }

  // There is a chance that lastTxn is still undefined. Let's throw the last error otherwise a WaitForTransactionError
  if (lastTxn === undefined) {
    if (lastError) {
      throw lastError;
    } else {
      throw new WaitForTransactionError(
        `Fetching transaction ${transactionHash} failed and timed out after ${timeoutSecs} seconds`,
        lastTxn,
      );
    }
  }

  if (lastTxn.type === TransactionResponseType.Pending) {
    throw new WaitForTransactionError(
      `Transaction ${transactionHash} timed out in pending state after ${timeoutSecs} seconds`,
      lastTxn,
    );
  }
  if (!checkSuccess) {
    return lastTxn;
  }
  if (!lastTxn.success) {
    throw new FailedTransactionError(
      `Transaction ${transactionHash} failed with an error: ${lastTxn.vm_status}`,
      lastTxn,
    );
  }

  return lastTxn;
}

/**
 * Waits for the indexer to sync up to the specified ledger version. The timeout is 3 seconds.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.minimumLedgerVersion - The minimum ledger version that the indexer should sync to.
 * @param args.processorType - (Optional) The type of processor to check the last success version from.
 */
export async function waitForIndexer(args: {
  aptosConfig: AptosConfig;
  minimumLedgerVersion: AnyNumber;
  processorType?: ProcessorType;
}): Promise<void> {
  const { aptosConfig, processorType } = args;
  const minimumLedgerVersion = BigInt(args.minimumLedgerVersion);
  const timeoutMilliseconds = 3000; // 3 seconds
  const startTime = new Date().getTime();
  let indexerVersion = BigInt(-1);

  while (indexerVersion < minimumLedgerVersion) {
    // check for timeout
    if (new Date().getTime() - startTime > timeoutMilliseconds) {
      throw new Error("waitForLastSuccessIndexerVersionSync timeout");
    }

    if (processorType === undefined) {
      // Get the last success version from all processor
      // eslint-disable-next-line no-await-in-loop
      indexerVersion = await getIndexerLastSuccessVersion({ aptosConfig });
    } else {
      // Get the last success version from the specific processor
      // eslint-disable-next-line no-await-in-loop
      const processor = await getProcessorStatus({ aptosConfig, processorType });
      indexerVersion = processor.last_success_version;
    }

    if (indexerVersion >= minimumLedgerVersion) {
      // break out immediately if we are synced
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
  }
}

/**
 * Represents an error that occurs when waiting for a transaction to complete.
 * This error is thrown by the `waitForTransaction` function when a transaction
 * times out or when the transaction response is undefined.
 *
 * @param message - A descriptive message for the error.
 * @param lastSubmittedTransaction - The last submitted transaction response, if available.
 */
export class WaitForTransactionError extends Error {
  public readonly lastSubmittedTransaction: TransactionResponse | undefined;

  /**
   * Constructs an instance of the class with a specified message and transaction response.
   *
   * @param message - The message associated with the transaction.
   * @param lastSubmittedTransaction - The transaction response object containing details about the transaction.
   */
  constructor(message: string, lastSubmittedTransaction: TransactionResponse | undefined) {
    super(message);
    this.lastSubmittedTransaction = lastSubmittedTransaction;
  }
}

/**
 * Represents an error that occurs when a transaction fails.
 * This error is thrown by the `waitForTransaction` function when the `checkSuccess` parameter is set to true.
 *
 * @param message - A description of the error.
 * @param transaction - The transaction response associated with the failure.
 */
export class FailedTransactionError extends Error {
  public readonly transaction: TransactionResponse;

  constructor(message: string, transaction: TransactionResponse) {
    super(message);
    this.transaction = transaction;
  }
}

/**
 * Retrieves a block from the Aptos blockchain by its ledger version.
 * This function allows you to obtain detailed information about a specific block, including its transactions if requested.
 *
 * @param args - The arguments for retrieving the block.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos node.
 * @param args.ledgerVersion - The ledger version of the block to retrieve.
 * @param args.options - Optional parameters for the request.
 * @param args.options.withTransactions - Indicates whether to include transactions in the block data.
 */
export async function getBlockByVersion(args: {
  aptosConfig: AptosConfig;
  ledgerVersion: AnyNumber;
  options?: { withTransactions?: boolean };
}): Promise<Block> {
  const { aptosConfig, ledgerVersion, options } = args;
  const { data: block } = await getAptosFullNode<{}, Block>({
    aptosConfig,
    originMethod: "getBlockByVersion",
    path: `blocks/by_version/${ledgerVersion}`,
    params: { with_transactions: options?.withTransactions },
  });

  return fillBlockTransactions({ block, ...args });
}

/**
 * Retrieves a block from the Aptos blockchain by its height.
 *
 * @param args - The parameters for retrieving the block.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.blockHeight - The height of the block to retrieve.
 * @param args.options - Optional parameters for the request.
 * @param args.options.withTransactions - Indicates whether to include transactions in the block data.
 * @returns A promise that resolves to the block data, potentially including its transactions.
 */
export async function getBlockByHeight(args: {
  aptosConfig: AptosConfig;
  blockHeight: AnyNumber;
  options?: { withTransactions?: boolean };
}): Promise<Block> {
  const { aptosConfig, blockHeight, options } = args;
  const { data: block } = await getAptosFullNode<{}, Block>({
    aptosConfig,
    originMethod: "getBlockByHeight",
    path: `blocks/by_height/${blockHeight}`,
    params: { with_transactions: options?.withTransactions },
  });
  return fillBlockTransactions({ block, ...args });
}

/**
 * Fills in the block with transactions if not enough were returned. This function ensures that the block contains all relevant
 * transactions by fetching any missing ones based on the specified options.
 * @param args - The arguments for filling the block transactions.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.block - The block object that will be filled with transactions.
 * @param args.options - Optional settings for fetching transactions.
 * @param args.options.withTransactions - Indicates whether to include transactions in the block.
 */
async function fillBlockTransactions(args: {
  aptosConfig: AptosConfig;
  block: Block;
  options?: { withTransactions?: boolean };
}) {
  const { aptosConfig, block, options } = args;
  if (options?.withTransactions) {
    // Transactions should be filled, but this ensures it
    block.transactions = block.transactions ?? [];

    const lastTxn = block.transactions[block.transactions.length - 1];
    const firstVersion = BigInt(block.first_version);
    const lastVersion = BigInt(block.last_version);

    // Convert the transaction to the type
    const curVersion: string | undefined = (lastTxn as any)?.version;
    let latestVersion;

    // This time, if we don't have any transactions, we will try once with the start of the block
    if (curVersion === undefined) {
      latestVersion = firstVersion - 1n;
    } else {
      latestVersion = BigInt(curVersion);
    }

    // If we have all the transactions in the block, we can skip out, otherwise we need to fill the transactions
    if (latestVersion === lastVersion) {
      return block;
    }

    // For now, we will grab all the transactions in groups of 100, but we can make this more efficient by trying larger
    // amounts
    const fetchFutures = [];
    const pageSize = 100n;
    for (let i = latestVersion + 1n; i < lastVersion; i += BigInt(100)) {
      fetchFutures.push(
        getTransactions({
          aptosConfig,
          options: {
            offset: i,
            limit: Math.min(Number(pageSize), Number(lastVersion - i + 1n)),
          },
        }),
      );
    }

    // Combine all the futures
    const responses = await Promise.all(fetchFutures);
    for (const txns of responses) {
      block.transactions.push(...txns);
    }
  }

  return block;
}
