// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/account}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * account namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { AptosApiError, getAptosFullNode, paginateWithCursor } from "../client";
import { AccountAddress } from "../core/accountAddress";
import { Account } from "../core/account";
import { PrivateKey } from "../core/crypto/asymmetricCrypto";
import { Hex } from "../core/hex";
import { getTableItem, queryIndexer } from "./general";
import {
  AccountData,
  GetAccountCoinsDataResponse,
  GetAccountCollectionsWithOwnedTokenResponse,
  GetAccountOwnedObjectsResponse,
  GetAccountOwnedTokensFromCollectionResponse,
  GetAccountOwnedTokensQueryResponse,
  HexInput,
  LedgerVersion,
  MoveModuleBytecode,
  MoveResource,
  MoveStructType,
  OrderBy,
  PaginationArgs,
  SigningScheme,
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
import { Secp256k1PrivateKey, AuthenticationKey, Ed25519PrivateKey } from "../core";
import { AnyPublicKey } from "../core/crypto/anyPublicKey";

export async function getInfo(args: { aptosConfig: AptosConfig; accountAddress: HexInput }): Promise<AccountData> {
  const { aptosConfig, accountAddress } = args;
  const { data } = await getAptosFullNode<{}, AccountData>({
    aptosConfig,
    originMethod: "getInfo",
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}`,
  });
  return data;
}

export async function getModules(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: PaginationArgs & LedgerVersion;
}): Promise<MoveModuleBytecode[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithCursor<{}, MoveModuleBytecode[]>({
    aptosConfig,
    originMethod: "getModules",
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}/modules`,
    params: {
      ledger_version: options?.ledgerVersion,
      start: options?.offset,
      limit: options?.limit ?? 1000,
    },
  });
}

