// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AnyNumber,
  GetCollectionDataResponse,
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  MoveStructId,
  OrderByArg,
  PaginationArgs,
  TokenStandardArg,
} from "../types";
import { AccountAddress, AccountAddressInput } from "../core";
import { Account } from "../account";
import { InputGenerateTransactionOptions } from "../transactions/types";
import {
  addDigitalAssetPropertyTransaction,
  addDigitalAssetTypedPropertyTransaction,
  burnDigitalAssetTransaction,
  CreateCollectionOptions,
  createCollectionTransaction,
  freezeDigitalAssetTransferTransaction,
  getCollectionData,
  getCollectionDataByCollectionId,
  getCollectionDataByCreatorAddress,
  getCollectionDataByCreatorAddressAndCollectionName,
  getCollectionId,
  getCurrentDigitalAssetOwnership,
  getDigitalAssetActivity,
  getDigitalAssetData,
  getOwnedDigitalAssets,
  mintDigitalAssetTransaction,
  mintSoulBoundTransaction,
  PropertyType,
  PropertyValue,
  removeDigitalAssetPropertyTransaction,
  setDigitalAssetDescriptionTransaction,
  setDigitalAssetNameTransaction,
  setDigitalAssetURITransaction,
  transferDigitalAssetTransaction,
  unfreezeDigitalAssetTransferTransaction,
  updateDigitalAssetPropertyTransaction,
  updateDigitalAssetTypedPropertyTransaction,
} from "../internal/digitalAsset";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class to query all `DigitalAsset` related queries on Aptos.
 */
export class DigitalAsset {
  constructor(readonly config: AptosConfig) {}

/**
 * Queries data of a specific collection by the collection creator address and the collection name.
 * If a creator account has multiple collections with the same name in v1 and v2, you can pass an optional `tokenStandard` parameter to query a specific standard.
 * 
 * @param args.creatorAddress - The address of the collection's creator.
 * @param args.collectionName - The name of the collection.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard - The token standard to query.
 * @returns GetCollectionDataResponse - The response type containing collection data.
 * @deprecated Use getCollectionDataByCreatorAddressAndCollectionName. This function will be removed in the next major release.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Querying collection data for a specific creator and collection name
 *   const collection = await aptos.getCollectionData({
 *     creatorAddress: "0x1", // replace with a real creator address
 *     collectionName: "myCollection",
 *   });
 * 
 *   console.log(collection);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getCollectionData(args: {
    creatorAddress: AccountAddressInput;
    collectionName: string;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg;
  }): Promise<GetCollectionDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });

    const { creatorAddress, collectionName, options } = args;
    const address = AccountAddress.from(creatorAddress);

    const whereCondition: any = {
      collection_name: { _eq: collectionName },
      creator_address: { _eq: address.toStringLong() },
    };
    if (options?.tokenStandard) {
      whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
    }

    return getCollectionData({ aptosConfig: this.config, options: { where: whereCondition } });
  }

/**
 * Queries data of a specific collection by the collection creator address and the collection name.
 * If a creator account has two collections with the same name in v1 and v2, 
 * you can pass an optional `tokenStandard` parameter to query a specific standard.
 * 
 * @param args.creatorAddress - The address of the collection's creator.
 * @param args.collectionName - The name of the collection.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard - The token standard to query.
 * @param args.options.pagination - Optional pagination parameters.
 * @returns GetCollectionDataResponse - The response containing collection data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch collection data by creator address and collection name
 *   const collection = await aptos.getCollectionDataByCreatorAddressAndCollectionName({
 *     creatorAddress: "0x123", // replace with a real creator address
 *     collectionName: "myCollection", // specify the collection name
 *   });
 * 
 *   console.log(collection);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getCollectionDataByCreatorAddressAndCollectionName(args: {
    creatorAddress: AccountAddressInput;
    collectionName: string;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs;
  }): Promise<GetCollectionDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });

    return getCollectionDataByCreatorAddressAndCollectionName({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves data of a specific collection by the creator's address.
 * This function can help you obtain collection details when you have the creator's address.
 *
 * @param args.creatorAddress - The address of the collection's creator.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard - Optional token standard to query.
 * @param args.options.pagination - Optional pagination parameters for the query.
 * @returns GetCollectionDataResponse - The response type containing collection data.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieving collection data by creator address
 *   const collectionData = await aptos.getCollectionDataByCreatorAddress({
 *     creatorAddress: "0x1", // replace with a real creator address
 *     minimumLedgerVersion: 1, // optional, specify if needed
 *     options: {
 *       tokenStandard: "v2", // optional, specify if needed
 *       pagination: { limit: 10, offset: 0 } // optional, specify if needed
 *     }
 *   });
 * 
 *   console.log(collectionData);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getCollectionDataByCreatorAddress(args: {
    creatorAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs;
  }): Promise<GetCollectionDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });

    return getCollectionDataByCreatorAddress({ aptosConfig: this.config, ...args });
  }

/**
 * Queries data of a specific collection by the collection ID.
 * 
 * @param args.collectionId - The ID of the collection, which is the same as the address of the collection object.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional parameters for token standard and pagination.
 * @returns GetCollectionDataResponse - The response type containing the collection data.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching collection data using the collection ID
 *   const collection = await aptos.getCollectionDataByCollectionId({
 *     collectionId: "0x123", // replace with a real collection ID
 *   });
 * 
 *   console.log(collection);
 * }
 * runExample().catch(console.error);
 */


