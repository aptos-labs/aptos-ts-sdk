// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/transaction}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { AptosApiError, getAptosFullNode, paginateWithCursor } from "../client";
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

export async

/**
 * Retrieves a list of transactions from the Aptos blockchain.
 * 
 * @param args - The arguments for retrieving transactions.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.options - Optional pagination arguments to limit the number of transactions returned.
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve transactions from the Aptos blockchain
 *   const transactions = await aptos.transaction.getTransactions({
 *     aptosConfig: config,
 *     options: { offset: 0, limit: 10 }, // Specify your own offset and limit if needed
 *   });
 * 
 *   console.log(transactions);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTransactions(args: {
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

export async

/**
 * Retrieves the estimated gas price for transactions on the Aptos network.
 * This function helps users understand the current gas price, which is essential for optimizing transaction costs.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Getting the estimated gas price
 *   const gasPriceEstimation = await aptos.getGasPriceEstimation({ aptosConfig: config });
 *   console.log("Estimated Gas Price:", gasPriceEstimation);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getGasPriceEstimation(args: { aptosConfig: AptosConfig }) {
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

export async

/**
 * Retrieves transaction details by its ledger version.
 * 
 * @param args - The arguments for retrieving the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.ledgerVersion - The version of the ledger for which the transaction details are requested.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch transaction details by ledger version
 *   const transactionDetails = await aptos.transaction.getTransactionByVersion({
 *     aptosConfig: config,
 *     ledgerVersion: 1, // replace with a real ledger version
 *   });
 * 
 *   console.log(transactionDetails);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTransactionByVersion(args: {
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

export async

/**
 * Retrieves the transaction details associated with a specific transaction hash.
 * 
 * @param args - The arguments for retrieving the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.transactionHash - The hash of the transaction to retrieve.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve transaction details by hash
 *   const transactionHash = "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"; // replace with a real transaction hash
 *   const transactionDetails = await aptos.transaction.getTransactionByHash({
 *     aptosConfig: config,
 *     transactionHash,
 *   });
 * 
 *   console.log(transactionDetails);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTransactionByHash(args: {
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

export async

/**
 * Checks if a transaction is pending based on its hash.
 * This function helps determine the status of a transaction in the Aptos network.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.transactionHash - The hash of the transaction to check.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transactionHash = "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"; // replace with a real transaction hash
 * 
 *   // Check if the transaction is pending
 *   const pending = await aptos.transaction.isTransactionPending({
 *     aptosConfig: config,
 *     transactionHash,
 *   });
 * 
 *   console.log(`Is the transaction pending? ${pending}`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function isTransactionPending(args: {
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

export async

/**
 * Waits for a transaction to be confirmed by the Aptos network using its transaction hash.
 * This function helps ensure that a transaction has been processed before proceeding with subsequent operations.
 * 
 * @param args - The arguments for the transaction waiting process.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.transactionHash - The hash of the transaction to wait for, represented as a hexadecimal string.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transactionHash = "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"; // replace with a real transaction hash
 * 
 *   // Wait for the transaction to be confirmed
 *   const transactionResponse = await aptos.longWaitForTransaction({
 *     aptosConfig: config,
 *     transactionHash,
 *   });
 * 
 *   console.log(transactionResponse);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function longWaitForTransaction(args: {
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

export async

/**
 * Waits for a transaction to be confirmed on the blockchain and returns its response.
 * This function is useful for ensuring that a transaction has been processed successfully before proceeding.
 * 
 * @param args - The arguments for waiting on the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.transactionHash - The hash of the transaction to wait for.
 * @param args.options - Optional parameters for waiting behavior.
 * @param args.options.timeoutSecs - The maximum time to wait for the transaction (default is 60 seconds).
 * @param args.options.checkSuccess - Whether to check if the transaction was successful (default is true).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fund an account and get the transaction hash
 *   const { data } = await aptos.faucet.fundAccount({
 *     address: "0x1", // replace with a real account address
 *   });
 * 
 *   const txnHash = data.txn_hashes[0];
 * 
 *   // Wait for the transaction to be confirmed
 *   const transactionResponse = await waitForTransaction({
 *     aptosConfig: config,
 *     transactionHash: txnHash,
 *     options: {
 *       timeoutSecs: 60, // specify your own timeout if needed
 *     },
 *   });
 * 
 *   console.log("Transaction Response:", transactionResponse);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function waitForTransaction(args: {
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
 * Handles API errors by determining if the error is an instance of AptosApiError 
 * and whether it should be retried based on the status code.
 * 
 * @param e - The error object to handle.
 * 
 * @throws Will throw the error if it is unexpected or if it is a request error (4xx).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, AptosApiError } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   try {
 *     // Simulate an API call that may throw an error
 *     await aptos.someAPICall();
 *   } catch (e) {
 *     // Handle the API error
 *     handleAPIError(e);
 *   }
 * }
 * runExample().catch(console.error);
 * ```
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
 * Waits for the indexer to sync up to the ledgerVersion. Timeout is 3 seconds.
 */
