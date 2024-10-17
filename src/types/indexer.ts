// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * GENERATED QUERY TYPES FROM GRAPHQL SCHEMA
 *
 * generated types we generate from graphql schema that match the structure of the
 * response type when querying from Hasura schema.
 *
 * These types are used as the return type when making the actual request (usually
 * under the /internal/ folder)
 * @group Implementation
 * @category Types
 */

import {
  GetAccountCoinsDataQuery,
  GetObjectDataQuery,
  GetAccountOwnedTokensQuery,
  GetAccountOwnedTokensFromCollectionQuery,
  GetAccountCollectionsWithOwnedTokensQuery,
  GetDelegatedStakingActivitiesQuery,
  GetNumberOfDelegatorsQuery,
  GetCollectionDataQuery,
  GetChainTopUserTransactionsQuery,
  GetEventsQuery,
  GetTokenDataQuery,
  GetProcessorStatusQuery,
  GetFungibleAssetMetadataQuery,
  GetFungibleAssetActivitiesQuery,
  GetCurrentFungibleAssetBalancesQuery,
  GetTokenActivityQuery,
  GetCurrentTokenOwnershipQuery,
  GetNamesQuery,
  GetTableItemsDataQuery,
  GetTableItemsMetadataQuery,
} from "./generated/operations";

/**
 * CUSTOM RESPONSE TYPES FOR THE END USER
 *
 * To provide a good dev exp, we build custom types derived from the
 * query types to be the response type the end developer/user will
 * work with.
 *
 * These types are used as the return type when calling a sdk api function
 * that calls the function that queries the server (usually under the /api/ folder)
 * @group Implementation
 * @category Types
 */
export type GetObjectDataQueryResponse = GetObjectDataQuery["current_objects"];

/**
 * The response structure for querying tokens owned by an account.
 * @group Implementation
 * @category Types
 */
export type GetAccountOwnedTokensQueryResponse = GetAccountOwnedTokensQuery["current_token_ownerships_v2"];

/**
 * The response containing the current token ownerships for an account from a specific collection.
 * @group Implementation
 * @category Types
 */
export type GetAccountOwnedTokensFromCollectionResponse =
  GetAccountOwnedTokensFromCollectionQuery["current_token_ownerships_v2"];

/**
 * The response structure for retrieving account collections associated with owned tokens.
 * @group Implementation
 * @category Types
 */
export type GetAccountCollectionsWithOwnedTokenResponse =
  GetAccountCollectionsWithOwnedTokensQuery["current_collection_ownership_v2_view"];

/**
 * The current balances of fungible assets for an account.
 * @group Implementation
 * @category Types
 */
export type GetAccountCoinsDataResponse = GetAccountCoinsDataQuery["current_fungible_asset_balances"];

/**
 * The response structure for retrieving user transactions from the top of the blockchain.
 * @group Implementation
 * @category Types
 */
export type GetChainTopUserTransactionsResponse = GetChainTopUserTransactionsQuery["user_transactions"];

/**
 * The response containing the events from the GetEventsQuery.
 * @group Implementation
 * @category Types
 */
export type GetEventsResponse = GetEventsQuery["events"];

/**
 * The number of active delegators per pool in response to a query.
 * @group Implementation
 * @category Types
 */
export type GetNumberOfDelegatorsResponse = GetNumberOfDelegatorsQuery["num_active_delegator_per_pool"];

/**
 * The response containing the delegated staking activities from the query.
 * @group Implementation
 * @category Types
 */
export type GetDelegatedStakingActivitiesResponse = GetDelegatedStakingActivitiesQuery["delegated_staking_activities"];

/**
 * The response structure for retrieving data from the current collections.
 * @group Implementation
 * @category Types
 */
export type GetCollectionDataResponse = GetCollectionDataQuery["current_collections_v2"][0];

/**
 * The response structure for retrieving token data, containing the current token information.
 * @group Implementation
 * @category Types
 */
export type GetTokenDataResponse = GetTokenDataQuery["current_token_datas_v2"][0];

/**
 * The status of the processor as returned by the GetProcessorStatusQuery.
 * @group Implementation
 * @category Types
 */
export type GetProcessorStatusResponse = GetProcessorStatusQuery["processor_status"];

/**
 * The response containing metadata for a fungible asset.
 * @group Implementation
 * @category Types
 */
export type GetFungibleAssetMetadataResponse = GetFungibleAssetMetadataQuery["fungible_asset_metadata"];

/**
 * The response containing the activities related to fungible assets.
 * @group Implementation
 * @category Types
 */
export type GetFungibleAssetActivitiesResponse = GetFungibleAssetActivitiesQuery["fungible_asset_activities"];

/**
 * The current balances of fungible assets for a specific query.
 * @group Implementation
 * @category Types
 */
export type GetCurrentFungibleAssetBalancesResponse =
  GetCurrentFungibleAssetBalancesQuery["current_fungible_asset_balances"];

/**
 * The response structure for retrieving token activity data.
 * @group Implementation
 * @category Types
 */
export type GetTokenActivityResponse = GetTokenActivityQuery["token_activities_v2"];

/**
 * The response structure for retrieving the current token ownership details.
 * @group Implementation
 * @category Types
 */
export type GetCurrentTokenOwnershipResponse = GetCurrentTokenOwnershipQuery["current_token_ownerships_v2"][0];

/**
 * The response containing the current token ownerships for a user.
 * @group Implementation
 * @category Types
 */
export type GetOwnedTokensResponse = GetCurrentTokenOwnershipQuery["current_token_ownerships_v2"];

/**
 * The response structure for retrieving items from a table.
 * @group Implementation
 * @category Types
 */
export type GetTableItemsDataResponse = GetTableItemsDataQuery["table_items"];

/**
 * The metadata for table items retrieved from a query.
 * @group Implementation
 * @category Types
 */
export type GetTableItemsMetadataResponse = GetTableItemsMetadataQuery["table_metadatas"];

/**
 * The response containing the current Aptos names from the GetNamesQuery.
 * @group Implementation
 * @category Types
 */
export type GetANSNameResponse = GetNamesQuery["current_aptos_names"];

/**
 * A generic type that being passed by each function and holds an
 * array of properties we can sort the query by
 * @group Implementation
 * @category Types
 */
export type OrderBy<T> = Array<{ [K in keyof T]?: OrderByValue }>;

/**
 * Specifies the order direction for sorting, including options for handling null values.
 * @group Implementation
 * @category Types
 */
export type OrderByValue =
  | "asc"
  | "asc_nulls_first"
  | "asc_nulls_last"
  | "desc"
  | "desc_nulls_first"
  | "desc_nulls_last";

/**
 * The token standard to query for, which can be either version "v1" or "v2".
 * @group Implementation
 * @category Types
 */
export type TokenStandard = "v1" | "v2";

/**
 * The GraphQL query to pass into the `queryIndexer` function.
 * @group Implementation
 * @category Types
 */
export type GraphqlQuery = {
  query: string;
  variables?: {};
};
