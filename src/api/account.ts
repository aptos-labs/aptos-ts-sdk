// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account as AccountModule } from "../account";
import { AccountAddress, PrivateKey, AccountAddressInput } from "../core";
import {
  AccountData,
  AnyNumber,
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
  deriveAccountFromPrivateKey,
  getAccountCoinAmount,
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
import { APTOS_COIN, ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";
import { CurrentFungibleAssetBalancesBoolExp } from "../types/generated/types";

/**
 * A class to query all `Account` related queries on Aptos.
 */
export class Account {
  constructor(readonly config: AptosConfig) {}

/**
 * Queries the current state for an Aptos account given its account address.
 * 
 * @param args - The arguments for the function.
 * @param args.accountAddress - The Aptos account address to query.
 * 
 * @returns The account data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get account information for a specific address
 *   const accountInfo = await aptos.getAccountInfo({ accountAddress: "0x1" }); // replace with a real account address
 *   console.log(accountInfo);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountInfo(args: { accountAddress: AccountAddressInput }): Promise<AccountData> {
    return getInfo({ aptosConfig: this.config, ...args });
  }

/**
 * Queries for all modules in an account given an account address.
 * This function may call the API multiple times to auto paginate and retrieve all account modules.
 * 
 * @param args.accountAddress - The Aptos account address to query modules for.
 * @param args.options.offset - The number of modules to start returning results from.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, it will get the latest version.
 * 
 * @returns Account modules.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching account modules for a specific account address
 *   const accountModules = await aptos.getAccountModules({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the limit of modules to return
 *     },
 *   });
 * 
 *   console.log(accountModules);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountModules(args: {
    accountAddress: AccountAddressInput;
    options?: PaginationArgs & LedgerVersionArg;
  }): Promise<MoveModuleBytecode[]> {
    return getModules({ aptosConfig: this.config, ...args });
  }

/**
 * Queries for a specific account module given an account address and module name.
 * 
 * @param args.accountAddress - The Aptos account address.
 * @param args.moduleName - The name of the module.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, it will get the latest version.
 * 
 * @returns The account module.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the account module for a specific address and module name
 *   const module = await aptos.getAccountModule({
 *     accountAddress: "0x1", // replace with a real account address
 *     moduleName: "MyModule" // specify the module name you want to query
 *   });
 * 
 *   console.log(module);
 * }
 * runExample().catch(console.error);
 */


  async getAccountModule(args: {
    accountAddress: AccountAddressInput;
    moduleName: string;
    options?: LedgerVersionArg;
  }): Promise<MoveModuleBytecode> {
    return getModule({ aptosConfig: this.config, ...args });
  }

/**
 * Queries account transactions given an account address.
 * This function may call the API multiple times to auto paginate and retrieve all account transactions.
 * 
 * @param args.accountAddress - The Aptos account address to query transactions for.
 * @param args.options - Optional pagination arguments.
 * @param args.options.offset - The number of transactions to start returning results from.
 * @param args.options.limit - The maximum number of results to return.
 * 
 * @returns The account transactions.
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
 *   const transactions = await aptos.getAccountTransactions({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       offset: 0, // starting from the first transaction
 *       limit: 10, // limit to 10 transactions
 *     },
 *   });
 * 
 *   console.log(transactions);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountTransactions(args: {
    accountAddress: AccountAddressInput;
    options?: PaginationArgs;
  }): Promise<TransactionResponse[]> {
    return getTransactions({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries all account resources given an account address.
 * This function may call the API multiple times as it auto paginates to retrieve all resources.
 * 
 * @param args.accountAddress - The Aptos account address to query.
 * @param args.options.offset - The number resource to start returning results from.
 * @param args.options.limit - The number of results to return.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, it will get the latest version.
 * @returns Account resources.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching account resources for a specific address
 *   const resources = await aptos.getAccountResources({ accountAddress: "0x1" }); // replace with a real account address
 *   console.log(resources);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountResources(args: {
    accountAddress: AccountAddressInput;
    options?: PaginationArgs & LedgerVersionArg;
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
   * @example
   * const resource = await aptos.getAccountResource({accountAddress:"0x456"})
   *
   */
  async getAccountResource<T extends {} = any>(args: {
    accountAddress: AccountAddressInput;
    resourceType: MoveStructId;
    options?: LedgerVersionArg;
  }): Promise<T> {
    return getResource<T>({ aptosConfig: this.config, ...args });
  }

/**
 * Looks up the account address for a given authentication key, handling cases where the account's authentication key has been rotated.
 * 
 * @param args.authenticationKey The authentication key to look up.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @param args.options.ledgerVersion The ledger version to query; if not provided, it will get the latest version.
 * @returns Promise<AccountAddress> The account address associated with the authentication key.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Look up the original account address for a given authentication key
 *   const accountAddress = await aptos.lookupOriginalAccountAddress({
 *     authenticationKey: "0x1", // replace with a real authentication key
 *   });
 * 
 *   console.log("Original Account Address:", accountAddress);
 * }
 * runExample().catch(console.error);
 */


  async lookupOriginalAccountAddress(args: {
    authenticationKey: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: LedgerVersionArg;
  }): Promise<AccountAddress> {
    return lookupOriginalAccountAddress({ aptosConfig: this.config, ...args });
  }

/**
 * Queries the current count of tokens owned by a specified account.
 * 
 * @param args.accountAddress - The account address to query.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @returns The current count of tokens owned by the account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the count of tokens for the specified account address
 *   const tokensCount = await aptos.getAccountTokensCount({ accountAddress: "0x1" }); // replace with a real account address
 *   console.log(`Tokens Count: ${tokensCount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountTokensCount(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR,
    });
    return getAccountTokensCount({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries the tokens currently owned by a specified account, including NFTs, fungible tokens, and soulbound tokens.
 * You can filter the results by token standard and paginate through the results.
 * 
 * @param args.accountAddress The account address for which to retrieve owned tokens.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard Optional token standard to filter the tokens by.
 * @param args.options.offset Optional number to start returning results from.
 * @param args.options.limit Optional number of results to return.
 * @param args.options.orderBy Optional order to sort the tokens by.
 * @returns An array of tokens owned by the account with their respective data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the tokens owned by the specified account
 *   const accountOwnedTokens = await aptos.getAccountOwnedTokens({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // limit the number of results returned
 *       orderBy: "created_at", // order by creation date
 *     },
 *   });
 * 
 *   console.log(accountOwnedTokens);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountOwnedTokens(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountOwnedTokensQueryResponse[0]>;
  }): Promise<GetAccountOwnedTokensQueryResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getAccountOwnedTokens({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries all current tokens of a specific collection that an account owns by the collection address.
 * This query returns all tokens (v1 and v2 standards) an account owns, including NFTs, fungible tokens, soulbound tokens, etc. 
 * If you want to get only the tokens from a specific standard, you can pass an optional tokenStandard parameter.
 *
 * @param args.accountAddress The account address we want to get the tokens for.
 * @param args.collectionAddress The address of the collection being queried.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard The NFT standard to query for.
 * @param args.options.offset The number token to start returning results from.
 * @param args.options.limit The number of results to return.
 * @param args.options.orderBy The order to sort the tokens by.
 * @returns Tokens array with the token data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Query the tokens owned by the account in a specific collection
 *   const accountOwnedTokens = await aptos.getAccountOwnedTokensFromCollectionAddress({
 *     accountAddress: "0x1", // replace with a real account address
 *     collectionAddress: "0x2", // replace with a real collection address
 *   });
 * 
 *   console.log(accountOwnedTokens);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountOwnedTokensFromCollectionAddress(args: {
    accountAddress: AccountAddressInput;
    collectionAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountOwnedTokensFromCollectionResponse[0]>;
  }): Promise<GetAccountOwnedTokensFromCollectionResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getAccountOwnedTokensFromCollectionAddress({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries for all collections that an account currently has tokens for, including NFTs, fungible tokens, and soulbound tokens. 
 * If you want to get only the tokens from a specific standard, you can pass an optional tokenStandard parameter.
 * 
 * @param args.accountAddress The account address we want to get the collections for.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying.
 * @param args.options.tokenStandard The NFT standard to query for.
 * @param args.options.offset The number of collections to start returning results from.
 * @param args.options.limit The number of results to return.
 * @param args.options.orderBy The order to sort the tokens by.
 * @returns Collections array with the collections data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching account collections with owned tokens
 *   const accountCollectionsWithOwnedTokens = await aptos.getAccountCollectionsWithOwnedTokens({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the number of results to return
 *       orderBy: { created_at: "desc" } // specify the order by criteria
 *     }
 *   });
 * 
 *   console.log(accountCollectionsWithOwnedTokens);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountCollectionsWithOwnedTokens(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs & OrderByArg<GetAccountCollectionsWithOwnedTokenResponse[0]>;
  }): Promise<GetAccountCollectionsWithOwnedTokenResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getAccountCollectionsWithOwnedTokens({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries the current count of transactions submitted by an account.
 *
 * @param args.accountAddress - The account address we want to get the total count for.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to, before querying.
 * @returns Current count of transactions made by an account.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Get the count of transactions for a specific account
 *   const accountTransactionsCount = await aptos.getAccountTransactionsCount({
 *     accountAddress: "0x1", // replace with a real account address
 *   });
 *
 *   console.log(`Account transactions count: ${accountTransactionsCount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountTransactionsCount(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR,
    });
    return getAccountTransactionsCount({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Queries an account's coins data.
 * 
 * @param args.accountAddress The account address to retrieve the coins data for.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @param args.options.offset Optional. The number of coins to start returning results from.
 * @param args.options.limit Optional. The number of results to return.
 * @param args.options.orderBy Optional. The order to sort the coins by.
 * @param args.options.where Optional. Filter the results by specific conditions.
 * @returns Array with the coins data.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve coins data for a specific account
 *   const accountCoinsData = await aptos.getAccountCoinsData({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the number of results to return
 *       orderBy: { asset_type: "asc" }, // specify the order to sort the coins
 *     },
 *   });
 * 
 *   console.log(accountCoinsData);
 * }
 * runExample().catch(console.error);
 */


  async getAccountCoinsData(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs &
      OrderByArg<GetAccountCoinsDataResponse[0]> &
      WhereArg<CurrentFungibleAssetBalancesBoolExp>;
  }): Promise<GetAccountCoinsDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getAccountCoinsData({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Retrieves the current count of an account's coins aggregated across all types.
 * 
 * @param args.accountAddress - The account address for which to get the total coin count.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @returns The current count of the aggregated coins for the specified account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the count of coins for a specific account
 *   const accountCoinsCount = await aptos.getAccountCoinsCount({
 *     accountAddress: "0x1", // replace with a real account address
 *   });
 * 
 *   console.log(`Account coins count: ${accountCoinsCount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountCoinsCount(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getAccountCoinsCount({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves the current amount of APT for a specified account.
 * 
 * @param args.accountAddress - The account address for which to retrieve the APT amount.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @returns The current amount of APT in the specified account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the APT amount for the specified account address
 *   const accountAPTAmount = await aptos.getAccountAPTAmount({ accountAddress: "0x1" }); // replace with a real account address
 *   console.log(`Account APT Amount: ${accountAPTAmount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountAPTAmount(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    return this.getAccountCoinAmount({ coinType: APTOS_COIN, ...args });
  }

/**
 * Retrieves the current amount of a specific coin held by an account.
 * 
 * @param args.accountAddress - The account address to query for the total coin amount.
 * @param args.coinType - The type of coin to query.
 * @param args.faMetadataAddress - The fungible asset metadata address to query. 
 *        Note: This will be automatically filled in if not provided when migrated to fungible assets.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @returns The current amount of the specified coin held by the account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the account's coin amount for a specific coin type
 *   const accountCoinAmount = await aptos.getAccountCoinAmount({
 *     accountAddress: "0x1", // replace with a real account address
 *     coinType: "0x1::aptos_coin::AptosCoin" // replace with a real coin type
 *   });
 * 
 *   console.log(`Account coin amount: ${accountCoinAmount}`);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountCoinAmount(args: {
    accountAddress: AccountAddressInput;
    coinType?: MoveStructId;
    faMetadataAddress?: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getAccountCoinAmount({ aptosConfig: this.config, ...args });
  }

/**
 * Queries an account's owned objects.
 * 
 * This function retrieves the objects owned by a specified account address, allowing users to understand the assets associated with that account.
 * 
 * @param args.accountAddress - The account address we want to get the objects for.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional pagination and sorting options.
 * @param args.options.offset - The starting position to start returning results from.
 * @param args.options.limit - The number of results to return.
 * @param args.options.orderBy - The order to sort the objects by.
 * @returns An array of objects with the object data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching owned objects for a specific account
 *   const accountOwnedObjects = await aptos.getAccountOwnedObjects({
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the number of results to return
 *       orderBy: { created_at: "desc" } // specify how to sort the results
 *     }
 *   });
 * 
 *   console.log(accountOwnedObjects);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountOwnedObjects(args: {
    accountAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetObjectDataQueryResponse[0]>;
  }): Promise<GetObjectDataQueryResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.DEFAULT,
    });
    return getAccountOwnedObjects({
      aptosConfig: this.config,
      ...args,
    });
  }

/**
 * Derives an account by providing a private key. This function resolves the provided private key type and derives the public key from it.
 * 
 * If the private key is of type Secp256k1, it derives the account using the derived public key and authentication key using the SingleKey scheme locally. If the private key is of type ED25519, it looks up the authentication key on-chain to determine whether it is a Legacy ED25519 key or a Unified ED25519 key, and then derives the account based on that.
 * 
 * @param args - The arguments for deriving the account.
 * @param args.privateKey - An account private key.
 * @returns The derived Account type.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Deriving an account from a provided ED25519 private key
 *   const account = await aptos.deriveAccountFromPrivateKey({
 *     privateKey: new Ed25519PrivateKey("0x123") // replace with a real private key
 *   });
 * 
 *   console.log("Derived account:", account);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async deriveAccountFromPrivateKey(args: { privateKey: PrivateKey }): Promise<AccountModule> {
    return deriveAccountFromPrivateKey({ aptosConfig: this.config, ...args });
  }
}