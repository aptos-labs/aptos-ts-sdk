// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/digitalAsset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * digitalAsset namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveString, Bool, U64 } from "../bcs";
import { Account, AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
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
import { CurrentTokenOwnershipsV2BoolExp, TokenActivitiesV2BoolExp } from "../types/generated/types";
import { checkOrConvertArgument, parseTypeTag } from "../transactions";

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
  // TODO support array/vector property types and values
  // ARRAY: "vector<u8>",
};

export type PropertyType = keyof typeof PropertyTypeMap;

// Accepted property value types for user input
export type PropertyValue = boolean | number | bigint | string | AccountAddress | Array<PropertyValue>;

// The default digital asset type to use if non provided
const defaultDigitalAssetType = "0x4::token::Token";

// FETCH QUERIES

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

export async function getCurrentDigitalAssetOwnership(args: {
  aptosConfig: AptosConfig;
  digitalAssetAddress: AccountAddressInput;
}): Promise<GetCurrentTokenOwnershipResponse> {
  const { aptosConfig, digitalAssetAddress } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    token_data_id: { _eq: AccountAddress.from(digitalAssetAddress).toStringLong() },
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

export async function createCollectionTransaction(
  args: {
    aptosConfig: AptosConfig;
    creator: Account;
    description: string;
    name: string;
    uri: string;
    options?: InputGenerateTransactionOptions;
  } & CreateCollectionOptions,
): Promise<SingleSignerTransaction> {
  const { aptosConfig, options, creator } = args;
  const transaction = await generateTransaction({
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
    },
    options,
  });
  return transaction;
}

export async function getCollectionData(args: {
  aptosConfig: AptosConfig;
  creatorAddress: AccountAddressInput;
  collectionName: string;
  options?: TokenStandardArg;
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

  const graphqlQuery = {
    query: GetCollectionData,
    variables: {
      where_condition: whereCondition,
    },
  };
  const data = await queryIndexer<GetCollectionDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCollectionData",
  });

  return data.current_collections_v2[0];
}

export async function getCollectionId(args: {
  aptosConfig: AptosConfig;
  creatorAddress: AccountAddressInput;
  collectionName: string;
  options?: TokenStandardArg;
}): Promise<string> {
  return (await getCollectionData(args)).collection_id;
}

// TRANSACTIONS

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
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::mint",
      functionArguments: [
        collection,
        description,
        name,
        uri,
        propertyKeys ?? [],
        convertedPropertyType ?? [],
        getPropertyValueRaw(propertyValues ?? [], convertedPropertyType ?? []),
      ],
    },
    options,
  });
  return transaction;
}

export async function transferDigitalAssetTransaction(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  digitalAssetAddress: AccountAddressInput;
  recipient: AccountAddress;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, sender, digitalAssetAddress, recipient, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      function: "0x1::object::transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress, recipient],
    },
    options,
  });
  return transaction;
}

export async function mintSoulBoundTransaction(args: {
  aptosConfig: AptosConfig;
  account: Account;
  collection: string;
  description: string;
  name: string;
  uri: string;
  recipient: AccountAddress;
  propertyKeys?: Array<string>;
  propertyTypes?: Array<PropertyType>;
  propertyValues?: Array<PropertyValue>;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: account.accountAddress,
    data: {
      function: "0x4::aptos_token::mint_soul_bound",
      functionArguments: [
        collection,
        description,
        name,
        uri,
        propertyKeys ?? [],
        convertedPropertyType ?? [],
        getPropertyValueRaw(propertyValues ?? [], convertedPropertyType ?? []),
        recipient,
      ],
    },
    options,
  });

  return transaction;
}

export async function burnDigitalAssetTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::burn",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress],
    },
    options,
  });
  return transaction;
}

export async function freezeDigitalAssetTransaferTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::freeze_transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress],
    },
    options,
  });
  return transaction;
}

export async function unfreezeDigitalAssetTransaferTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::unfreeze_transfer",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress],
    },
    options,
  });
  return transaction;
}

export async function setDigitalAssetDescriptionTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  description: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, description, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_description",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress, description],
    },
    options,
  });
  return transaction;
}

export async function setDigitalAssetNameTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  name: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, name, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_name",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress, name],
    },
    options,
  });
  return transaction;
}

export async function setDigitalAssetURITransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  uri: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, uri, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::set_uri",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress, uri],
    },
    options,
  });
  return transaction;
}

export async function addDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::add_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [
        digitalAssetAddress,
        propertyKey,
        PropertyTypeMap[propertyType],
        getSinglePropertyValueRaw(propertyValue, PropertyTypeMap[propertyType]),
      ],
    },
    options,
  });
  return transaction;
}

export async function removeDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, creator, propertyKey, digitalAssetAddress, digitalAssetType, options } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::remove_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [digitalAssetAddress, propertyKey],
    },
    options,
  });
  return transaction;
}

export async function updateDigitalAssetPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::update_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType],
      functionArguments: [
        digitalAssetAddress,
        propertyKey,
        PropertyTypeMap[propertyType],
        getSinglePropertyValueRaw(propertyValue, PropertyTypeMap[propertyType]),
      ],
    },
    options,
  });
  return transaction;
}

export async function addDigitalAssetTypedPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::add_typed_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType, PropertyTypeMap[propertyType]],
      functionArguments: [digitalAssetAddress, propertyKey, propertyValue],
    },
    options,
  });
  return transaction;
}

export async function updateDigitalAssetTypedPropertyTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  propertyKey: string;
  propertyType: PropertyType;
  propertyValue: PropertyValue;
  digitalAssetAddress: AccountAddressInput;
  digitalAssetType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
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
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress,
    data: {
      function: "0x4::aptos_token::update_typed_property",
      typeArguments: [digitalAssetType ?? defaultDigitalAssetType, PropertyTypeMap[propertyType]],
      functionArguments: [digitalAssetAddress, propertyKey, propertyValue],
    },
    options,
  });
  return transaction;
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
