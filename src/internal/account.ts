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
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { Account } from "../account";
import { AnyPublicKey, Ed25519PublicKey, PrivateKey } from "../core/crypto";
import { queryIndexer } from "./general";
import {
  AccountData,
  GetAccountCoinsDataResponse,
  GetAccountCollectionsWithOwnedTokenResponse,
  GetAccountOwnedTokensFromCollectionResponse,
  GetAccountOwnedTokensQueryResponse,
  GetObjectDataQueryResponse,
  LedgerVersionArg,
  MoveModuleBytecode,
  MoveResource,
  MoveStructId,
  OrderByArg,
  PaginationArgs,
  TokenStandardArg,
  TransactionResponse,
  WhereArg,
} from "../types";
import {
  GetAccountCoinsCountQuery,
  GetAccountCoinsDataQuery,
  GetAccountCollectionsWithOwnedTokensQuery,
  GetObjectDataQuery,
  GetAccountOwnedTokensFromCollectionQuery,
  GetAccountOwnedTokensQuery,
  GetAccountTokensCountQuery,
  GetAccountTransactionsCountQuery,
} from "../types/generated/operations";
import {
  GetAccountCoinsCount,
  GetAccountCoinsData,
  GetAccountCollectionsWithOwnedTokens,
  GetObjectData,
  GetAccountOwnedTokens,
  GetAccountOwnedTokensFromCollection,
  GetAccountTokensCount,
  GetAccountTransactionsCount,
} from "../types/generated/queries";
import { memoizeAsync } from "../utils/memoize";
import { Secp256k1PrivateKey, AuthenticationKey, Ed25519PrivateKey, createObjectAddress } from "../core";
import { CurrentFungibleAssetBalancesBoolExp } from "../types/generated/types";
import { getTableItem } from "./table";
import { APTOS_COIN } from "../utils";

export async

