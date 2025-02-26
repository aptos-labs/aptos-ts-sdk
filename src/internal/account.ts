// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/account}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * account namespace and without having a dependency cycle error.
 * @group Implementation
 */
import { AptosConfig } from "../api/aptosConfig";
import { getAptosFullNode, paginateWithCursor, paginateWithObfuscatedCursor } from "../client";
import {
  AccountData,
  AnyPublicKeyVariant,
  GetAccountCoinsDataResponse,
  GetAccountCollectionsWithOwnedTokenResponse,
  GetAccountOwnedTokensFromCollectionResponse,
  GetAccountOwnedTokensQueryResponse,
  GetMultiKeyForAuthKeyResponse,
  GetObjectDataQueryResponse,
  isEd25519Signature,
  isMultiEd25519Signature,
  isSingleSenderSignature,
  isUserTransactionResponse,
  LedgerVersionArg,
  MoveModuleBytecode,
  MoveResource,
  MoveStructId,
  OrderByArg,
  PaginationArgs,
  PendingTransactionResponse,
  TokenStandardArg,
  TransactionResponse,
  WhereArg,
} from "../types";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { Account, Ed25519Account, MultiEd25519Account } from "../account";
import {
  AbstractMultiKey,
  AccountPublicKey,
  AnyPublicKey,
  Ed25519PublicKey,
  FederatedKeylessPublicKey,
  KeylessPublicKey,
  MultiEd25519PublicKey,
  MultiKey,
  PrivateKey,
  PublicKey,
  Secp256k1PublicKey,
} from "../core/crypto";
import { queryIndexer } from "./general";
import { getModules as getModulesUtil, getModule as getModuleUtil, getInfo as getInfoUtil } from "./utils";
import {
  GetAccountCoinsCountQuery,
  GetAccountCoinsDataQuery,
  GetAccountCollectionsWithOwnedTokensQuery,
  GetObjectDataQuery,
  GetAccountOwnedTokensFromCollectionQuery,
  GetAccountOwnedTokensQuery,
  GetAccountTokensCountQuery,
  GetAccountTransactionsCountQuery,
  GetMultiKeyForAuthKeyQuery,
  GetAuthKeysForPublicKeyQuery,
  GetAccountAddressesForAuthKeyQuery,
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
  GetMultiKeyForAuthKey,
  GetAuthKeysForPublicKey,
  GetAccountAddressesForAuthKey,
} from "../types/generated/queries";
import { Secp256k1PrivateKey, AuthenticationKey, Ed25519PrivateKey, createObjectAddress, Hex } from "../core";
import { CurrentFungibleAssetBalancesBoolExp } from "../types/generated/types";
import { getTableItem } from "./table";
import { APTOS_COIN } from "../utils";
import { AptosApiError } from "../errors";
import { Deserializer } from "../bcs";
import { getTransactionByVersion } from "./transaction";
import { signAndSubmitTransaction, generateTransaction } from "./transactionSubmission";
import { EntryFunctionABI, RotationProofChallenge, TypeTagU8, TypeTagVector } from "../transactions";
import { U8, MoveVector } from "../bcs";
import { waitForTransaction } from "./transaction";

/**
 * Retrieves account information for a specified account address.
 *
 * @param args - The arguments for retrieving account information.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.accountAddress - The address of the account to retrieve information for.
 * @group Implementation
 */
export async function getInfo(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<AccountData> {
  return getInfoUtil(args);
}

/**
 * Retrieves the modules associated with a specified account address.
 *
 * @param args - The arguments for retrieving modules.
 * @param args.aptosConfig - The configuration for connecting to the Aptos blockchain.
 * @param args.accountAddress - The address of the account whose modules are to be retrieved.
 * @param args.options - Optional parameters for pagination and ledger version.
 * @param args.options.limit - The maximum number of modules to retrieve (default is 1000).
 * @param args.options.offset - The starting point for pagination.  Note, this is obfuscated and is not an index.
 * @param args.options.ledgerVersion - The specific ledger version to query.
 * @group Implementation
 */
export async function getModules(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & LedgerVersionArg;
}): Promise<MoveModuleBytecode[]> {
  return getModulesUtil(args);
}

