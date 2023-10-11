// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/account}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * account namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptos_config";
import { AptosApiError, getAptosFullNode, paginateWithCursor } from "../client";
import { AccountAddress, Hex } from "../core";
import { getTableItem, queryIndexer } from "./general";
import {
  AccountData,
  GetAccountCoinsCountResponse,
  GetAccountCoinsDataResponse,
  GetAccountCollectionsWithOwnedTokenResponse,
  GetAccountOwnedObjectsResponse,
  GetAccountOwnedTokensFromCollectionResponse,
  GetAccountOwnedTokensQueryResponse,
  GetAccountTokensCountQueryResponse,
  GetAccountTransactionsCountResponse,
  HexInput,
  IndexerPaginationArgs,
  LedgerVersion,
  MoveModuleBytecode,
  MoveResource,
  MoveResourceType,
  OrderBy,
  PaginationArgs,
  TokenStandard,
  TransactionResponse,
} from "../types";
import {
  GetAccountCoinsCountQuery,
  GetAccountCoinsDataQuery,
  GetAccountCollectionsWithOwnedTokensQuery,
  GetAccountOwnedObjectsQuery,
  GetAccountOwnedTokensFromCollectionQuery,
  GetAccountOwnedTokensQuery,
  GetAccountTokensCountQuery,
  GetAccountTransactionsCountQuery,
} from "../types/generated/operations";
import {
  GetAccountCoinsCount,
  GetAccountCoinsData,
  GetAccountCollectionsWithOwnedTokens,
  GetAccountOwnedObjects,
  GetAccountOwnedTokens,
  GetAccountOwnedTokensFromCollection,
  GetAccountTokensCount,
  GetAccountTransactionsCount,
} from "../types/generated/queries";
import { memoizeAsync } from "../utils/memoize";

export async function getInfo(args: { aptosConfig: AptosConfig; accountAddress: HexInput }): Promise<AccountData> {
  const { aptosConfig, accountAddress } = args;
  const { data } = await getAptosFullNode<{}, AccountData>({
    aptosConfig,
    originMethod: "getInfo",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}`,
  });
  return data;
}

export async function getModules(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: PaginationArgs & LedgerVersion;
}): Promise<MoveModuleBytecode[]> {
  const { aptosConfig, accountAddress, options } = args;
  const data = await paginateWithCursor<{}, MoveModuleBytecode[]>({
    aptosConfig,
    originMethod: "getModules",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}/modules`,
    params: {
      ledger_version: options?.ledgerVersion,
      start: options?.start,
      limit: options?.limit ?? 1000,
    },
  });
  return data;
}

/**
 * Queries for a move module given account address and module name
 *
 * @param accountAddress Hex-encoded 32 byte Aptos account address
 * @param moduleName The name of the module
 * @param query.ledgerVersion Specifies ledger version of transactions. By default latest version will be used
 * @returns The move module.
 */
export async function getModule(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  moduleName: string;
  options?: LedgerVersion;
}): Promise<MoveModuleBytecode> {
  // We don't memoize the account module by ledger version, as it's not a common use case, this would be handled
  // by the developer directly
  if (args.options?.ledgerVersion !== undefined) {
    const module = await getModuleInner(args);
    return module;
  }

  const module = await memoizeAsync(
    async () => getModuleInner(args),
    `module-${args.accountAddress}-${args.moduleName}`,
    1000 * 60 * 5, // 5 minutes
  )();
  return module;
}

async function getModuleInner(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  moduleName: string;
  options?: LedgerVersion;
}): Promise<MoveModuleBytecode> {
  const { aptosConfig, accountAddress, moduleName, options } = args;

  const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
    aptosConfig,
    originMethod: "getModule",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}/module/${moduleName}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}

export async function getTransactions(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: PaginationArgs;
}): Promise<TransactionResponse[]> {
  const { aptosConfig, accountAddress, options } = args;
  const data = await paginateWithCursor<{}, TransactionResponse[]>({
    aptosConfig,
    originMethod: "getTransactions",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}/transactions`,
    params: { start: options?.start, limit: options?.limit },
  });
  return data;
}

export async function getResources(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: PaginationArgs & LedgerVersion;
}): Promise<MoveResource[]> {
  const { aptosConfig, accountAddress, options } = args;
  const data = await paginateWithCursor<{}, MoveResource[]>({
    aptosConfig,
    originMethod: "getResources",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}/resources`,
    params: {
      ledger_version: options?.ledgerVersion,
      start: options?.start,
      limit: options?.limit ?? 999,
    },
  });
  return data;
}

