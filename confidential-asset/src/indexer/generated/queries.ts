import * as Types from './operations';

import { GraphQLClient, RequestOptions } from 'graphql-request';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];

export const GetConfidentialAssetActivities = `
    query getConfidentialAssetActivities($where_condition: confidential_asset_activities_bool_exp, $offset: Int, $limit: Int, $order_by: [confidential_asset_activities_order_by!]) {
  confidential_asset_activities(
    where: $where_condition
    offset: $offset
    limit: $limit
    order_by: $order_by
  ) {
    transaction_version
    event_index
    event_type
    owner_address
    asset_type
    counterparty_address
    amount
    event_data
    event_data_version
    block_height
    is_transaction_success
    entry_function_id_str
    transaction_timestamp
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getConfidentialAssetActivities(variables?: Types.GetConfidentialAssetActivitiesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.GetConfidentialAssetActivitiesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.GetConfidentialAssetActivitiesQuery>({ document: GetConfidentialAssetActivities, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'getConfidentialAssetActivities', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;