  async getCollectionDataByCollectionId(args: {
    collectionId: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg & PaginationArgs;
  }): Promise<GetCollectionDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getCollectionDataByCollectionId({ aptosConfig: this.config, ...args });
  }

/**
 * Queries the ID of a specified collection created by a given address.
 * This ID corresponds to the collection's object address in V2, while V1 does not utilize objects and lacks an address.
 *
 * @param args.creatorAddress - The address of the collection's creator.
 * @param args.collectionName - The name of the collection.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options.tokenStandard - The token standard to query.
 * @returns The collection ID.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Get the collection ID for a specific collection
 *   const collectionId = await aptos.getCollectionId({
 *     creatorAddress: "0x1", // replace with a real creator address
 *     collectionName: "myCollection",
 *   });
 *
 *   console.log("Collection ID:", collectionId);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getCollectionId(args: {
    creatorAddress: AccountAddressInput;
    collectionName: string;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg;
  }): Promise<string> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getCollectionId({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves digital asset data using the address of the digital asset.
 * 
 * @param args The parameters for retrieving digital asset data.
 * @param args.digitalAssetAddress The address of the digital asset.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @returns GetTokenDataResponse containing relevant data about the digital asset.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching digital asset data for a specific asset address
 *   const digitalAsset = await aptos.getDigitalAssetData({
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log(digitalAsset);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getDigitalAssetData(args: {
    digitalAssetAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetTokenDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getDigitalAssetData({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves the current ownership data of a specified digital asset.
 * 
 * @param args The parameters for the ownership query.
 * @param args.digitalAssetAddress The address of the digital asset.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * 
 * @returns GetCurrentTokenOwnershipResponse containing relevant ownership data of the digital asset.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the current ownership data for a digital asset
 *   const digitalAssetOwner = await aptos.getCurrentDigitalAssetOwnership({
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log(digitalAssetOwner);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getCurrentDigitalAssetOwnership(args: {
    digitalAssetAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetCurrentTokenOwnershipResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getCurrentDigitalAssetOwnership({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves the digital assets owned by a specified address.
 *
 * @param args.ownerAddress The address of the owner.
 * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
 * @param args.options Optional pagination and ordering parameters.
 * 
 * @returns GetOwnedTokensResponse containing ownership data of the digital assets belonging to the ownerAddress.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the digital assets owned by the specified address
 *   const digitalAssets = await aptos.getOwnedDigitalAssets({
 *     ownerAddress: "0x1", // replace with a real account address
 *   });
 * 
 *   console.log(digitalAssets);
 * }
 * runExample().catch(console.error);
 */


  async getOwnedDigitalAssets(args: {
    ownerAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetOwnedTokensResponse[0]>;
  }): Promise<GetOwnedTokensResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getOwnedDigitalAssets({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieves the activity data for a specified digital asset using its address.
 * 
 * @param args.digitalAssetAddress - The address of the digital asset.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional pagination and ordering parameters for the activity data.
 * 
 * @returns A promise that resolves to a GetTokenActivityResponse containing relevant activity data for the digital asset.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the activity data for a digital asset
 *   const digitalAssetActivity = await aptos.getDigitalAssetActivity({
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log(digitalAssetActivity);
 * }
 * runExample().catch(console.error);
 */


  async getDigitalAssetActivity(args: {
    digitalAssetAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetTokenActivityResponse[0]>;
  }): Promise<GetTokenActivityResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    return getDigitalAssetActivity({ aptosConfig: this.config, ...args });
  }

/**
 * Creates a new collection within the specified account.
 * 
 * @param args.creator - The account of the collection's creator.
 * @param args.description - The description of the collection.
 * @param args.name - The name of the collection.
 * @param args.uri - The URI to additional info about the collection.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * The parameters below are optional:
 * @param args.maxSupply - Controls the max supply of the digital assets - defaults to MAX_U64_BIG_INT.
 * @param args.mutableDescription - Controls mutability of the collection's description - defaults to true.
 * @param args.mutableRoyalty - Controls mutability of the collection's royalty - defaults to true.
 * @param args.mutableUri - Controls mutability of the collection's URI - defaults to true.
 * @param args.mutableTokenDescription - Controls mutability of the digital asset's description - defaults to true.
 * @param args.mutableTokenName - Controls mutability of the digital asset's name - defaults to true.
 * @param args.mutableTokenProperties - Controls mutability of digital asset's properties - defaults to true.
 * @param args.mutableTokenUri - Controls mutability of the digital asset's URI - defaults to true.
 * @param args.tokensBurnableByCreator - Controls whether digital assets can be burnable by the creator - defaults to true.
 * @param args.tokensFreezableByCreator - Controls whether digital assets can be frozen by the creator - defaults to true.
 * @param args.royaltyNumerator - The numerator of the royalty to be paid to the creator when a digital asset is transferred - defaults to 0.
 * @param args.royaltyDenominator - The denominator of the royalty to be paid to the creator when a digital asset is transferred - defaults to 1.
 * 
 * @returns A SimpleTransaction that when submitted will create the collection.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Creating a new collection transaction
 *   const transaction = await aptos.createCollectionTransaction({
 *     creator: Account.generate(), // replace with a real account
 *     description: "A unique collection of digital assets.",
 *     name: "My Digital Collection",
 *     uri: "https://collection-uri.com",
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async createCollectionTransaction(
    args: {
      creator: Account;
      description: string;
      name: string;
      uri: string;
      options?: InputGenerateTransactionOptions;
    } & CreateCollectionOptions,
  ): Promise<SimpleTransaction> {
    return createCollectionTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Create a transaction to mint a digital asset into the creator's account within an existing collection.
 * 
 * @param args - The parameters for minting the digital asset.
 * @param args.creator - The creator of the collection.
 * @param args.collection - The name of the collection the digital asset belongs to.
 * @param args.description - The description of the digital asset.
 * @param args.name - The name of the digital asset.
 * @param args.uri - The URI to additional info about the digital asset.
 * @param args.propertyKeys - Optional array of property keys for the digital asset.
 * @param args.propertyTypes - Optional array of property types for the digital asset.
 * @param args.propertyValues - Optional array of property values for the digital asset.
 * @param args.options - Optional transaction generation options.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account if needed
 * 
 *   // Create a transaction to mint a digital asset
 *   const transaction = await aptos.mintDigitalAssetTransaction({
 *     creator: alice,
 *     collection: "MyCollection",
 *     description: "This is a digital asset.",
 *     name: "MyDigitalAsset",
 *     uri: "https://example.com/my-digital-asset",
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 */


  async mintDigitalAssetTransaction(args: {
    creator: Account;
    collection: string;
    description: string;
    name: string;
    uri: string;
    propertyKeys?: Array<string>;
    propertyTypes?: Array<PropertyType>;
    propertyValues?: Array<PropertyValue>;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return mintDigitalAssetTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Transfer ownership of a digital asset (non-fungible digital asset).
 * Ensure that the digital asset is not frozen, as ownership transfer is disabled for certain types of assets.
 *
 * @param args The arguments for the transfer operation.
 * @param args.sender The sender account of the current digital asset owner.
 * @param args.digitalAssetAddress The digital asset address.
 * @param args.recipient The recipient account address.
 * @param args.digitalAssetType Optional. The digital asset type, defaults to "0x4::token::Token".
 * @param args.options Optional. Additional options for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   const sender = Account.generate(); // Replace with a real sender account
 *   const recipient = "0x456"; // Replace with a real recipient account
 *   const digitalAssetAddress = "0x123"; // Replace with a real digital asset address
 *
 *   // Transfer ownership of the digital asset
 *   const transaction = await aptos.transferDigitalAssetTransaction({
 *     sender,
 *     digitalAssetAddress,
 *     recipient,
 *   });
 *
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async transferDigitalAssetTransaction(args: {
    sender: Account;
    digitalAssetAddress: AccountAddressInput;
    recipient: AccountAddress;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return transferDigitalAssetTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Mint a soul bound digital asset into a recipient's account.
 * This function allows you to create a unique digital asset that is permanently tied to a specific account.
 *
 * @param args The arguments for minting the soul bound transaction.
 * @param args.account The account that mints the digital asset.
 * @param args.collection The collection name that the digital asset belongs to.
 * @param args.description The digital asset description.
 * @param args.name The digital asset name.
 * @param args.uri The digital asset URL.
 * @param args.recipient The account address where the digital asset will be created.
 * @param args.propertyKeys The property keys for storing on-chain properties.
 * @param args.propertyTypes The type of property values.
 * @param args.propertyValues The property values to be stored on-chain.
 * @param args.options Optional parameters for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const alice = Account.generate(); // Replace with a real account if needed
 * const recipient = "0x123"; // Replace with a real recipient address
 * 
 * async function runExample() {
 *   // Mint a soul bound digital asset
 *   const transaction = await aptos.mintSoulBoundTransaction({
 *     account: alice,
 *     collection: "collectionName",
 *     description: "collectionDescription",
 *     name: "digitalAssetName",
 *     uri: "digital-asset-uri.com",
 *     recipient: recipient,
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async mintSoulBoundTransaction(args: {
    account: Account;
    collection: string;
    description: string;
    name: string;
    uri: string;
    recipient: AccountAddressInput;
    propertyKeys?: Array<string>;
    propertyTypes?: Array<PropertyType>;
    propertyValues?: Array<PropertyValue>;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return mintSoulBoundTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Burn a digital asset by its creator, allowing for the removal of a specific digital asset from circulation.
 * 
 * @param args The arguments for burning the digital asset.
 * @param args.creator The creator account responsible for the digital asset.
 * @param args.digitalAssetAddress The address of the digital asset to be burned.
 * @param args.digitalAssetType Optional. The type of the digital asset being burned.
 * @param args.options Optional. Additional options for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account
 * 
 *   // Burn a digital asset created by Alice
 *   const transaction = await aptos.burnDigitalAssetTransaction({
 *     creator: alice,
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log("Transaction to burn digital asset:", transaction);
 * }
 * runExample().catch(console.error);
 */


  async burnDigitalAssetTransaction(args: {
    creator: Account;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return burnDigitalAssetTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Freeze the ability to transfer a digital asset.
 *
 * This function allows you to prevent further transfers of a specified digital asset by freezing its transfer capability.
 *
 * @param args The arguments for freezing the digital asset transfer.
 * @param args.creator The creator account that is initiating the freeze.
 * @param args.digitalAssetAddress The address of the digital asset to be frozen.
 * @param args.digitalAssetType Optional. The type of the digital asset, represented as a Move struct ID.
 * @param args.options Optional. Additional options for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const creator = Account.generate(); // replace with a real account if needed
 *   const digitalAssetAddress = "0x123"; // replace with a real digital asset address
 * 
 *   // Freeze the digital asset transfer
 *   const transaction = await aptos.freezeDigitalAssetTransaferTransaction({
 *     creator,
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async freezeDigitalAssetTransaferTransaction(args: {
    creator: Account;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return freezeDigitalAssetTransferTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Unfreezes the ability to transfer a digital asset.
 * This function allows you to enable the transfer of a previously frozen digital asset.
 * 
 * @param args The parameters for unfreezing the digital asset transfer.
 * @param args.creator The creator account that is unfreezing the asset.
 * @param args.digitalAssetAddress The address of the digital asset to unfreeze.
 * @param args.digitalAssetType Optional. The type of the digital asset being unfreezed.
 * @param args.options Optional. Additional options for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account if needed
 * 
 *   const transaction = await aptos.unfreezeDigitalAssetTransaferTransaction({
 *     creator: alice,
 *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async unfreezeDigitalAssetTransaferTransaction(args: {
    creator: Account;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return unfreezeDigitalAssetTransferTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Set the digital asset description to provide additional context or information about the asset.
 * 
 * @param args The parameters for setting the digital asset description.
 * @param args.creator The creator account responsible for the digital asset.
 * @param args.description The digital asset description to be set.
 * @param args.digitalAssetAddress The address of the digital asset.
 * @param args.digitalAssetType Optional. The type of the digital asset, represented as a Move struct ID.
 * @param args.options Optional. Additional options for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const creator = Account.generate(); // Generate a new account for the creator
 * 
 *   const transaction = await aptos.setDigitalAssetDescriptionTransaction({
 *     creator: creator,
 *     description: "This is a digital asset description.",
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 */


  async setDigitalAssetDescriptionTransaction(args: {
    creator: Account;
    description: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return setDigitalAssetDescriptionTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Set the digital asset name by creating a transaction that can be simulated or submitted to the blockchain.
 * 
 * @param args The parameters for setting the digital asset name.
 * @param args.creator The creator account.
 * @param args.name The digital asset name.
 * @param args.digitalAssetAddress The digital asset address.
 * @param args.digitalAssetType Optional. The type of the digital asset.
 * @param args.options Optional. Additional options for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Setting the digital asset name
 *   const transaction = await aptos.setDigitalAssetNameTransaction({
 *     creator: Account.generate(), // Replace with a real creator account
 *     name: "digitalAssetName",
 *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async setDigitalAssetNameTransaction(args: {
    creator: Account;
    name: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return setDigitalAssetNameTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Set the URI for a digital asset, allowing you to associate a specific URI with it.
 *
 * @param args The parameters for setting the digital asset URI.
 * @param args.creator The creator account responsible for setting the URI.
 * @param args.uri The digital asset URI to be set.
 * @param args.digitalAssetAddress The address of the digital asset.
 * @param args.digitalAssetType Optional. The type of the digital asset.
 * @param args.options Optional. Additional options for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const creator = Account.generate(); // Replace with a real account
 *   const digitalAssetAddress = "0x123"; // Replace with a real digital asset address
 * 
 *   // Set the digital asset URI
 *   const transaction = await aptos.setDigitalAssetURITransaction({
 *     creator,
 *     uri: "digital-asset-uri.com",
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async setDigitalAssetURITransaction(args: {
    creator: Account;
    uri: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return setDigitalAssetURITransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Add a digital asset property to the blockchain.
 * 
 * @param args - The arguments for adding the digital asset property.
 * @param args.creator - The account that mints the digital asset.
 * @param args.propertyKey - The property key for storing on-chain properties.
 * @param args.propertyType - The type of property value.
 * @param args.propertyValue - The property value to be stored on-chain.
 * @param args.digitalAssetAddress - The digital asset address.
 * @param args.digitalAssetType - The optional type of the digital asset.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account if needed
 * 
 *   // This function adds a digital asset property
 *   const transaction = await aptos.addDigitalAssetPropertyTransaction({
 *     creator: alice,
 *     propertyKey: "newKey",
 *     propertyType: "BOOLEAN",
 *     propertyValue: true,
 *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async addDigitalAssetPropertyTransaction(args: {
    creator: Account;
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return addDigitalAssetPropertyTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Remove a digital asset property from the blockchain.
 * This function allows you to specify the property key, type, and value to be removed from a digital asset.
 * 
 * @param args - The arguments for removing the digital asset property.
 * @param args.creator - The account that mints the digital asset.
 * @param args.propertyKey - The property key for storing on-chain properties.
 * @param args.propertyType - The type of property value.
 * @param args.propertyValue - The property value to be stored on-chain.
 * @param args.digitalAssetAddress - The digital asset address.
 * @param args.digitalAssetType - (Optional) The type of the digital asset.
 * @param args.options - (Optional) Options for generating the transaction.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account if needed
 * 
 *   const transaction = await aptos.removeDigitalAssetPropertyTransaction({
 *     creator: alice,
 *     propertyKey: "newKey",
 *     propertyType: "BOOLEAN",
 *     propertyValue: true,
 *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async removeDigitalAssetPropertyTransaction(args: {
    creator: Account;
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return removeDigitalAssetPropertyTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Update a digital asset property by modifying its on-chain attributes.
 *
 * @param args - The parameters for updating the digital asset property.
 * @param args.creator - The account that mints the digital asset.
 * @param args.propertyKey - The property key for storing on-chain properties.
 * @param args.propertyType - The type of property value.
 * @param args.propertyValue - The property value to be stored on-chain.
 * @param args.digitalAssetAddress - The digital asset address.
 * @param args.digitalAssetType - The optional Move struct ID for the digital asset type.
 * @param args.options - Optional parameters for generating the transaction.
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   const alice = Account.generate(); // Replace with a real account if needed
 *   
 *   // Update a digital asset property
 *   const transaction = await aptos.updateDigitalAssetPropertyTransaction({
 *     creator: alice,
 *     propertyKey: "newKey",
 *     propertyType: "BOOLEAN",
 *     propertyValue: false,
 *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
 *   });
 *   
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async updateDigitalAssetPropertyTransaction(args: {
    creator: Account;
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return updateDigitalAssetPropertyTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Add a typed digital asset property to the blockchain.
 * This function allows you to associate a specific typed property with a digital asset, facilitating better asset management.
 * 
 * @param args - The arguments for adding a typed property.
 * @param args.creator - The account that mints the digital asset.
 * @param args.propertyKey - The property key for storing on-chain properties.
 * @param args.propertyType - The type of property value.
 * @param args.propertyValue - The property value to be stored on-chain.
 * @param args.digitalAssetAddress - The digital asset address.
 * @param args.digitalAssetType - Optional; the type of the digital asset.
 * @param args.options - Optional; additional transaction options.
 * 
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const creator = Account.generate(); // Generate a new account for the creator
 *   const digitalAssetAddress = "0x123"; // Replace with a real digital asset address
 * 
 *   const transaction = await aptos.addDigitalAssetTypedPropertyTransaction({
 *     creator,
 *     propertyKey: "typedKey",
 *     propertyType: "STRING",
 *     propertyValue: "hello",
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log(transaction); // Log the transaction to verify it worked
 * }
 * runExample().catch(console.error);
 * ```
 */


  async addDigitalAssetTypedPropertyTransaction(args: {
    creator: Account;
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return addDigitalAssetTypedPropertyTransaction({ aptosConfig: this.config, ...args });
  }

/**
 * Update a typed digital asset property on-chain.
 * This function allows you to modify the properties of a digital asset, enabling dynamic updates to its metadata.
 *
 * @param args The parameters for updating the digital asset property.
 * @param args.creator The account that mints the digital asset.
 * @param args.propertyKey The property key for storing on-chain properties.
 * @param args.propertyType The type of property value.
 * @param args.propertyValue The property value to be stored on-chain.
 * @param args.digitalAssetAddress The digital asset address.
 * @param args.digitalAssetType Optional. The type of the digital asset.
 * @param args.options Optional. Additional options for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transaction = await aptos.updateDigitalAssetTypedPropertyTransaction({
 *     creator: Account.generate(), // replace with a real account
 *     propertyKey: "typedKey",
 *     propertyType: "U8",
 *     propertyValue: 2,
 *     digitalAssetAddress: "0x123", // replace with a real digital asset address
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 */


  async updateDigitalAssetTypedPropertyTransaction(args: {
    creator: Account;
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }) {
    return updateDigitalAssetTypedPropertyTransaction({ aptosConfig: this.config, ...args });
  }
}