/**
 * Retrieves information about a specific account on the Aptos blockchain.
 * 
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account to retrieve information for.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get information about a specific account
 *   const accountInfo = await aptos.getInfo({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *   });
 * 
 *   console.log(accountInfo);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getInfo(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<AccountData> {
  const { aptosConfig, accountAddress } = args;
  const { data } = await getAptosFullNode<{}, AccountData>({
    aptosConfig,
    originMethod: "getInfo",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}`,
  });
  return data;
}

export async

/**
 * Retrieves the modules associated with a specified account address.
 * 
 * @param args - The arguments for retrieving modules.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose modules are to be retrieved.
 * @param args.options - Optional parameters for pagination and ledger version.
 * @param args.options.offset - The starting point for pagination.
 * @param args.options.limit - The maximum number of modules to retrieve (default is 1000).
 * @param args.options.ledgerVersion - The specific ledger version to query.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve modules for a specific account address
 *   const modules = await aptos.account.getModules({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the number of modules to retrieve
 *     },
 *   });
 * 
 *   console.log(modules);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getModules(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & LedgerVersionArg;
}): Promise<MoveModuleBytecode[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithCursor<{}, MoveModuleBytecode[]>({
    aptosConfig,
    originMethod: "getModules",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/modules`,
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
export async

/**
 * Retrieves the specified module from the Aptos blockchain for a given account address.
 * This function can help you access the module's ABI and its exposed functions.
 * 
 * @param args - The parameters for retrieving the module.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account from which to retrieve the module.
 * @param args.moduleName - The name of the module to retrieve.
 * @param args.options - Optional parameters for specifying the ledger version.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the module for the specified account and module name
 *   const module = await aptos.getModule({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     moduleName: "MyModule",
 *   });
 * 
 *   console.log(module);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getModule(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: LedgerVersionArg;
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

async

/**
 * Retrieves the bytecode of a specified module from a given account on the Aptos blockchain.
 * 
 * @param args - The arguments for retrieving the module bytecode.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account containing the module.
 * @param args.moduleName - The name of the module to retrieve.
 * @param args.options - Optional parameters for specifying the ledger version.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the bytecode of a module named "MyModule" from the account "0x1".
 *   const moduleBytecode = await aptos.getModuleInner({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     moduleName: "MyModule",
 *     options: { ledgerVersion: 1 }, // specify your own ledger version if needed
 *   });
 * 
 *   console.log(moduleBytecode);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getModuleInner(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: LedgerVersionArg;
}): Promise<MoveModuleBytecode> {
  const { aptosConfig, accountAddress, moduleName, options } = args;

  const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
    aptosConfig,
    originMethod: "getModule",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/module/${moduleName}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}

export async

/**
 * Retrieves a list of transactions for a specified account address.
 * 
 * @param args - The arguments for fetching transactions.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The account address for which to retrieve transactions.
 * @param args.options - Optional pagination parameters.
 * @param args.options.offset - The starting point for pagination.
 * @param args.options.limit - The maximum number of transactions to retrieve.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch transactions for a specific account address
 *   const transactions = await aptos.getTransactions({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       offset: 0, // starting from the first transaction
 *       limit: 10, // retrieve up to 10 transactions
 *     },
 *   });
 * 
 *   console.log(transactions);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTransactions(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs;
}): Promise<TransactionResponse[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithCursor<{}, TransactionResponse[]>({
    aptosConfig,
    originMethod: "getTransactions",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/transactions`,
    params: { start: options?.offset, limit: options?.limit },
  });
}

export async

/**
 * Retrieves the resources associated with a specific account address.
 * 
 * @param args - The arguments for retrieving resources.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose resources are to be retrieved.
 * @param args.options - Optional pagination parameters and ledger version.
 * @param args.options.limit - The maximum number of resources to return (default is 999).
 * @param args.options.offset - The starting point for pagination.
 * @param args.options.ledgerVersion - The specific ledger version to query.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const resources = await aptos.account.getResources({
 *     aptosConfig: config,
 *     accountAddress,
 *     options: {
 *       limit: 10, // specify the number of resources to retrieve
 *     },
 *   });
 * 
 *   console.log(resources);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getResources(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & LedgerVersionArg;
}): Promise<MoveResource[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithCursor<{}, MoveResource[]>({
    aptosConfig,
    originMethod: "getResources",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/resources`,
    params: {
      ledger_version: options?.ledgerVersion,
      start: options?.offset,
      limit: options?.limit ?? 999,
    },
  });
}

export async function getResource<T extends {}>(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  resourceType: MoveStructId;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, accountAddress, resourceType, options } = args;
  const { data } = await getAptosFullNode<{}, MoveResource>({
    aptosConfig,
    originMethod: "getResource",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/resource/${resourceType}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data.data as T;
}

export async

/**
 * Retrieves the original account address associated with a given authentication key, handling key rotations if necessary.
 * 
 * @param args - The parameters for the lookup.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.authenticationKey - The authentication key for which to find the original account address.
 * @param args.options - Optional parameters for specifying the ledger version.
 * @returns The original account address associated with the provided authentication key.
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Look up the original account address for the given authentication key
 *   const originalAddress = await aptos.lookupOriginalAccountAddress({
 *     aptosConfig: config,
 *     authenticationKey: "0x1", // replace with a real authentication key
 *   });
 * 
 *   console.log("Original Account Address:", originalAddress.toString());
 * }
 * runExample().catch(console.error);
 * ```
 */
 function lookupOriginalAccountAddress(args: {
  aptosConfig: AptosConfig;
  authenticationKey: AccountAddressInput;
  options?: LedgerVersionArg;
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

  const authKeyAddress = AccountAddress.from(authenticationKey);

  // If the address is not found in the address map, which means its not rotated
  // then return the address as is
  try {
    const originalAddress = await getTableItem<string>({
      aptosConfig,
      handle,
      data: {
        key: authKeyAddress.toString(),
        key_type: "address",
        value_type: "address",
      },
      options,
    });

    return AccountAddress.from(originalAddress);
  } catch (err) {
    if (err instanceof AptosApiError && err.data.error_code === "table_item_not_found") {
      return authKeyAddress;
    }

    throw err;
  }
}

export async

/**
 * Retrieves the count of tokens owned by a specified account address.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account for which to retrieve the token count.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the token count for a specific account address
 *   const tokenCount = await aptos.getAccountTokensCount({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *   });
 * 
 *   console.log(`Token Count: ${tokenCount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountTokensCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: { owner_address: { _eq: string }; amount: { _gt: number } } = {
    owner_address: { _eq: address },
    amount: { _gt: 0 },
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

  // commonjs (aka cjs) doesnt handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data.current_token_ownerships_v2_aggregate.aggregate
    ? data.current_token_ownerships_v2_aggregate.aggregate.count
    : 0;
}

export async

/**
 * Retrieves the tokens owned by a specified account address.
 * 
 * @param args - The parameters for retrieving the account's owned tokens.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose tokens are being queried.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - The token standard to filter the results by.
 * @param args.options.offset - The pagination offset for the results.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.orderBy - The ordering of the results.
 * @returns A promise that resolves to an array of tokens owned by the specified account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch tokens owned by the specified account address
 *   const tokens = await aptos.getAccountOwnedTokens({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       tokenStandard: "0x1::aptos_coin::AptosCoin", // specify the token standard if needed
 *       limit: 10, // specify the maximum number of results
 *     },
 *   });
 * 
 *   console.log(tokens);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountOwnedTokens(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountOwnedTokensQueryResponse[0]>;
}): Promise<GetAccountOwnedTokensQueryResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: { owner_address: { _eq: string }; amount: { _gt: number }; token_standard?: { _eq: string } } =
    {
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
      offset: options?.offset,
      limit: options?.limit,
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

export async

/**
 * Retrieves the tokens owned by a specified account from a specific collection address.
 * 
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose tokens are being queried.
 * @param args.collectionAddress - The address of the collection from which to retrieve tokens.
 * @param args.options - Optional parameters for token standard, pagination, and ordering.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch tokens owned by the account from a specific collection
 *   const tokens = await aptos.account.getAccountOwnedTokensFromCollectionAddress({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     collectionAddress: "0x1", // replace with a real collection address
 *     options: {
 *       tokenStandard: "NFT", // specify the token standard if needed
 *       limit: 10, // limit the number of results
 *       offset: 0, // specify the starting point for results
 *     },
 *   });
 * 
 *   console.log(tokens);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountOwnedTokensFromCollectionAddress(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  collectionAddress: AccountAddressInput;
  options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountOwnedTokensFromCollectionResponse[0]>;
}): Promise<GetAccountOwnedTokensFromCollectionResponse> {
  const { aptosConfig, accountAddress, collectionAddress, options } = args;
  const ownerAddress = AccountAddress.from(accountAddress).toStringLong();
  const collAddress = AccountAddress.from(collectionAddress).toStringLong();

  const whereCondition: {
    owner_address: { _eq: string };
    current_token_data: { collection_id: { _eq: string } };
    amount: { _gt: number };
    token_standard?: { _eq: string };
  } = {
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
      offset: options?.offset,
      limit: options?.limit,
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

export async

/**
 * Retrieves the collections owned by a specified account along with the tokens in those collections.
 * 
 * @param args - The arguments for retrieving account collections.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose collections are to be retrieved.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - The token standard to filter collections by.
 * @param args.options.offset - The number of results to skip for pagination.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.orderBy - The order in which to return the results.
 * 
 * @returns A promise that resolves to the collections owned by the specified account with their respective tokens.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve collections owned by the account with address '0x1'
 *   const collections = await aptos.getAccountCollectionsWithOwnedTokens({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       tokenStandard: "0x1::aptos_coin::AptosCoin", // replace with a real token standard if needed
 *       limit: 10,
 *       offset: 0,
 *     },
 *   });
 * 
 *   console.log(collections);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountCollectionsWithOwnedTokens(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountCollectionsWithOwnedTokenResponse[0]>;
}): Promise<GetAccountCollectionsWithOwnedTokenResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: {
    owner_address: { _eq: string };
    current_collection?: { token_standard: { _eq: string } };
  } = {
    owner_address: { _eq: address },
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
      offset: options?.offset,
      limit: options?.limit,
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

export async

/**
 * Retrieves the total number of transactions associated with a specified account.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account for which to retrieve the transaction count.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the transaction count for a specific account
 *   const transactionCount = await aptos.getAccountTransactionsCount({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *   });
 * 
 *   console.log(`Transaction count: ${transactionCount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountTransactionsCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;

  const address = AccountAddress.from(accountAddress).toStringLong();

  const graphqlQuery = {
    query: GetAccountTransactionsCount,
    variables: { address },
  };

  const data = await queryIndexer<GetAccountTransactionsCountQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountTransactionsCount",
  });

  // commonjs (aka cjs) doesnt handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data.account_transactions_aggregate.aggregate ? data.account_transactions_aggregate.aggregate.count : 0;
}

export async

/**
 * Retrieves the amount of a specific coin held by an account.
 * This function is useful for checking the balance of a particular fungible asset for a given account.
 * 
 * @param args - The arguments for retrieving the account coin amount.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose coin amount is being retrieved.
 * @param args.coinType - (Optional) The type of coin to check the amount for.
 * @param args.faMetadataAddress - (Optional) The address of the fungible asset metadata.
 * @returns The amount of the specified coin held by the account, or 0 if none is found.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the amount of APT held by the account at address "0x1"
 *   const amount = await aptos.account.getAccountCoinAmount({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     coinType: "0x1::aptos_coin::AptosCoin" // replace with a real coin type if needed
 *   });
 * 
 *   console.log(`Amount of coin: ${amount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountCoinAmount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  coinType?: MoveStructId;
  faMetadataAddress?: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress, coinType, faMetadataAddress } = args;
  let coinAssetType: string | undefined;
  let faAddress: string;

  if (coinType !== undefined && faMetadataAddress !== undefined) {
    faAddress = AccountAddress.from(faMetadataAddress).toStringLong();
  } else if (coinType !== undefined && faMetadataAddress === undefined) {
    coinAssetType = coinType;
    // TODO Move to a separate function as defined in the AIP for coin migration
    if (args.coinType === APTOS_COIN) {
      faAddress = AccountAddress.A.toStringLong();
    } else {
      faAddress = createObjectAddress(AccountAddress.A, coinType).toStringLong();
    }
  } else if (coinType === undefined && faMetadataAddress !== undefined) {
    // TODO: add a view function lookup for non-APT migrated coins
    const addr = AccountAddress.from(faMetadataAddress);
    faAddress = addr.toStringLong();
    if (addr === AccountAddress.A) {
      coinAssetType = APTOS_COIN;
    }
  } else {
    throw new Error("Either coinType, fungibleAssetAddress, or both must be provided");
  }
  const address = AccountAddress.from(accountAddress).toStringLong();

  // Search by fungible asset address, unless it has a coin it migrated from
  let where: any = { asset_type: { _eq: faAddress } };
  if (coinType !== undefined) {
    where = { asset_type: { _in: [coinAssetType, faAddress] } };
  }

  const data = await getAccountCoinsData({
    aptosConfig,
    accountAddress: address,
    options: {
      where,
    },
  });

  // commonjs (aka cjs) doesnt handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data[0] ? data[0].amount : 0;
}

export async

/**
 * Retrieves the current fungible asset balances for a specified account.
 * 
 * @param args - The arguments for retrieving account coins data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account to query.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.offset - The number of records to skip for pagination.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria to order the results.
 * @param args.options.where - Conditions to filter the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve fungible asset balances for a specific account
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const coinsData = await aptos.account.getAccountCoinsData({
 *     aptosConfig: config,
 *     accountAddress,
 *     options: {
 *       limit: 10, // specify the maximum number of records to return
 *       orderBy: { balance: "desc" }, // order by balance in descending order
 *     },
 *   });
 * 
 *   console.log(coinsData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountCoinsData(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & OrderByArg<GetAccountCoinsDataResponse[0]> & WhereArg<CurrentFungibleAssetBalancesBoolExp>;
}): Promise<GetAccountCoinsDataResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: { owner_address: { _eq: string } } = {
    ...options?.where,
    owner_address: { _eq: address },
  };

  const graphqlQuery = {
    query: GetAccountCoinsData,
    variables: {
      where_condition: whereCondition,
      offset: options?.offset,
      limit: options?.limit,
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

export async

/**
 * Retrieves the count of fungible asset coins held by a specified account.
 * 
 * @param args - The arguments for retrieving the account coins count.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose coin count is to be retrieved.
 * 
 * @throws Error if the count of account coins cannot be retrieved.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the count of fungible asset coins for a specific account
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const coinsCount = await aptos.getAccountCoinsCount({
 *     aptosConfig: config,
 *     accountAddress: accountAddress,
 *   });
 * 
 *   console.log(`Account ${accountAddress} has ${coinsCount} fungible asset coins.`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountCoinsCount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

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

export async

/**
 * Retrieves the objects owned by a specified account.
 * 
 * @param args - The parameters for the function.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose owned objects you want to retrieve.
 * @param args.options - Optional pagination and ordering parameters for the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve objects owned by the specified account address
 *   const ownedObjects = await aptos.account.getAccountOwnedObjects({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify how many results to return
 *       offset: 0, // specify the starting point for results
 *     },
 *   });
 * 
 *   console.log(ownedObjects);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountOwnedObjects(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & OrderByArg<GetObjectDataQueryResponse[0]>;
}): Promise<GetObjectDataQueryResponse> {
  const { aptosConfig, accountAddress, options } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: { owner_address: { _eq: string } } = {
    owner_address: { _eq: address },
  };
  const graphqlQuery = {
    query: GetObjectData,
    variables: {
      where_condition: whereCondition,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };
  const data = await queryIndexer<GetObjectDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountOwnedObjects",
  });

  return data.current_objects;
}

/**
 * NOTE: There is a potential issue once unified single signer scheme will be adopted
 * by the community.
 *
 * Becuase on could create 2 accounts with the same private key with this new authenticator type,
 * we’ll need to determine the order in which we lookup the accounts. First unified
 * scheme and then legacy scheme vs first legacy scheme and then unified scheme.
 *
 */
export async

/**
 * Derives an account from the provided private key and Aptos configuration.
 * This function is essential for obtaining the account details associated with a given private key.
 * 
 * @param args - The arguments for deriving the account.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.privateKey - The private key used to derive the account.
 * 
 * @throws Error if the account cannot be derived from the private key.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PrivateKey } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const privateKey = PrivateKey.fromHex("0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"); // replace with a real private key
 * 
 * async function runExample() {
 *   // Deriving an account from the private key
 *   const account = await Aptos.deriveAccountFromPrivateKey({ aptosConfig: config, privateKey });
 * 
 *   console.log("Derived account:", account);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function deriveAccountFromPrivateKey(args: {
  aptosConfig: AptosConfig;
  privateKey: PrivateKey;
}): Promise<Account> {
  const { aptosConfig, privateKey } = args;
  const publicKey = new AnyPublicKey(privateKey.publicKey());

  if (privateKey instanceof Secp256k1PrivateKey) {
    // private key is secp256k1, therefore we know it for sure uses a single signer key
    const authKey = AuthenticationKey.fromPublicKey({ publicKey });
    const address = authKey.derivedAddress();
    return Account.fromPrivateKey({ privateKey, address });
  }

  if (privateKey instanceof Ed25519PrivateKey) {
    // lookup single sender ed25519
    const singleSenderTransactionAuthenticatorAuthKey = AuthenticationKey.fromPublicKey({
      publicKey,
    });
    const isSingleSenderTransactionAuthenticator = await isAccountExist({
      authKey: singleSenderTransactionAuthenticatorAuthKey,
      aptosConfig,
    });
    if (isSingleSenderTransactionAuthenticator) {
      const address = singleSenderTransactionAuthenticatorAuthKey.derivedAddress();
      return Account.fromPrivateKey({ privateKey, address, legacy: false });
    }
    // lookup legacy ed25519
    const legacyAuthKey = AuthenticationKey.fromPublicKey({
      publicKey: publicKey.publicKey as Ed25519PublicKey,
    });
    const isLegacyEd25519 = await isAccountExist({ authKey: legacyAuthKey, aptosConfig });
    if (isLegacyEd25519) {
      const address = legacyAuthKey.derivedAddress();
      return Account.fromPrivateKey({ privateKey, address, legacy: true });
    }
  }
  // if we are here, it means we couldn't find an address with an
  // auth key that matches the provided private key
  throw new Error(`Can't derive account from private key ${privateKey}`);
}

export async

/**
 * Checks if an account exists by verifying its information on the Aptos blockchain.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.authKey - The authentication key used to derive the account address.
 * @returns A boolean indicating whether the account exists.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, AuthenticationKey } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const authKey = new AuthenticationKey("0x1"); // replace with a real authentication key
 * 
 *   // Check if the account exists
 *   const accountExists = await aptos.isAccountExist({ aptosConfig: config, authKey });
 * 
 *   console.log(`Account exists: ${accountExists}`);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function isAccountExist(args: { aptosConfig: AptosConfig; authKey: AuthenticationKey }): Promise<boolean> {
  const { aptosConfig, authKey } = args;
  const accountAddress = await lookupOriginalAccountAddress({
    aptosConfig,
    authenticationKey: authKey.derivedAddress(),
  });

  try {
    await getInfo({
      aptosConfig,
      accountAddress,
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