export async function getResource(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  resourceType: MoveResourceType;
  options?: LedgerVersion;
}): Promise<MoveResource> {
  const { aptosConfig, accountAddress, resourceType, options } = args;
  const { data } = await getAptosFullNode<{}, MoveResource>({
    aptosConfig,
    originMethod: "getResource",
    path: `accounts/${AccountAddress.fromHexInput({
      input: accountAddress,
    }).toString()}/resource/${resourceType}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}

export async function lookupOriginalAccountAddress(args: {
  aptosConfig: AptosConfig;
  authenticationKey: HexInput;
  options?: LedgerVersion;
}): Promise<AccountAddress> {
  const { aptosConfig, authenticationKey, options } = args;
  const resource = await getResource({
    aptosConfig,
    accountAddress: "0x1",
    resourceType: "0x1::account::OriginatingAddress",
    options,
  });

  const {
    address_map: { handle },
  } = resource.data as any;

  // If the address is not found in the address map, which means its not rotated
  // then return the address as is
  try {
    const originalAddress = await getTableItem({
      aptosConfig,
      handle,
      data: {
        key: Hex.fromHexInput({ hexInput: authenticationKey }).toString(),
        key_type: "address",
        value_type: "address",
      },
      options,
    });

    return AccountAddress.fromHexInput({ input: originalAddress });
  } catch (err) {
    if (err instanceof AptosApiError && err.data.error_code === "table_item_not_found") {
      return AccountAddress.fromHexInput({ input: authenticationKey });
    }

    throw err;
  }
}

export async function getAccountTokensCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
}): Promise<GetAccountTokensCountQueryResponse> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: address },
    amount: { _gt: "0" },
  };

  const graphqlQuery = {
    query: GetAccountTokensCount,
    variables: { where_condition: whereCondition },
  };

  const data = await queryIndexer<GetAccountTokensCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountTokensCount",
  });

  return data.current_token_ownerships_v2_aggregate.aggregate;
}

export async function getAccountOwnedTokens(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    tokenStandard?: TokenStandard;
    pagination?: IndexerPaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedTokensQueryResponse[0]>;
  };
}): Promise<GetAccountOwnedTokensQueryResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: address },
    amount: { _gt: 0 },
  };

  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard };
  }

  const graphqlQuery = {
    query: GetAccountOwnedTokens,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetAccountOwnedTokensQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountOwnedTokens",
  });

  return data.current_token_ownerships_v2;
}

export async function getAccountOwnedTokensFromCollectionAddress(args: {
  aptosConfig: AptosConfig;
  ownerAddress: HexInput;
  collectionAddress: HexInput;
  options?: {
    tokenStandard?: TokenStandard;
    pagination?: IndexerPaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedTokensFromCollectionResponse[0]>;
  };
}): Promise<GetAccountOwnedTokensFromCollectionResponse> {
  const { aptosConfig, ownerAddress, collectionAddress, options } = args;
  const accountAddress = AccountAddress.fromHexInput({
    input: ownerAddress,
  }).toString();
  const collAddress = Hex.fromHexInput({
    hexInput: collectionAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: accountAddress },
    current_token_data: { collection_id: { _eq: collAddress } },
    amount: { _gt: 0 },
  };

  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard };
  }

  const graphqlQuery = {
    query: GetAccountOwnedTokensFromCollection,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetAccountOwnedTokensFromCollectionQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountOwnedTokensFromCollectionAddress",
  });

  return data.current_token_ownerships_v2;
}

export async function getAccountCollectionsWithOwnedTokens(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    tokenStandard?: TokenStandard;
    pagination?: IndexerPaginationArgs;
    orderBy?: OrderBy<GetAccountCollectionsWithOwnedTokenResponse[0]>;
  };
}): Promise<GetAccountCollectionsWithOwnedTokenResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: address },
    amount: { _gt: 0 },
  };

  if (options?.tokenStandard) {
    whereCondition.current_collection = {
      token_standard: { _eq: options?.tokenStandard },
    };
  }

  const graphqlQuery = {
    query: GetAccountCollectionsWithOwnedTokens,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetAccountCollectionsWithOwnedTokensQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountCollectionsWithOwnedTokens",
  });

  return data.current_collection_ownership_v2_view;
}

export async function getAccountTransactionsCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
}): Promise<GetAccountTransactionsCountResponse> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const graphqlQuery = {
    query: GetAccountTransactionsCount,
    variables: { address },
  };

  const data = await queryIndexer<GetAccountTransactionsCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountTransactionsCount",
  });

  return data.account_transactions_aggregate.aggregate;
}

export async function getAccountCoinsData(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    pagination?: IndexerPaginationArgs;
    orderBy?: OrderBy<GetAccountCoinsDataResponse[0]>;
  };
}): Promise<GetAccountCoinsDataResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: address },
  };

  const graphqlQuery = {
    query: GetAccountCoinsData,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetAccountCoinsDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountCoinsData",
  });

  return data.current_fungible_asset_balances;
}

export async function getAccountCoinsCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
}): Promise<GetAccountCoinsCountResponse> {
  const { aptosConfig, accountAddress } = args;
  const address = AccountAddress.fromHexInput({
    input: accountAddress,
  }).toString();

  const graphqlQuery = {
    query: GetAccountCoinsCount,
    variables: { address },
  };

  const data = await queryIndexer<GetAccountCoinsCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountCoinsCount",
  });

  return data.current_fungible_asset_balances_aggregate.aggregate;
}

export async function getAccountOwnedObjects(args: {
  aptosConfig: AptosConfig;
  ownerAddress: HexInput;
  options?: {
    pagination?: IndexerPaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedObjectsResponse[0]>;
  };
}): Promise<GetAccountOwnedObjectsResponse> {
  const { aptosConfig, ownerAddress, options } = args;
  const address = AccountAddress.fromHexInput({
    input: ownerAddress,
  }).toString();

  const whereCondition: any = {
    owner_address: { _eq: address },
  };
  const graphqlQuery = {
    query: GetAccountOwnedObjects,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };
  const data = await queryIndexer<GetAccountOwnedObjectsQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountOwnedObjects",
  });

  return data.current_objects;
}
