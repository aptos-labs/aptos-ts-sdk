// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/digitalAsset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * digitalAsset namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveString, MoveVector, Bool, U64, U8 } from "../bcs";
import { Account, Hex } from "../core";
import { InputGenerateTransactionOptions, InputSingleSignerTransaction } from "../transactions/types";
import {
  AnyNumber,
  GetCollectionDataResponse,
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  HexInput,
  OrderBy,
  PaginationArgs,
  TokenStandard,
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

// TODO: Support properties when minting.
export interface MintTokenOptions {
  propertyKeys?: Array<string>;
  propertyTypes?: Array<string>;
  propertyValues?: Array<string>;
}

export async function mintTokenTransaction(args: {
  aptosConfig: AptosConfig;
  creator: Account;
  collection: string;
  description: string;
  name: string;
  uri: string;
  options?: InputGenerateTransactionOptions;
}): Promise<InputSingleSignerTransaction> {
  const { aptosConfig, options, creator } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress.toString(),
    data: {
      function: "0x4::aptos_token::mint",
      functionArguments: [
        new MoveString(args.collection),
        new MoveString(args.description),
        new MoveString(args.name),
        new MoveString(args.uri),
        MoveVector.MoveString([]),
        MoveVector.MoveString([]),
        new MoveVector<MoveVector<U8>>([]),
      ],
    },
    options,
  });
  return transaction as InputSingleSignerTransaction;
}

export async function getTokenData(args: {
  aptosConfig: AptosConfig;
  tokenAddress: HexInput;
}): Promise<GetTokenDataResponse> {
  const { aptosConfig, tokenAddress } = args;

  const whereCondition: any = {
    token_data_id: { _eq: Hex.fromHexInput(tokenAddress).toString() },
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
    originMethod: "getTokenData",
  });

  return data.current_token_datas_v2[0];
}

export async function getCurrentTokenOwnership(args: {
  aptosConfig: AptosConfig;
  tokenAddress: HexInput;
}): Promise<GetCurrentTokenOwnershipResponse> {
  const { aptosConfig, tokenAddress } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    token_data_id: { _eq: Hex.fromHexInput(tokenAddress).toString() },
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
    originMethod: "getCurrentTokenOwnership",
  });

  return data.current_token_ownerships_v2[0];
}

export async function getOwnedTokens(args: {
  aptosConfig: AptosConfig;
  ownerAddress: HexInput;
  options?: {
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetTokenActivityResponse[0]>;
  };
}): Promise<GetOwnedTokensResponse> {
  const { aptosConfig, ownerAddress, options } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    owner_address: { _eq: Hex.fromHexInput(ownerAddress).toString() },
  };

  const graphqlQuery = {
    query: GetCurrentTokenOwnership,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetCurrentTokenOwnershipQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getOwnedTokens",
  });

  return data.current_token_ownerships_v2;
}

export async function getTokenActivity(args: {
  aptosConfig: AptosConfig;
  tokenAddress: HexInput;
  options?: {
    pagination?: PaginationArgs;
    orderBy?: OrderBy<GetTokenActivityResponse[0]>;
  };
}): Promise<GetTokenActivityResponse> {
  const { aptosConfig, tokenAddress, options } = args;

  const whereCondition: TokenActivitiesV2BoolExp = {
    token_data_id: { _eq: Hex.fromHexInput(tokenAddress).toString() },
  };

  const graphqlQuery = {
    query: GetTokenActivity,
    variables: {
      where_condition: whereCondition,
      offset: options?.pagination?.offset,
      limit: options?.pagination?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetTokenActivityQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getTokenActivity",
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
): Promise<InputSingleSignerTransaction> {
  const { aptosConfig, options, creator } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress.toString(),
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
  return transaction as InputSingleSignerTransaction;
}

export async function getCollectionData(args: {
  aptosConfig: AptosConfig;
  creatorAddress: HexInput;
  collectionName: string;
  options?: {
    tokenStandard?: TokenStandard;
  };
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, creatorAddress, collectionName, options } = args;
  const address = Hex.fromHexInput(creatorAddress).toString();

  const whereCondition: any = {
    collection_name: { _eq: collectionName },
    creator_address: { _eq: address },
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
  creatorAddress: HexInput;
  collectionName: string;
  options?: {
    tokenStandard?: TokenStandard;
  };
}): Promise<string> {
  return (await getCollectionData(args)).collection_id;
}
