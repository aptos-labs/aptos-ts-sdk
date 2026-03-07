// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { AptosApiType } from "../core/constants.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import { get, paginateWithCursor, paginateWithObfuscatedCursor } from "../client/get.js";
import type { AptosConfig } from "./config.js";
import type {
  AccountData,
  MoveModuleBytecode,
  MoveResource,
  MoveStructId,
  CommittedTransactionResponse,
} from "./types.js";

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
