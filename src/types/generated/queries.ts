import * as Types from "./operations";

import { GraphQLClient, RequestOptions } from "graphql-request";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export const TokenActivitiesFieldsFragmentDoc = `
    fragment TokenActivitiesFields on token_activities_v2 {
  after_value
  before_value
  entry_function_id_str
  event_account_address
  event_index
  from_address
  is_fungible_v2
  property_version_v1
  to_address
  token_amount
  token_data_id
  token_standard
  transaction_timestamp
  transaction_version
  type
}
    `;
export const AnsTokenFragmentFragmentDoc = `
    fragment AnsTokenFragment on current_cedra_names {
  domain
  expiration_timestamp
  registered_address
  subdomain
  token_standard
  is_primary
  owner_address
  subdomain_expiration_policy
  domain_expiration_timestamp
}
    `;
export const CurrentTokenOwnershipFieldsFragmentDoc = `
    fragment CurrentTokenOwnershipFields on current_token_ownerships_v2 {
  token_standard
  token_properties_mutated_v1
  token_data_id
  table_type_v1
  storage_id
  property_version_v1
  owner_address
  last_transaction_version
  last_transaction_timestamp
  is_soulbound_v2
  is_fungible_v2
  amount
  current_token_data {
    collection_id
    description
    is_fungible_v2
    largest_property_version_v1
    last_transaction_timestamp
    last_transaction_version
    maximum
    supply
    token_data_id
    token_name
    token_properties
    token_standard
    token_uri
    decimals
    current_collection {
      collection_id
      collection_name
      creator_address
      current_supply
      description
      last_transaction_timestamp
      last_transaction_version
      max_supply
      mutable_description
      mutable_uri
      table_handle_v1
      token_standard
      total_minted_v2
      uri
    }
  }
}
    `;
export const GetAccountCoinsCount = `
    query getAccountCoinsCount($address: String) {
  current_fungible_asset_balances_new_aggregate(
    where: {owner_address: {_eq: $address}}
  ) {
    aggregate {
      count
    }
  }
}
    `;
export const GetAccountCoinsData = `
    query getAccountCoinsData($where_condition: current_fungible_asset_balances_new_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_fungible_asset_balances_new_order_by!]) {
  current_fungible_asset_balances_new(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    amount
    asset_type
    is_frozen
    is_primary
    last_transaction_timestamp
    last_transaction_version
    owner_address
    storage_id
    token_standard
    metadata {
      token_standard
      symbol
      supply_aggregator_table_key_v1
      supply_aggregator_table_handle_v1
      project_uri
      name
      last_transaction_version
      last_transaction_timestamp
      icon_uri
      decimals
      creator_address
      asset_type
    }
  }
}
    `;
export const GetAccountCollectionsWithOwnedTokens = `
    query getAccountCollectionsWithOwnedTokens($where_condition: current_collection_ownership_v2_view_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_collection_ownership_v2_view_order_by!]) {
  current_collection_ownership_v2_view(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    current_collection {
      collection_id
      collection_name
      creator_address
      current_supply
      description
      last_transaction_timestamp
      last_transaction_version
      mutable_description
      max_supply
      mutable_uri
      table_handle_v1
      token_standard
      total_minted_v2
      uri
    }
    collection_id
    collection_name
    collection_uri
    creator_address
    distinct_tokens
    last_transaction_version
    owner_address
    single_token_uri
  }
}
    `;
export const GetAccountOwnedTokens = `
    query getAccountOwnedTokens($where_condition: current_token_ownerships_v2_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_token_ownerships_v2_order_by!]) {
  current_token_ownerships_v2(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    ...CurrentTokenOwnershipFields
  }
}
    ${CurrentTokenOwnershipFieldsFragmentDoc}`;
export const GetAccountOwnedTokensByTokenData = `
    query getAccountOwnedTokensByTokenData($where_condition: current_token_ownerships_v2_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_token_ownerships_v2_order_by!]) {
  current_token_ownerships_v2(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    ...CurrentTokenOwnershipFields
  }
}
    ${CurrentTokenOwnershipFieldsFragmentDoc}`;
export const GetAccountOwnedTokensFromCollection = `
    query getAccountOwnedTokensFromCollection($where_condition: current_token_ownerships_v2_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_token_ownerships_v2_order_by!]) {
  current_token_ownerships_v2(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    ...CurrentTokenOwnershipFields
  }
}
    ${CurrentTokenOwnershipFieldsFragmentDoc}`;
