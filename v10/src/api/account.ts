// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { get, paginateWithCursor, paginateWithObfuscatedCursor } from "../client/get.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import type {
  AccountData,
  CommittedTransactionResponse,
  MoveModuleBytecode,
  MoveResource,
  MoveStructId,
} from "./types.js";

/**
 * Retrieves core account information including the sequence number and authentication key.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account to query.
 * @returns The account data containing sequence number and authentication key.
 */
export async function getAccountInfo(config: AptosConfig, accountAddress: AccountAddressInput): Promise<AccountData> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<AccountData>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}`,
    originMethod: "getAccountInfo",
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves all Move modules published under the specified account. Results are paginated automatically.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account whose modules to retrieve.
 * @param options - Optional parameters.
 * @param options.limit - Maximum number of modules per page. Defaults to 1000.
 * @param options.ledgerVersion - The ledger version to query at. Defaults to the latest version.
 * @returns An array of all Move modules published under the account.
 */
export async function getAccountModules(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  options?: { limit?: number; ledgerVersion?: AnyNumber },
): Promise<MoveModuleBytecode[]> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  return paginateWithObfuscatedCursor<MoveModuleBytecode[]>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}/modules`,
    originMethod: "getAccountModules",
    params: { limit: options?.limit ?? 1000, ledger_version: options?.ledgerVersion },
    overrides: config.getMergedFullnodeConfig(),
  });
}

/**
 * Retrieves a single Move module by name from the specified account.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account that published the module.
 * @param moduleName - The name of the module to retrieve.
 * @param options - Optional parameters.
 * @param options.ledgerVersion - The ledger version to query at. Defaults to the latest version.
 * @returns The Move module bytecode and ABI.
 */
export async function getAccountModule(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  moduleName: string,
  options?: { ledgerVersion?: AnyNumber },
): Promise<MoveModuleBytecode> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<MoveModuleBytecode>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}/module/${moduleName}`,
    originMethod: "getAccountModule",
    params: { ledger_version: options?.ledgerVersion },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves a specific Move resource by type from the specified account.
 * @typeParam T - The expected shape of the resource data.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account holding the resource.
 * @param resourceType - The fully qualified Move struct type of the resource (e.g. `"0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"`).
 * @param options - Optional parameters.
 * @param options.ledgerVersion - The ledger version to query at. Defaults to the latest version.
 * @returns The deserialized resource data.
 */
export async function getAccountResource<T = unknown>(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  resourceType: MoveStructId,
  options?: { ledgerVersion?: AnyNumber },
): Promise<T> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<MoveResource<T>>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}/resource/${resourceType}`,
    originMethod: "getAccountResource",
    params: { ledger_version: options?.ledgerVersion },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data.data;
}

/**
 * Retrieves all Move resources stored under the specified account. Results are paginated automatically.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account whose resources to retrieve.
 * @param options - Optional parameters.
 * @param options.limit - Maximum number of resources per page. Defaults to 999.
 * @param options.ledgerVersion - The ledger version to query at. Defaults to the latest version.
 * @returns An array of all Move resources stored under the account.
 */
export async function getAccountResources(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  options?: { limit?: number; ledgerVersion?: AnyNumber },
): Promise<MoveResource[]> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  return paginateWithObfuscatedCursor<MoveResource[]>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}/resources`,
    originMethod: "getAccountResources",
    params: { limit: options?.limit ?? 999, ledger_version: options?.ledgerVersion },
    overrides: config.getMergedFullnodeConfig(),
  });
}

/**
 * Retrieves transactions sent by the specified account. Results are paginated automatically.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account whose transactions to retrieve.
 * @param options - Optional parameters.
 * @param options.offset - The sequence number to start listing transactions from.
 * @param options.limit - Maximum number of transactions to return per page.
 * @returns An array of committed transactions sent by the account.
 */
export async function getAccountTransactions(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  options?: { offset?: AnyNumber; limit?: number },
): Promise<CommittedTransactionResponse[]> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  return paginateWithCursor<CommittedTransactionResponse[]>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `accounts/${AccountAddress.from(accountAddress)}/transactions`,
    originMethod: "getAccountTransactions",
    params: { start: options?.offset, limit: options?.limit },
    overrides: config.getMergedFullnodeConfig(),
  });
}
