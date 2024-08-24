// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/digitalAsset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * digitalAsset namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Bool, MoveString, MoveVector, U64 } from "../bcs";
import { AccountAddress, AccountAddressInput } from "../core";
import { Account } from "../account";
import { EntryFunctionABI, InputGenerateTransactionOptions } from "../transactions/types";
import {
  AnyNumber,
  GetCollectionDataResponse,
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  MoveAbility,
  MoveStructId,
  OrderByArg,
  PaginationArgs,
  TokenStandardArg,
  WhereArg,
} from "../types";
import {
  GetCollectionDataQuery,
  GetCurrentTokenOwnershipQuery,
  GetTokenActivityQuery,
  GetTokenDataQuery,
} from "../types/generated/operations";
import {
  GetCollectionData,
  GetCurrentTokenOwnership,
  GetTokenActivity,
  GetTokenData,
} from "../types/generated/queries";
import { queryIndexer } from "./general";
import { generateTransaction } from "./transactionSubmission";
import { MAX_U64_BIG_INT } from "../bcs/consts";
import {
  CurrentCollectionsV2BoolExp,
  CurrentTokenOwnershipsV2BoolExp,
  TokenActivitiesV2BoolExp,
} from "../types/generated/types";
import {
  checkOrConvertArgument,
  objectStructTag,
  parseTypeTag,
  stringStructTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagGeneric,
  TypeTagStruct,
  TypeTagU64,
  TypeTagVector,
} from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

// A property type map for the user input and what Move expects
const PropertyTypeMap = {
  BOOLEAN: "bool",
  U8: "u8",
  U16: "u16",
  U32: "u32",
  U64: "u64",
  U128: "u128",
  U256: "u256",
  ADDRESS: "address",
  STRING: "0x1::string::String",
  ARRAY: "vector<u8>",
};

export type PropertyType = keyof typeof PropertyTypeMap;

// Accepted property value types for user input
// To pass in an Array, use Uint8Array type
// for example `new MoveVector([new MoveString("hello"), new MoveString("world")]).bcsToBytes()`
export type PropertyValue = boolean | number | bigint | string | AccountAddress | Uint8Array;

// The default digital asset type to use if non provided
const defaultDigitalAssetType = "0x4::token::Token";

// FETCH QUERIES

export async