export const GetAccountTokensCount = `
    query getAccountTokensCount($where_condition: current_token_ownerships_v2_bool_exp, $offset: Int, $limit: Int) {
  current_token_ownerships_v2_aggregate(
    where: $where_condition
    offset: $offset
    limit: $limit
  ) {
    aggregate {
      count
    }
  }
}
    `;
export const GetAccountTransactionsCount = `
    query getAccountTransactionsCount($address: String) {
  account_transactions_aggregate(where: {account_address: {_eq: $address}}) {
    aggregate {
      count
    }
  }
}
    `;
export const GetChainTopUserTransactions = `
    query getChainTopUserTransactions($limit: Int) {
  user_transactions(limit: $limit, order_by: {version: desc}) {
    version
  }
}
    `;
export const GetCollectionData = `
    query getCollectionData($where_condition: current_collections_v2_bool_exp!) {
  current_collections_v2(where: $where_condition) {
    uri
    total_minted_v2
    token_standard
    table_handle_v1
    mutable_uri
    mutable_description
    max_supply
    collection_id
    collection_name
    creator_address
    current_supply
    description
    last_transaction_timestamp
    last_transaction_version
    cdn_asset_uris {
      cdn_image_uri
      asset_uri
      animation_optimizer_retry_count
      cdn_animation_uri
      cdn_json_uri
      image_optimizer_retry_count
      json_parser_retry_count
      raw_animation_uri
      raw_image_uri
    }
  }
}
    `;
export const GetCurrentFungibleAssetBalances = `
    query getCurrentFungibleAssetBalances($where_condition: current_fungible_asset_balances_new_bool_exp, $offset: Int, $limit: Int) {
  current_fungible_asset_balances_new(
    where: $where_condition
    offset: $offset
    limit: $limit
  ) {
    amount
    asset_type
    is_frozen
    is_primary
    last_transaction_timestamp
    last_transaction_version
    owner_address
    storage_id
    token_standard
  }
}
    `;
export const GetDelegatedStakingActivities = `
    query getDelegatedStakingActivities($delegatorAddress: String, $poolAddress: String) {
  delegated_staking_activities(
    where: {delegator_address: {_eq: $delegatorAddress}, pool_address: {_eq: $poolAddress}}
  ) {
    amount
    delegator_address
    event_index
    event_type
    pool_address
    transaction_version
  }
}
    `;
export const GetEvents = `
    query getEvents($where_condition: events_bool_exp, $offset: Int, $limit: Int, $order_by: [events_order_by!]) {
  events(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    account_address
    creation_number
    data
    event_index
    sequence_number
    transaction_block_height
    transaction_version
    type
    indexed_type
  }
}
    `;
export const GetFungibleAssetActivities = `
    query getFungibleAssetActivities($where_condition: fungible_asset_activities_bool_exp, $offset: Int, $limit: Int) {
  fungible_asset_activities(
    where: $where_condition
    offset: $offset
    limit: $limit
  ) {
    amount
    asset_type
    block_height
    entry_function_id_str
    event_index
    gas_fee_payer_address
    is_frozen
    is_gas_fee
    is_transaction_success
    owner_address
    storage_id
    storage_refund_amount
    token_standard
    transaction_timestamp
    transaction_version
    type
  }
}
    `;
export const GetFungibleAssetMetadata = `
    query getFungibleAssetMetadata($where_condition: fungible_asset_metadata_bool_exp, $offset: Int, $limit: Int) {
  fungible_asset_metadata(where: $where_condition, offset: $offset, limit: $limit) {
    icon_uri
    project_uri
    supply_aggregator_table_handle_v1
    supply_aggregator_table_key_v1
    creator_address
    asset_type
    decimals
    last_transaction_timestamp
    last_transaction_version
    name
    symbol
    token_standard
    supply_v2
    maximum_v2
  }
}
    `;
export const GetNames = `
    query getNames($offset: Int, $limit: Int, $where_condition: current_cedra_names_bool_exp, $order_by: [current_cedra_names_order_by!]) {
  current_cedra_names(
    limit: $limit
    where: $where_condition
    order_by: $order_by
    offset: $offset
  ) {
    ...AnsTokenFragment
  }
}
    ${AnsTokenFragmentFragmentDoc}`;
export const GetNumberOfDelegators = `
    query getNumberOfDelegators($where_condition: num_active_delegator_per_pool_bool_exp, $order_by: [num_active_delegator_per_pool_order_by!]) {
  num_active_delegator_per_pool(where: $where_condition, order_by: $order_by) {
    num_active_delegator
    pool_address
  }
}
    `;
