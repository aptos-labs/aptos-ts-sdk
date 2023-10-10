/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/transaction}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptos_config";
import { AptosApiError, getAptosFullNode, paginateWithCursor } from "../client";
import { AnyNumber, GasEstimation, HexInput, PaginationArgs, TransactionResponse, TransactionResponseType } from "../types";
import { DEFAULT_TXN_TIMEOUT_SEC } from "../utils/const";
import { sleep } from "../utils/helpers";

export async function getTransactions(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs;
}): Promise<TransactionResponse[]> {
  const { aptosConfig, options } = args;
  const data = await paginateWithCursor<{}, TransactionResponse[]>({
    aptosConfig,
    originMethod: "getTransactions",
    path: "transactions",
    params: { start: options?.start, limit: options?.limit },
  });
  return data;
}

export async function getGasPriceEstimation(args: { aptosConfig: AptosConfig }) {
  const { aptosConfig } = args;
  const { data } = await getAptosFullNode<{}, GasEstimation>({
    aptosConfig,
    originMethod: "getGasPriceEstimation",
    path: "estimate_gas_price",
  });
  return data;
}

export async function getTransactionByVersion(args: {
  aptosConfig: AptosConfig;
  txnVersion: AnyNumber;
}): Promise<TransactionResponse> {
  const { aptosConfig, txnVersion } = args;
  const { data } = await getAptosFullNode<{}, TransactionResponse>({
    aptosConfig,
    originMethod: "getTransactionByVersion",
    path: `transactions/by_version/${txnVersion}`,
  });
  return data;
}

export async function getTransactionByHash(args: {
  aptosConfig: AptosConfig;
  txnHash: HexInput;
}): Promise<TransactionResponse> {
  const { aptosConfig, txnHash } = args;
  const { data } = await getAptosFullNode<{}, TransactionResponse>({
    aptosConfig,
    path: `transactions/by_hash/${txnHash}`,
    originMethod: "getTransactionByHash",
  });
  return data;
}

export async function isTransactionPending(args: { aptosConfig: AptosConfig; txnHash: HexInput }): Promise<boolean> {
  const { aptosConfig, txnHash } = args;
  try {
    const transaction = await getTransactionByHash({ aptosConfig, txnHash });
    return transaction.type === TransactionResponseType.Pending;
  } catch (e: any) {
    if (e?.status === 404) {
      return true;
    }
    throw e;
  }
}

export async function waitForTransaction(args: {
  aptosConfig: AptosConfig;
  txnHash: HexInput;
  extraArgs?: { timeoutSecs?: number; checkSuccess?: boolean };
}): Promise<TransactionResponse> {
  const { aptosConfig, txnHash, extraArgs } = args;
  const timeoutSecs = extraArgs?.timeoutSecs ?? DEFAULT_TXN_TIMEOUT_SEC;
  const checkSuccess = extraArgs?.checkSuccess ?? true;

  let isPending = true;
  let timeElapsed = 0;
  let lastTxn: TransactionResponse | undefined;
  let lastError: AptosApiError | undefined;
  let backoffIntervalMs = 200;
  const backoffMultiplier = 1.5;

  while (isPending) {
    if (timeElapsed >= timeoutSecs) {
      break;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      lastTxn = await getTransactionByHash({ aptosConfig, txnHash });

      isPending = lastTxn.type === TransactionResponseType.Pending;

      if (!isPending) {
        break;
      }
    } catch (e) {
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
    // eslint-disable-next-line no-await-in-loop
    await sleep(backoffIntervalMs);
    timeElapsed += backoffIntervalMs/1000; // Convert to seconds
    backoffIntervalMs *= backoffMultiplier
  }

  // There is a chance that lastTxn is still undefined. Let's throw the last error otherwise a WaitForTransactionError
  if (lastTxn === undefined) {
    if (lastError) {
      throw lastError;
    } else {
      throw new WaitForTransactionError(
        `Fetching transaction ${txnHash} failed and timed out after ${timeoutSecs} seconds`,
        lastTxn,
      );
    }
  }

  if (lastTxn.type === TransactionResponseType.Pending) {
    throw new WaitForTransactionError(
      `Transaction ${txnHash} timed out in pending state after ${timeoutSecs} seconds`,
      lastTxn,
    );
  }
  if (!checkSuccess) {
    return lastTxn;
  }
  if (!lastTxn.success) {
    throw new FailedTransactionError(
      `Transaction ${txnHash} failed with an error: ${(lastTxn as any).vm_status}`,
      lastTxn,
    );
  }
  return lastTxn;
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
