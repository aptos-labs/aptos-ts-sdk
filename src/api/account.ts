// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { AccountAddress, PrivateKey, Account as AccountModule } from "../core";
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
  TokenStandard,
  TransactionResponse,
} from "../types";
import {
  deriveAccountFromPrivateKey,
  getAccountCoinsCount,
  getAccountCoinsData,
  getAccountCollectionsWithOwnedTokens,
  getAccountOwnedObjects,
  getAccountOwnedTokens,
  getAccountOwnedTokensFromCollectionAddress,
  getAccountTokensCount,
  getAccountTransactionsCount,
  getInfo,
  getModule,
  getModules,
  getResource,
  getResources,
  getTransactions,
  lookupOriginalAccountAddress,
} from "../internal/account";

/**
 * A class to query all `Account` related queries on Aptos.
 */
export class Account {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries the current state for an Aptos account given its account address
   *
   * @param args.accountAddress Aptos account address
   *
   * @returns The account data
   *
   * @example An example of the returned account
   * ```
   * {
   *    sequence_number: "1",
   *    authentication_key: "0x5307b5f4bc67829097a8ba9b43dba3b88261eeccd1f709d9bde240fc100fbb69"
   * }
   * ```
   */
  async getAccountInfo(args: { accountAddress: HexInput }): Promise<AccountData> {
    return getInfo({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for all modules in an account given an account address
   *
   * Note: In order to get all account modules, this function may call the API
   * multiple times as it auto paginates.
   *
   * @param args.accountAddress Aptos account address
   * @param args.options.offset The number module to start returning results from
   * @param args.options.limit The number of results to return
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @returns Account modules
   */

  async getAccountModules(args: {
    accountAddress: HexInput;
    options?: PaginationArgs & LedgerVersion;
  }): Promise<MoveModuleBytecode[]> {
    return getModules({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for a specific account module given account address and module name
   *
   * @param args.accountAddress Aptos account address
   * @param args.moduleName The name of the module
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @returns Account module
   *
   * @example An example of an account module
   * ```
   * {
   *    bytecode: "0xa11ceb0b0600000006010002030206050807070f0d081c200",
   *    abi: { address: "0x1" }
   * }
   * ```
   */
  async getAccountModule(args: {
    accountAddress: HexInput;
    moduleName: string;
    options?: LedgerVersion;
  }): Promise<MoveModuleBytecode> {
    return getModule({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries account transactions given an account address
   *
   * Note: In order to get all account transactions, this function may call the API
   * multiple times as it auto paginates.
   *
   * @param args.accountAddress Aptos account address
   * @param args.options.offset The number transaction to start returning results from
   * @param args.options.limit The number of results to return
   *
   * @returns The account transactions
   */
  async getAccountTransactions(args: {
    accountAddress: HexInput;
    options?: PaginationArgs;
  }): Promise<TransactionResponse[]> {
    return getTransactions({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries all account resources given an account address
   *
   * Note: In order to get all account resources, this function may call the API
   * multiple times as it auto paginates.
   *
   * @param args.accountAddress Aptos account address
   * @param args.options.offset The number resource to start returning results from
   * @param args.options.limit The number of results to return
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   * @returns Account resources
   */
  async getAccountResources(args: {
    accountAddress: HexInput;
    options?: PaginationArgs & LedgerVersion;
  }): Promise<MoveResource[]> {
    return getResources({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries a specific account resource given account address and resource type. Note that the default is `any` in order
   * to allow for ease of accessing properties of the object.
   *
   * @type The typed output of the resource
   * @param args.accountAddress Aptos account address
   * @param args.resourceType String representation of an on-chain Move struct type, i.e "0x1::aptos_coin::AptosCoin"
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @returns Account resource
   *
   * @example An example of an account resource
   * ```
   * {
   *    data: { value: 6 }
   * }
   * ```
   */
  async getAccountResource<T extends {} = any>(args: {
    accountAddress: HexInput;
    resourceType: MoveStructType;
    options?: LedgerVersion;
  }): Promise<T> {
    return getResource<T>({ aptosConfig: this.config, ...args });
  }

  /**
   * Looks up the account address for a given authentication key
   *
   * This handles both if the account's authentication key has been rotated or not.
   *
   * @param args.authenticationKey The authentication key
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   * @returns Promise<AccountAddress> The accountAddress associated with the authentication key
   */
  async lookupOriginalAccountAddress(args: {
    authenticationKey: HexInput;
    options?: LedgerVersion;
  }): Promise<AccountAddress> {
    return lookupOriginalAccountAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the current count of tokens owned by an account
   *
   * @param args.accountAddress The account address
   * @returns Current count of tokens owned by the account
   */
  async getAccountTokensCount(args: { accountAddress: HexInput }): Promise<number> {
    return getAccountTokensCount({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries the account's current owned tokens.
   *
   * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible, soulbound, etc.
   * If you want to get only the token from a specific standard, you can pass an optional tokenStandard param
   *
   * @param args.accountAddress The account address we want to get the tokens for
   * @param args.options.tokenStandard The NFT standard to query for
   * @param args.options.pagination.offset The number token to start returning results from
   * @param args.options.pagination.limit The number of results to return
   * @param args.options.orderBy The order to sort the tokens by
   * @returns Tokens array with the token data
   */
  async getAccountOwnedTokens(args: {
    accountAddress: HexInput;
    options?: {
      tokenStandard?: TokenStandard;
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetAccountOwnedTokensQueryResponse[0]>;
    };
  }): Promise<GetAccountOwnedTokensQueryResponse> {
    return getAccountOwnedTokens({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries all current tokens of a specific collection that an account owns by the collection address
   *
   * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible, soulbound, etc.
   * If you want to get only the token from a specific standard, you can pass an optional tokenStandard param
   *
   * @param args.accountAddress The account address we want to get the tokens for
   * @param args.collectionAddress The address of the collection being queried
   * @param args.options.tokenStandard The NFT standard to query for
   * @param args.options.pagination.offset The number token to start returning results from
   * @param args.options.pagination.limit The number of results to return
   * @param args.options.orderBy The order to sort the tokens by
   * @returns Tokens array with the token data
   */
  async getAccountOwnedTokensFromCollectionAddress(args: {
    accountAddress: HexInput;
    collectionAddress: HexInput;
    options?: {
      tokenStandard?: TokenStandard;
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetAccountOwnedTokensFromCollectionResponse[0]>;
    };
  }): Promise<GetAccountOwnedTokensFromCollectionResponse> {
    return getAccountOwnedTokensFromCollectionAddress({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries for all collections that an account currently has tokens for.
   *
   * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible, soulbound, etc.
   * If you want to get only the token from a specific standard, you can pass an optional tokenStandard param
   *
   * @param args.accountAddress The account address we want to get the collections for
   * @param args.options.tokenStandard The NFT standard to query for
   * @param args.options.pagination.offset The number collection to start returning results from
   * @param args.options.pagination.limit The number of results to return
   * @param args.options.orderBy The order to sort the tokens by
   * @returns Collections array with the collections data
   */
  async getAccountCollectionsWithOwnedTokens(args: {
    accountAddress: HexInput;
    options?: {
      tokenStandard?: TokenStandard;
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetAccountCollectionsWithOwnedTokenResponse[0]>;
    };
  }): Promise<GetAccountCollectionsWithOwnedTokenResponse> {
    return getAccountCollectionsWithOwnedTokens({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries the current count of transactions submitted by an account
   *
   * @param args.accountAddress The account address we want to get the total count for
   * @returns Current count of transactions made by an account
   */
  async getAccountTransactionsCount(args: { accountAddress: HexInput }): Promise<number> {
    return getAccountTransactionsCount({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries an account's coins data
   *
   * @param args.accountAddress The account address we want to get the coins data for
   * @param args.options.pagination.offset The number coin to start returning results from
   * @param args.options.pagination.limit The number of results to return
   * @param args.options.orderBy The order to sort the coins by
   * @returns Array with the coins data
   */
  async getAccountCoinsData(args: {
    accountAddress: HexInput;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetAccountCoinsDataResponse[0]>;
    };
  }): Promise<GetAccountCoinsDataResponse> {
    return getAccountCoinsData({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries the current count of an account's coins aggregated
   *
   * @param args.accountAddress The account address we want to get the total count for
   * @returns Current count of the aggregated count of all account's coins
   */
  async getAccountCoinsCount(args: { accountAddress: HexInput }): Promise<number> {
    return getAccountCoinsCount({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries an account's owned objects
   *
   * @param args.accountAddress The account address we want to get the objects for
   * @param args.options.pagination.offset The number coin to start returning results from
   * @param args.options.pagination.limit The number of results to return
   * @param args.options.orderBy The order to sort the coins by
   * @returns Objects array with the object data
   */
  async getAccountOwnedObjects(args: {
    accountAddress: HexInput;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetAccountOwnedObjectsResponse[0]>;
    };
  }): Promise<GetAccountOwnedObjectsResponse> {
    return getAccountOwnedObjects({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Derives an account by providing a private key.
   * This functions resolves the provided private key type and derives the public key from it.
   *
   * If the privateKey is a Secp256k1 type, it derives the account using the derived public key and
   * auth key using the SingleKey scheme locally.
   *
   * If the privateKey is a ED25519 type, it looks up the authentication key on chain, and uses it to resolve
   * whether it is a Legacy ED25519 key or a Unified ED25519 key. It then derives the account based
   * on that.
   *
   * @param args.privateKey An account private key
   * @returns Account type
   */
  async deriveAccountFromPrivateKey(args: { privateKey: PrivateKey }): Promise<AccountModule> {
    return deriveAccountFromPrivateKey({ aptosConfig: this.config, ...args });
  }
}