/**
 * Retrieves the digital asset data for a specified asset address.
 * 
 * @param args - The arguments for retrieving the digital asset data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.digitalAssetAddress - The address of the digital asset to retrieve data for.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve digital asset data for a specified address
 *   const digitalAssetData = await aptos.digitalAsset.getDigitalAssetData({
 *     aptosConfig: config,
 *     digitalAssetAddress: "0x1" // replace with a real digital asset address
 *   });
 * 
 *   console.log(digitalAssetData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getDigitalAssetData(args: {
  aptosConfig: AptosConfig;
  digitalAssetAddress: AccountAddressInput;
}): Promise<GetTokenDataResponse> {
  const { aptosConfig, digitalAssetAddress } = args;

  const whereCondition: { token_data_id: { _eq: string } } = {
    token_data_id: { _eq: AccountAddress.from(digitalAssetAddress).toStringLong() },
  };

  const graphqlQuery = {
    query: GetTokenData,
    variables: {
      where_condition: whereCondition,
    },
  };

  const data = await queryIndexer<GetTokenDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getDigitalAssetData",
  });

  return data.current_token_datas_v2[0];
}

export async

/**
 * Retrieves the current ownership details of a specified digital asset.
 * 
 * @param args - The arguments for retrieving digital asset ownership.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.digitalAssetAddress - The address of the digital asset to query ownership for.
 * 
 * @returns The current ownership details of the specified digital asset.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 * 
 *   // Fetching current digital asset ownership
 *   const ownershipDetails = await aptos.digitalAsset.getCurrentDigitalAssetOwnership({
 *     aptosConfig: config,
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log(ownershipDetails);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCurrentDigitalAssetOwnership(args: {
  aptosConfig: AptosConfig;
  digitalAssetAddress: AccountAddressInput;
}): Promise<GetCurrentTokenOwnershipResponse> {
  const { aptosConfig, digitalAssetAddress } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    token_data_id: { _eq: AccountAddress.from(digitalAssetAddress).toStringLong() },
    amount: { _gt: 0 },
  };

  const graphqlQuery = {
    query: GetCurrentTokenOwnership,
    variables: {
      where_condition: whereCondition,
    },
  };

  const data = await queryIndexer<GetCurrentTokenOwnershipQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCurrentDigitalAssetOwnership",
  });

  return data.current_token_ownerships_v2[0];
}

export async

/**
 * Retrieves the digital assets owned by a specified address.
 * 
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.ownerAddress - The address of the owner whose digital assets are being queried.
 * @param args.options - Optional pagination and ordering parameters.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch the digital assets owned by the specified address
 *   const ownerAddress = "0x1"; // replace with a real account address
 *   const assets = await aptos.digitalAsset.getOwnedDigitalAssets({
 *     aptosConfig: config,
 *     ownerAddress,
 *     options: { limit: 10, offset: 0 }, // specify your pagination options if needed
 *   });
 * 
 *   console.log(assets);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getOwnedDigitalAssets(args: {
  aptosConfig: AptosConfig;
  ownerAddress: AccountAddressInput;
  options?: PaginationArgs & OrderByArg<GetTokenActivityResponse[0]>;
}): Promise<GetOwnedTokensResponse> {
  const { aptosConfig, ownerAddress, options } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    owner_address: { _eq: AccountAddress.from(ownerAddress).toStringLong() },
    amount: { _gt: 0 },
  };

  const graphqlQuery = {
    query: GetCurrentTokenOwnership,
    variables: {
      where_condition: whereCondition,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetCurrentTokenOwnershipQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getOwnedDigitalAssets",
  });

  return data.current_token_ownerships_v2;
}

export async

/**
 * Retrieves the activity associated with a specific digital asset.
 * This function allows you to track the interactions and transactions related to a digital asset.
 * 
 * @param args - The arguments for retrieving digital asset activity.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.digitalAssetAddress - The address of the digital asset to query.
 * @param args.options - Optional pagination and ordering parameters for the query.
 * @param args.options.offset - The number of records to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria by which to order the results.
 * 
 * @returns A promise that resolves to an array of token activities related to the specified digital asset.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 * 
 *   const activities = await aptos.digitalAsset.getDigitalAssetActivity({
 *     aptosConfig: config,
 *     digitalAssetAddress,
 *     options: {
 *       offset: 0,
 *       limit: 10,
 *       orderBy: { timestamp: "desc" }, // ordering by timestamp in descending order
 *     },
 *   });
 * 
 *   console.log(activities);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getDigitalAssetActivity(args: {
  aptosConfig: AptosConfig;
  digitalAssetAddress: AccountAddressInput;
  options?: PaginationArgs & OrderByArg<GetTokenActivityResponse[0]>;
}): Promise<GetTokenActivityResponse> {
  const { aptosConfig, digitalAssetAddress, options } = args;

  const whereCondition: TokenActivitiesV2BoolExp = {
    token_data_id: { _eq: AccountAddress.from(digitalAssetAddress).toStringLong() },
  };

  const graphqlQuery = {
    query: GetTokenActivity,
    variables: {
      where_condition: whereCondition,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetTokenActivityQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getDigitalAssetActivity",
  });

  return data.token_activities_v2;
}

export interface CreateCollectionOptions {
  maxSupply?: AnyNumber;
  mutableDescription?: boolean;
  mutableRoyalty?: boolean;
  mutableURI?: boolean;
  mutableTokenDescription?: boolean;
  mutableTokenName?: boolean;
  mutableTokenProperties?: boolean;
  mutableTokenURI?: boolean;
  tokensBurnableByCreator?: boolean;
  tokensFreezableByCreator?: boolean;
  royaltyNumerator?: number;
  royaltyDenominator?: number;
}

const createCollectionAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [
    new TypeTagStruct(stringStructTag()),
    new TypeTagU64(),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagBool(),
    new TypeTagU64(),
    new TypeTagU64(),
  ],
};

export async

/**
 * Creates a transaction to generate a new token collection on the Aptos blockchain.
 * This function allows users to define the properties of the collection, including its name, description, and various mutable options.
 * 
 * @param args - The parameters for creating the collection transaction.
 * @param args.aptosConfig - The configuration settings for connecting to the Aptos network.
 * @param args.creator - The account that will create the collection.
 * @param args.description - A description of the collection.
 * @param args.name - The name of the collection.
 * @param args.uri - A URI pointing to the collection's metadata.
 * @param args.options - Optional settings for generating the transaction.
 * @param args.maxSupply - The maximum supply of tokens in the collection (optional).
 * @param args.mutableDescription - Indicates if the description can be changed after creation (optional).
 * @param args.mutableRoyalty - Indicates if the royalty settings can be changed after creation (optional).
 * @param args.mutableURI - Indicates if the URI can be changed after creation (optional).
 * @param args.mutableTokenDescription - Indicates if the token description can be changed (optional).
 * @param args.mutableTokenName - Indicates if the token name can be changed (optional).
 * @param args.mutableTokenProperties - Indicates if the token properties can be changed (optional).
 * @param args.mutableTokenURI - Indicates if the token URI can be changed (optional).
 * @param args.tokensBurnableByCreator - Indicates if tokens can be burned by the creator (optional).
 * @param args.tokensFreezableByCreator - Indicates if tokens can be frozen by the creator (optional).
 * @param args.royaltyNumerator - The numerator for calculating royalties (optional).
 * @param args.royaltyDenominator - The denominator for calculating royalties (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Generate a new account for the creator
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.createCollectionTransaction({
 *     aptosConfig: config,
 *     creator: creator,
 *     description: "A collection of unique digital assets.",
 *     name: "Unique Assets",
 *     uri: "https://example.com/collection-metadata",
 *     maxSupply: 1000, // Specify the maximum supply of tokens
 *     mutableDescription: true,
 *     mutableRoyalty: true,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function createCollectionTransaction(
  args: {
    aptosConfig: AptosConfig;
    creator: Account;
    description: string;
    name: string;
    uri: string;
    options?: InputGenerateTransactionOptions;
  } & CreateCollectionOptions,
): Promise<SimpleTransaction> {
  const { aptosConfig, options, creator } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::create_collection",
      functionArguments: [
        // Do not change the order
        new MoveString(args.description),
        new U64(args.maxSupply ?? MAX_U64_BIG_INT),
        new MoveString(args.name),
        new MoveString(args.uri),
        new Bool(args.mutableDescription ?? true),
        new Bool(args.mutableRoyalty ?? true),
        new Bool(args.mutableURI ?? true),
        new Bool(args.mutableTokenDescription ?? true),
        new Bool(args.mutableTokenName ?? true),
        new Bool(args.mutableTokenProperties ?? true),
        new Bool(args.mutableTokenURI ?? true),
        new Bool(args.tokensBurnableByCreator ?? true),
        new Bool(args.tokensFreezableByCreator ?? true),
        new U64(args.royaltyNumerator ?? 0),
        new U64(args.royaltyDenominator ?? 1),
      ],
      abi: createCollectionAbi,
    },
    options,
  });
}

export async

/**
 * Retrieves the current collection data based on specified options.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - The token standard to filter by, defaults to "v2" if not specified.
 * @param args.options.where - Conditions to filter the collections.
 * @param args.options.offset - The offset for pagination.
 * @param args.options.limit - The limit for pagination.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching current collection data with default token standard
 *   const collectionData = await aptos.getCollectionData({
 *     aptosConfig: config,
 *     options: {
 *       tokenStandard: "v2", // specify your token standard if needed
 *       limit: 10, // limit the number of results
 *       offset: 0, // start from the first result
 *     },
 *   });
 * 
 *   console.log(collectionData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCollectionData(args: {
  aptosConfig: AptosConfig;
  options?: TokenStandardArg & PaginationArgs & WhereArg<CurrentCollectionsV2BoolExp>;
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, options } = args;

  const whereCondition: any = options?.where;

  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
  }

  const graphqlQuery = {
    query: GetCollectionData,
    variables: {
      where_condition: whereCondition,
      offset: options?.offset,
      limit: options?.limit,
    },
  };
  const data = await queryIndexer<GetCollectionDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCollectionData",
  });

  return data.current_collections_v2[0];
}

export async

/**
 * Retrieves collection data for a specific creator and collection name.
 * 
 * @param args - The parameters required to fetch the collection data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.creatorAddress - The address of the creator of the collection.
 * @param args.collectionName - The name of the collection to retrieve data for.
 * @param args.options - Optional parameters for specifying token standards and pagination.
 * @param args.options.tokenStandard - The token standard to filter the collection data (default is "v2").
 * @param args.options.pagination - Pagination options for the results.
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
 *   const collectionData = await aptos.getCollectionDataByCreatorAddressAndCollectionName({
 *     aptosConfig: config,
 *     creatorAddress: "0x1", // replace with a real creator address
 *     collectionName: "MyCollection", // specify the collection name
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
 */
 function getCollectionDataByCreatorAddressAndCollectionName(args: {
  aptosConfig: AptosConfig;
  creatorAddress: AccountAddressInput;
  collectionName: string;
  options?: TokenStandardArg & PaginationArgs;
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, creatorAddress, collectionName, options } = args;
  const address = AccountAddress.from(creatorAddress);

  const whereCondition: any = {
    collection_name: { _eq: collectionName },
    creator_address: { _eq: address.toStringLong() },
  };
  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
  }

  return getCollectionData({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves collection data associated with a specific creator address.
 * This function allows you to filter collections by the creator's address and optionally by token standard.
 * 
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.creatorAddress - The address of the creator whose collections you want to retrieve.
 * @param args.options - Optional parameters for filtering the results.
 * @param args.options.tokenStandard - The token standard to filter by (e.g., "v2").
 * @param args.options.pagination - Pagination options for the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve collection data for a specific creator address
 *   const creatorAddress = "0x1"; // replace with a real creator address
 *   const collectionData = await aptos.collection.getCollectionDataByCreatorAddress({
 *     aptosConfig: config,
 *     creatorAddress,
 *     options: {
 *       tokenStandard: "v2", // specify your own token standard if needed
 *     },
 *   });
 * 
 *   console.log(collectionData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCollectionDataByCreatorAddress(args: {
  aptosConfig: AptosConfig;
  creatorAddress: AccountAddressInput;
  options?: TokenStandardArg & PaginationArgs;
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, creatorAddress, options } = args;
  const address = AccountAddress.from(creatorAddress);

  const whereCondition: any = {
    creator_address: { _eq: address.toStringLong() },
  };
  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
  }

  return getCollectionData({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves collection data based on the specified collection ID.
 * This function allows you to filter collections by their token standard and pagination options.
 * 
 * @param args - The arguments for retrieving collection data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.collectionId - The ID of the collection to retrieve data for.
 * @param args.options - Optional parameters for filtering by token standard and pagination.
 * @param args.options.tokenStandard - The token standard to filter the collection by (default is "v2").
 * @param args.options.pagination - Pagination options for the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve collection data for a specific collection ID
 *   const collectionId = "0x1"; // replace with a real collection ID
 *   const collectionData = await aptos.getCollectionDataByCollectionId({
 *     aptosConfig: config,
 *     collectionId,
 *     options: {
 *       tokenStandard: "v2", // specify your token standard if needed
 *     },
 *   });
 * 
 *   console.log(collectionData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCollectionDataByCollectionId(args: {
  aptosConfig: AptosConfig;
  collectionId: AccountAddressInput;
  options?: TokenStandardArg & PaginationArgs;
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, collectionId, options } = args;
  const address = AccountAddress.from(collectionId);

  const whereCondition: any = {
    collection_id: { _eq: address.toStringLong() },
  };

  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
  }

  return getCollectionData({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves the collection ID for a specified creator and collection name.
 * This function allows you to identify a specific collection by its creator and name, which can be useful for further interactions with the collection.
 * 
 * @param args - The parameters for the function.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creatorAddress - The address of the creator of the collection.
 * @param args.collectionName - The name of the collection.
 * @param args.options - Optional parameters for token standards.
 * @param args.options.tokenStandard - The token standard to filter the collection (default is "v2").
 * @returns The ID of the specified collection.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the collection ID for a specific creator and collection name
 *   const collectionId = await aptos.digitalAsset.getCollectionId({
 *     aptosConfig: config,
 *     creatorAddress: "0x1", // replace with a real creator address
 *     collectionName: "MyCollection",
 *     options: { tokenStandard: "v2" }, // specify your token standard if needed
 *   });
 * 
 *   console.log("Collection ID:", collectionId);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCollectionId(args: {
  aptosConfig: AptosConfig;
  creatorAddress: AccountAddressInput;
  collectionName: string;
  options?: TokenStandardArg;
}): Promise<string> {
  const { creatorAddress, collectionName, options, aptosConfig } = args;
  const address = AccountAddress.from(creatorAddress);

  const whereCondition: any = {
    collection_name: { _eq: collectionName },
    creator_address: { _eq: address.toStringLong() },
  };
  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard ?? "v2" };
  }

  return (await getCollectionData({ aptosConfig, options: { where: whereCondition } })).collection_id;
}

// TRANSACTIONS

const mintDigitalAssetAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagVector(new TypeTagStruct(stringStructTag())),
    new TypeTagVector(new TypeTagStruct(stringStructTag())),
    new TypeTagVector(TypeTagVector.u8()),
  ],
};

export async

/**
 * Creates a transaction to mint a digital asset on the Aptos blockchain.
 * This function allows users to define the asset's properties, including its name, description, and associated metadata.
 * 
 * @param args - The arguments for minting the digital asset.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that will create the digital asset.
 * @param args.collection - The name of the collection to which the asset belongs.
 * @param args.description - A description of the digital asset.
 * @param args.name - The name of the digital asset.
 * @param args.uri - The URI pointing to the asset's metadata.
 * @param args.propertyKeys - Optional keys for additional properties of the asset.
 * @param args.propertyTypes - Optional types for the additional properties.
 * @param args.propertyValues - Optional values for the additional properties.
 * @param args.options - Optional transaction generation options.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PropertyType, PropertyValue } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with a real account
 * 
 * async function runExample() {
 *   const transaction = await aptos.mintDigitalAssetTransaction({
 *     aptosConfig: config,
 *     creator,
 *     collection: "My Collection",
 *     description: "This is a digital asset.",
 *     name: "My Digital Asset",
 *     uri: "https://example.com/asset-metadata.json", // Replace with a real URI
 *     propertyKeys: ["key1", "key2"],
 *     propertyTypes: [PropertyType.STRING, PropertyType.NUMBER],
 *     propertyValues: ["value1", 42],
 *   });
 * 
 *   console.log("Mint Digital Asset Transaction:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function mintDigitalAssetTransaction(args: {
  aptosConfig: AptosConfig;
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
  const {
    aptosConfig,
    options,
    creator,
    collection,
    description,
    name,
    uri,
    propertyKeys,
    propertyTypes,
    propertyValues,
  } = args;
  const convertedPropertyType = propertyTypes?.map((type) => PropertyTypeMap[type]);
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::mint",
      functionArguments: [
        new MoveString(collection),
        new MoveString(description),
        new MoveString(name),
        new MoveString(uri),
        MoveVector.MoveString(propertyKeys ?? []),
        MoveVector.MoveString(convertedPropertyType ?? []),
        getPropertyValueRaw(propertyValues ?? [], convertedPropertyType ?? []),
      ],
      abi: mintDigitalAssetAbi,
    },
    options,
  });
}

const transferDigitalAssetAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagAddress()],
};

export async

/**
 * Creates a transaction to transfer a digital asset from one account to another.
 * This function helps facilitate the transfer of ownership of digital assets on the Aptos blockchain.
 * 
 * @param args - The parameters for the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.sender - The account initiating the transfer.
 * @param args.digitalAssetAddress - The address of the digital asset being transferred.
 * @param args.recipient - The address of the account receiving the digital asset.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
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
 *   const recipient = "0x1"; // Replace with a real recipient account
 *   const digitalAssetAddress = "0x2"; // Replace with a real digital asset address
 * 
 *   // Create a transaction to transfer a digital asset
 *   const transaction = await aptos.transferDigitalAssetTransaction({
 *     aptosConfig: config,
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
 function transferDigitalAssetTransaction(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  digitalAssetAddress: AccountAddressInput;
  recipient: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, digitalAssetAddress, recipient, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      function: "0x1::object::transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress), AccountAddress.from(recipient)],
      abi: transferDigitalAssetAbi,
    },
    options,
  });
}

const mintSoulBoundAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    new TypeTagVector(new TypeTagStruct(stringStructTag())),
    new TypeTagVector(new TypeTagStruct(stringStructTag())),
    new TypeTagVector(TypeTagVector.u8()),
    new TypeTagAddress(),
  ],
};

export async

/**
 * Creates a transaction to mint a soul-bound token on the Aptos blockchain.
 * This function allows users to specify various properties for the token, including its collection, description, and recipient.
 * 
 * @param args - The arguments for minting the soul-bound token.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.account - The account that will send the transaction.
 * @param args.collection - The name of the collection to which the token belongs.
 * @param args.description - A description of the token being minted.
 * @param args.name - The name of the token.
 * @param args.uri - A URI pointing to the token's metadata.
 * @param args.recipient - The account address of the recipient of the token.
 * @param args.propertyKeys - Optional keys for additional properties of the token.
 * @param args.propertyTypes - Optional types corresponding to the additional properties.
 * @param args.propertyValues - Optional values for the additional properties.
 * @param args.options - Optional transaction generation options.
 * @throws Error if the lengths of property keys, property types, and property values do not match.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const sender = Account.generate(); // Replace with a real account
 * const recipient = "0x1"; // Replace with a real recipient account address
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.mintSoulBoundTransaction({
 *     aptosConfig: config,
 *     account: sender,
 *     collection: "MyCollection",
 *     description: "This is a soul-bound token.",
 *     name: "SoulBoundToken",
 *     uri: "https://example.com/token-metadata",
 *     recipient: recipient,
 *     propertyKeys: ["key1"],
 *     propertyTypes: ["string"],
 *     propertyValues: ["value1"],
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function mintSoulBoundTransaction(args: {
  aptosConfig: AptosConfig;
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
  const {
    aptosConfig,
    account,
    collection,
    description,
    name,
    uri,
    recipient,
    propertyKeys,
    propertyTypes,
    propertyValues,
    options,
  } = args;
  if (propertyKeys?.length !== propertyValues?.length) {
    throw new Error("Property keys and property values counts do not match");
  }
  if (propertyTypes?.length !== propertyValues?.length) {
    throw new Error("Property types and property values counts do not match");
  }
  const convertedPropertyType = propertyTypes?.map((type) => PropertyTypeMap[type]);
  return generateTransaction({
    aptosConfig,
    sender: account.accountAddress,
    data: {
      function: "0x4::aptos_token::mint_soul_bound",
      functionArguments: [
        collection,
        description,
        name,
        uri,
        MoveVector.MoveString(propertyKeys ?? []),
        MoveVector.MoveString(convertedPropertyType ?? []),
        getPropertyValueRaw(propertyValues ?? [], convertedPropertyType ?? []),
        recipient,
      ],
      abi: mintSoulBoundAbi,
    },
    options,
  });
}

const burnDigitalAssetAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0)))],
};

export async

/**
 * Creates a transaction to burn a specified digital asset.
 * This function helps in removing a digital asset from circulation by burning it.
 * 
 * @param args - The arguments for creating the burn transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that is burning the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset to be burned.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
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
 *   const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 *   const digitalAssetType = "0x1::my_module::MyAsset"; // replace with a real digital asset type
 * 
 *   const transaction = await aptos.burnDigitalAssetTransaction({
 *     aptosConfig: config,
 *     creator,
 *     digitalAssetAddress,
 *     digitalAssetType,
 *   });
 * 
 *   console.log("Burn transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function burnDigitalAssetTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::burn",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress)],
      abi: burnDigitalAssetAbi,
    },
    options,
  });
}

const freezeDigitalAssetAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0)))],
};

export async

/**
 * Creates a transaction to freeze the transfer of a digital asset.
 * This function helps prevent the transfer of a specified digital asset by creating a transaction that freezes it.
 * 
 * @param args - The arguments for creating the freeze transfer transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that is creating the transaction.
 * @param args.digitalAssetAddress - The address of the digital asset to be frozen.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Generate a new account for the creator
 * const digitalAssetAddress = "0x1"; // Replace with a real digital asset address
 * 
 * async function runExample() {
 *   // Creating a transaction to freeze the digital asset transfer
 *   const transaction = await aptos.freezeDigitalAssetTransferTransaction({
 *     aptosConfig: config,
 *     creator: creator,
 *     digitalAssetAddress: digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function freezeDigitalAssetTransferTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::freeze_transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress],
      abi: freezeDigitalAssetAbi,
    },
    options,
  });
}

const unfreezeDigitalAssetAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0)))],
};

export async

/**
 * Creates a transaction to unfreeze the transfer of a digital asset.
 * This function allows users to enable the transfer of a previously frozen digital asset.
 * 
 * @param args - The parameters for generating the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that will create the transaction.
 * @param args.digitalAssetAddress - The address of the digital asset to unfreeze.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // replace with a real account if needed
 * const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 * 
 * async function runExample() {
 *   // Create a transaction to unfreeze the digital asset transfer
 *   const transaction = await aptos.digitalAsset.unfreezeDigitalAssetTransferTransaction({
 *     aptosConfig: config,
 *     creator,
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function unfreezeDigitalAssetTransferTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::unfreeze_transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress],
      abi: unfreezeDigitalAssetAbi,
    },
    options,
  });
}

const setDigitalAssetDescriptionAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagStruct(stringStructTag())],
};

export async

/**
 * Creates a transaction to set the description of a digital asset.
 * This function allows you to update the metadata associated with a digital asset on the Aptos blockchain.
 * 
 * @param args - The parameters for setting the digital asset description.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that is creating the transaction.
 * @param args.description - The new description for the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset to update.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with an actual account if needed
 * const digitalAssetAddress = "0x1"; // Replace with a real digital asset address
 * 
 * async function runExample() {
 *   const transaction = await aptos.setDigitalAssetDescriptionTransaction({
 *     aptosConfig: config,
 *     creator,
 *     description: "A new description for the digital asset.",
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function setDigitalAssetDescriptionTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  description: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, description, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_description",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(description)],
      abi: setDigitalAssetDescriptionAbi,
    },
    options,
  });
}

const setDigitalAssetNameAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagStruct(stringStructTag())],
};

export async

/**
 * Creates a transaction to set the name of a digital asset.
 * This function allows you to specify a new name for a digital asset, which can help in organizing and identifying assets more effectively.
 * 
 * @param args - The arguments for setting the digital asset name.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that will create the transaction.
 * @param args.name - The new name to assign to the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset whose name is being set.
 * @param args.digitalAssetType - (Optional) The type of the digital asset; defaults to a predefined type if not specified.
 * @param args.options - (Optional) Additional options for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with a real account
 * const digitalAssetAddress = "0x1"; // Replace with a real digital asset address
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.setDigitalAssetNameTransaction({
 *     aptosConfig: config,
 *     creator,
 *     name: "My Digital Asset",
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function setDigitalAssetNameTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  name: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, name, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_name",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(name)],
      abi: setDigitalAssetNameAbi,
    },
    options,
  });
}

const setDigitalAssetURIAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagStruct(stringStructTag())],
};

export async

/**
 * Creates a transaction to set the URI for a digital asset on the Aptos blockchain.
 * This function allows the creator to specify a new URI for their digital asset, which can be useful for updating metadata.
 * 
 * @param args - The arguments for creating the transaction.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.creator - The account creating the transaction.
 * @param args.uri - The new URI for the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const creator = Account.generate(); // replace with a real account if needed
 *   const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 *   const uri = "https://example.com/asset-metadata.json";
 * 
 *   // Creating a transaction to set the digital asset URI
 *   const transaction = await aptos.transaction.setDigitalAssetURITransaction({
 *     aptosConfig: config,
 *     creator,
 *     uri,
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function setDigitalAssetURITransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  uri: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, uri, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_uri",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(uri)],
      abi: setDigitalAssetURIAbi,
    },
    options,
  });
}

const addDigitalAssetPropertyAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [
    new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    TypeTagVector.u8(),
  ],
};

export async

/**
 * Creates a transaction to add a property to a digital asset on the Aptos blockchain.
 * This function helps you extend the metadata of a digital asset by adding custom properties.
 * 
 * @param args - The parameters for creating the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account creating the transaction.
 * @param args.propertyKey - The key of the property to be added.
 * @param args.propertyType - The type of the property being added.
 * @param args.propertyValue - The value of the property being added.
 * @param args.digitalAssetAddress - The address of the digital asset to which the property will be added.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PropertyType, PropertyValue } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with a real account if needed
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.addDigitalAssetPropertyTransaction({
 *     aptosConfig: config,
 *     creator,
 *     propertyKey: "color",
 *     propertyType: PropertyType.STRING,
 *     propertyValue: "blue",
 *     digitalAssetAddress: "0x1", // Replace with a real digital asset address
 *     digitalAssetType: "0x1::example::MyDigitalAsset", // Replace with a real digital asset type if needed
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function addDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    creator,
    propertyKey,
    propertyType,
    propertyValue,
    digitalAssetAddress,
    digitalAssetType,
    options,
  } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::add_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [
        AccountAddress.from(digitalAssetAddress),
        new MoveString(propertyKey),
        new MoveString(PropertyTypeMap[propertyType]),
        MoveVector.U8(getSinglePropertyValueRaw(propertyValue, PropertyTypeMap[propertyType])),
      ],
      abi: addDigitalAssetPropertyAbi,
    },
    options,
  });
}

const removeDigitalAssetPropertyAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))), new TypeTagStruct(stringStructTag())],
};

export async

/**
 * Generates a transaction to remove a property from a digital asset.
 * This function helps you modify the attributes of a digital asset by removing a specified property.
 * 
 * @param args - The arguments for generating the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key of the property to be removed.
 * @param args.digitalAssetAddress - The address of the digital asset from which the property will be removed.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Generate a new account for the creator
 * const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 * const propertyKey = "examplePropertyKey"; // specify the property key to remove
 * 
 * async function runExample() {
 *   // Generate the transaction to remove a property from a digital asset
 *   const transaction = await aptos.transaction.removeDigitalAssetPropertyTransaction({
 *     aptosConfig: config,
 *     creator,
 *     propertyKey,
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction generated:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function removeDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, creator, propertyKey, digitalAssetAddress, digitalAssetType, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::remove_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(propertyKey)],
      abi: removeDigitalAssetPropertyAbi,
    },
    options,
  });
}

const updateDigitalAssetPropertyAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }],
  parameters: [
    new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))),
    new TypeTagStruct(stringStructTag()),
    new TypeTagStruct(stringStructTag()),
    TypeTagVector.u8(),
  ],
};

export async

/**
 * Updates a property of a digital asset by creating a transaction for the specified property.
 * This function allows you to modify attributes of a digital asset, enabling dynamic updates to its properties.
 * 
 * @param args - The arguments for updating the digital asset property.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key of the property to update.
 * @param args.propertyType - The type of the property being updated.
 * @param args.propertyValue - The new value for the property.
 * @param args.digitalAssetAddress - The address of the digital asset to update.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PropertyType, PropertyValue } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with a real account
 * const digitalAssetAddress = "0x1"; // Replace with a real digital asset address
 * 
 * async function runExample() {
 *   const transaction = await aptos.digitalAsset.updateDigitalAssetPropertyTransaction({
 *     aptosConfig: config,
 *     creator,
 *     propertyKey: "description",
 *     propertyType: PropertyType.STRING,
 *     propertyValue: "Updated asset description",
 *     digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function updateDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    creator,
    propertyKey,
    propertyType,
    propertyValue,
    digitalAssetAddress,
    digitalAssetType,
    options,
  } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::update_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [
        AccountAddress.from(digitalAssetAddress),
        new MoveString(propertyKey),
        new MoveString(PropertyTypeMap[propertyType]),
        getSinglePropertyValueRaw(propertyValue, PropertyTypeMap[propertyType]),
      ],
      abi: updateDigitalAssetPropertyAbi,
    },
    options,
  });
}

const addDigitalAssetTypedPropertyAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }, { constraints: [] }],
  parameters: [
    new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))),
    new TypeTagStruct(stringStructTag()),
    new TypeTagGeneric(1),
  ],
};

export async

/**
 * Creates a transaction to add a typed property to a digital asset.
 * This function allows you to enhance a digital asset by attaching additional metadata in the form of typed properties.
 * 
 * @param args - The arguments for adding a typed property to a digital asset.
 * @param args.aptosConfig - Configuration for the Aptos client.
 * @param args.creator - The account creating the transaction.
 * @param args.propertyKey - The key for the property being added.
 * @param args.propertyType - The type of the property being added.
 * @param args.propertyValue - The value of the property being added.
 * @param args.digitalAssetAddress - The address of the digital asset to which the property will be added.
 * @param args.digitalAssetType - Optional. The type of the digital asset.
 * @param args.options - Optional. Additional options for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PropertyType, PropertyValue } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // Replace with a real account if needed
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.addDigitalAssetTypedPropertyTransaction({
 *     aptosConfig: config,
 *     creator,
 *     propertyKey: "color",
 *     propertyType: PropertyType.STRING,
 *     propertyValue: "blue", // Example value
 *     digitalAssetAddress: "0x1", // Replace with a real digital asset address
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function addDigitalAssetTypedPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    creator,
    propertyKey,
    propertyType,
    propertyValue,
    digitalAssetAddress,
    digitalAssetType,
    options,
  } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::add_typed_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType, PropertyTypeMap[propertyType]],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(propertyKey), propertyValue],
      abi: addDigitalAssetTypedPropertyAbi,
    },
    options,
  });
}

const updateDigitalAssetTypedPropertyAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [MoveAbility.KEY] }, { constraints: [] }],
  parameters: [
    new TypeTagStruct(objectStructTag(new TypeTagGeneric(0))),
    new TypeTagStruct(stringStructTag()),
    new TypeTagGeneric(1),
  ],
};

export async

/**
 * Creates a transaction to update a typed property of a digital asset.
 * This function allows you to modify the properties associated with a digital asset, enabling dynamic updates to asset characteristics.
 * 
 * @param args - The arguments for creating the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.creator - The account that will sign and send the transaction.
 * @param args.propertyKey - The key of the property to update.
 * @param args.propertyType - The type of the property being updated.
 * @param args.propertyValue - The new value for the property.
 * @param args.digitalAssetAddress - The address of the digital asset being modified.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PropertyType, PropertyValue } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const creator = Account.generate(); // replace with a real account
 * const digitalAssetAddress = "0x1"; // replace with a real digital asset address
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.updateDigitalAssetTypedPropertyTransaction({
 *     aptosConfig: config,
 *     creator: creator,
 *     propertyKey: "exampleKey",
 *     propertyType: PropertyType.String,
 *     propertyValue: "newValue" as PropertyValue, // replace with a real property value
 *     digitalAssetAddress: digitalAssetAddress,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function updateDigitalAssetTypedPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    creator,
    propertyKey,
    propertyType,
    propertyValue,
    digitalAssetAddress,
    digitalAssetType,
    options,
  } = args;
  return generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::update_typed_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType, PropertyTypeMap[propertyType]],
      functionArguments: [AccountAddress.from(digitalAssetAddress), new MoveString(propertyKey), propertyValue],
      abi: updateDigitalAssetTypedPropertyAbi,
    },
    options,
  });
}

function getPropertyValueRaw(propertyValues: Array<PropertyValue>, propertyTypes: Array<string>): Array<Uint8Array> {
  const results = new Array<Uint8Array>();
  propertyTypes.forEach((typ, index) => {
    results.push(getSinglePropertyValueRaw(propertyValues[index], typ));
  });

  return results;
}

function getSinglePropertyValueRaw(propertyValue: PropertyValue, propertyType: string): Uint8Array {
  const typeTag = parseTypeTag(propertyType);
  const res = checkOrConvertArgument(propertyValue, typeTag, 0, []);
  return res.bcsToBytes();
}