// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Account } from "../account/types.js";
import { Serializer } from "../bcs/serializer.js";
import type { AnyNumber, EntryFunctionArgument } from "../bcs/types.js";
import { get } from "../client/get.js";
import { post } from "../client/post.js";
import { MimeType } from "../client/types.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import { AptosApiType } from "../core/constants.js";
import type { TypeTag } from "../core/type-tag.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { type AccountAuthenticator, TransactionAuthenticatorSingleSender } from "../transactions/authenticator.js";
import { ChainId } from "../transactions/chain-id.js";
import { RawTransaction } from "../transactions/raw-transaction.js";
import { SignedTransaction } from "../transactions/signed-transaction.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import { SimpleTransaction } from "../transactions/simple-transaction.js";
import { EntryFunction, TransactionPayloadEntryFunction } from "../transactions/transaction-payload.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { AptosConfig } from "./config.js";
import { getGasPriceEstimation, getLedgerInfo } from "./general.js";
import type {
  CommittedTransactionResponse,
  MoveStructId,
  PendingTransactionResponse,
  TransactionResponse,
} from "./types.js";
import { isPendingTransactionResponse } from "./types.js";

// ── Transaction building ──

/** Options for customizing how a simple transaction is built. */
export interface BuildSimpleTransactionOptions {
  /** The maximum amount of gas units the sender is willing to pay. Defaults to the config's `defaultMaxGasAmount`. */
  maxGasAmount?: AnyNumber;
  /** The gas unit price in Octas. Defaults to the network's estimated gas price. */
  gasUnitPrice?: AnyNumber;
  /** The transaction expiration timestamp in seconds since the Unix epoch. Defaults to `now + config.defaultTxnExpSecFromNow`. */
  expireTimestamp?: AnyNumber;
  /** The sender's account sequence number. If omitted, it is fetched from the network automatically. */
  sequenceNumber?: AnyNumber;
}

/**
 * Builds a simple entry function transaction. Automatically fetches the sender's sequence number,
 * chain ID, and gas estimation from the network if not provided in `options`.
 *
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param sender - The address of the transaction sender.
 * @param payload - The entry function to call.
 * @param payload.function - The fully qualified function name (e.g. `"0x1::aptos_account::transfer"`).
 * @param payload.typeArguments - Optional type arguments for generic functions.
 * @param payload.functionArguments - Optional arguments to pass to the function.
 * @param options - Optional transaction parameters (gas, expiration, sequence number).
 * @returns A {@link SimpleTransaction} ready to be signed and submitted.
 *
 * @example
 * ```typescript
 * const txn = await buildSimpleTransaction(config, senderAddress, {
 *   function: "0x1::aptos_account::transfer",
 *   functionArguments: [recipientAddress, new U64(1_000_000)],
 * });
 * ```
 */
export async function buildSimpleTransaction(
  config: AptosConfig,
  sender: AccountAddressInput,
  payload: {
    function: MoveStructId;
    typeArguments?: TypeTag[];
    functionArguments?: EntryFunctionArgument[];
  },
  options?: BuildSimpleTransactionOptions,
): Promise<SimpleTransaction> {
  const senderAddress = AccountAddress.from(sender);

  // Fetch account info and gas estimation in parallel if not provided
  const [ledgerInfo, gasEstimation, accountData] = await Promise.all([
    options?.expireTimestamp ? null : getLedgerInfo(config),
    options?.gasUnitPrice ? null : getGasPriceEstimation(config),
    options?.sequenceNumber !== undefined ? null : getAccountSequenceNumber(config, senderAddress),
  ]);

  const [moduleAddress, moduleName] = payload.function.split("::") as [string, string, string];
  const functionName = payload.function.split("::")[2];
  const moduleId = `${moduleAddress}::${moduleName}` as `${string}::${string}`;

  const entryFunction = EntryFunction.build(
    moduleId,
    functionName,
    payload.typeArguments ?? [],
    payload.functionArguments ?? [],
  );

  const now = Math.floor(Date.now() / 1000);
  const rawTxn = new RawTransaction(
    senderAddress,
    BigInt(options?.sequenceNumber ?? accountData ?? 0n),
    new TransactionPayloadEntryFunction(entryFunction),
    BigInt(options?.maxGasAmount ?? config.defaultMaxGasAmount),
    BigInt(options?.gasUnitPrice ?? gasEstimation?.gas_estimate ?? 100),
    BigInt(options?.expireTimestamp ?? now + config.defaultTxnExpSecFromNow),
    new ChainId(ledgerInfo?.chain_id ?? 4),
  );

  return new SimpleTransaction(rawTxn);
}

