// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/token}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * token namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Hex } from "../core";
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
import { CurrentTokenOwnershipsV2BoolExp, TokenActivitiesBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

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
}): Promise<GetOwnedTokensResponse> {
  const { aptosConfig, ownerAddress } = args;

  const whereCondition: CurrentTokenOwnershipsV2BoolExp = {
    owner_address: { _eq: Hex.fromHexInput(ownerAddress).toString() },
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

  const whereCondition: TokenActivitiesBoolExp = {
    token_data_id_hash: { _eq: Hex.fromHexInput(tokenAddress).toString() },
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