export async

/**
 * Waits for the indexer to reach a specified minimum ledger version.
 * This function is useful for ensuring that the indexer is synchronized with the latest ledger version before proceeding with further operations.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.minimumLedgerVersion - The minimum ledger version to wait for.
 * @param args.processorType - Optional. The type of processor to check the last success version for.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, ProcessorType } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Wait for the indexer to reach a minimum ledger version
 *   await waitForIndexer({
 *     aptosConfig: config,
 *     minimumLedgerVersion: BigInt(100), // replace with a real ledger version
 *     processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR, // specify processor type if needed
 *   });
 * 
 *   console.log("Indexer is synchronized with the minimum ledger version.");
 * }
 * runExample().catch(console.error);
 * ```
 */
 function waitForIndexer(args: {
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
 * This error is used by `waitForTransaction` when waiting for a
 * transaction to time out or when the transaction response is undefined
 */
export class WaitForTransactionError extends Error {
  public readonly lastSubmittedTransaction: TransactionResponse | undefined;

  constructor(message: string, lastSubmittedTransaction: TransactionResponse | undefined) {
    super(message);
    this.lastSubmittedTransaction = lastSubmittedTransaction;
  }
}

/**
 * This error is used by `waitForTransaction` if `checkSuccess` is true.
 * See that function for more information.
 */
export class FailedTransactionError extends Error {
  public readonly transaction: TransactionResponse;

  constructor(message: string, transaction: TransactionResponse) {
    super(message);
    this.transaction = transaction;
  }
}

export async

/**
 * Retrieves a block from the Aptos blockchain by its ledger version, optionally including transactions.
 * 
 * @param args - The arguments for retrieving the block.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.ledgerVersion - The version of the ledger for which the block is requested.
 * @param args.options - Optional parameters for the request.
 * @param args.options.withTransactions - Whether to include transactions in the block data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve a block by its ledger version
 *   const block = await aptos.block.getBlockByVersion({
 *     aptosConfig: config,
 *     ledgerVersion: 1, // replace with a real ledger version
 *     options: { withTransactions: true }, // specify if transactions are needed
 *   });
 * 
 *   console.log(block);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getBlockByVersion(args: {
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

export async

/**
 * Retrieves a block from the Aptos blockchain by its height, optionally including transactions.
 * This function is useful for accessing specific block data and its associated transactions.
 * 
 * @param args - The arguments for retrieving the block.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.blockHeight - The height of the block to retrieve.
 * @param args.options - Optional parameters.
 * @param args.options.withTransactions - Whether to include transactions in the block data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve a block by its height, including transactions.
 *   const blockHeight = 10; // replace with a real block height
 *   const block = await aptos.block.getBlockByHeight({
 *     aptosConfig: config,
 *     blockHeight,
 *     options: { withTransactions: true }, // specify if transactions are needed
 *   });
 * 
 *   console.log(block);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getBlockByHeight(args: {
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
 * Fills in the block with transactions if not enough were returned
 * @param args
 */
async

/**
 * Fills in the block with transactions if not enough were returned. This function ensures that the block contains all relevant transactions by fetching any missing ones.
 * 
 * @param args - The arguments for filling the block.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.block - The block to be filled with transactions.
 * @param args.options - Optional parameters for the operation.
 * @param args.options.withTransactions - A flag indicating whether to include transactions in the block.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const block = {
 *     first_version: "0",
 *     last_version: "10",
 *     transactions: [], // Initially empty
 *   };
 * 
 *   // Fill the block with transactions
 *   const filledBlock = await aptos.fillBlockTransactions({
 *     aptosConfig: config,
 *     block: block,
 *     options: { withTransactions: true }, // Specify to include transactions
 *   });
 * 
 *   console.log(filledBlock);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function fillBlockTransactions(args: {
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