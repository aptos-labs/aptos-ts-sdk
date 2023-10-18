// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/token}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * token namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveString, MoveVector, U8 } from "../bcs";
import { Account, Hex } from "../core";
import { GenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
import {
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  HexInput,
  OrderBy,
  PaginationArgs,
} from "../types";
import { GetCurrentTokenOwnershipQuery, GetTokenActivityQuery, GetTokenDataQuery } from "../types/generated/operations";
import { GetCurrentTokenOwnership, GetTokenActivity, GetTokenData } from "../types/generated/queries";
import { CurrentTokenOwnershipsV2BoolExp, TokenActivitiesV2BoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";
import { generateTransaction } from "./transactionSubmission";

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
  options?: GenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, options, creator } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress.toString(),
    data: {
      function: "0x4::aptos_token::mint",
      arguments: [
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
  return transaction as SingleSignerTransaction;
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