/**
 * Queries for a move module given an account address and module name.
 * This function can help you retrieve the module's ABI and other relevant information.
 *
 * @param args - The arguments for retrieving the module.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The account address in hex-encoded 32 byte format.
 * @param args.moduleName - The name of the module to retrieve.
 * @param args.options - Optional parameters for the request.
 * @param args.options.ledgerVersion - Specifies the ledger version of transactions. By default, the latest version will be used.
 * @returns The move module.
 * @group Implementation
 */
export async function getModule(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: LedgerVersionArg;
}): Promise<MoveModuleBytecode> {
  return getModuleUtil(args);
}

/**
 * Retrieves a list of transactions associated with a specific account address.
 * This function allows you to paginate through the transactions for better performance and usability.
 *
 * @param args - The arguments for retrieving transactions.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.accountAddress - The account address for which to retrieve transactions.
 * @param args.options - Optional pagination parameters.
 * @param args.options.offset - The starting point for pagination.
 * @param args.options.limit - The maximum number of transactions to retrieve.
 * @group Implementation
 */
export async function getTransactions(args: {
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

/**
 * Retrieves a list of resources associated with a specific account address.
 *
 * @param args - The arguments for retrieving resources.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.accountAddress - The address of the account to fetch resources for.
 * @param args.options - Optional pagination and ledger version parameters.
 * @param args.options.offset - The starting point for pagination.  Note, this is obfuscated and is not an index.
 * @param args.options.limit - The maximum number of resources to retrieve (default is 999).
 * @param args.options.ledgerVersion - The specific ledger version to query.
 * @group Implementation
 */
export async function getResources(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & LedgerVersionArg;
}): Promise<MoveResource[]> {
  const { aptosConfig, accountAddress, options } = args;
  return paginateWithObfuscatedCursor<{}, MoveResource[]>({
    aptosConfig,
    originMethod: "getResources",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/resources`,
    params: {
      ledger_version: options?.ledgerVersion,
      offset: options?.offset,
      limit: options?.limit ?? 999,
    },
  });
}

/**
 * Retrieves a specific resource of a given type for the specified account address.
 *
 * @param args - The arguments for retrieving the resource.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.accountAddress - The address of the account from which to retrieve the resource.
 * @param args.resourceType - The type of the resource to retrieve, specified as a MoveStructId.
 * @param args.options - Optional parameters for specifying the ledger version.
 * @group Implementation
 */
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

/**
 * Retrieves the original account address associated with a given authentication key, which is useful for handling key rotations.
 *
 * @param args - The arguments for the lookup.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.authenticationKey - The authentication key for which to look up the original address.
 * @param args.options - Optional parameters for specifying the ledger version.
 * @returns The original account address or the provided authentication key address if not found.
 * @throws Throws an error if the lookup fails for reasons other than the address not being found.
 * @group Implementation
 */
export async function lookupOriginalAccountAddress(args: {
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

/**
 * Retrieves the count of tokens owned by a specific account address.
 *
 * @param args - The arguments for retrieving the account tokens count.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.accountAddress - The address of the account for which to count the tokens.
 * @returns The count of tokens owned by the specified account.
 * @group Implementation
 */
export async function getAccountTokensCount(args: {
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

  // commonjs (aka cjs) doesn't handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data.current_token_ownerships_v2_aggregate.aggregate
    ? data.current_token_ownerships_v2_aggregate.aggregate.count
    : 0;
}

/**
 * Retrieves the tokens owned by a specified account address.
 *
 * @param args - The arguments for retrieving the account's tokens.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose tokens are being queried.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - The specific token standard to filter the results.
 * @param args.options.offset - The number of records to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria for ordering the results.
 * @returns A promise that resolves to the current token ownerships of the specified account.
 * @group Implementation
 */
export async function getAccountOwnedTokens(args: {
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

/**
 * Retrieves the tokens owned by a specific account from a particular collection address.
 *
 * @param args - The parameters required to fetch the owned tokens.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.accountAddress - The address of the account whose tokens are being queried.
 * @param args.collectionAddress - The address of the collection from which tokens are being retrieved.
 * @param args.options - Optional parameters for filtering and pagination, including token standard, pagination arguments, and
 * order by options.
 * @group Implementation
 */
export async function getAccountOwnedTokensFromCollectionAddress(args: {
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

/**
 * Retrieves the collections owned by a specified account along with the tokens in those collections.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose collections are being queried.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - An optional token standard to filter the collections.
 * @param args.options.offset - An optional offset for pagination.
 * @param args.options.limit - An optional limit for the number of results returned.
 * @param args.options.orderBy - An optional parameter to specify the order of the results.
 * @group Implementation
 */
export async function getAccountCollectionsWithOwnedTokens(args: {
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

/**
 * Retrieves the count of transactions associated with a specified account.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.accountAddress - The address of the account for which to retrieve the transaction count.
 * @returns The number of transactions associated with the specified account.
 * @group Implementation
 */
export async function getAccountTransactionsCount(args: {
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

  // commonjs (aka cjs) doesn't handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data.account_transactions_aggregate.aggregate ? data.account_transactions_aggregate.aggregate.count : 0;
}

/**
 * Retrieves the amount of a specific coin held by an account.
 *
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.accountAddress - The address of the account to query.
 * @param args.coinType - Optional; the type of coin to check the amount for.
 * @param args.faMetadataAddress - Optional; the address of the fungible asset metadata.
 * @returns The amount of the specified coin held by the account, or 0 if none is found.
 * @throws Error if neither coinType nor faMetadataAddress is provided.
 * @group Implementation
 */
export async function getAccountCoinAmount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  coinType?: MoveStructId;
  faMetadataAddress?: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress, coinType, faMetadataAddress } = args;

  let coinAssetType: string | undefined = coinType;
  let faAddress: string;

  if (coinType !== undefined && faMetadataAddress !== undefined) {
    faAddress = AccountAddress.from(faMetadataAddress).toStringLong();
  } else if (coinType !== undefined && faMetadataAddress === undefined) {
    // TODO Move to a separate function as defined in the AIP for coin migration
    if (coinType === APTOS_COIN) {
      faAddress = AccountAddress.A.toStringLong();
    } else {
      faAddress = createObjectAddress(AccountAddress.A, coinType).toStringLong();
    }
  } else if (coinType === undefined && faMetadataAddress !== undefined) {
    const addr = AccountAddress.from(faMetadataAddress);
    faAddress = addr.toStringLong();
    if (addr === AccountAddress.A) {
      coinAssetType = APTOS_COIN;
    }
    // The paired CoinType should be populated outside of this function in another
    // async call. We cannot do this internally due to dependency cycles issue.
  } else {
    throw new Error("Either coinType, fungibleAssetAddress, or both must be provided");
  }
  const address = AccountAddress.from(accountAddress).toStringLong();

  // Search by fungible asset address, unless it has a coin it migrated from
  let where: any = { asset_type: { _eq: faAddress } };
  if (coinAssetType !== undefined) {
    where = { asset_type: { _in: [coinAssetType, faAddress] } };
  }

  const data = await getAccountCoinsData({
    aptosConfig,
    accountAddress: address,
    options: {
      where,
    },
  });

  // commonjs (aka cjs) doesn't handle Nullish Coalescing for some reason
  // might be because of how ts infer the graphql generated scheme type
  return data[0] ? data[0].amount : 0;
}

/**
 * Retrieves the current fungible asset balances for a specified account.
 *
 * @param args - The arguments for retrieving account coins data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account for which to retrieve coin data.
 * @param args.options - Optional parameters for pagination and filtering the results.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.orderBy - The criteria for ordering the results.
 * @param args.options.where - Conditions to filter the results based on the current fungible asset balances.
 * @group Implementation
 */
export async function getAccountCoinsData(args: {
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

/**
 * Retrieves the count of fungible asset coins held by a specified account.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.accountAddress - The address of the account for which to retrieve the coin count.
 * @throws Error if the count of account coins cannot be retrieved.
 * @group Implementation
 */
export async function getAccountCoinsCount(args: {
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

/**
 * Retrieves the objects owned by a specified account.
 *
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account whose owned objects are to be retrieved.
 * @param args.options - Optional parameters for pagination and ordering of the results.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.orderBy - The criteria to order the results by.
 * @returns A promise that resolves to the current objects owned by the specified account.
 * @group Implementation
 */
export async function getAccountOwnedObjects(args: {
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
 * Derives an account from the provided private key and Aptos configuration.
 * This function helps in obtaining the account details associated with a given private key,
 * considering both unified and legacy authentication schemes.
 *
 * NOTE: There is a potential issue once the unified single signer scheme is adopted by the community.
 * Because one could create two accounts with the same private key with this new authenticator type,
 * we’ll need to determine the order in which we look up the accounts: first unified scheme and then legacy scheme,
 * or first legacy scheme and then unified scheme.
 *
 * @param args - The arguments for deriving the account.
 * @param args.aptosConfig - The Aptos configuration used for account lookup.
 * @param args.privateKey - The private key used to derive the account.
 * @throws Error if the account cannot be derived from the private key.
 * @group Implementation
 */
export async function deriveAccountFromPrivateKey(args: {
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

/**
 * Checks if an account exists by verifying its information against the Aptos blockchain.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for connecting to the Aptos blockchain.
 * @param args.authKey - The authentication key used to derive the account address.
 * @returns A promise that resolves to a boolean indicating whether the account exists.
 *
 * @throws Throws an Error if there is an issue while looking for account information.
 * @group Implementation
 */
export async function isAccountExist(args: { aptosConfig: AptosConfig; authKey: AuthenticationKey }): Promise<boolean> {
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

const rotateAuthKeyAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [
    new TypeTagU8(),
    TypeTagVector.u8(),
    new TypeTagU8(),
    TypeTagVector.u8(),
    TypeTagVector.u8(),
    TypeTagVector.u8(),
  ],
};

/**
 * Rotates the authentication key for a given account.
 *
 * @param args - The arguments for rotating the authentication key.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.fromAccount - The account from which the authentication key will be rotated.
 * @param args.toAccount - (Optional) The target account to rotate to. Required if not using toNewPrivateKey or toAuthKey.
 * @param args.toNewPrivateKey - (Optional) The new private key to rotate to. Required if not using toAccount or toAuthKey.
 * @param args.toAuthKey - (Optional) The new authentication key to rotate to. Can only be used with dangerouslySkipVerification=true.
 * @param args.dangerouslySkipVerification - (Optional) If true, skips verification steps after rotation. Required when using toAuthKey.
 *
 * @remarks
 * This function supports three modes of rotation:
 * 1. Using a target Account object (toAccount)
 * 2. Using a new private key (toNewPrivateKey)
 * 3. Using a raw authentication key (toAuthKey) - requires dangerouslySkipVerification=true
 *
 * When not using dangerouslySkipVerification, the function performs additional safety checks and account setup.
 *
 * If the new key is a multi key, skipping verification is dangerous because verification will publish the public key onchain and
 * prevent users from being locked out of the account from loss of knowledge of one of the public keys.
 *
 * @returns A promise that resolves to the pending transaction response.
 * @throws Error if the rotation fails or verification fails.
 *
 * @group Implementation
 */
export async function rotateAuthKey(
  args: {
    aptosConfig: AptosConfig;
    fromAccount: Account;
  } & (
    | { toAccount: Account; dangerouslySkipVerification?: never }
    | { toNewPrivateKey: Ed25519PrivateKey; dangerouslySkipVerification?: never }
    | { toAuthKey: AuthenticationKey; dangerouslySkipVerification: true }
  ),
): Promise<PendingTransactionResponse> {
  const { aptosConfig, fromAccount, dangerouslySkipVerification } = args;
  if ("toNewPrivateKey" in args) {
    return rotateAuthKeyWithChallenge({
      aptosConfig,
      fromAccount,
      toNewPrivateKey: args.toNewPrivateKey,
    });
  }
  let authKey: AuthenticationKey;
  if ("toAccount" in args) {
    if (args.toAccount instanceof Ed25519Account) {
      return rotateAuthKeyWithChallenge({ aptosConfig, fromAccount, toNewPrivateKey: args.toAccount.privateKey });
    }
    if (args.toAccount instanceof MultiEd25519Account) {
      return rotateAuthKeyWithChallenge({ aptosConfig, fromAccount, toAccount: args.toAccount });
    }
    authKey = args.toAccount.publicKey.authKey();
  } else if ("toAuthKey" in args) {
    authKey = args.toAuthKey;
  } else {
    throw new Error("Invalid arguments");
  }

  const pendingTxn = await rotateAuthKeyUnverified({
    aptosConfig,
    fromAccount,
    toAuthKey: authKey,
  });

  if (dangerouslySkipVerification === true) {
    return pendingTxn;
  }

  const rotateAuthKeyTxnResponse = await waitForTransaction({
    aptosConfig,
    transactionHash: pendingTxn.hash,
  });
  if (!rotateAuthKeyTxnResponse.success) {
    throw new Error(`Failed to rotate authentication key - ${rotateAuthKeyTxnResponse}`);
  }

  // Verify the rotation by setting the originating address to the new account.
  // This verifies the rotation even if the transaction payload fails to execute successfully.
  const verificationTxn = await generateTransaction({
    aptosConfig,
    sender: fromAccount.accountAddress,
    data: {
      function: "0x1::account::set_originating_address",
      functionArguments: [],
    },
  });

  return signAndSubmitTransaction({
    aptosConfig,
    signer: args.toAccount, // Use the new account to sign
    transaction: verificationTxn,
  });
}

async function rotateAuthKeyWithChallenge(
  args: {
    aptosConfig: AptosConfig;
    fromAccount: Account;
  } & ({ toNewPrivateKey: Ed25519PrivateKey } | { toAccount: MultiEd25519Account }),
): Promise<PendingTransactionResponse> {
  const { aptosConfig, fromAccount } = args;
  const accountInfo = await getInfo({
    aptosConfig,
    accountAddress: fromAccount.accountAddress,
  });

  let newAccount: Account;
  if ("toNewPrivateKey" in args) {
    newAccount = Account.fromPrivateKey({ privateKey: args.toNewPrivateKey, legacy: true });
  } else {
    newAccount = args.toAccount;
  }

  const challenge = new RotationProofChallenge({
    sequenceNumber: BigInt(accountInfo.sequence_number),
    originator: fromAccount.accountAddress,
    currentAuthKey: AccountAddress.from(accountInfo.authentication_key),
    newPublicKey: newAccount.publicKey,
  });

  // Sign the challenge
  const challengeHex = challenge.bcsToBytes();
  const proofSignedByCurrentKey = fromAccount.sign(challengeHex);
  const proofSignedByNewKey = newAccount.sign(challengeHex);

  // Generate transaction
  const rawTxn = await generateTransaction({
    aptosConfig,
    sender: fromAccount.accountAddress,
    data: {
      function: "0x1::account::rotate_authentication_key",
      functionArguments: [
        new U8(fromAccount.signingScheme), // from scheme
        MoveVector.U8(fromAccount.publicKey.toUint8Array()),
        new U8(newAccount.signingScheme), // to scheme
        MoveVector.U8(newAccount.publicKey.toUint8Array()),
        MoveVector.U8(proofSignedByCurrentKey.toUint8Array()),
        MoveVector.U8(proofSignedByNewKey.toUint8Array()),
      ],
      abi: rotateAuthKeyAbi,
    },
  });
  return signAndSubmitTransaction({
    aptosConfig,
    signer: fromAccount,
    transaction: rawTxn,
  });
}

const rotateAuthKeyUnverifiedAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [TypeTagVector.u8()],
};

async function rotateAuthKeyUnverified(args: {
  aptosConfig: AptosConfig;
  fromAccount: Account;
  toAuthKey: AuthenticationKey;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, fromAccount, toAuthKey } = args;
  const authKey = toAuthKey;
  const rawTxn = await generateTransaction({
    aptosConfig,
    sender: fromAccount.accountAddress,
    data: {
      function: "0x1::account::rotate_authentication_key_call",
      functionArguments: [MoveVector.U8(authKey.toUint8Array())],
      abi: rotateAuthKeyUnverifiedAbi,
    },
  });
  return signAndSubmitTransaction({
    aptosConfig,
    signer: fromAccount,
    transaction: rawTxn,
  });
}

async function getMultiKeysForAuthenticationKeys(args: {
  aptosConfig: AptosConfig;
  authKeys: AuthenticationKey[];
}): Promise<{ authKey: AuthenticationKey; publicKey: MultiKey | MultiEd25519PublicKey }[]> {
  const { aptosConfig, authKeys } = args;
  if (authKeys.length === 0) {
    throw new Error("No authentication keys provided");
  }

  const whereCondition: { auth_key: { _in: string[] } } = {
    auth_key: { _in: authKeys.map((authKey) => authKey.toString()) },
  };

  const graphqlQuery = {
    query: GetMultiKeyForAuthKey,
    variables: {
      where_condition: whereCondition,
    },
  };
  const { auth_key_multikey_layout: data } = await queryIndexer<GetMultiKeyForAuthKeyQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getMultiKeysForAuthenticationKeys",
  });

  const authKeyToMultiKey = new Map(data.map((entry) => [entry.auth_key, entry]));

  const result: { authKey: AuthenticationKey; publicKey: MultiKey | MultiEd25519PublicKey }[] = [];
  for (let i = 0; i < authKeys.length; i += 1) {
    const entry = authKeyToMultiKey.get(authKeys[i].toString());
    if (!entry) {
      throw new Error(`Failed to find multikey for authentication key ${authKeys[i]}`);
    }
    const publicKey = extractMultiKeyFromData(entry);
    result.push({ authKey: authKeys[i], publicKey });
  }

  return result;
}

function extractMultiKeyFromData(data: GetMultiKeyForAuthKeyResponse): MultiKey | MultiEd25519PublicKey {
  const signaturesRequired = data.signatures_required;
  const multikeyLayout = data.multikey_layout_with_prefixes;
  const multikeyType = data.multikey_type;

  if (multikeyType === "multi_ed25519") {
    const ed25519PublicKeys: Array<Ed25519PublicKey> = [];
    for (const key of multikeyLayout) {
      ed25519PublicKeys.push(new Ed25519PublicKey(key));
    }
    return new MultiEd25519PublicKey({
      publicKeys: ed25519PublicKeys,
      threshold: signaturesRequired,
    });
  }
  if (multikeyType === "multi_key") {
    const publicKeys: Array<PublicKey> = [];
    for (const key of multikeyLayout) {
      const deserializer = Deserializer.fromHex(key);
      const variantIndex = deserializer.deserializeUleb128AsU32();
      let publicKey: PublicKey;
      switch (variantIndex) {
        case AnyPublicKeyVariant.Ed25519:
          publicKey = new Ed25519PublicKey(deserializer.deserializeFixedBytes(32));
          break;
        case AnyPublicKeyVariant.Secp256k1:
          publicKey = new Secp256k1PublicKey(deserializer.deserializeFixedBytes(65));
          break;
        case AnyPublicKeyVariant.Keyless:
          publicKey = KeylessPublicKey.deserialize(deserializer);
          break;
        case AnyPublicKeyVariant.FederatedKeyless:
          publicKey = FederatedKeylessPublicKey.deserialize(deserializer);
          break;
        default:
          throw new Error(`Unknown variant index for AnyPublicKey: ${variantIndex}`);
      }
      publicKeys.push(new AnyPublicKey(publicKey));
    }
    return new MultiKey({
      publicKeys,
      signaturesRequired,
    });
  }
  throw new Error("Unknown multikey type");
}

async function getAuthKeysForPublicKey(args: {
  aptosConfig: AptosConfig;
  publicKey: Exclude<AccountPublicKey, AbstractMultiKey>;
  options?: { verified?: boolean };
}): Promise<AuthenticationKey[]> {
  const { aptosConfig, publicKey, options } = args;
  const verified = options?.verified ?? true;
  let baseKey: PublicKey = publicKey;
  if (publicKey instanceof AnyPublicKey) {
    baseKey = publicKey.publicKey;
  }
  const whereCondition: any = {
    public_key: { _eq: baseKey.toString() },
    verified: { _eq: verified },
  };
  const graphqlQuery = {
    query: GetAuthKeysForPublicKey,
    variables: {
      where_condition: whereCondition,
    },
  };
  const { public_key_auth_keys: data } = await queryIndexer<GetAuthKeysForPublicKeyQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAuthKeysForPublicKey",
  });

  const sortedData = data.sort((a, b) => Number(b.last_transaction_version) - Number(a.last_transaction_version));
  const authKeys = sortedData.map((entry) => new AuthenticationKey({ data: entry.auth_key }));
  return authKeys;
}

async function getLastestTransactionVersionForAddress(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<number> {
  const { aptosConfig, accountAddress } = args;
  const address = AccountAddress.from(accountAddress).toString();
  const whereCondition: any = {
    address: { _eq: address.toString() },
    verified: { _eq: true },
  };

  const graphqlQuery = {
    query: GetAccountAddressesForAuthKey,
    variables: {
      where_condition: whereCondition,
    },
  };
  const { auth_key_account_addresses: data } = await queryIndexer<GetAccountAddressesForAuthKeyQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountAddressesForAuthKeys",
  });
  if (data.length !== 1) {
    throw new Error(`Expected 1 account address for address ${address}, got ${data.length}`);
  }
  return Number(data[0].last_transaction_version);
}

async function getAccountAddressesForAuthKeys(args: {
  aptosConfig: AptosConfig;
  authKeys: AuthenticationKey[];
  options?: { verified?: boolean };
}): Promise<
  { authKey: AuthenticationKey; accountAddress: AccountAddress; verified: boolean; lastTransactionVersion: number }[]
> {
  const { aptosConfig, options, authKeys } = args;
  const verified = options?.verified ?? true;
  if (authKeys.length === 0) {
    throw new Error("No authentication keys provided");
  }

  const whereCondition: any = {
    auth_key: { _in: authKeys.map((authKey) => authKey.toString()) },
    verified: { _eq: verified },
  };

  const graphqlQuery = {
    query: GetAccountAddressesForAuthKey,
    variables: {
      where_condition: whereCondition,
    },
  };
  const { auth_key_account_addresses: data } = await queryIndexer<GetAccountAddressesForAuthKeyQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getAccountAddressesForAuthKeys",
  });
  return data.map((entry) => ({
    authKey: new AuthenticationKey({ data: entry.auth_key }),
    accountAddress: new AccountAddress(Hex.hexInputToUint8Array(entry.address)),
    verified: entry.verified,
    lastTransactionVersion: Number(entry.last_transaction_version),
  }));
}

export async function getAccountsForPublicKey(args: {
  aptosConfig: AptosConfig;
  publicKey: AccountPublicKey;
}): Promise<
  { accountAddress: AccountAddress; publicKey: PublicKey; verified: boolean; lastTransactionVersion: number }[]
> {
  const { aptosConfig, publicKey } = args;

  let baseKey: PublicKey = publicKey;
  if (publicKey instanceof AnyPublicKey) {
    baseKey = publicKey.publicKey;
  }
  const singleKeyPublicKeys: AccountPublicKey[] = [];
  if (baseKey instanceof Ed25519PublicKey) {
    singleKeyPublicKeys.push(baseKey);
  }
  const anyPublicKey = new AnyPublicKey(baseKey);
  singleKeyPublicKeys.push(anyPublicKey);

  const singleKeyAuthKeyPublicKeyPairs = singleKeyPublicKeys.map((pubKey) => {
    const authKey = pubKey.authKey();
    return { authKey, publicKey: pubKey };
  });

  const multiKeyAuthKeys = await getAuthKeysForPublicKey({ aptosConfig, publicKey });

  const [multiKeyPairs, authKeyAccountAddressPairs] = await Promise.all([
    getMultiKeysForAuthenticationKeys({ aptosConfig, authKeys: multiKeyAuthKeys }),
    getAccountAddressesForAuthKeys({
      aptosConfig,
      authKeys: multiKeyAuthKeys.concat(singleKeyAuthKeyPublicKeyPairs.map((pair) => pair.publicKey.authKey())),
    }),
  ]);

  const authKeyPublicKeyPairs = singleKeyAuthKeyPublicKeyPairs.concat(multiKeyPairs);

  const result: {
    accountAddress: AccountAddress;
    publicKey: PublicKey;
    verified: boolean;
    lastTransactionVersion: number;
  }[] = [];
  const authKeyToPublicKey = new Map(authKeyPublicKeyPairs.map((pair) => [pair.authKey.toString(), pair.publicKey]));
  for (const authKeyAccountAddressPair of authKeyAccountAddressPairs) {
    if (!authKeyToPublicKey.has(authKeyAccountAddressPair.authKey.toString())) {
      throw new Error(`No publicKey found for authentication key ${authKeyAccountAddressPair.authKey}.`);
    }
    result.push({
      accountAddress: authKeyAccountAddressPair.accountAddress,
      publicKey: authKeyToPublicKey.get(authKeyAccountAddressPair.authKey.toString()) as PublicKey,
      verified: authKeyAccountAddressPair.verified,
      lastTransactionVersion: authKeyAccountAddressPair.lastTransactionVersion,
    });
  }

  return result;
}

export async function getPublicKeyFromAccountAddress(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
}): Promise<PublicKey> {
  const { aptosConfig, accountAddress } = args;

  const accountData = await getInfo({ aptosConfig, accountAddress });

  const lastTransactionVersion = await getLastestTransactionVersionForAddress({
    aptosConfig,
    accountAddress,
  });

  const transaction = await getTransactionByVersion({ aptosConfig, ledgerVersion: lastTransactionVersion });
  if (!isUserTransactionResponse(transaction)) {
    throw new Error("Transaction is not a user transaction");
  }

  const { signature } = transaction;
  if (!signature) {
    throw new Error("Transaction has no signature");
  }

  let publicKey: AccountPublicKey;
  if (isEd25519Signature(signature)) {
    publicKey = new Ed25519PublicKey(signature.public_key);
  } else if (isMultiEd25519Signature(signature)) {
    publicKey = new MultiEd25519PublicKey({
      publicKeys: signature.public_keys.map((pk) => new Ed25519PublicKey(pk)),
      threshold: signature.threshold,
    });
  } else if (isSingleSenderSignature(signature)) {
    if (signature.public_key.type === "keyless") {
      const deserializer = Deserializer.fromHex(signature.public_key.value);
      publicKey = new AnyPublicKey(KeylessPublicKey.deserialize(deserializer));
    } else if (signature.public_key.type === "ed25519") {
      publicKey = new AnyPublicKey(new Ed25519PublicKey(signature.public_key.value));
    } else if (signature.public_key.type === "secp256k1_ecdsa") {
      publicKey = new AnyPublicKey(new Secp256k1PublicKey(signature.public_key.value));
    } else {
      throw new Error("Unknown public key type");
    }
  } else {
    throw new Error("Unknown signature type");
  }
  if (publicKey.authKey().toString() !== accountData.authentication_key) {
    throw new Error(
      "Derived public key does not match authentication key. The most recent signature was likely a key rotation.",
    );
  }
  return publicKey;
}

export async function getMultiKeyFromAuthenticationKey(args: {
  aptosConfig: AptosConfig;
  authKey: AuthenticationKey;
}): Promise<MultiKey | MultiEd25519PublicKey> {
  const { aptosConfig, authKey } = args;

  const result = await getMultiKeysForAuthenticationKeys({ aptosConfig, authKeys: [authKey] });

  if (result.length === 0) {
    throw new Error(`No multikey found for the given authentication key ${authKey}`);
  }
  if (result.length > 1) {
    // This should never happen. Rows are uniquely keyed by auth key.
    throw new Error(`More than one multikey found for the given authentication key ${authKey}`);
  }

  return result[0].publicKey;
}
