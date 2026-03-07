// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber, EntryFunctionArgument } from "../bcs/types.js";
import { Serializer } from "../bcs/serializer.js";
import { AptosApiType } from "../core/constants.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import type { TypeTag } from "../core/type-tag.js";
import { get } from "../client/get.js";
import { post } from "../client/post.js";
import { MimeType } from "../client/types.js";
import { RawTransaction } from "../transactions/raw-transaction.js";
import { SimpleTransaction } from "../transactions/simple-transaction.js";
import { SignedTransaction } from "../transactions/signed-transaction.js";
import { EntryFunction, TransactionPayloadEntryFunction } from "../transactions/transaction-payload.js";
import { ChainId } from "../transactions/chain-id.js";
import {
  TransactionAuthenticatorEd25519,
  TransactionAuthenticatorSingleSender,
  type AccountAuthenticator,
} from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Account } from "../account/types.js";
import type { AptosConfig } from "./config.js";
import { getLedgerInfo, getGasPriceEstimation } from "./general.js";
import type {
  CommittedTransactionResponse,
  GasEstimation,
  MoveStructId,
  PendingTransactionResponse,
  TransactionResponse,
} from "./types.js";
import { isPendingTransactionResponse } from "./types.js";

// ── Transaction building ──

export interface BuildSimpleTransactionOptions {
  maxGasAmount?: AnyNumber;
  gasUnitPrice?: AnyNumber;
  expireTimestamp?: AnyNumber;
  sequenceNumber?: AnyNumber;
}

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

export function signTransaction(signer: Account, transaction: AnyRawTransaction): AccountAuthenticator {
  return signer.signTransactionWithAuthenticator(transaction);
}

// ── Submission ──

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

export async function signAndSubmitTransaction(
  config: AptosConfig,
  signer: Account,
  transaction: AnyRawTransaction,
): Promise<PendingTransactionResponse> {
  const authenticator = signTransaction(signer, transaction);
  return submitTransaction(config, transaction, authenticator);
}

// ── Waiting ──

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
        throw new Error(`Transaction ${hashStr} failed: ${(response.data as any).vm_status}`);
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
          throw new Error(`Transaction ${hashStr} failed: ${(txn as any).vm_status}`);
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

export async function getSigningMessage(transaction: AnyRawTransaction): Promise<Uint8Array> {
  return generateSigningMessageForTransaction(transaction);
}
