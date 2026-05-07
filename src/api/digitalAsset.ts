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
 * @group DigitalAsset
 */
export class DigitalAsset {
  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your desired network
   *
   *     // Initialize the Aptos client with the configuration
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
   */
  constructor(readonly config: AptosConfig) {}

  /**
   * Queries data of a specific collection by the collection creator address and the collection name.
   * This function is deprecated; use `getCollectionDataByCreatorAddressAndCollectionName` instead.
   *
   * If a creator account has two collections with the same name in v1 and v2, you can pass an optional `tokenStandard` parameter
   * to query a specific standard.
   *
   * @param args - The arguments for querying the collection data.
   * @param args.creatorAddress - The address of the collection's creator.
   * @param args.collectionName - The name of the collection.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @param args.options - Optional parameters for the query.
   * @param args.options.tokenStandard - The token standard to query.
   * @returns GetCollectionDataResponse - The response type containing the collection data.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Querying collection data by creator address and collection name
   *   const collection = await aptos.getCollectionData({
   *     creatorAddress: "0x1", // replace with a real creator address
   *     collectionName: "myCollection", // specify your collection name
   *   });
   *
   *   console.log(collection);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * If a creator account has multiple collections with the same name across different versions,
   * specify the `tokenStandard` parameter to query a specific standard.
   *
   * @param args.creatorAddress - The address of the collection's creator.
   * @param args.collectionName - The name of the collection.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @param args.options.tokenStandard - Optional token standard to query.
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
   *   // Fetching collection data by creator address and collection name
   *   const collection = await aptos.getCollectionDataByCreatorAddressAndCollectionName({
   *     creatorAddress: "0x1", // replace with a real creator address
   *     collectionName: "myCollection",
   *     minimumLedgerVersion: 1, // optional, specify if needed
   *     options: { tokenStandard: "v2" } // optional, specify if needed
   *   });
   *
   *   console.log(collection);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Retrieves data for a specific collection created by a given creator address.
   * This function allows you to query collection data while optionally specifying a minimum ledger version and pagination options.
   *
   * @param args.creatorAddress - The address of the collection's creator.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @param args.options.tokenStandard - Optional token standard to query.
   * @param args.options.pagination - Optional pagination arguments.
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
   *   // Retrieve collection data by creator address
   *   const collectionData = await aptos.getCollectionDataByCreatorAddress({
   *     creatorAddress: "0x1", // replace with a real creator address
   *     minimumLedgerVersion: 1, // specify the minimum ledger version if needed
   *     options: {
   *       tokenStandard: "v2", // specify the token standard if needed
   *       pagination: { limit: 10, offset: 0 } // specify pagination options if needed
   *     }
   *   });
   *
   *   console.log(collectionData);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching collection data by collection ID
   *   const collection = await aptos.getCollectionDataByCollectionId({
   *     collectionId: "0x123", // replace with a real collection ID
   *   });
   *
   *   console.log(collection);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Queries the ID of a specified collection.
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
   *   // Fetching the collection ID for a specific creator and collection name
   *   const collectionId = await aptos.getCollectionId({
   *     creatorAddress: "0x1", // replace with a real creator address
   *     collectionName: "myCollection"
   *   });
   *
   *   console.log("Collection ID:", collectionId);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Retrieves digital asset data using the address of a digital asset.
   *
   * @param args - The parameters for the request.
   * @param args.digitalAssetAddress - The address of the digital asset.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @returns GetTokenDataResponse containing relevant data for the digital asset.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching digital asset data for a specific address
   *   const digitalAsset = await aptos.getDigitalAssetData({
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(digitalAsset);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Retrieves the current ownership data of a specified digital asset using its address.
   *
   * @param args The parameters for the request.
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
   *   // Getting the current ownership of a digital asset
   *   const digitalAssetOwner = await aptos.getCurrentDigitalAssetOwnership({
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(digitalAssetOwner);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * @param args.options Optional pagination and ordering parameters for the response.
   *
   * @returns GetOwnedTokensResponse containing ownership data of the digital assets belonging to the ownerAddress.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching the digital assets owned by the specified address
   *   const digitalAssets = await aptos.getOwnedDigitalAssets({
   *     ownerAddress: "0x1", // replace with a real account address
   *   });
   *
   *   console.log(digitalAssets);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * @param args - The parameters for the request.
   * @param args.digitalAssetAddress - The address of the digital asset.
   * @param args.minimumLedgerVersion - Optional minimum ledger version to sync up to before querying.
   * @param args.options - Optional pagination and ordering parameters.
   *
   * @returns A promise that resolves to the activity data related to the digital asset.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Get the activity data for a digital asset
   *   const digitalAssetActivity = await aptos.getDigitalAssetActivity({
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(digitalAssetActivity);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * @param args.maxSupply - Controls the max supply of the digital assets. Defaults to MAX_U64_BIG_INT.
   * @param args.mutableDescription - Controls mutability of the collection's description. Defaults to true.
   * @param args.mutableRoyalty - Controls mutability of the collection's royalty. Defaults to true.
   * @param args.mutableUri - Controls mutability of the collection's URI. Defaults to true.
   * @param args.mutableTokenDescription - Controls mutability of the digital asset's description. Defaults to true.
   * @param args.mutableTokenName - Controls mutability of the digital asset's name. Defaults to true.
   * @param args.mutableTokenProperties - Controls mutability of digital asset's properties. Defaults to true.
   * @param args.mutableTokenUri - Controls mutability of the digital asset's URI. Defaults to true.
   * @param args.tokensBurnableByCreator - Controls whether digital assets can be burnable by the creator. Defaults to true.
   * @param args.tokensFreezableByCreator - Controls whether digital assets can be frozen by the creator. Defaults to true.
   * @param args.royaltyNumerator - The numerator of the royalty to be paid to the creator when a digital asset is transferred.
   * Defaults to 0.
   * @param args.royaltyDenominator - The denominator of the royalty to be paid to the creator when a digital asset is
   * transferred. Defaults to 1.
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
   *     creator: Account.generate(), // Replace with a real account
   *     description: "A unique collection of digital assets.",
   *     name: "My Digital Collection",
   *     uri: "https://mycollection.com",
   *   });
   *
   *   console.log("Transaction created:", transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * This function helps you generate a transaction that can be simulated or submitted to the blockchain for minting a digital asset.
   *
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
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Creating a transaction to mint a digital asset
   *   const transaction = await aptos.mintDigitalAssetTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     collection: "MyCollection",
   *     description: "This is a digital asset.",
   *     name: "MyDigitalAsset",
   *     uri: "https://example.com/my-digital-asset",
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Transfer ownership of a non-fungible digital asset.
   * This function allows you to transfer a digital asset only if it is not frozen, meaning the ownership transfer is not disabled.
   *
   * @param args The arguments for transferring the digital asset.
   * @param args.sender The sender account of the current digital asset owner.
   * @param args.digitalAssetAddress The address of the digital asset being transferred.
   * @param args.recipient The account address of the recipient.
   * @param args.digitalAssetType Optional. The type of the digital asset, defaults to "0x4::token::Token".
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
   *   // Transfer a digital asset
   *   const transaction = await aptos.transferDigitalAssetTransaction({
   *     sender: Account.generate(), // replace with a real sender account
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *     recipient: "0x456", // replace with a real recipient account address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * This function allows you to create a unique digital asset that is bound to a specific account.
   *
   * @param args - The arguments for minting the soul bound transaction.
   * @param args.account - The account that mints the digital asset.
   * @param args.collection - The collection name that the digital asset belongs to.
   * @param args.description - The digital asset description.
   * @param args.name - The digital asset name.
   * @param args.uri - The digital asset URL.
   * @param args.recipient - The account address where the digital asset will be created.
   * @param args.propertyKeys - The property keys for storing on-chain properties.
   * @param args.propertyTypes - The type of property values.
   * @param args.propertyValues - The property values to be stored on-chain.
   * @param args.options - Additional options for generating the transaction.
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
   *   // Mint a soul bound digital asset
   *   const transaction = await aptos.mintSoulBoundTransaction({
   *     account: Account.generate(), // Replace with a real account
   *     collection: "collectionName",
   *     description: "collectionDescription",
   *     name: "digitalAssetName",
   *     uri: "digital-asset-uri.com",
   *     recipient: "0x123" // Replace with a real recipient account address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Burn a digital asset by its creator, allowing for the removal of a specified digital asset from the blockchain.
   *
   * @param args The arguments for burning the digital asset.
   * @param args.creator The creator account that is burning the digital asset.
   * @param args.digitalAssetAddress The address of the digital asset to be burned.
   * @param args.digitalAssetType Optional. The type of the digital asset being burned.
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
   *   const creator = Account.generate(); // Replace with a real creator account
   *   const transaction = await aptos.burnDigitalAssetTransaction({
   *     creator: creator,
   *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Freeze the ability to transfer a specified digital asset.
   * This function allows the creator to restrict the transfer capability of a digital asset.
   *
   * @param args The arguments for freezing the digital asset transfer.
   * @param args.creator The creator account initiating the freeze.
   * @param args.digitalAssetAddress The address of the digital asset to be frozen.
   * @param args.digitalAssetType Optional. The type of the digital asset being frozen.
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
   *   // Freeze the digital asset transfer
   *   const transaction = await aptos.freezeDigitalAssetTransaferTransaction({
   *     creator: Account.generate(), // Replace with a real account if needed
   *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Unfreeze the ability to transfer a digital asset.
   * This function allows the specified creator account to unfreeze the transfer of a digital asset identified by its address.
   *
   * @param args The parameters for unfreezing the digital asset transfer.
   * @param args.creator The creator account that is unfreezing the digital asset transfer.
   * @param args.digitalAssetAddress The address of the digital asset to unfreeze.
   * @param args.digitalAssetType Optional. The type of the digital asset being unfrozen.
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
   *   // Unfreeze the ability to transfer a digital asset
   *   const transaction = await aptos.unfreezeDigitalAssetTransaferTransaction({
   *     creator: Account.generate(), // replace with a real creator account
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
   */
  // TODO: Rename Transafer to Transfer
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
   *   // Set the digital asset description
   *   const transaction = await aptos.setDigitalAssetDescriptionTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     description: "This is a digital asset description.",
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Set the digital asset name, allowing you to define a name for a specific digital asset on the blockchain.
   *
   * @param args The parameters for setting the digital asset name.
   * @param args.creator The creator account responsible for the transaction.
   * @param args.name The desired name for the digital asset.
   * @param args.digitalAssetAddress The address of the digital asset.
   * @param args.digitalAssetType Optional. The type of the digital asset, represented as a Move struct ID.
   * @param args.options Optional. Additional options for generating the transaction.
   *
   * @returns A SimpleTransaction that can be simulated or submitted to the blockchain.
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
   *   const digitalAssetAddress = "0x123"; // replace with a real digital asset address
   *
   *   // Set the digital asset name
   *   const transaction = await aptos.setDigitalAssetNameTransaction({
   *     creator: creator,
   *     name: "digitalAssetName",
   *     digitalAssetAddress: digitalAssetAddress,
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Set the URI for a digital asset, allowing you to associate a unique identifier with the asset.
   *
   * @param args The parameters for the transaction.
   * @param args.creator The creator account initiating the transaction.
   * @param args.uri The digital asset URI to be set.
   * @param args.digitalAssetAddress The address of the digital asset.
   * @param args.digitalAssetType Optional. The type of the digital asset.
   * @param args.options Optional. Additional options for generating the transaction.
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
   *   // Set the URI for a digital asset
   *   const transaction = await aptos.setDigitalAssetURITransaction({
   *     creator: Account.generate(), // Replace with a real creator account
   *     uri: "digital-asset-uri.com",
   *     digitalAssetAddress: "0x123", // Replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * This function allows you to specify a new property for a digital asset, including its key, type, and value.
   *
   * @param args - The arguments for adding a digital asset property.
   * @param args.creator - The account that mints the digital asset.
   * @param args.propertyKey - The property key for storing on-chain properties.
   * @param args.propertyType - The type of property value.
   * @param args.propertyValue - The property value to be stored on-chain.
   * @param args.digitalAssetAddress - The digital asset address.
   * @param args.digitalAssetType - (Optional) The type of the digital asset.
   * @param args.options - (Optional) Options for generating the transaction.
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
   *   // Add a digital asset property
   *   const transaction = await aptos.addDigitalAssetPropertyTransaction({
   *     creator: Account.generate(), // Replace with a real account
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
   * @group DigitalAsset
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
   * This function allows you to delete an existing property associated with a digital asset.
   *
   * @param args The parameters required to remove the digital asset property.
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
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Remove a digital asset property
   *   const transaction = await aptos.removeDigitalAssetPropertyTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     propertyKey: "newKey",
   *     propertyType: "BOOLEAN",
   *     propertyValue: true,
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * Update a digital asset property on-chain.
   *
   * @param args The parameters for updating the digital asset property.
   * @param args.creator The account that mints the digital asset.
   * @param args.digitalAssetAddress The address of the digital asset.
   * @param args.propertyKey The property key for storing on-chain properties.
   * @param args.propertyType The type of property value.
   * @param args.propertyValue The property value to be stored on-chain.
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
   *   // Update a digital asset property
   *   const transaction = await aptos.updateDigitalAssetPropertyTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     propertyKey: "newKey",
   *     propertyType: "BOOLEAN",
   *     propertyValue: false,
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * This function allows you to define and store a specific property for a digital asset, enabling better categorization and
   * management of digital assets.
   *
   * @param args - The parameters for adding the typed property.
   * @param args.creator - The account that mints the digital asset.
   * @param args.propertyKey - The property key for storing on-chain properties.
   * @param args.propertyType - The type of property value.
   * @param args.propertyValue - The property value to be stored on-chain.
   * @param args.digitalAssetAddress - The digital asset address.
   * @param args.digitalAssetType - The optional type of the digital asset.
   * @param args.options - Optional transaction generation options.
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
   *   // Adding a typed digital asset property
   *   const transaction = await aptos.addDigitalAssetTypedPropertyTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     propertyKey: "typedKey",
   *     propertyType: "STRING",
   *     propertyValue: "hello",
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
   * This function allows you to modify the properties of a digital asset, enabling dynamic updates to its attributes.
   *
   * @param args - The arguments for updating the digital asset property.
   * @param args.creator - The account that mints the digital asset.
   * @param args.propertyKey - The property key for storing on-chain properties.
   * @param args.propertyType - The type of property value.
   * @param args.propertyValue - The property value to be stored on-chain.
   * @param args.digitalAssetAddress - The digital asset address.
   * @param args.digitalAssetType - (Optional) The type of the digital asset.
   * @param args.options - (Optional) Additional options for generating the transaction.
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
   *   // Update a typed digital asset property
   *   const transaction = await aptos.updateDigitalAssetTypedPropertyTransaction({
   *     creator: Account.generate(), // replace with a real account
   *     propertyKey: "typedKey",
   *     propertyType: "U8",
   *     propertyValue: 2,
   *     digitalAssetAddress: "0x123", // replace with a real digital asset address
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group DigitalAsset
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