async function getAccountSequenceNumber(config: AptosConfig, address: AccountAddress): Promise<bigint> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<{ sequence_number: string }>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${address}`,
    originMethod: "getAccountSequenceNumber",
    overrides: config.getMergedFullnodeConfig(),
  });
  return BigInt(response.data.sequence_number);
}

// ── Signing ──

/**
 * Signs a transaction using the provided account's private key.
 * @param signer - The account that will sign the transaction.
 * @param transaction - The raw transaction to sign.
 * @returns An authenticator containing the signature.
 */
export function signTransaction(signer: Account, transaction: AnyRawTransaction): AccountAuthenticator {
  return signer.signTransactionWithAuthenticator(transaction);
}

// ── Submission ──

/**
 * Submits a signed transaction to the Aptos fullnode for inclusion in the mempool.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param transaction - The raw transaction that was signed.
 * @param senderAuthenticator - The authenticator produced by signing the transaction.
 * @returns The pending transaction response containing the transaction hash.
 */
export async function submitTransaction(
  config: AptosConfig,
  transaction: AnyRawTransaction,
  senderAuthenticator: AccountAuthenticator,
): Promise<PendingTransactionResponse> {
  const signedTxn = new SignedTransaction(
    transaction.rawTransaction,
    new TransactionAuthenticatorSingleSender(senderAuthenticator),
  );

  const serializer = new Serializer();
  signedTxn.serialize(serializer);

  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await post<PendingTransactionResponse>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: "transactions",
    originMethod: "submitTransaction",
    body: serializer.toUint8Array(),
    contentType: MimeType.BCS_SIGNED_TRANSACTION,
    overrides: config.getMergedFullnodeConfig(),
  });

  return response.data;
}

/**
 * Signs and submits a transaction in a single step. This is a convenience wrapper
 * that calls {@link signTransaction} followed by {@link submitTransaction}.
 *
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param signer - The account that will sign and submit the transaction.
 * @param transaction - The raw transaction to sign and submit.
 * @returns The pending transaction response containing the transaction hash.
 *
 * @example
 * ```typescript
 * const txn = await buildSimpleTransaction(config, sender.accountAddress, {
 *   function: "0x1::aptos_account::transfer",
 *   functionArguments: [recipient, new U64(1_000_000)],
 * });
 * const pending = await signAndSubmitTransaction(config, sender, txn);
 * const committed = await waitForTransaction(config, pending.hash);
 * ```
 */
export async function signAndSubmitTransaction(
  config: AptosConfig,
  signer: Account,
  transaction: AnyRawTransaction,
): Promise<PendingTransactionResponse> {
  const authenticator = signTransaction(signer, transaction);
  return submitTransaction(config, transaction, authenticator);
}

// ── Waiting ──

/**
 * Waits for a transaction to be committed on-chain. First attempts a long-poll endpoint,
 * then falls back to polling with exponential backoff.
 *
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param transactionHash - The hash of the pending transaction to wait for.
 * @param options - Optional parameters.
 * @param options.timeoutSecs - Maximum time to wait in seconds. Defaults to 20.
 * @param options.checkSuccess - If `true` (the default), throws an error if the transaction fails on-chain.
 * @returns The committed transaction response.
 * @throws Error if the transaction times out or fails (when `checkSuccess` is `true`).
 *
 * @example
 * ```typescript
 * const committed = await waitForTransaction(config, pendingTxn.hash, {
 *   timeoutSecs: 30,
 *   checkSuccess: true,
 * });
 * console.log("Transaction version:", committed.version);
 * ```
 */
export async function waitForTransaction(
  config: AptosConfig,
  transactionHash: HexInput,
  options?: { timeoutSecs?: number; checkSuccess?: boolean },
): Promise<CommittedTransactionResponse> {
  const timeoutSecs = options?.timeoutSecs ?? 20;
  const checkSuccess = options?.checkSuccess ?? true;
  const hashStr = typeof transactionHash === "string" ? transactionHash : Hex.fromHexInput(transactionHash).toString();

  const startTime = Date.now();
  let lastError: Error | undefined;

  // Try the long-poll endpoint first
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  try {
    const response = await get<TransactionResponse>({
      url,
      apiType: AptosApiType.FULLNODE,
      path: `transactions/wait_by_hash/${hashStr}`,
      originMethod: "waitForTransaction",
      overrides: config.getMergedFullnodeConfig(),
    });
    if (!isPendingTransactionResponse(response.data)) {
      if (checkSuccess && !("success" in response.data && response.data.success)) {
        throw new Error(`Transaction ${hashStr} failed: ${(response.data as Record<string, unknown>).vm_status}`);
      }
      return response.data as CommittedTransactionResponse;
    }
  } catch (e) {
    lastError = e instanceof Error ? e : new Error(String(e));
  }

  // Fall back to polling
  let delayMs = 200;
  while (Date.now() - startTime < timeoutSecs * 1000) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs * 1.5, 2000);

    try {
      const txn = await getTransactionByHash(config, hashStr);
      if (!isPendingTransactionResponse(txn)) {
        if (checkSuccess && !("success" in txn && txn.success)) {
          throw new Error(`Transaction ${hashStr} failed: ${(txn as Record<string, unknown>).vm_status}`);
        }
        return txn as CommittedTransactionResponse;
      }
    } catch {
      // Transaction may not be found yet, keep waiting
    }
  }

  throw lastError ?? new Error(`Transaction ${hashStr} timed out after ${timeoutSecs}s`);
}

// ── Transaction queries ──

/**
 * Retrieves a transaction by its hash. The returned transaction may be pending or committed.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param transactionHash - The hash of the transaction to look up.
 * @returns The transaction response (pending or committed).
 */
export async function getTransactionByHash(
  config: AptosConfig,
  transactionHash: HexInput,
): Promise<TransactionResponse> {
  const hashStr = typeof transactionHash === "string" ? transactionHash : Hex.fromHexInput(transactionHash).toString();
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<TransactionResponse>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `transactions/by_hash/${hashStr}`,
    originMethod: "getTransactionByHash",
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves a committed transaction by its ledger version number.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param ledgerVersion - The ledger version of the transaction to retrieve.
 * @returns The transaction response at the specified version.
 */
export async function getTransactionByVersion(
  config: AptosConfig,
  ledgerVersion: AnyNumber,
): Promise<TransactionResponse> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<TransactionResponse>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `transactions/by_version/${ledgerVersion}`,
    originMethod: "getTransactionByVersion",
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves a list of transactions from the ledger, ordered by version.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param options - Optional parameters.
 * @param options.offset - The ledger version to start listing from.
 * @param options.limit - Maximum number of transactions to return.
 * @returns An array of transaction responses.
 */
export async function getTransactions(
  config: AptosConfig,
  options?: { offset?: AnyNumber; limit?: number },
): Promise<TransactionResponse[]> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<TransactionResponse[]>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: "transactions",
    originMethod: "getTransactions",
    params: { start: options?.offset, limit: options?.limit },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Generates the BCS-serialized signing message (bytes to sign) for a raw transaction.
 * @param transaction - The raw transaction to generate the signing message for.
 * @returns The signing message as a `Uint8Array`.
 */
export async function getSigningMessage(transaction: AnyRawTransaction): Promise<Uint8Array> {
  return generateSigningMessageForTransaction(transaction);
}
