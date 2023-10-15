// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptos_config";
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
  MoveResourceType,
  OrderBy,
  PaginationArgs,
  TokenStandard,
  TransactionResponse,
} from "../types";
import {
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
import { AccountAddress } from "../core";

/**
 * A class to query all `Account` related queries on Aptos.
 */
export class Account {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries for an Aptos account given an account address
   *
   * @param accountAddress Aptos account address
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
   * Queries for an acount modules given an account address
   *
   * Note: In order to get all account modules, this function may call the API
   * multiple times as it auto paginates.
   *
   * @param accountAddress Aptos account address
   * @returns Account modules
   */

  async getAccountModules(args: {
    accountAddress: HexInput;
    options?: PaginationArgs & LedgerVersion;
  }): Promise<MoveModuleBytecode[]> {
    return getModules({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for an account module given account address and module name
   *
   * @param accountAddress Aptos account address
   * @param moduleName The name of the module
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
   * @param accountAddress Aptos account address
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
   * Queries account resources given an account address
   *
   * Note: In order to get all account resources, this function may call the API
   * multiple times as it auto paginates.
   *
   * @param accountAddress Aptos account address
   * @returns Account resources
   */
  async getAccountResources(args: {
    accountAddress: HexInput;
    options?: PaginationArgs & LedgerVersion;
  }): Promise<MoveResource[]> {
    return getResources({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries account resource given account address and resource type
   *
   * @param accountAddress Aptos account address
   * @param resourceType String representation of an on-chain Move struct type, i.e "0x1::aptos_coin::AptosCoin"
   *
   * @returns Account resource
   *
   * @example An example of an account resource
   * ```
   * {
   *    type: "0x1::aptos_coin::AptosCoin",
   *    data: { value: 6 }
   * }
   * ```
   */
  async getAccountResource(args: {
    accountAddress: HexInput;
    resourceType: MoveResourceType;
    options?: LedgerVersion;
  }): Promise<MoveResource> {
    return getResource({ aptosConfig: this.config, ...args });
  }

  /**
   * Lookup the original address by the current derived address or authentication key
   *
   * @param args.addressOrAuthKey The derived address or authentication key
   * @returns Promise<AccountAddress> The original address
   */
  async lookupOriginalAccountAddress(args: {
    authenticationKey: HexInput;
    options?: LedgerVersion;
  }): Promise<AccountAddress> {
    return lookupOriginalAccountAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the count of tokens owned by an account
   *
   * @param accountAddress The account address
   * @returns An object { count : number }
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
   * If you want to get only the token from a specific standrd, you can pass an optional tokenStandard param
   *
   * @param accountAddress The account address we want to get the tokens for
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
   * Queries all tokens of a specific collection that an account owns by the collection address
   *
   * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible, soulbound, etc.
   * If you want to get only the token from a specific standrd, you can pass an optional tokenStandard param
   *
   * @param ownerAddress The account address we want to get the tokens for
   * @param collectionAddress The address of the collection being queried
   * @returns Tokens array with the token data
   */
  async getAccountOwnedTokensFromCollectionAddress(args: {
    ownerAddress: HexInput;
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
   * Queries for all collections that an account has tokens for.
   *
   * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible, soulbound, etc.
   * If you want to get only the token from a specific standrd, you can pass an optional tokenStandard param
   *
   * @param accountAddress The account address we want to get the collections for
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
   * Queries the count of transactions submitted by an account
   *
   * @param accountAddress The account address we want to get the total count for
   * @returns An object { count : number }
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
   * @param accountAddress The account address we want to get the coins data for
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
   * Queries the count of an account's coins aggregated
   *
   * @param accountAddress The account address we want to get the total count for
   * @returns An object { count : number } where `number` is the aggregated count of all account's coin
   */
  async getAccountCoinsCount(args: { accountAddress: HexInput }): Promise<number> {
    return getAccountCoinsCount({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries an account's owned objects
   *
   * @param ownerAddress The account address we want to get the objects for
   * @returns Objects array with the object data
   */
  async getAccountOwnedObjects(args: {
    ownerAddress: HexInput;
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
}
