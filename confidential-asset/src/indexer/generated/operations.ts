import * as Types from './types';

export type GetConfidentialAssetActivitiesQueryVariables = Types.Exact<{
  where_condition?: Types.InputMaybe<Types.ConfidentialAssetActivitiesBoolExp>;
  offset?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  order_by?: Types.InputMaybe<Array<Types.ConfidentialAssetActivitiesOrderBy> | Types.ConfidentialAssetActivitiesOrderBy>;
}>;


export type GetConfidentialAssetActivitiesQuery = { confidential_asset_activities: Array<{ transaction_version: any, event_index: any, event_type: string, owner_address: string, asset_type?: string | null, counterparty_address?: string | null, amount?: any | null, event_data: any, event_data_version: string, block_height: any, is_transaction_success: boolean, entry_function_id_str?: string | null, transaction_timestamp: any }> };