/**
 * Queries for a move module given account address and module name
 *
 * @param args.accountAddress Hex-encoded 32 byte Aptos account address
 * @param args.moduleName The name of the module
 * @param args.query.ledgerVersion Specifies ledger version of transactions. By default, latest version will be used
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
    return getModuleInner(args);
  }

  return memoizeAsync(
    async () => getModuleInner(args),
    `module-${args.accountAddress}-${args.moduleName}`,
    1000 * 60 * 5, // 5 minutes
  )();
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
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}/module/${moduleName}`,
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
  return paginateWithCursor<{}, TransactionResponse[]>({
    aptosConfig,
    originMethod: "getTransactions",
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}/transactions`,
    params: { start: options?.offset, limit: options?.limit },
  });
}

export async function getResources(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: PaginationArgs & LedgerVersion;
}): Promise<MoveResource[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithCursor<{}, MoveResource[]>({
    aptosConfig,
    originMethod: "getResources",
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}/resources`,
    params: {
      ledger_version: options?.ledgerVersion,
      start: options?.offset,
      limit: options?.limit ?? 999,
    },
  });
}

export async function getResource<T extends {}>(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  resourceType: MoveStructType;
  options?: LedgerVersion;
}): Promise<T> {
  const { aptosConfig, accountAddress, resourceType, options } = args;
  const { data } = await getAptosFullNode<{}, MoveResource>({
    aptosConfig,
    originMethod: "getResource",
    path: `accounts/${AccountAddress.fromHexInput(accountAddress).toString()}/resource/${resourceType}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data.data as T;
}

export async function lookupOriginalAccountAddress(args: {
  aptosConfig: AptosConfig;
  authenticationKey: HexInput;
  options?: LedgerVersion;
}): Promise<AccountAddress> {
  const { aptosConfig, authenticationKey, options } = args;
  type OriginatingAddress = {
    address_map: { handle: string };
  };
  const resource = await getResource<OriginatingAddress>({
    aptosConfig,
    accountAddress: "0x1",
    resourceType: "0x1::account::OriginatingAddress",
    options,
  });

  const {
    address_map: { handle },
  } = resource;

  // If the address is not found in the address map, which means its not rotated
  // then return the address as is
  try {
    const originalAddress = await getTableItem({
      aptosConfig,
      handle,
      data: {
        key: Hex.fromHexInput(authenticationKey).toString(),
        key_type: "address",
        value_type: "address",
      },
      options,
    });

    return AccountAddress.fromHexInput(originalAddress);
  } catch (err) {
    if (err instanceof AptosApiError && err.data.error_code === "table_item_not_found") {
      return AccountAddress.fromHexInput(authenticationKey);
    }

    throw err;
  }
}

export async function getAccountTokensCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.fromHexInput(accountAddress).toString();

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
  if (!data.current_token_ownerships_v2_aggregate.aggregate) {
    throw Error("Failed to get the count of account tokens");
  }
  return data.current_token_ownerships_v2_aggregate.aggregate.count;
}

export async function getAccountOwnedTokens(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    tokenStandard?: TokenStandard;
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedTokensQueryResponse[0]>;
  };
}): Promise<GetAccountOwnedTokensQueryResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput(accountAddress).toString();

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
  accountAddress: HexInput;
  collectionAddress: HexInput;
  options?: {
    tokenStandard?: TokenStandard;
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedTokensFromCollectionResponse[0]>;
  };
}): Promise<GetAccountOwnedTokensFromCollectionResponse> {
  const { aptosConfig, accountAddress, collectionAddress, options } = args;
  const ownerAddress = AccountAddress.fromHexInput(accountAddress).toString();
  const collAddress = Hex.fromHexInput(collectionAddress).toString();

  const whereCondition: any = {
    owner_address: { _eq: ownerAddress },
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
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetAccountCollectionsWithOwnedTokenResponse[0]>;
  };
}): Promise<GetAccountCollectionsWithOwnedTokenResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput(accountAddress).toString();

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
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.fromHexInput(accountAddress).toString();

  const graphqlQuery = {
    query: GetAccountTransactionsCount,
    variables: { address },
  };

  const data = await queryIndexer<GetAccountTransactionsCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountTransactionsCount",
  });

  if (!data.account_transactions_aggregate.aggregate) {
    throw Error("Failed to get the count of account transactions");
  }

  return data.account_transactions_aggregate.aggregate.count;
}

export async function getAccountCoinsData(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetAccountCoinsDataResponse[0]>;
  };
}): Promise<GetAccountCoinsDataResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput(accountAddress).toString();

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
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;
  const address = AccountAddress.fromHexInput(accountAddress).toString();

  const graphqlQuery = {
    query: GetAccountCoinsCount,
    variables: { address },
  };

  const data = await queryIndexer<GetAccountCoinsCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountCoinsCount",
  });

  if (!data.current_fungible_asset_balances_aggregate.aggregate) {
    throw Error("Failed to get the count of account coins");
  }

  return data.current_fungible_asset_balances_aggregate.aggregate.count;
}

export async function getAccountOwnedObjects(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  options?: {
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetAccountOwnedObjectsResponse[0]>;
  };
}): Promise<GetAccountOwnedObjectsResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.fromHexInput(accountAddress).toString();

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

export async function deriveAccountFromPrivateKey(args: {
  aptosConfig: AptosConfig;
  privateKey: PrivateKey;
}): Promise<Account> {
  const { aptosConfig, privateKey } = args;
  const publicKey = new AnyPublicKey(privateKey.publicKey());

  if (privateKey instanceof Secp256k1PrivateKey) {
    // private key is secp256k1, therefore we know it for sure uses a single signer key
    const authKey = AuthenticationKey.fromPublicKeyAndScheme({ publicKey, scheme: SigningScheme.SingleKey });
    const address = new AccountAddress({ data: authKey.toUint8Array() });
    return Account.fromPrivateKeyAndAddress({ privateKey, address });
  }

  if (privateKey instanceof Ed25519PrivateKey) {
    // lookup single sender ed25519
    const SingleSenderTransactionAuthenticatorAuthKey = AuthenticationKey.fromPublicKeyAndScheme({
      publicKey,
      scheme: SigningScheme.SingleKey,
    });
    const isSingleSenderTransactionAuthenticator = await isAccountExist({
      authKey: SingleSenderTransactionAuthenticatorAuthKey,
      aptosConfig,
    });
    if (isSingleSenderTransactionAuthenticator) {
      const address = new AccountAddress({ data: SingleSenderTransactionAuthenticatorAuthKey.toUint8Array() });
      return Account.fromPrivateKeyAndAddress({ privateKey, address });
    }
    // lookup legacy ed25519
    const legacyAuthKey = AuthenticationKey.fromPublicKeyAndScheme({ publicKey, scheme: SigningScheme.Ed25519 });
    const isLegacyEd25519 = await isAccountExist({ authKey: legacyAuthKey, aptosConfig });
    if (isLegacyEd25519) {
      const address = new AccountAddress({ data: legacyAuthKey.toUint8Array() });
      return Account.fromPrivateKeyAndAddress({ privateKey, address, legacy: true });
    }
  }
  // if we are here, it means we couldn't find an address with an
  // auth key that matches the provided private key
  throw new Error(`Can't derive account from private key ${privateKey}`);
}

export async function isAccountExist(args: { aptosConfig: AptosConfig; authKey: AuthenticationKey }): Promise<boolean> {
  const { aptosConfig, authKey } = args;
  const accountAddress = await lookupOriginalAccountAddress({
    aptosConfig,
    authenticationKey: authKey.toString(),
  });

  try {
    await getInfo({
      aptosConfig,
      accountAddress: accountAddress.toString(),
    });
    return true;
  } catch (error: any) {
    // account not found
    if (error.status === 404) {
      return false;
    }
    throw new Error(`Error while looking for an account info ${accountAddress.toString()}`);
  }
}
