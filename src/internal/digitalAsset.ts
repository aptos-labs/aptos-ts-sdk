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

/**
 * The keys of the PropertyTypeMap, representing different property types.
 */
export type PropertyType = keyof typeof PropertyTypeMap;

/**
 * Accepted property value types for user input, including boolean, number, bigint, string, AccountAddress, and Uint8Array.
 * To pass in an Array, use Uint8Array type
 * for example `new MoveVector([new MoveString("hello"), new MoveString("world")]).bcsToBytes()`
 */
export type PropertyValue = boolean | number | bigint | string | AccountAddress | Uint8Array;

// The default digital asset type to use if non provided
const defaultDigitalAssetType = "0x4::token::Token";

// FETCH QUERIES

/**
 * Retrieves data for a specific digital asset using its address.
 *
 * @param args - The arguments for fetching digital asset data.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.digitalAssetAddress - The address of the digital asset to retrieve data for.
 * @returns The data of the specified digital asset.
 */
export async function getDigitalAssetData(args: {
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

/**
 * Retrieves the current ownership details of a specified digital asset.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.digitalAssetAddress - The address of the digital asset to query ownership for.
 * @returns The current ownership details of the specified digital asset.
 */
export async function getCurrentDigitalAssetOwnership(args: {
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

/**
 * Retrieves the digital assets owned by a specified account address.
 *
 * @param args - The arguments for retrieving owned digital assets.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.ownerAddress - The address of the account whose owned digital assets are being queried.
 * @param args.options - Optional pagination and ordering parameters for the query.
 * @param args.options.offset - The number of records to skip for pagination.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria for ordering the results.
 *
 * @returns An array of digital assets currently owned by the specified account.
 */
export async function getOwnedDigitalAssets(args: {
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

/**
 * Retrieves the activity associated with a specific digital asset.
 * This function allows you to track the token activities for a given digital asset address.
 *
 * @param args - The arguments for retrieving digital asset activity.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.digitalAssetAddress - The address of the digital asset to query.
 * @param args.options - Optional parameters for pagination and ordering.
 * @param args.options.offset - The number of records to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria to order the results by.
 * @returns A promise that resolves to an array of token activities for the specified digital asset.
 */
export async function getDigitalAssetActivity(args: {
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

/**
 * Options for creating a collection, allowing customization of various attributes such as supply limits, mutability of metadata,
 * and royalty settings.
 *
 * @param maxSupply - Maximum number of tokens that can be minted in the collection.
 * @param mutableDescription - Indicates if the collection description can be changed after creation.
 * @param mutableRoyalty - Indicates if the royalty settings can be modified after creation.
 * @param mutableURI - Indicates if the collection URI can be updated.
 * @param mutableTokenDescription - Indicates if individual token descriptions can be modified.
 * @param mutableTokenName - Indicates if individual token names can be changed.
 * @param mutableTokenProperties - Indicates if individual token properties can be altered.
 * @param mutableTokenURI - Indicates if individual token URIs can be updated.
 * @param tokensBurnableByCreator - Indicates if the creator can burn tokens from the collection.
 * @param tokensFreezableByCreator - Indicates if the creator can freeze tokens in the collection.
 * @param royaltyNumerator - The numerator for calculating royalties.
 * @param royaltyDenominator - The denominator for calculating royalties.
 */
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

/**
 * Creates a new collection transaction on the Aptos blockchain.
 * This function allows you to define the properties of the collection, including its name, description, and URI.
 *
 * @param args - The parameters for creating the collection transaction.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.creator - The account that will create the collection.
 * @param args.description - A description of the collection.
 * @param args.name - The name of the collection.
 * @param args.uri - The URI associated with the collection.
 * @param args.options - Optional parameters for generating the transaction.
 * @param args.maxSupply - The maximum supply of tokens in the collection (optional).
 * @param args.mutableDescription - Indicates if the collection description can be changed (optional, defaults to true).
 * @param args.mutableRoyalty - Indicates if the royalty settings can be changed (optional, defaults to true).
 * @param args.mutableURI - Indicates if the URI can be changed (optional, defaults to true).
 * @param args.mutableTokenDescription - Indicates if the token description can be changed (optional, defaults to true).
 * @param args.mutableTokenName - Indicates if the token name can be changed (optional, defaults to true).
 * @param args.mutableTokenProperties - Indicates if the token properties can be changed (optional, defaults to true).
 * @param args.mutableTokenURI - Indicates if the token URI can be changed (optional, defaults to true).
 * @param args.tokensBurnableByCreator - Indicates if tokens can be burned by the creator (optional, defaults to true).
 * @param args.tokensFreezableByCreator - Indicates if tokens can be frozen by the creator (optional, defaults to true).
 * @param args.royaltyNumerator - The numerator for calculating royalties (optional, defaults to 0).
 * @param args.royaltyDenominator - The denominator for calculating royalties (optional, defaults to 1).
 */
export async function createCollectionTransaction(
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

/**
 * Retrieves data for the current collections based on specified options.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.options - Optional parameters for filtering and pagination.
 * @param args.options.tokenStandard - The token standard to filter the collections (default is "v2").
 * @param args.options.offset - The offset for pagination.
 * @param args.options.limit - The limit for pagination.
 * @param args.options.where - The conditions to filter the collections.
 * @returns The data of the current collections.
 */
export async function getCollectionData(args: {
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

/**
 * Retrieves collection data based on the creator's address and the collection name.
 *
 * @param args - The arguments for retrieving the collection data.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.creatorAddress - The address of the creator whose collection data is being retrieved.
 * @param args.collectionName - The name of the collection to fetch data for.
 * @param args.options - Optional parameters for filtering the results, including token standard and pagination options.
 * @param args.options.tokenStandard - The token standard to filter the results by (optional).
 * @param args.options.pagination - Pagination options for the results (optional).
 */
export async function getCollectionDataByCreatorAddressAndCollectionName(args: {
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

/**
 * Retrieves collection data associated with a specific creator's address.
 * This function allows you to filter the collections based on the creator's address and optional token standards.
 *
 * @param args - The arguments for retrieving collection data.
 * @param args.aptosConfig - The configuration for the Aptos network.
 * @param args.creatorAddress - The address of the creator whose collection data is being retrieved.
 * @param args.options - Optional parameters for filtering the results.
 * @param args.options.tokenStandard - The token standard to filter the collections by.
 * @param args.options.pagination - Pagination options for the results.
 */
export async function getCollectionDataByCreatorAddress(args: {
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

/**
 * Retrieves data for a specific collection using its unique identifier.
 * This function allows you to filter the collection data based on the token standard and pagination options.
 *
 * @param args - The arguments for retrieving collection data.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.collectionId - The unique identifier for the collection.
 * @param args.options - Optional parameters for filtering by token standard and pagination.
 * @param args.options.tokenStandard - The standard of the token to filter the collection data.
 * @param args.options.page - The page number for pagination.
 * @param args.options.limit - The number of items per page for pagination.
 */
export async function getCollectionDataByCollectionId(args: {
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

/**
 * Retrieves the collection ID based on the creator's address and the collection name.
 * This function helps in identifying a specific collection within the Aptos ecosystem.
 *
 * @param args - The parameters for retrieving the collection ID.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.creatorAddress - The address of the creator of the collection.
 * @param args.collectionName - The name of the collection to look up.
 * @param args.options - Optional parameters for additional filtering.
 * @param args.options.tokenStandard - The token standard to filter the collection (default is "v2").
 * @returns The ID of the specified collection.
 */
export async function getCollectionId(args: {
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

/**
 * Creates a transaction to mint a digital asset on the Aptos blockchain.
 * This function allows you to specify various attributes of the asset, including its collection, description, name, and URI.
 *
 * @param args - The arguments for minting the digital asset.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.creator - The account that will create the digital asset.
 * @param args.collection - The name of the collection to which the asset belongs.
 * @param args.description - A brief description of the digital asset.
 * @param args.name - The name of the digital asset.
 * @param args.uri - The URI pointing to the asset's metadata.
 * @param [args.propertyKeys] - Optional array of property keys associated with the asset.
 * @param [args.propertyTypes] - Optional array of property types corresponding to the asset's properties.
 * @param [args.propertyValues] - Optional array of property values for the asset's properties.
 * @param [args.options] - Optional transaction generation options.
 */
export async function mintDigitalAssetTransaction(args: {
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

        /**
         * Retrieves the raw values of specified properties from an array of property values based on their types.
         *
         * @param propertyValues - An array of property values from which to extract the raw data.
         * @param propertyTypes - An array of strings representing the types of properties to retrieve.
         * @returns An array of Uint8Array containing the raw values for the specified property types.
         */
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

/**
 * Initiates a transaction to transfer a digital asset from one account to another.
 * This function helps in executing the transfer of digital assets securely and efficiently.
 *
 * @param args - The arguments required to perform the transfer.
 * @param args.aptosConfig - Configuration settings for the Aptos client.
 * @param args.sender - The account initiating the transfer.
 * @param args.digitalAssetAddress - The address of the digital asset being transferred.
 * @param args.recipient - The address of the account receiving the digital asset.
 * @param args.digitalAssetType - (Optional) The type of the digital asset being transferred.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function transferDigitalAssetTransaction(args: {
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

/**
 * Creates a transaction to mint a soul-bound token.
 * This function allows you to specify the token's attributes and recipient, facilitating the creation of unique digital assets.
 *
 * @param args - The parameters required to mint the soul-bound token.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.account - The account initiating the minting transaction.
 * @param args.collection - The name of the collection to which the token belongs.
 * @param args.description - A description of the token being minted.
 * @param args.name - The name of the token.
 * @param args.uri - The URI pointing to the token's metadata.
 * @param args.recipient - The address of the account that will receive the minted token.
 * @param [args.propertyKeys] - Optional array of property keys associated with the token.
 * @param [args.propertyTypes] - Optional array of property types corresponding to the property keys.
 * @param [args.propertyValues] - Optional array of property values that match the property keys and types.
 * @param [args.options] - Optional transaction generation options.
 * @throws Error if the counts of property keys, property types, and property values do not match.
 */
export async function mintSoulBoundTransaction(args: {
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

/**
 * Creates a transaction to burn a specified digital asset.
 * This function allows users to permanently remove a digital asset from their account.
 *
 * @param args - The arguments for the transaction.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.creator - The account that is initiating the burn transaction.
 * @param args.digitalAssetAddress - The address of the digital asset to be burned.
 * @param args.digitalAssetType - Optional; the type of the digital asset being burned.
 * @param args.options - Optional; additional options for generating the transaction.
 */
export async function burnDigitalAssetTransaction(args: {
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

/**
 * Creates a transaction to freeze the transfer of a digital asset.
 * This function helps you prevent the transfer of a specified digital asset by generating the appropriate transaction.
 *
 * @param args - The parameters for the transaction.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.creator - The account that is creating the transaction.
 * @param args.digitalAssetAddress - The address of the digital asset to be frozen.
 * @param args.digitalAssetType - (Optional) The type of the digital asset as a Move struct ID.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function freezeDigitalAssetTransferTransaction(args: {
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

/**
 * Unfreezes a digital asset transfer transaction, allowing the transfer of the specified digital asset.
 *
 * @param args - The arguments for unfreezing the digital asset transfer transaction.
 * @param args.aptosConfig - The Aptos configuration settings.
 * @param args.creator - The account that is initiating the unfreeze transaction.
 * @param args.digitalAssetAddress - The address of the digital asset to be unfrozen.
 * @param args.digitalAssetType - (Optional) The type of the digital asset being unfrozen.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function unfreezeDigitalAssetTransferTransaction(args: {
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

/**
 * Sets the description for a digital asset, allowing users to provide additional context or information about the asset.
 *
 * @param args - The arguments for setting the digital asset description.
 * @param args.aptosConfig - The Aptos configuration to use for the transaction.
 * @param args.creator - The account that is creating the transaction.
 * @param args.description - The new description for the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset whose description is being set.
 * @param args.digitalAssetType - (Optional) The type of the digital asset.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function setDigitalAssetDescriptionTransaction(args: {
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

/**
 * Sets the name of a digital asset on the Aptos blockchain.
 * This function allows you to update the name of a specified digital asset, enabling better identification and categorization.
 *
 * @param args - The parameters for setting the digital asset name.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.creator - The account that is creating the transaction.
 * @param args.name - The new name to assign to the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset to update.
 * @param args.digitalAssetType - (Optional) The type of the digital asset, represented as a Move struct ID.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function setDigitalAssetNameTransaction(args: {
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

/**
 * Sets the URI for a digital asset, allowing you to update the metadata associated with it.
 *
 * @param args - The arguments for setting the digital asset URI.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.creator - The account that is creating the transaction.
 * @param args.uri - The new URI to be set for the digital asset.
 * @param args.digitalAssetAddress - The address of the digital asset whose URI is being set.
 * @param args.digitalAssetType - The optional type of the digital asset; defaults to a predefined type if not provided.
 * @param args.options - Optional settings for generating the transaction.
 */
export async function setDigitalAssetURITransaction(args: {
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

/**
 * Creates a transaction to add a property to a digital asset.
 * This function helps in enhancing the metadata associated with a digital asset by allowing the addition of custom properties.
 *
 * @param args - The arguments for the transaction.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key for the property being added.
 * @param args.propertyType - The type of the property being added.
 * @param args.propertyValue - The value of the property being added.
 * @param args.digitalAssetAddress - The address of the digital asset to which the property is being added.
 * @param args.digitalAssetType - The optional type of the digital asset.
 * @param args.options - Optional transaction generation options.
 */
export async function addDigitalAssetPropertyTransaction(args: {
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

/**
 * Removes a property from a digital asset on the Aptos blockchain.
 * This function helps in managing the attributes of digital assets by allowing the removal of specific properties.
 *
 * @param args - The arguments for the transaction.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key of the property to be removed.
 * @param args.digitalAssetAddress - The address of the digital asset from which the property will be removed.
 * @param args.digitalAssetType - The type of the digital asset (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 */
export async function removeDigitalAssetPropertyTransaction(args: {
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

/**
 * Updates a property of a digital asset by generating a transaction for the Aptos blockchain.
 * This function allows you to modify attributes of a digital asset, facilitating dynamic changes to its properties.
 *
 * @param args - The arguments for updating the digital asset property.
 * @param args.aptosConfig - The configuration settings for the Aptos blockchain.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key of the property to be updated.
 * @param args.propertyType - The type of the property being updated.
 * @param args.propertyValue - The new value for the property.
 * @param args.digitalAssetAddress - The address of the digital asset to update.
 * @param args.digitalAssetType - (Optional) The type of the digital asset.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function updateDigitalAssetPropertyTransaction(args: {
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

        /**
         * Retrieves the raw byte representation of a single property value based on its type.
         *
         * @param propertyValue - The value of the property to convert.
         * @param propertyType - The type of the property, which determines how the value is processed.
         * @returns The raw byte representation of the property value.
         */
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

/**
 * Creates a transaction to add a typed property to a digital asset.
 * This function helps in customizing digital assets by associating them with specific properties.
 *
 * @param args - The arguments required to create the transaction.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key for the property being added.
 * @param args.propertyType - The type of the property being added.
 * @param args.propertyValue - The value of the property being added.
 * @param args.digitalAssetAddress - The address of the digital asset to which the property is being added.
 * @param args.digitalAssetType - (Optional) The type of the digital asset.
 * @param args.options - (Optional) Additional options for generating the transaction.
 */
export async function addDigitalAssetTypedPropertyTransaction(args: {
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

/**
 * Updates the typed property of a digital asset by generating a transaction for the Aptos blockchain.
 *
 * @param args - The arguments for updating the digital asset typed property.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.creator - The account that is creating the transaction.
 * @param args.propertyKey - The key of the property to be updated.
 * @param args.propertyType - The type of the property being updated.
 * @param args.propertyValue - The new value for the property.
 * @param args.digitalAssetAddress - The address of the digital asset to be updated.
 * @param args.digitalAssetType - Optional. The type of the digital asset, if not provided, defaults to the standard type.
 * @param args.options - Optional. Additional options for generating the transaction.
 */
export async function updateDigitalAssetTypedPropertyTransaction(args: {
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