export const GetObjectData = `
    query getObjectData($where_condition: current_objects_bool_exp, $offset: Int, $limit: Int, $order_by: [current_objects_order_by!]) {
  current_objects(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    allow_ungated_transfer
    state_key_hash
    owner_address
    object_address
    last_transaction_version
    last_guid_creation_num
    is_deleted
  }
}
    `;
export const GetProcessorStatus = `
    query getProcessorStatus($where_condition: processor_metadata_processor_status_bool_exp) {
  processor_metadata_processor_status(where: $where_condition) {
    last_success_version
    processor
    last_updated
  }
}
    `;
export const GetTableItemsData = `
    query getTableItemsData($where_condition: table_items_bool_exp!, $offset: Int, $limit: Int, $order_by: [table_items_order_by!]) {
  table_items(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    decoded_key
    decoded_value
    key
    table_handle
    transaction_version
    write_set_change_index
  }
}
    `;
export const GetTableItemsMetadata = `
    query getTableItemsMetadata($where_condition: table_metadatas_bool_exp!, $offset: Int, $limit: Int, $order_by: [table_metadatas_order_by!]) {
  table_metadatas(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    handle
    key_type
    value_type
  }
}
    `;
export const GetTokenActivity = `
    query getTokenActivity($where_condition: token_activities_v2_bool_exp!, $offset: Int, $limit: Int, $order_by: [token_activities_v2_order_by!]) {
  token_activities_v2(
    where: $where_condition
    order_by: $order_by
    offset: $offset
    limit: $limit
  ) {
    ...TokenActivitiesFields
  }
}
    ${TokenActivitiesFieldsFragmentDoc}`;
export const GetCurrentTokenOwnership = `
    query getCurrentTokenOwnership($where_condition: current_token_ownerships_v2_bool_exp!, $offset: Int, $limit: Int, $order_by: [current_token_ownerships_v2_order_by!]) {
  current_token_ownerships_v2(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    ...CurrentTokenOwnershipFields
  }
}
    ${CurrentTokenOwnershipFieldsFragmentDoc}`;
