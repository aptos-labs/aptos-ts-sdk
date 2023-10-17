// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/fungible_asset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * fungible_asset namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import {
  GetCurrentFungibleAssetBalancesResponse,
  GetFungibleAssetActivitiesResponse,
  GetFungibleAssetMetadataResponse,
  PaginationArgs,
} from "../types";
import { queryIndexer } from "./general";
import {
  GetCurrentFungibleAssetBalances,
  GetFungibleAssetActivities,
  GetFungibleAssetMetadata,
} from "../types/generated/queries";
import {
  GetCurrentFungibleAssetBalancesQuery,
  GetFungibleAssetActivitiesQuery,
  GetFungibleAssetMetadataQuery,
} from "../types/generated/operations";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../types/generated/types";

export async function getFungibleAssetMetadata(args: {
  aptosConfig: AptosConfig;
  options?: {
    pagination?: PaginationArgs;
    where?: FungibleAssetMetadataBoolExp;
  };
}): Promise<GetFungibleAssetMetadataResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetFungibleAssetMetadata,
    variables: {
      where_condition: options?.where,
      limit: options?.pagination?.limit,
      offset: options?.pagination?.offset,
    },
  };

  const data = await queryIndexer<GetFungibleAssetMetadataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getFungibleAssetMetadata",
  });

  return data.fungible_asset_metadata;
}

export async function getFungibleAssetActivities(args: {
  aptosConfig: AptosConfig;
  options?: {
    pagination?: PaginationArgs;
    where?: FungibleAssetActivitiesBoolExp;
  };
}): Promise<GetFungibleAssetActivitiesResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetFungibleAssetActivities,
    variables: {
      where_condition: options?.where,
      limit: options?.pagination?.limit,
      offset: options?.pagination?.offset,
    },
  };

  const data = await queryIndexer<GetFungibleAssetActivitiesQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getFungibleAssetActivities",
  });

  return data.fungible_asset_activities;
}

export async function getCurrentFungibleAssetBalances(args: {
  aptosConfig: AptosConfig;
  options?: {
    pagination?: PaginationArgs;
    where?: CurrentFungibleAssetBalancesBoolExp;
  };
}): Promise<GetCurrentFungibleAssetBalancesResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetCurrentFungibleAssetBalances,
    variables: {
      where_condition: options?.where,
      limit: options?.pagination?.limit,
      offset: options?.pagination?.offset,
    },
  };

  const data = await queryIndexer<GetCurrentFungibleAssetBalancesQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCurrentFungibleAssetBalances",
  });

  return data.current_fungible_asset_balances;
}