export const GetTokenData = `
    query getTokenData($where_condition: current_token_datas_v2_bool_exp, $offset: Int, $limit: Int, $order_by: [current_token_datas_v2_order_by!]) {
  current_token_datas_v2(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    collection_id
    description
    is_fungible_v2
    largest_property_version_v1
    last_transaction_timestamp
    last_transaction_version
    maximum
    supply
    token_data_id
    token_name
    token_properties
    token_standard
    token_uri
    decimals
    current_collection {
      collection_id
      collection_name
      creator_address
      current_supply
      description
      last_transaction_timestamp
      last_transaction_version
      max_supply
      mutable_description
      mutable_uri
      table_handle_v1
      token_standard
      total_minted_v2
      uri
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getAccountCoinsCount(
      variables?: Types.GetAccountCoinsCountQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountCoinsCountQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountCoinsCountQuery>({
            document: GetAccountCoinsCount,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountCoinsCount",
        "query",
        variables,
      );
    },
    getAccountCoinsData(
      variables: Types.GetAccountCoinsDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountCoinsDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountCoinsDataQuery>({
            document: GetAccountCoinsData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountCoinsData",
        "query",
        variables,
      );
    },
    getAccountCollectionsWithOwnedTokens(
      variables: Types.GetAccountCollectionsWithOwnedTokensQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountCollectionsWithOwnedTokensQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountCollectionsWithOwnedTokensQuery>({
            document: GetAccountCollectionsWithOwnedTokens,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountCollectionsWithOwnedTokens",
        "query",
        variables,
      );
    },
    getAccountOwnedTokens(
      variables: Types.GetAccountOwnedTokensQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountOwnedTokensQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountOwnedTokensQuery>({
            document: GetAccountOwnedTokens,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountOwnedTokens",
        "query",
        variables,
      );
    },
    getAccountOwnedTokensByTokenData(
      variables: Types.GetAccountOwnedTokensByTokenDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountOwnedTokensByTokenDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountOwnedTokensByTokenDataQuery>({
            document: GetAccountOwnedTokensByTokenData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountOwnedTokensByTokenData",
        "query",
        variables,
      );
    },
    getAccountOwnedTokensFromCollection(
      variables: Types.GetAccountOwnedTokensFromCollectionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountOwnedTokensFromCollectionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountOwnedTokensFromCollectionQuery>({
            document: GetAccountOwnedTokensFromCollection,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountOwnedTokensFromCollection",
        "query",
        variables,
      );
    },
    getAccountTokensCount(
      variables?: Types.GetAccountTokensCountQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountTokensCountQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountTokensCountQuery>({
            document: GetAccountTokensCount,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountTokensCount",
        "query",
        variables,
      );
    },
    getAccountTransactionsCount(
      variables?: Types.GetAccountTransactionsCountQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetAccountTransactionsCountQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetAccountTransactionsCountQuery>({
            document: GetAccountTransactionsCount,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getAccountTransactionsCount",
        "query",
        variables,
      );
    },
    getChainTopUserTransactions(
      variables?: Types.GetChainTopUserTransactionsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetChainTopUserTransactionsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetChainTopUserTransactionsQuery>({
            document: GetChainTopUserTransactions,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getChainTopUserTransactions",
        "query",
        variables,
      );
    },
    getCollectionData(
      variables: Types.GetCollectionDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetCollectionDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetCollectionDataQuery>({
            document: GetCollectionData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getCollectionData",
        "query",
        variables,
      );
    },
    getCurrentFungibleAssetBalances(
      variables?: Types.GetCurrentFungibleAssetBalancesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetCurrentFungibleAssetBalancesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetCurrentFungibleAssetBalancesQuery>({
            document: GetCurrentFungibleAssetBalances,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getCurrentFungibleAssetBalances",
        "query",
        variables,
      );
    },
    getDelegatedStakingActivities(
      variables?: Types.GetDelegatedStakingActivitiesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetDelegatedStakingActivitiesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetDelegatedStakingActivitiesQuery>({
            document: GetDelegatedStakingActivities,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getDelegatedStakingActivities",
        "query",
        variables,
      );
    },
    getEvents(
      variables?: Types.GetEventsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetEventsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetEventsQuery>({
            document: GetEvents,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getEvents",
        "query",
        variables,
      );
    },
    getFungibleAssetActivities(
      variables?: Types.GetFungibleAssetActivitiesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetFungibleAssetActivitiesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetFungibleAssetActivitiesQuery>({
            document: GetFungibleAssetActivities,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getFungibleAssetActivities",
        "query",
        variables,
      );
    },
    getFungibleAssetMetadata(
      variables?: Types.GetFungibleAssetMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetFungibleAssetMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetFungibleAssetMetadataQuery>({
            document: GetFungibleAssetMetadata,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getFungibleAssetMetadata",
        "query",
        variables,
      );
    },
    getNames(
      variables?: Types.GetNamesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetNamesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetNamesQuery>({
            document: GetNames,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getNames",
        "query",
        variables,
      );
    },
    getNumberOfDelegators(
      variables?: Types.GetNumberOfDelegatorsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetNumberOfDelegatorsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetNumberOfDelegatorsQuery>({
            document: GetNumberOfDelegators,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getNumberOfDelegators",
        "query",
        variables,
      );
    },
    getObjectData(
      variables?: Types.GetObjectDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetObjectDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetObjectDataQuery>({
            document: GetObjectData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getObjectData",
        "query",
        variables,
      );
    },
    getProcessorStatus(
      variables?: Types.GetProcessorStatusQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetProcessorStatusQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetProcessorStatusQuery>({
            document: GetProcessorStatus,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getProcessorStatus",
        "query",
        variables,
      );
    },
    getTableItemsData(
      variables: Types.GetTableItemsDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetTableItemsDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetTableItemsDataQuery>({
            document: GetTableItemsData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getTableItemsData",
        "query",
        variables,
      );
    },
    getTableItemsMetadata(
      variables: Types.GetTableItemsMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetTableItemsMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetTableItemsMetadataQuery>({
            document: GetTableItemsMetadata,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getTableItemsMetadata",
        "query",
        variables,
      );
    },
    getTokenActivity(
      variables: Types.GetTokenActivityQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetTokenActivityQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetTokenActivityQuery>({
            document: GetTokenActivity,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getTokenActivity",
        "query",
        variables,
      );
    },
    getCurrentTokenOwnership(
      variables: Types.GetCurrentTokenOwnershipQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetCurrentTokenOwnershipQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetCurrentTokenOwnershipQuery>({
            document: GetCurrentTokenOwnership,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getCurrentTokenOwnership",
        "query",
        variables,
      );
    },
    getTokenData(
      variables?: Types.GetTokenDataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit["signal"],
    ): Promise<Types.GetTokenDataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<Types.GetTokenDataQuery>({
            document: GetTokenData,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        "getTokenData",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
