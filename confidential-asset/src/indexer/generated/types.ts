export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  bigint: { input: any; output: any; }
  jsonb: { input: any; output: any; }
  numeric: { input: any; output: any; }
  timestamp: { input: any; output: any; }
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type BooleanComparisonExp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type IntComparisonExp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type StringComparisonExp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "account_transactions" */
export type AccountTransactions = {
  account_address: Scalars['String']['output'];
  /** An array relationship */
  delegated_staking_activities: Array<DelegatedStakingActivities>;
  /** An array relationship */
  fungible_asset_activities: Array<FungibleAssetActivities>;
  /** An array relationship */
  token_activities_v2: Array<TokenActivitiesV2>;
  /** An aggregate relationship */
  token_activities_v2_aggregate: TokenActivitiesV2Aggregate;
  transaction_version: Scalars['bigint']['output'];
  /** An object relationship */
  user_transaction?: Maybe<UserTransactions>;
};


/** columns and relationships of "account_transactions" */
export type AccountTransactionsDelegatedStakingActivitiesArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingActivitiesOrderBy>>;
  where?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
};


/** columns and relationships of "account_transactions" */
export type AccountTransactionsFungibleAssetActivitiesArgs = {
  distinct_on?: InputMaybe<Array<FungibleAssetActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<FungibleAssetActivitiesOrderBy>>;
  where?: InputMaybe<FungibleAssetActivitiesBoolExp>;
};


/** columns and relationships of "account_transactions" */
export type AccountTransactionsTokenActivitiesV2Args = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


/** columns and relationships of "account_transactions" */
export type AccountTransactionsTokenActivitiesV2AggregateArgs = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};

/** aggregated selection of "account_transactions" */
export type AccountTransactionsAggregate = {
  aggregate?: Maybe<AccountTransactionsAggregateFields>;
  nodes: Array<AccountTransactions>;
};

/** aggregate fields of "account_transactions" */
export type AccountTransactionsAggregateFields = {
  avg?: Maybe<AccountTransactionsAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<AccountTransactionsMaxFields>;
  min?: Maybe<AccountTransactionsMinFields>;
  stddev?: Maybe<AccountTransactionsStddevFields>;
  stddev_pop?: Maybe<AccountTransactionsStddevPopFields>;
  stddev_samp?: Maybe<AccountTransactionsStddevSampFields>;
  sum?: Maybe<AccountTransactionsSumFields>;
  var_pop?: Maybe<AccountTransactionsVarPopFields>;
  var_samp?: Maybe<AccountTransactionsVarSampFields>;
  variance?: Maybe<AccountTransactionsVarianceFields>;
};


/** aggregate fields of "account_transactions" */
export type AccountTransactionsAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<AccountTransactionsSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type AccountTransactionsAvgFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "account_transactions". All fields are combined with a logical 'AND'. */
export type AccountTransactionsBoolExp = {
  _and?: InputMaybe<Array<AccountTransactionsBoolExp>>;
  _not?: InputMaybe<AccountTransactionsBoolExp>;
  _or?: InputMaybe<Array<AccountTransactionsBoolExp>>;
  account_address?: InputMaybe<StringComparisonExp>;
  delegated_staking_activities?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
  fungible_asset_activities?: InputMaybe<FungibleAssetActivitiesBoolExp>;
  token_activities_v2?: InputMaybe<TokenActivitiesV2BoolExp>;
  token_activities_v2_aggregate?: InputMaybe<TokenActivitiesV2AggregateBoolExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  user_transaction?: InputMaybe<UserTransactionsBoolExp>;
};

/** aggregate max on columns */
export type AccountTransactionsMaxFields = {
  account_address?: Maybe<Scalars['String']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate min on columns */
export type AccountTransactionsMinFields = {
  account_address?: Maybe<Scalars['String']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** Ordering options when selecting data from "account_transactions". */
export type AccountTransactionsOrderBy = {
  account_address?: InputMaybe<OrderBy>;
  delegated_staking_activities_aggregate?: InputMaybe<DelegatedStakingActivitiesAggregateOrderBy>;
  fungible_asset_activities_aggregate?: InputMaybe<FungibleAssetActivitiesAggregateOrderBy>;
  token_activities_v2_aggregate?: InputMaybe<TokenActivitiesV2AggregateOrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  user_transaction?: InputMaybe<UserTransactionsOrderBy>;
};

/** select columns of table "account_transactions" */
export enum AccountTransactionsSelectColumn {
  /** column name */
  AccountAddress = 'account_address',
  /** column name */
  TransactionVersion = 'transaction_version'
}

/** aggregate stddev on columns */
export type AccountTransactionsStddevFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type AccountTransactionsStddevPopFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type AccountTransactionsStddevSampFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "account_transactions" */
export type AccountTransactionsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: AccountTransactionsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type AccountTransactionsStreamCursorValueInput = {
  account_address?: InputMaybe<Scalars['String']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
};

/** aggregate sum on columns */
export type AccountTransactionsSumFields = {
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type AccountTransactionsVarPopFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type AccountTransactionsVarSampFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type AccountTransactionsVarianceFields = {
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "auth_key_account_addresses" */
export type AuthKeyAccountAddresses = {
  account_address: Scalars['String']['output'];
  auth_key: Scalars['String']['output'];
  is_auth_key_used: Scalars['Boolean']['output'];
  last_transaction_version: Scalars['bigint']['output'];
};

/** aggregated selection of "auth_key_account_addresses" */
export type AuthKeyAccountAddressesAggregate = {
  aggregate?: Maybe<AuthKeyAccountAddressesAggregateFields>;
  nodes: Array<AuthKeyAccountAddresses>;
};

/** aggregate fields of "auth_key_account_addresses" */
export type AuthKeyAccountAddressesAggregateFields = {
  avg?: Maybe<AuthKeyAccountAddressesAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<AuthKeyAccountAddressesMaxFields>;
  min?: Maybe<AuthKeyAccountAddressesMinFields>;
  stddev?: Maybe<AuthKeyAccountAddressesStddevFields>;
  stddev_pop?: Maybe<AuthKeyAccountAddressesStddevPopFields>;
  stddev_samp?: Maybe<AuthKeyAccountAddressesStddevSampFields>;
  sum?: Maybe<AuthKeyAccountAddressesSumFields>;
  var_pop?: Maybe<AuthKeyAccountAddressesVarPopFields>;
  var_samp?: Maybe<AuthKeyAccountAddressesVarSampFields>;
  variance?: Maybe<AuthKeyAccountAddressesVarianceFields>;
};


/** aggregate fields of "auth_key_account_addresses" */
export type AuthKeyAccountAddressesAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<AuthKeyAccountAddressesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type AuthKeyAccountAddressesAvgFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "auth_key_account_addresses". All fields are combined with a logical 'AND'. */
export type AuthKeyAccountAddressesBoolExp = {
  _and?: InputMaybe<Array<AuthKeyAccountAddressesBoolExp>>;
  _not?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
  _or?: InputMaybe<Array<AuthKeyAccountAddressesBoolExp>>;
  account_address?: InputMaybe<StringComparisonExp>;
  auth_key?: InputMaybe<StringComparisonExp>;
  is_auth_key_used?: InputMaybe<BooleanComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
};

/** aggregate max on columns */
export type AuthKeyAccountAddressesMaxFields = {
  account_address?: Maybe<Scalars['String']['output']>;
  auth_key?: Maybe<Scalars['String']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate min on columns */
export type AuthKeyAccountAddressesMinFields = {
  account_address?: Maybe<Scalars['String']['output']>;
  auth_key?: Maybe<Scalars['String']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** Ordering options when selecting data from "auth_key_account_addresses". */
export type AuthKeyAccountAddressesOrderBy = {
  account_address?: InputMaybe<OrderBy>;
  auth_key?: InputMaybe<OrderBy>;
  is_auth_key_used?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
};

/** select columns of table "auth_key_account_addresses" */
export enum AuthKeyAccountAddressesSelectColumn {
  /** column name */
  AccountAddress = 'account_address',
  /** column name */
  AuthKey = 'auth_key',
  /** column name */
  IsAuthKeyUsed = 'is_auth_key_used',
  /** column name */
  LastTransactionVersion = 'last_transaction_version'
}

/** aggregate stddev on columns */
export type AuthKeyAccountAddressesStddevFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type AuthKeyAccountAddressesStddevPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type AuthKeyAccountAddressesStddevSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "auth_key_account_addresses" */
export type AuthKeyAccountAddressesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: AuthKeyAccountAddressesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type AuthKeyAccountAddressesStreamCursorValueInput = {
  account_address?: InputMaybe<Scalars['String']['input']>;
  auth_key?: InputMaybe<Scalars['String']['input']>;
  is_auth_key_used?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
};

/** aggregate sum on columns */
export type AuthKeyAccountAddressesSumFields = {
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type AuthKeyAccountAddressesVarPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type AuthKeyAccountAddressesVarSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type AuthKeyAccountAddressesVarianceFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type BigintComparisonExp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** columns and relationships of "block_metadata_transactions" */
export type BlockMetadataTransactions = {
  block_height: Scalars['bigint']['output'];
  epoch: Scalars['bigint']['output'];
  failed_proposer_indices: Scalars['jsonb']['output'];
  id: Scalars['String']['output'];
  previous_block_votes_bitvec: Scalars['jsonb']['output'];
  proposer: Scalars['String']['output'];
  round: Scalars['bigint']['output'];
  timestamp: Scalars['timestamp']['output'];
  version: Scalars['bigint']['output'];
};


/** columns and relationships of "block_metadata_transactions" */
export type BlockMetadataTransactionsFailedProposerIndicesArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "block_metadata_transactions" */
export type BlockMetadataTransactionsPreviousBlockVotesBitvecArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "block_metadata_transactions". All fields are combined with a logical 'AND'. */
export type BlockMetadataTransactionsBoolExp = {
  _and?: InputMaybe<Array<BlockMetadataTransactionsBoolExp>>;
  _not?: InputMaybe<BlockMetadataTransactionsBoolExp>;
  _or?: InputMaybe<Array<BlockMetadataTransactionsBoolExp>>;
  block_height?: InputMaybe<BigintComparisonExp>;
  epoch?: InputMaybe<BigintComparisonExp>;
  failed_proposer_indices?: InputMaybe<JsonbComparisonExp>;
  id?: InputMaybe<StringComparisonExp>;
  previous_block_votes_bitvec?: InputMaybe<JsonbComparisonExp>;
  proposer?: InputMaybe<StringComparisonExp>;
  round?: InputMaybe<BigintComparisonExp>;
  timestamp?: InputMaybe<TimestampComparisonExp>;
  version?: InputMaybe<BigintComparisonExp>;
};

/** Ordering options when selecting data from "block_metadata_transactions". */
export type BlockMetadataTransactionsOrderBy = {
  block_height?: InputMaybe<OrderBy>;
  epoch?: InputMaybe<OrderBy>;
  failed_proposer_indices?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  previous_block_votes_bitvec?: InputMaybe<OrderBy>;
  proposer?: InputMaybe<OrderBy>;
  round?: InputMaybe<OrderBy>;
  timestamp?: InputMaybe<OrderBy>;
  version?: InputMaybe<OrderBy>;
};

/** select columns of table "block_metadata_transactions" */
export enum BlockMetadataTransactionsSelectColumn {
  /** column name */
  BlockHeight = 'block_height',
  /** column name */
  Epoch = 'epoch',
  /** column name */
  FailedProposerIndices = 'failed_proposer_indices',
  /** column name */
  Id = 'id',
  /** column name */
  PreviousBlockVotesBitvec = 'previous_block_votes_bitvec',
  /** column name */
  Proposer = 'proposer',
  /** column name */
  Round = 'round',
  /** column name */
  Timestamp = 'timestamp',
  /** column name */
  Version = 'version'
}

/** Streaming cursor of the table "block_metadata_transactions" */
export type BlockMetadataTransactionsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: BlockMetadataTransactionsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type BlockMetadataTransactionsStreamCursorValueInput = {
  block_height?: InputMaybe<Scalars['bigint']['input']>;
  epoch?: InputMaybe<Scalars['bigint']['input']>;
  failed_proposer_indices?: InputMaybe<Scalars['jsonb']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  previous_block_votes_bitvec?: InputMaybe<Scalars['jsonb']['input']>;
  proposer?: InputMaybe<Scalars['String']['input']>;
  round?: InputMaybe<Scalars['bigint']['input']>;
  timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  version?: InputMaybe<Scalars['bigint']['input']>;
};

/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivities = {
  amount?: Maybe<Scalars['numeric']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  block_height: Scalars['bigint']['output'];
  counterparty_address?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  counterparty_aptos_names: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  counterparty_aptos_names_aggregate: CurrentAptosNamesAggregate;
  entry_function_id_str?: Maybe<Scalars['String']['output']>;
  event_data: Scalars['jsonb']['output'];
  event_data_version: Scalars['String']['output'];
  event_index: Scalars['bigint']['output'];
  event_type: Scalars['String']['output'];
  is_transaction_success: Scalars['Boolean']['output'];
  /** An object relationship */
  metadata?: Maybe<FungibleAssetMetadata>;
  owner_address: Scalars['String']['output'];
  /** An array relationship */
  owner_aptos_names: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  owner_aptos_names_aggregate: CurrentAptosNamesAggregate;
  transaction_timestamp: Scalars['timestamp']['output'];
  transaction_version: Scalars['bigint']['output'];
};


/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivitiesCounterpartyAptosNamesArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivitiesCounterpartyAptosNamesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivitiesEventDataArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivitiesOwnerAptosNamesArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "confidential_asset_activities" */
export type ConfidentialAssetActivitiesOwnerAptosNamesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};

/** Boolean expression to filter rows from the table "confidential_asset_activities". All fields are combined with a logical 'AND'. */
export type ConfidentialAssetActivitiesBoolExp = {
  _and?: InputMaybe<Array<ConfidentialAssetActivitiesBoolExp>>;
  _not?: InputMaybe<ConfidentialAssetActivitiesBoolExp>;
  _or?: InputMaybe<Array<ConfidentialAssetActivitiesBoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  asset_type?: InputMaybe<StringComparisonExp>;
  block_height?: InputMaybe<BigintComparisonExp>;
  counterparty_address?: InputMaybe<StringComparisonExp>;
  counterparty_aptos_names?: InputMaybe<CurrentAptosNamesBoolExp>;
  counterparty_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  entry_function_id_str?: InputMaybe<StringComparisonExp>;
  event_data?: InputMaybe<JsonbComparisonExp>;
  event_data_version?: InputMaybe<StringComparisonExp>;
  event_index?: InputMaybe<BigintComparisonExp>;
  event_type?: InputMaybe<StringComparisonExp>;
  is_transaction_success?: InputMaybe<BooleanComparisonExp>;
  metadata?: InputMaybe<FungibleAssetMetadataBoolExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  owner_aptos_names?: InputMaybe<CurrentAptosNamesBoolExp>;
  owner_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
};

/** Ordering options when selecting data from "confidential_asset_activities". */
export type ConfidentialAssetActivitiesOrderBy = {
  amount?: InputMaybe<OrderBy>;
  asset_type?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  counterparty_address?: InputMaybe<OrderBy>;
  counterparty_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_data?: InputMaybe<OrderBy>;
  event_data_version?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  event_type?: InputMaybe<OrderBy>;
  is_transaction_success?: InputMaybe<OrderBy>;
  metadata?: InputMaybe<FungibleAssetMetadataOrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  owner_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** select columns of table "confidential_asset_activities" */
export enum ConfidentialAssetActivitiesSelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  AssetType = 'asset_type',
  /** column name */
  BlockHeight = 'block_height',
  /** column name */
  CounterpartyAddress = 'counterparty_address',
  /** column name */
  EntryFunctionIdStr = 'entry_function_id_str',
  /** column name */
  EventData = 'event_data',
  /** column name */
  EventDataVersion = 'event_data_version',
  /** column name */
  EventIndex = 'event_index',
  /** column name */
  EventType = 'event_type',
  /** column name */
  IsTransactionSuccess = 'is_transaction_success',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  TransactionTimestamp = 'transaction_timestamp',
  /** column name */
  TransactionVersion = 'transaction_version'
}

/** Streaming cursor of the table "confidential_asset_activities" */
export type ConfidentialAssetActivitiesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: ConfidentialAssetActivitiesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type ConfidentialAssetActivitiesStreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  asset_type?: InputMaybe<Scalars['String']['input']>;
  block_height?: InputMaybe<Scalars['bigint']['input']>;
  counterparty_address?: InputMaybe<Scalars['String']['input']>;
  entry_function_id_str?: InputMaybe<Scalars['String']['input']>;
  event_data?: InputMaybe<Scalars['jsonb']['input']>;
  event_data_version?: InputMaybe<Scalars['String']['input']>;
  event_index?: InputMaybe<Scalars['bigint']['input']>;
  event_type?: InputMaybe<Scalars['String']['input']>;
  is_transaction_success?: InputMaybe<Scalars['Boolean']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
};

/** columns and relationships of "current_ans_lookup_v2" */
export type CurrentAnsLookupV2 = {
  domain: Scalars['String']['output'];
  expiration_timestamp: Scalars['timestamp']['output'];
  is_deleted: Scalars['Boolean']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  registered_address?: Maybe<Scalars['String']['output']>;
  subdomain: Scalars['String']['output'];
  token_name?: Maybe<Scalars['String']['output']>;
  token_standard: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "current_ans_lookup_v2". All fields are combined with a logical 'AND'. */
export type CurrentAnsLookupV2BoolExp = {
  _and?: InputMaybe<Array<CurrentAnsLookupV2BoolExp>>;
  _not?: InputMaybe<CurrentAnsLookupV2BoolExp>;
  _or?: InputMaybe<Array<CurrentAnsLookupV2BoolExp>>;
  domain?: InputMaybe<StringComparisonExp>;
  expiration_timestamp?: InputMaybe<TimestampComparisonExp>;
  is_deleted?: InputMaybe<BooleanComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  registered_address?: InputMaybe<StringComparisonExp>;
  subdomain?: InputMaybe<StringComparisonExp>;
  token_name?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_ans_lookup_v2". */
export type CurrentAnsLookupV2OrderBy = {
  domain?: InputMaybe<OrderBy>;
  expiration_timestamp?: InputMaybe<OrderBy>;
  is_deleted?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  registered_address?: InputMaybe<OrderBy>;
  subdomain?: InputMaybe<OrderBy>;
  token_name?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** select columns of table "current_ans_lookup_v2" */
export enum CurrentAnsLookupV2SelectColumn {
  /** column name */
  Domain = 'domain',
  /** column name */
  ExpirationTimestamp = 'expiration_timestamp',
  /** column name */
  IsDeleted = 'is_deleted',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  RegisteredAddress = 'registered_address',
  /** column name */
  Subdomain = 'subdomain',
  /** column name */
  TokenName = 'token_name',
  /** column name */
  TokenStandard = 'token_standard'
}

/** Streaming cursor of the table "current_ans_lookup_v2" */
export type CurrentAnsLookupV2StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentAnsLookupV2StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentAnsLookupV2StreamCursorValueInput = {
  domain?: InputMaybe<Scalars['String']['input']>;
  expiration_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  is_deleted?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  registered_address?: InputMaybe<Scalars['String']['input']>;
  subdomain?: InputMaybe<Scalars['String']['input']>;
  token_name?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_aptos_names" */
export type CurrentAptosNames = {
  domain?: Maybe<Scalars['String']['output']>;
  domain_expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  domain_with_suffix?: Maybe<Scalars['String']['output']>;
  expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  /** An object relationship */
  is_domain_owner?: Maybe<CurrentAptosNames>;
  is_primary?: Maybe<Scalars['Boolean']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  registered_address?: Maybe<Scalars['String']['output']>;
  subdomain?: Maybe<Scalars['String']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['bigint']['output']>;
  token_name?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "current_aptos_names" */
export type CurrentAptosNamesAggregate = {
  aggregate?: Maybe<CurrentAptosNamesAggregateFields>;
  nodes: Array<CurrentAptosNames>;
};

export type CurrentAptosNamesAggregateBoolExp = {
  bool_and?: InputMaybe<CurrentAptosNamesAggregateBoolExpBoolAnd>;
  bool_or?: InputMaybe<CurrentAptosNamesAggregateBoolExpBoolOr>;
  count?: InputMaybe<CurrentAptosNamesAggregateBoolExpCount>;
};

export type CurrentAptosNamesAggregateBoolExpBoolAnd = {
  arguments: CurrentAptosNamesSelectColumnCurrentAptosNamesAggregateBoolExpBoolAndArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentAptosNamesBoolExp>;
  predicate: BooleanComparisonExp;
};

export type CurrentAptosNamesAggregateBoolExpBoolOr = {
  arguments: CurrentAptosNamesSelectColumnCurrentAptosNamesAggregateBoolExpBoolOrArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentAptosNamesBoolExp>;
  predicate: BooleanComparisonExp;
};

export type CurrentAptosNamesAggregateBoolExpCount = {
  arguments?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentAptosNamesBoolExp>;
  predicate: IntComparisonExp;
};

/** aggregate fields of "current_aptos_names" */
export type CurrentAptosNamesAggregateFields = {
  avg?: Maybe<CurrentAptosNamesAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<CurrentAptosNamesMaxFields>;
  min?: Maybe<CurrentAptosNamesMinFields>;
  stddev?: Maybe<CurrentAptosNamesStddevFields>;
  stddev_pop?: Maybe<CurrentAptosNamesStddevPopFields>;
  stddev_samp?: Maybe<CurrentAptosNamesStddevSampFields>;
  sum?: Maybe<CurrentAptosNamesSumFields>;
  var_pop?: Maybe<CurrentAptosNamesVarPopFields>;
  var_samp?: Maybe<CurrentAptosNamesVarSampFields>;
  variance?: Maybe<CurrentAptosNamesVarianceFields>;
};


/** aggregate fields of "current_aptos_names" */
export type CurrentAptosNamesAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "current_aptos_names" */
export type CurrentAptosNamesAggregateOrderBy = {
  avg?: InputMaybe<CurrentAptosNamesAvgOrderBy>;
  count?: InputMaybe<OrderBy>;
  max?: InputMaybe<CurrentAptosNamesMaxOrderBy>;
  min?: InputMaybe<CurrentAptosNamesMinOrderBy>;
  stddev?: InputMaybe<CurrentAptosNamesStddevOrderBy>;
  stddev_pop?: InputMaybe<CurrentAptosNamesStddevPopOrderBy>;
  stddev_samp?: InputMaybe<CurrentAptosNamesStddevSampOrderBy>;
  sum?: InputMaybe<CurrentAptosNamesSumOrderBy>;
  var_pop?: InputMaybe<CurrentAptosNamesVarPopOrderBy>;
  var_samp?: InputMaybe<CurrentAptosNamesVarSampOrderBy>;
  variance?: InputMaybe<CurrentAptosNamesVarianceOrderBy>;
};

/** aggregate avg on columns */
export type CurrentAptosNamesAvgFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "current_aptos_names" */
export type CurrentAptosNamesAvgOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** Boolean expression to filter rows from the table "current_aptos_names". All fields are combined with a logical 'AND'. */
export type CurrentAptosNamesBoolExp = {
  _and?: InputMaybe<Array<CurrentAptosNamesBoolExp>>;
  _not?: InputMaybe<CurrentAptosNamesBoolExp>;
  _or?: InputMaybe<Array<CurrentAptosNamesBoolExp>>;
  domain?: InputMaybe<StringComparisonExp>;
  domain_expiration_timestamp?: InputMaybe<TimestampComparisonExp>;
  domain_with_suffix?: InputMaybe<StringComparisonExp>;
  expiration_timestamp?: InputMaybe<TimestampComparisonExp>;
  is_active?: InputMaybe<BooleanComparisonExp>;
  is_domain_owner?: InputMaybe<CurrentAptosNamesBoolExp>;
  is_primary?: InputMaybe<BooleanComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  registered_address?: InputMaybe<StringComparisonExp>;
  subdomain?: InputMaybe<StringComparisonExp>;
  subdomain_expiration_policy?: InputMaybe<BigintComparisonExp>;
  token_name?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type CurrentAptosNamesMaxFields = {
  domain?: Maybe<Scalars['String']['output']>;
  domain_expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  domain_with_suffix?: Maybe<Scalars['String']['output']>;
  expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  registered_address?: Maybe<Scalars['String']['output']>;
  subdomain?: Maybe<Scalars['String']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['bigint']['output']>;
  token_name?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "current_aptos_names" */
export type CurrentAptosNamesMaxOrderBy = {
  domain?: InputMaybe<OrderBy>;
  domain_expiration_timestamp?: InputMaybe<OrderBy>;
  domain_with_suffix?: InputMaybe<OrderBy>;
  expiration_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  registered_address?: InputMaybe<OrderBy>;
  subdomain?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
  token_name?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** aggregate min on columns */
export type CurrentAptosNamesMinFields = {
  domain?: Maybe<Scalars['String']['output']>;
  domain_expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  domain_with_suffix?: Maybe<Scalars['String']['output']>;
  expiration_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  registered_address?: Maybe<Scalars['String']['output']>;
  subdomain?: Maybe<Scalars['String']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['bigint']['output']>;
  token_name?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "current_aptos_names" */
export type CurrentAptosNamesMinOrderBy = {
  domain?: InputMaybe<OrderBy>;
  domain_expiration_timestamp?: InputMaybe<OrderBy>;
  domain_with_suffix?: InputMaybe<OrderBy>;
  expiration_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  registered_address?: InputMaybe<OrderBy>;
  subdomain?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
  token_name?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** Ordering options when selecting data from "current_aptos_names". */
export type CurrentAptosNamesOrderBy = {
  domain?: InputMaybe<OrderBy>;
  domain_expiration_timestamp?: InputMaybe<OrderBy>;
  domain_with_suffix?: InputMaybe<OrderBy>;
  expiration_timestamp?: InputMaybe<OrderBy>;
  is_active?: InputMaybe<OrderBy>;
  is_domain_owner?: InputMaybe<CurrentAptosNamesOrderBy>;
  is_primary?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  registered_address?: InputMaybe<OrderBy>;
  subdomain?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
  token_name?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** select columns of table "current_aptos_names" */
export enum CurrentAptosNamesSelectColumn {
  /** column name */
  Domain = 'domain',
  /** column name */
  DomainExpirationTimestamp = 'domain_expiration_timestamp',
  /** column name */
  DomainWithSuffix = 'domain_with_suffix',
  /** column name */
  ExpirationTimestamp = 'expiration_timestamp',
  /** column name */
  IsActive = 'is_active',
  /** column name */
  IsPrimary = 'is_primary',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  RegisteredAddress = 'registered_address',
  /** column name */
  Subdomain = 'subdomain',
  /** column name */
  SubdomainExpirationPolicy = 'subdomain_expiration_policy',
  /** column name */
  TokenName = 'token_name',
  /** column name */
  TokenStandard = 'token_standard'
}

/** select "current_aptos_names_aggregate_bool_exp_bool_and_arguments_columns" columns of table "current_aptos_names" */
export enum CurrentAptosNamesSelectColumnCurrentAptosNamesAggregateBoolExpBoolAndArgumentsColumns {
  /** column name */
  IsActive = 'is_active',
  /** column name */
  IsPrimary = 'is_primary'
}

/** select "current_aptos_names_aggregate_bool_exp_bool_or_arguments_columns" columns of table "current_aptos_names" */
export enum CurrentAptosNamesSelectColumnCurrentAptosNamesAggregateBoolExpBoolOrArgumentsColumns {
  /** column name */
  IsActive = 'is_active',
  /** column name */
  IsPrimary = 'is_primary'
}

/** aggregate stddev on columns */
export type CurrentAptosNamesStddevFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "current_aptos_names" */
export type CurrentAptosNamesStddevOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** aggregate stddev_pop on columns */
export type CurrentAptosNamesStddevPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "current_aptos_names" */
export type CurrentAptosNamesStddevPopOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** aggregate stddev_samp on columns */
export type CurrentAptosNamesStddevSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "current_aptos_names" */
export type CurrentAptosNamesStddevSampOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** Streaming cursor of the table "current_aptos_names" */
export type CurrentAptosNamesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentAptosNamesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentAptosNamesStreamCursorValueInput = {
  domain?: InputMaybe<Scalars['String']['input']>;
  domain_expiration_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  domain_with_suffix?: InputMaybe<Scalars['String']['input']>;
  expiration_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  registered_address?: InputMaybe<Scalars['String']['input']>;
  subdomain?: InputMaybe<Scalars['String']['input']>;
  subdomain_expiration_policy?: InputMaybe<Scalars['bigint']['input']>;
  token_name?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type CurrentAptosNamesSumFields = {
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['bigint']['output']>;
};

/** order by sum() on columns of table "current_aptos_names" */
export type CurrentAptosNamesSumOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** aggregate var_pop on columns */
export type CurrentAptosNamesVarPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "current_aptos_names" */
export type CurrentAptosNamesVarPopOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** aggregate var_samp on columns */
export type CurrentAptosNamesVarSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "current_aptos_names" */
export type CurrentAptosNamesVarSampOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** aggregate variance on columns */
export type CurrentAptosNamesVarianceFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  subdomain_expiration_policy?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "current_aptos_names" */
export type CurrentAptosNamesVarianceOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  subdomain_expiration_policy?: InputMaybe<OrderBy>;
};

/** columns and relationships of "current_collection_ownership_v2_view" */
export type CurrentCollectionOwnershipV2View = {
  collection_id?: Maybe<Scalars['String']['output']>;
  collection_name?: Maybe<Scalars['String']['output']>;
  collection_uri?: Maybe<Scalars['String']['output']>;
  creator_address?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  current_collection?: Maybe<CurrentCollectionsV2>;
  distinct_tokens?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  single_token_uri?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "current_collection_ownership_v2_view" */
export type CurrentCollectionOwnershipV2ViewAggregate = {
  aggregate?: Maybe<CurrentCollectionOwnershipV2ViewAggregateFields>;
  nodes: Array<CurrentCollectionOwnershipV2View>;
};

/** aggregate fields of "current_collection_ownership_v2_view" */
export type CurrentCollectionOwnershipV2ViewAggregateFields = {
  avg?: Maybe<CurrentCollectionOwnershipV2ViewAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<CurrentCollectionOwnershipV2ViewMaxFields>;
  min?: Maybe<CurrentCollectionOwnershipV2ViewMinFields>;
  stddev?: Maybe<CurrentCollectionOwnershipV2ViewStddevFields>;
  stddev_pop?: Maybe<CurrentCollectionOwnershipV2ViewStddevPopFields>;
  stddev_samp?: Maybe<CurrentCollectionOwnershipV2ViewStddevSampFields>;
  sum?: Maybe<CurrentCollectionOwnershipV2ViewSumFields>;
  var_pop?: Maybe<CurrentCollectionOwnershipV2ViewVarPopFields>;
  var_samp?: Maybe<CurrentCollectionOwnershipV2ViewVarSampFields>;
  variance?: Maybe<CurrentCollectionOwnershipV2ViewVarianceFields>;
};


/** aggregate fields of "current_collection_ownership_v2_view" */
export type CurrentCollectionOwnershipV2ViewAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type CurrentCollectionOwnershipV2ViewAvgFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "current_collection_ownership_v2_view". All fields are combined with a logical 'AND'. */
export type CurrentCollectionOwnershipV2ViewBoolExp = {
  _and?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewBoolExp>>;
  _not?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
  _or?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewBoolExp>>;
  collection_id?: InputMaybe<StringComparisonExp>;
  collection_name?: InputMaybe<StringComparisonExp>;
  collection_uri?: InputMaybe<StringComparisonExp>;
  creator_address?: InputMaybe<StringComparisonExp>;
  current_collection?: InputMaybe<CurrentCollectionsV2BoolExp>;
  distinct_tokens?: InputMaybe<BigintComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  single_token_uri?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type CurrentCollectionOwnershipV2ViewMaxFields = {
  collection_id?: Maybe<Scalars['String']['output']>;
  collection_name?: Maybe<Scalars['String']['output']>;
  collection_uri?: Maybe<Scalars['String']['output']>;
  creator_address?: Maybe<Scalars['String']['output']>;
  distinct_tokens?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  single_token_uri?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type CurrentCollectionOwnershipV2ViewMinFields = {
  collection_id?: Maybe<Scalars['String']['output']>;
  collection_name?: Maybe<Scalars['String']['output']>;
  collection_uri?: Maybe<Scalars['String']['output']>;
  creator_address?: Maybe<Scalars['String']['output']>;
  distinct_tokens?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  single_token_uri?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "current_collection_ownership_v2_view". */
export type CurrentCollectionOwnershipV2ViewOrderBy = {
  collection_id?: InputMaybe<OrderBy>;
  collection_name?: InputMaybe<OrderBy>;
  collection_uri?: InputMaybe<OrderBy>;
  creator_address?: InputMaybe<OrderBy>;
  current_collection?: InputMaybe<CurrentCollectionsV2OrderBy>;
  distinct_tokens?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  single_token_uri?: InputMaybe<OrderBy>;
};

/** select columns of table "current_collection_ownership_v2_view" */
export enum CurrentCollectionOwnershipV2ViewSelectColumn {
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  CollectionName = 'collection_name',
  /** column name */
  CollectionUri = 'collection_uri',
  /** column name */
  CreatorAddress = 'creator_address',
  /** column name */
  DistinctTokens = 'distinct_tokens',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  SingleTokenUri = 'single_token_uri'
}

/** aggregate stddev on columns */
export type CurrentCollectionOwnershipV2ViewStddevFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type CurrentCollectionOwnershipV2ViewStddevPopFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type CurrentCollectionOwnershipV2ViewStddevSampFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "current_collection_ownership_v2_view" */
export type CurrentCollectionOwnershipV2ViewStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentCollectionOwnershipV2ViewStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentCollectionOwnershipV2ViewStreamCursorValueInput = {
  collection_id?: InputMaybe<Scalars['String']['input']>;
  collection_name?: InputMaybe<Scalars['String']['input']>;
  collection_uri?: InputMaybe<Scalars['String']['input']>;
  creator_address?: InputMaybe<Scalars['String']['input']>;
  distinct_tokens?: InputMaybe<Scalars['bigint']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  single_token_uri?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type CurrentCollectionOwnershipV2ViewSumFields = {
  distinct_tokens?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type CurrentCollectionOwnershipV2ViewVarPopFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type CurrentCollectionOwnershipV2ViewVarSampFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type CurrentCollectionOwnershipV2ViewVarianceFields = {
  distinct_tokens?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "current_collections_v2" */
export type CurrentCollectionsV2 = {
  /** An object relationship */
  cdn_asset_uris?: Maybe<NftMetadataCrawlerParsedAssetUris>;
  collection_id: Scalars['String']['output'];
  collection_name: Scalars['String']['output'];
  collection_properties?: Maybe<Scalars['jsonb']['output']>;
  creator_address: Scalars['String']['output'];
  current_supply: Scalars['numeric']['output'];
  description: Scalars['String']['output'];
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  max_supply?: Maybe<Scalars['numeric']['output']>;
  mutable_description?: Maybe<Scalars['Boolean']['output']>;
  mutable_uri?: Maybe<Scalars['Boolean']['output']>;
  table_handle_v1?: Maybe<Scalars['String']['output']>;
  token_standard: Scalars['String']['output'];
  total_minted_v2?: Maybe<Scalars['numeric']['output']>;
  uri: Scalars['String']['output'];
};


/** columns and relationships of "current_collections_v2" */
export type CurrentCollectionsV2CollectionPropertiesArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "current_collections_v2". All fields are combined with a logical 'AND'. */
export type CurrentCollectionsV2BoolExp = {
  _and?: InputMaybe<Array<CurrentCollectionsV2BoolExp>>;
  _not?: InputMaybe<CurrentCollectionsV2BoolExp>;
  _or?: InputMaybe<Array<CurrentCollectionsV2BoolExp>>;
  cdn_asset_uris?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
  collection_id?: InputMaybe<StringComparisonExp>;
  collection_name?: InputMaybe<StringComparisonExp>;
  collection_properties?: InputMaybe<JsonbComparisonExp>;
  creator_address?: InputMaybe<StringComparisonExp>;
  current_supply?: InputMaybe<NumericComparisonExp>;
  description?: InputMaybe<StringComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  max_supply?: InputMaybe<NumericComparisonExp>;
  mutable_description?: InputMaybe<BooleanComparisonExp>;
  mutable_uri?: InputMaybe<BooleanComparisonExp>;
  table_handle_v1?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
  total_minted_v2?: InputMaybe<NumericComparisonExp>;
  uri?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_collections_v2". */
export type CurrentCollectionsV2OrderBy = {
  cdn_asset_uris?: InputMaybe<NftMetadataCrawlerParsedAssetUrisOrderBy>;
  collection_id?: InputMaybe<OrderBy>;
  collection_name?: InputMaybe<OrderBy>;
  collection_properties?: InputMaybe<OrderBy>;
  creator_address?: InputMaybe<OrderBy>;
  current_supply?: InputMaybe<OrderBy>;
  description?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  max_supply?: InputMaybe<OrderBy>;
  mutable_description?: InputMaybe<OrderBy>;
  mutable_uri?: InputMaybe<OrderBy>;
  table_handle_v1?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  total_minted_v2?: InputMaybe<OrderBy>;
  uri?: InputMaybe<OrderBy>;
};

/** select columns of table "current_collections_v2" */
export enum CurrentCollectionsV2SelectColumn {
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  CollectionName = 'collection_name',
  /** column name */
  CollectionProperties = 'collection_properties',
  /** column name */
  CreatorAddress = 'creator_address',
  /** column name */
  CurrentSupply = 'current_supply',
  /** column name */
  Description = 'description',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  MaxSupply = 'max_supply',
  /** column name */
  MutableDescription = 'mutable_description',
  /** column name */
  MutableUri = 'mutable_uri',
  /** column name */
  TableHandleV1 = 'table_handle_v1',
  /** column name */
  TokenStandard = 'token_standard',
  /** column name */
  TotalMintedV2 = 'total_minted_v2',
  /** column name */
  Uri = 'uri'
}

/** Streaming cursor of the table "current_collections_v2" */
export type CurrentCollectionsV2StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentCollectionsV2StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentCollectionsV2StreamCursorValueInput = {
  collection_id?: InputMaybe<Scalars['String']['input']>;
  collection_name?: InputMaybe<Scalars['String']['input']>;
  collection_properties?: InputMaybe<Scalars['jsonb']['input']>;
  creator_address?: InputMaybe<Scalars['String']['input']>;
  current_supply?: InputMaybe<Scalars['numeric']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  max_supply?: InputMaybe<Scalars['numeric']['input']>;
  mutable_description?: InputMaybe<Scalars['Boolean']['input']>;
  mutable_uri?: InputMaybe<Scalars['Boolean']['input']>;
  table_handle_v1?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
  total_minted_v2?: InputMaybe<Scalars['numeric']['input']>;
  uri?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_delegated_staking_pool_balances" */
export type CurrentDelegatedStakingPoolBalances = {
  active_table_handle: Scalars['String']['output'];
  inactive_table_handle: Scalars['String']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  operator_commission_percentage: Scalars['numeric']['output'];
  staking_pool_address: Scalars['String']['output'];
  total_coins: Scalars['numeric']['output'];
  total_shares: Scalars['numeric']['output'];
};

/** Boolean expression to filter rows from the table "current_delegated_staking_pool_balances". All fields are combined with a logical 'AND'. */
export type CurrentDelegatedStakingPoolBalancesBoolExp = {
  _and?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesBoolExp>>;
  _not?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
  _or?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesBoolExp>>;
  active_table_handle?: InputMaybe<StringComparisonExp>;
  inactive_table_handle?: InputMaybe<StringComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  operator_commission_percentage?: InputMaybe<NumericComparisonExp>;
  staking_pool_address?: InputMaybe<StringComparisonExp>;
  total_coins?: InputMaybe<NumericComparisonExp>;
  total_shares?: InputMaybe<NumericComparisonExp>;
};

/** Ordering options when selecting data from "current_delegated_staking_pool_balances". */
export type CurrentDelegatedStakingPoolBalancesOrderBy = {
  active_table_handle?: InputMaybe<OrderBy>;
  inactive_table_handle?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  operator_commission_percentage?: InputMaybe<OrderBy>;
  staking_pool_address?: InputMaybe<OrderBy>;
  total_coins?: InputMaybe<OrderBy>;
  total_shares?: InputMaybe<OrderBy>;
};

/** select columns of table "current_delegated_staking_pool_balances" */
export enum CurrentDelegatedStakingPoolBalancesSelectColumn {
  /** column name */
  ActiveTableHandle = 'active_table_handle',
  /** column name */
  InactiveTableHandle = 'inactive_table_handle',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  OperatorCommissionPercentage = 'operator_commission_percentage',
  /** column name */
  StakingPoolAddress = 'staking_pool_address',
  /** column name */
  TotalCoins = 'total_coins',
  /** column name */
  TotalShares = 'total_shares'
}

/** Streaming cursor of the table "current_delegated_staking_pool_balances" */
export type CurrentDelegatedStakingPoolBalancesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentDelegatedStakingPoolBalancesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentDelegatedStakingPoolBalancesStreamCursorValueInput = {
  active_table_handle?: InputMaybe<Scalars['String']['input']>;
  inactive_table_handle?: InputMaybe<Scalars['String']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  operator_commission_percentage?: InputMaybe<Scalars['numeric']['input']>;
  staking_pool_address?: InputMaybe<Scalars['String']['input']>;
  total_coins?: InputMaybe<Scalars['numeric']['input']>;
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
};

/** columns and relationships of "current_delegated_voter" */
export type CurrentDelegatedVoter = {
  delegation_pool_address: Scalars['String']['output'];
  delegator_address: Scalars['String']['output'];
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  pending_voter?: Maybe<Scalars['String']['output']>;
  table_handle?: Maybe<Scalars['String']['output']>;
  voter?: Maybe<Scalars['String']['output']>;
};

/** Boolean expression to filter rows from the table "current_delegated_voter". All fields are combined with a logical 'AND'. */
export type CurrentDelegatedVoterBoolExp = {
  _and?: InputMaybe<Array<CurrentDelegatedVoterBoolExp>>;
  _not?: InputMaybe<CurrentDelegatedVoterBoolExp>;
  _or?: InputMaybe<Array<CurrentDelegatedVoterBoolExp>>;
  delegation_pool_address?: InputMaybe<StringComparisonExp>;
  delegator_address?: InputMaybe<StringComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  pending_voter?: InputMaybe<StringComparisonExp>;
  table_handle?: InputMaybe<StringComparisonExp>;
  voter?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_delegated_voter". */
export type CurrentDelegatedVoterOrderBy = {
  delegation_pool_address?: InputMaybe<OrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  pending_voter?: InputMaybe<OrderBy>;
  table_handle?: InputMaybe<OrderBy>;
  voter?: InputMaybe<OrderBy>;
};

/** select columns of table "current_delegated_voter" */
export enum CurrentDelegatedVoterSelectColumn {
  /** column name */
  DelegationPoolAddress = 'delegation_pool_address',
  /** column name */
  DelegatorAddress = 'delegator_address',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  PendingVoter = 'pending_voter',
  /** column name */
  TableHandle = 'table_handle',
  /** column name */
  Voter = 'voter'
}

/** Streaming cursor of the table "current_delegated_voter" */
export type CurrentDelegatedVoterStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentDelegatedVoterStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentDelegatedVoterStreamCursorValueInput = {
  delegation_pool_address?: InputMaybe<Scalars['String']['input']>;
  delegator_address?: InputMaybe<Scalars['String']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  pending_voter?: InputMaybe<Scalars['String']['input']>;
  table_handle?: InputMaybe<Scalars['String']['input']>;
  voter?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_delegator_balances" */
export type CurrentDelegatorBalances = {
  /** An object relationship */
  current_pool_balance?: Maybe<CurrentDelegatedStakingPoolBalances>;
  delegator_address: Scalars['String']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  parent_table_handle: Scalars['String']['output'];
  pool_address: Scalars['String']['output'];
  pool_type: Scalars['String']['output'];
  shares: Scalars['numeric']['output'];
  /** An object relationship */
  staking_pool_metadata?: Maybe<CurrentStakingPoolVoter>;
  table_handle: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "current_delegator_balances". All fields are combined with a logical 'AND'. */
export type CurrentDelegatorBalancesBoolExp = {
  _and?: InputMaybe<Array<CurrentDelegatorBalancesBoolExp>>;
  _not?: InputMaybe<CurrentDelegatorBalancesBoolExp>;
  _or?: InputMaybe<Array<CurrentDelegatorBalancesBoolExp>>;
  current_pool_balance?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
  delegator_address?: InputMaybe<StringComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  parent_table_handle?: InputMaybe<StringComparisonExp>;
  pool_address?: InputMaybe<StringComparisonExp>;
  pool_type?: InputMaybe<StringComparisonExp>;
  shares?: InputMaybe<NumericComparisonExp>;
  staking_pool_metadata?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
  table_handle?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_delegator_balances". */
export type CurrentDelegatorBalancesOrderBy = {
  current_pool_balance?: InputMaybe<CurrentDelegatedStakingPoolBalancesOrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  parent_table_handle?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
  pool_type?: InputMaybe<OrderBy>;
  shares?: InputMaybe<OrderBy>;
  staking_pool_metadata?: InputMaybe<CurrentStakingPoolVoterOrderBy>;
  table_handle?: InputMaybe<OrderBy>;
};

/** select columns of table "current_delegator_balances" */
export enum CurrentDelegatorBalancesSelectColumn {
  /** column name */
  DelegatorAddress = 'delegator_address',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  ParentTableHandle = 'parent_table_handle',
  /** column name */
  PoolAddress = 'pool_address',
  /** column name */
  PoolType = 'pool_type',
  /** column name */
  Shares = 'shares',
  /** column name */
  TableHandle = 'table_handle'
}

/** Streaming cursor of the table "current_delegator_balances" */
export type CurrentDelegatorBalancesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentDelegatorBalancesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentDelegatorBalancesStreamCursorValueInput = {
  delegator_address?: InputMaybe<Scalars['String']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  parent_table_handle?: InputMaybe<Scalars['String']['input']>;
  pool_address?: InputMaybe<Scalars['String']['input']>;
  pool_type?: InputMaybe<Scalars['String']['input']>;
  shares?: InputMaybe<Scalars['numeric']['input']>;
  table_handle?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_fungible_asset_balances" */
export type CurrentFungibleAssetBalances = {
  amount: Scalars['numeric']['output'];
  amount_v1?: Maybe<Scalars['numeric']['output']>;
  amount_v2?: Maybe<Scalars['numeric']['output']>;
  asset_type: Scalars['String']['output'];
  asset_type_v1?: Maybe<Scalars['String']['output']>;
  asset_type_v2?: Maybe<Scalars['String']['output']>;
  is_frozen: Scalars['Boolean']['output'];
  is_primary: Scalars['Boolean']['output'];
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v1?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v2?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  metadata?: Maybe<FungibleAssetMetadata>;
  owner_address: Scalars['String']['output'];
  storage_id: Scalars['String']['output'];
  token_standard: Scalars['String']['output'];
};

/** aggregated selection of "current_fungible_asset_balances" */
export type CurrentFungibleAssetBalancesAggregate = {
  aggregate?: Maybe<CurrentFungibleAssetBalancesAggregateFields>;
  nodes: Array<CurrentFungibleAssetBalances>;
};

/** aggregate fields of "current_fungible_asset_balances" */
export type CurrentFungibleAssetBalancesAggregateFields = {
  avg?: Maybe<CurrentFungibleAssetBalancesAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<CurrentFungibleAssetBalancesMaxFields>;
  min?: Maybe<CurrentFungibleAssetBalancesMinFields>;
  stddev?: Maybe<CurrentFungibleAssetBalancesStddevFields>;
  stddev_pop?: Maybe<CurrentFungibleAssetBalancesStddevPopFields>;
  stddev_samp?: Maybe<CurrentFungibleAssetBalancesStddevSampFields>;
  sum?: Maybe<CurrentFungibleAssetBalancesSumFields>;
  var_pop?: Maybe<CurrentFungibleAssetBalancesVarPopFields>;
  var_samp?: Maybe<CurrentFungibleAssetBalancesVarSampFields>;
  variance?: Maybe<CurrentFungibleAssetBalancesVarianceFields>;
};


/** aggregate fields of "current_fungible_asset_balances" */
export type CurrentFungibleAssetBalancesAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<CurrentFungibleAssetBalancesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type CurrentFungibleAssetBalancesAvgFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "current_fungible_asset_balances". All fields are combined with a logical 'AND'. */
export type CurrentFungibleAssetBalancesBoolExp = {
  _and?: InputMaybe<Array<CurrentFungibleAssetBalancesBoolExp>>;
  _not?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
  _or?: InputMaybe<Array<CurrentFungibleAssetBalancesBoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  amount_v1?: InputMaybe<NumericComparisonExp>;
  amount_v2?: InputMaybe<NumericComparisonExp>;
  asset_type?: InputMaybe<StringComparisonExp>;
  asset_type_v1?: InputMaybe<StringComparisonExp>;
  asset_type_v2?: InputMaybe<StringComparisonExp>;
  is_frozen?: InputMaybe<BooleanComparisonExp>;
  is_primary?: InputMaybe<BooleanComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_timestamp_v1?: InputMaybe<TimestampComparisonExp>;
  last_transaction_timestamp_v2?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  last_transaction_version_v1?: InputMaybe<BigintComparisonExp>;
  last_transaction_version_v2?: InputMaybe<BigintComparisonExp>;
  metadata?: InputMaybe<FungibleAssetMetadataBoolExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  storage_id?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type CurrentFungibleAssetBalancesMaxFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  amount_v1?: Maybe<Scalars['numeric']['output']>;
  amount_v2?: Maybe<Scalars['numeric']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_type_v1?: Maybe<Scalars['String']['output']>;
  asset_type_v2?: Maybe<Scalars['String']['output']>;
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v1?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v2?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  storage_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type CurrentFungibleAssetBalancesMinFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  amount_v1?: Maybe<Scalars['numeric']['output']>;
  amount_v2?: Maybe<Scalars['numeric']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_type_v1?: Maybe<Scalars['String']['output']>;
  asset_type_v2?: Maybe<Scalars['String']['output']>;
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v1?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_timestamp_v2?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  storage_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "current_fungible_asset_balances". */
export type CurrentFungibleAssetBalancesOrderBy = {
  amount?: InputMaybe<OrderBy>;
  amount_v1?: InputMaybe<OrderBy>;
  amount_v2?: InputMaybe<OrderBy>;
  asset_type?: InputMaybe<OrderBy>;
  asset_type_v1?: InputMaybe<OrderBy>;
  asset_type_v2?: InputMaybe<OrderBy>;
  is_frozen?: InputMaybe<OrderBy>;
  is_primary?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_timestamp_v1?: InputMaybe<OrderBy>;
  last_transaction_timestamp_v2?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  last_transaction_version_v1?: InputMaybe<OrderBy>;
  last_transaction_version_v2?: InputMaybe<OrderBy>;
  metadata?: InputMaybe<FungibleAssetMetadataOrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** select columns of table "current_fungible_asset_balances" */
export enum CurrentFungibleAssetBalancesSelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  AmountV1 = 'amount_v1',
  /** column name */
  AmountV2 = 'amount_v2',
  /** column name */
  AssetType = 'asset_type',
  /** column name */
  AssetTypeV1 = 'asset_type_v1',
  /** column name */
  AssetTypeV2 = 'asset_type_v2',
  /** column name */
  IsFrozen = 'is_frozen',
  /** column name */
  IsPrimary = 'is_primary',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionTimestampV1 = 'last_transaction_timestamp_v1',
  /** column name */
  LastTransactionTimestampV2 = 'last_transaction_timestamp_v2',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  LastTransactionVersionV1 = 'last_transaction_version_v1',
  /** column name */
  LastTransactionVersionV2 = 'last_transaction_version_v2',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  StorageId = 'storage_id',
  /** column name */
  TokenStandard = 'token_standard'
}

/** aggregate stddev on columns */
export type CurrentFungibleAssetBalancesStddevFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type CurrentFungibleAssetBalancesStddevPopFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type CurrentFungibleAssetBalancesStddevSampFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "current_fungible_asset_balances" */
export type CurrentFungibleAssetBalancesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentFungibleAssetBalancesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentFungibleAssetBalancesStreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  amount_v1?: InputMaybe<Scalars['numeric']['input']>;
  amount_v2?: InputMaybe<Scalars['numeric']['input']>;
  asset_type?: InputMaybe<Scalars['String']['input']>;
  asset_type_v1?: InputMaybe<Scalars['String']['input']>;
  asset_type_v2?: InputMaybe<Scalars['String']['input']>;
  is_frozen?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_timestamp_v1?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_timestamp_v2?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  last_transaction_version_v1?: InputMaybe<Scalars['bigint']['input']>;
  last_transaction_version_v2?: InputMaybe<Scalars['bigint']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  storage_id?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type CurrentFungibleAssetBalancesSumFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  amount_v1?: Maybe<Scalars['numeric']['output']>;
  amount_v2?: Maybe<Scalars['numeric']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['bigint']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type CurrentFungibleAssetBalancesVarPopFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type CurrentFungibleAssetBalancesVarSampFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type CurrentFungibleAssetBalancesVarianceFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  amount_v1?: Maybe<Scalars['Float']['output']>;
  amount_v2?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v1?: Maybe<Scalars['Float']['output']>;
  last_transaction_version_v2?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "current_objects" */
export type CurrentObjects = {
  allow_ungated_transfer: Scalars['Boolean']['output'];
  is_deleted: Scalars['Boolean']['output'];
  last_guid_creation_num: Scalars['numeric']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  object_address: Scalars['String']['output'];
  owner_address: Scalars['String']['output'];
  state_key_hash: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "current_objects". All fields are combined with a logical 'AND'. */
export type CurrentObjectsBoolExp = {
  _and?: InputMaybe<Array<CurrentObjectsBoolExp>>;
  _not?: InputMaybe<CurrentObjectsBoolExp>;
  _or?: InputMaybe<Array<CurrentObjectsBoolExp>>;
  allow_ungated_transfer?: InputMaybe<BooleanComparisonExp>;
  is_deleted?: InputMaybe<BooleanComparisonExp>;
  last_guid_creation_num?: InputMaybe<NumericComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  object_address?: InputMaybe<StringComparisonExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  state_key_hash?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_objects". */
export type CurrentObjectsOrderBy = {
  allow_ungated_transfer?: InputMaybe<OrderBy>;
  is_deleted?: InputMaybe<OrderBy>;
  last_guid_creation_num?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  object_address?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  state_key_hash?: InputMaybe<OrderBy>;
};

/** select columns of table "current_objects" */
export enum CurrentObjectsSelectColumn {
  /** column name */
  AllowUngatedTransfer = 'allow_ungated_transfer',
  /** column name */
  IsDeleted = 'is_deleted',
  /** column name */
  LastGuidCreationNum = 'last_guid_creation_num',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  ObjectAddress = 'object_address',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  StateKeyHash = 'state_key_hash'
}

/** Streaming cursor of the table "current_objects" */
export type CurrentObjectsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentObjectsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentObjectsStreamCursorValueInput = {
  allow_ungated_transfer?: InputMaybe<Scalars['Boolean']['input']>;
  is_deleted?: InputMaybe<Scalars['Boolean']['input']>;
  last_guid_creation_num?: InputMaybe<Scalars['numeric']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  object_address?: InputMaybe<Scalars['String']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  state_key_hash?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_staking_pool_voter" */
export type CurrentStakingPoolVoter = {
  last_transaction_version: Scalars['bigint']['output'];
  operator_address: Scalars['String']['output'];
  /** An array relationship */
  operator_aptos_name: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  operator_aptos_name_aggregate: CurrentAptosNamesAggregate;
  staking_pool_address: Scalars['String']['output'];
  voter_address: Scalars['String']['output'];
};


/** columns and relationships of "current_staking_pool_voter" */
export type CurrentStakingPoolVoterOperatorAptosNameArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "current_staking_pool_voter" */
export type CurrentStakingPoolVoterOperatorAptosNameAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};

/** Boolean expression to filter rows from the table "current_staking_pool_voter". All fields are combined with a logical 'AND'. */
export type CurrentStakingPoolVoterBoolExp = {
  _and?: InputMaybe<Array<CurrentStakingPoolVoterBoolExp>>;
  _not?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
  _or?: InputMaybe<Array<CurrentStakingPoolVoterBoolExp>>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  operator_address?: InputMaybe<StringComparisonExp>;
  operator_aptos_name?: InputMaybe<CurrentAptosNamesBoolExp>;
  operator_aptos_name_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  staking_pool_address?: InputMaybe<StringComparisonExp>;
  voter_address?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_staking_pool_voter". */
export type CurrentStakingPoolVoterOrderBy = {
  last_transaction_version?: InputMaybe<OrderBy>;
  operator_address?: InputMaybe<OrderBy>;
  operator_aptos_name_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  staking_pool_address?: InputMaybe<OrderBy>;
  voter_address?: InputMaybe<OrderBy>;
};

/** select columns of table "current_staking_pool_voter" */
export enum CurrentStakingPoolVoterSelectColumn {
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  OperatorAddress = 'operator_address',
  /** column name */
  StakingPoolAddress = 'staking_pool_address',
  /** column name */
  VoterAddress = 'voter_address'
}

/** Streaming cursor of the table "current_staking_pool_voter" */
export type CurrentStakingPoolVoterStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentStakingPoolVoterStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentStakingPoolVoterStreamCursorValueInput = {
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  operator_address?: InputMaybe<Scalars['String']['input']>;
  staking_pool_address?: InputMaybe<Scalars['String']['input']>;
  voter_address?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_table_items" */
export type CurrentTableItems = {
  decoded_key: Scalars['jsonb']['output'];
  decoded_value?: Maybe<Scalars['jsonb']['output']>;
  is_deleted: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  key_hash: Scalars['String']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  table_handle: Scalars['String']['output'];
};


/** columns and relationships of "current_table_items" */
export type CurrentTableItemsDecodedKeyArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "current_table_items" */
export type CurrentTableItemsDecodedValueArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "current_table_items". All fields are combined with a logical 'AND'. */
export type CurrentTableItemsBoolExp = {
  _and?: InputMaybe<Array<CurrentTableItemsBoolExp>>;
  _not?: InputMaybe<CurrentTableItemsBoolExp>;
  _or?: InputMaybe<Array<CurrentTableItemsBoolExp>>;
  decoded_key?: InputMaybe<JsonbComparisonExp>;
  decoded_value?: InputMaybe<JsonbComparisonExp>;
  is_deleted?: InputMaybe<BooleanComparisonExp>;
  key?: InputMaybe<StringComparisonExp>;
  key_hash?: InputMaybe<StringComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  table_handle?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_table_items". */
export type CurrentTableItemsOrderBy = {
  decoded_key?: InputMaybe<OrderBy>;
  decoded_value?: InputMaybe<OrderBy>;
  is_deleted?: InputMaybe<OrderBy>;
  key?: InputMaybe<OrderBy>;
  key_hash?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  table_handle?: InputMaybe<OrderBy>;
};

/** select columns of table "current_table_items" */
export enum CurrentTableItemsSelectColumn {
  /** column name */
  DecodedKey = 'decoded_key',
  /** column name */
  DecodedValue = 'decoded_value',
  /** column name */
  IsDeleted = 'is_deleted',
  /** column name */
  Key = 'key',
  /** column name */
  KeyHash = 'key_hash',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  TableHandle = 'table_handle'
}

/** Streaming cursor of the table "current_table_items" */
export type CurrentTableItemsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentTableItemsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentTableItemsStreamCursorValueInput = {
  decoded_key?: InputMaybe<Scalars['jsonb']['input']>;
  decoded_value?: InputMaybe<Scalars['jsonb']['input']>;
  is_deleted?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  key_hash?: InputMaybe<Scalars['String']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  table_handle?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_token_datas_v2" */
export type CurrentTokenDatasV2 = {
  /** An object relationship */
  aptos_name?: Maybe<CurrentAptosNames>;
  /** An object relationship */
  cdn_asset_uris?: Maybe<NftMetadataCrawlerParsedAssetUris>;
  collection_id: Scalars['String']['output'];
  /** An object relationship */
  current_collection?: Maybe<CurrentCollectionsV2>;
  /** An object relationship */
  current_royalty_v1?: Maybe<CurrentTokenRoyaltyV1>;
  /** An array relationship */
  current_token_ownerships: Array<CurrentTokenOwnershipsV2>;
  /** An aggregate relationship */
  current_token_ownerships_aggregate: CurrentTokenOwnershipsV2Aggregate;
  decimals?: Maybe<Scalars['bigint']['output']>;
  description: Scalars['String']['output'];
  is_deleted_v2?: Maybe<Scalars['Boolean']['output']>;
  is_fungible_v2?: Maybe<Scalars['Boolean']['output']>;
  largest_property_version_v1?: Maybe<Scalars['numeric']['output']>;
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  maximum?: Maybe<Scalars['numeric']['output']>;
  supply?: Maybe<Scalars['numeric']['output']>;
  token_data_id: Scalars['String']['output'];
  token_name: Scalars['String']['output'];
  token_properties: Scalars['jsonb']['output'];
  token_standard: Scalars['String']['output'];
  token_uri: Scalars['String']['output'];
};


/** columns and relationships of "current_token_datas_v2" */
export type CurrentTokenDatasV2CurrentTokenOwnershipsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


/** columns and relationships of "current_token_datas_v2" */
export type CurrentTokenDatasV2CurrentTokenOwnershipsAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


/** columns and relationships of "current_token_datas_v2" */
export type CurrentTokenDatasV2TokenPropertiesArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "current_token_datas_v2". All fields are combined with a logical 'AND'. */
export type CurrentTokenDatasV2BoolExp = {
  _and?: InputMaybe<Array<CurrentTokenDatasV2BoolExp>>;
  _not?: InputMaybe<CurrentTokenDatasV2BoolExp>;
  _or?: InputMaybe<Array<CurrentTokenDatasV2BoolExp>>;
  aptos_name?: InputMaybe<CurrentAptosNamesBoolExp>;
  cdn_asset_uris?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
  collection_id?: InputMaybe<StringComparisonExp>;
  current_collection?: InputMaybe<CurrentCollectionsV2BoolExp>;
  current_royalty_v1?: InputMaybe<CurrentTokenRoyaltyV1BoolExp>;
  current_token_ownerships?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  current_token_ownerships_aggregate?: InputMaybe<CurrentTokenOwnershipsV2AggregateBoolExp>;
  decimals?: InputMaybe<BigintComparisonExp>;
  description?: InputMaybe<StringComparisonExp>;
  is_deleted_v2?: InputMaybe<BooleanComparisonExp>;
  is_fungible_v2?: InputMaybe<BooleanComparisonExp>;
  largest_property_version_v1?: InputMaybe<NumericComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  maximum?: InputMaybe<NumericComparisonExp>;
  supply?: InputMaybe<NumericComparisonExp>;
  token_data_id?: InputMaybe<StringComparisonExp>;
  token_name?: InputMaybe<StringComparisonExp>;
  token_properties?: InputMaybe<JsonbComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
  token_uri?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_token_datas_v2". */
export type CurrentTokenDatasV2OrderBy = {
  aptos_name?: InputMaybe<CurrentAptosNamesOrderBy>;
  cdn_asset_uris?: InputMaybe<NftMetadataCrawlerParsedAssetUrisOrderBy>;
  collection_id?: InputMaybe<OrderBy>;
  current_collection?: InputMaybe<CurrentCollectionsV2OrderBy>;
  current_royalty_v1?: InputMaybe<CurrentTokenRoyaltyV1OrderBy>;
  current_token_ownerships_aggregate?: InputMaybe<CurrentTokenOwnershipsV2AggregateOrderBy>;
  decimals?: InputMaybe<OrderBy>;
  description?: InputMaybe<OrderBy>;
  is_deleted_v2?: InputMaybe<OrderBy>;
  is_fungible_v2?: InputMaybe<OrderBy>;
  largest_property_version_v1?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  maximum?: InputMaybe<OrderBy>;
  supply?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_name?: InputMaybe<OrderBy>;
  token_properties?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  token_uri?: InputMaybe<OrderBy>;
};

/** select columns of table "current_token_datas_v2" */
export enum CurrentTokenDatasV2SelectColumn {
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  Decimals = 'decimals',
  /** column name */
  Description = 'description',
  /** column name */
  IsDeletedV2 = 'is_deleted_v2',
  /** column name */
  IsFungibleV2 = 'is_fungible_v2',
  /** column name */
  LargestPropertyVersionV1 = 'largest_property_version_v1',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  Maximum = 'maximum',
  /** column name */
  Supply = 'supply',
  /** column name */
  TokenDataId = 'token_data_id',
  /** column name */
  TokenName = 'token_name',
  /** column name */
  TokenProperties = 'token_properties',
  /** column name */
  TokenStandard = 'token_standard',
  /** column name */
  TokenUri = 'token_uri'
}

/** Streaming cursor of the table "current_token_datas_v2" */
export type CurrentTokenDatasV2StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentTokenDatasV2StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentTokenDatasV2StreamCursorValueInput = {
  collection_id?: InputMaybe<Scalars['String']['input']>;
  decimals?: InputMaybe<Scalars['bigint']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  is_deleted_v2?: InputMaybe<Scalars['Boolean']['input']>;
  is_fungible_v2?: InputMaybe<Scalars['Boolean']['input']>;
  largest_property_version_v1?: InputMaybe<Scalars['numeric']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  maximum?: InputMaybe<Scalars['numeric']['input']>;
  supply?: InputMaybe<Scalars['numeric']['input']>;
  token_data_id?: InputMaybe<Scalars['String']['input']>;
  token_name?: InputMaybe<Scalars['String']['input']>;
  token_properties?: InputMaybe<Scalars['jsonb']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
  token_uri?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2 = {
  amount: Scalars['numeric']['output'];
  /** An array relationship */
  composed_nfts: Array<CurrentTokenOwnershipsV2>;
  /** An aggregate relationship */
  composed_nfts_aggregate: CurrentTokenOwnershipsV2Aggregate;
  /** An object relationship */
  current_token_data?: Maybe<CurrentTokenDatasV2>;
  is_fungible_v2?: Maybe<Scalars['Boolean']['output']>;
  is_soulbound_v2?: Maybe<Scalars['Boolean']['output']>;
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  non_transferrable_by_owner?: Maybe<Scalars['Boolean']['output']>;
  owner_address: Scalars['String']['output'];
  property_version_v1: Scalars['numeric']['output'];
  storage_id: Scalars['String']['output'];
  table_type_v1?: Maybe<Scalars['String']['output']>;
  token_data_id: Scalars['String']['output'];
  token_properties_mutated_v1?: Maybe<Scalars['jsonb']['output']>;
  token_standard: Scalars['String']['output'];
};


/** columns and relationships of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2ComposedNftsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


/** columns and relationships of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2ComposedNftsAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


/** columns and relationships of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2TokenPropertiesMutatedV1Args = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2Aggregate = {
  aggregate?: Maybe<CurrentTokenOwnershipsV2AggregateFields>;
  nodes: Array<CurrentTokenOwnershipsV2>;
};

export type CurrentTokenOwnershipsV2AggregateBoolExp = {
  bool_and?: InputMaybe<CurrentTokenOwnershipsV2AggregateBoolExpBoolAnd>;
  bool_or?: InputMaybe<CurrentTokenOwnershipsV2AggregateBoolExpBoolOr>;
  count?: InputMaybe<CurrentTokenOwnershipsV2AggregateBoolExpCount>;
};

export type CurrentTokenOwnershipsV2AggregateBoolExpBoolAnd = {
  arguments: CurrentTokenOwnershipsV2SelectColumnCurrentTokenOwnershipsV2AggregateBoolExpBoolAndArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  predicate: BooleanComparisonExp;
};

export type CurrentTokenOwnershipsV2AggregateBoolExpBoolOr = {
  arguments: CurrentTokenOwnershipsV2SelectColumnCurrentTokenOwnershipsV2AggregateBoolExpBoolOrArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  predicate: BooleanComparisonExp;
};

export type CurrentTokenOwnershipsV2AggregateBoolExpCount = {
  arguments?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  predicate: IntComparisonExp;
};

/** aggregate fields of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2AggregateFields = {
  avg?: Maybe<CurrentTokenOwnershipsV2AvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<CurrentTokenOwnershipsV2MaxFields>;
  min?: Maybe<CurrentTokenOwnershipsV2MinFields>;
  stddev?: Maybe<CurrentTokenOwnershipsV2StddevFields>;
  stddev_pop?: Maybe<CurrentTokenOwnershipsV2StddevPopFields>;
  stddev_samp?: Maybe<CurrentTokenOwnershipsV2StddevSampFields>;
  sum?: Maybe<CurrentTokenOwnershipsV2SumFields>;
  var_pop?: Maybe<CurrentTokenOwnershipsV2VarPopFields>;
  var_samp?: Maybe<CurrentTokenOwnershipsV2VarSampFields>;
  variance?: Maybe<CurrentTokenOwnershipsV2VarianceFields>;
};


/** aggregate fields of "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2AggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2AggregateOrderBy = {
  avg?: InputMaybe<CurrentTokenOwnershipsV2AvgOrderBy>;
  count?: InputMaybe<OrderBy>;
  max?: InputMaybe<CurrentTokenOwnershipsV2MaxOrderBy>;
  min?: InputMaybe<CurrentTokenOwnershipsV2MinOrderBy>;
  stddev?: InputMaybe<CurrentTokenOwnershipsV2StddevOrderBy>;
  stddev_pop?: InputMaybe<CurrentTokenOwnershipsV2StddevPopOrderBy>;
  stddev_samp?: InputMaybe<CurrentTokenOwnershipsV2StddevSampOrderBy>;
  sum?: InputMaybe<CurrentTokenOwnershipsV2SumOrderBy>;
  var_pop?: InputMaybe<CurrentTokenOwnershipsV2VarPopOrderBy>;
  var_samp?: InputMaybe<CurrentTokenOwnershipsV2VarSampOrderBy>;
  variance?: InputMaybe<CurrentTokenOwnershipsV2VarianceOrderBy>;
};

/** aggregate avg on columns */
export type CurrentTokenOwnershipsV2AvgFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2AvgOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** Boolean expression to filter rows from the table "current_token_ownerships_v2". All fields are combined with a logical 'AND'. */
export type CurrentTokenOwnershipsV2BoolExp = {
  _and?: InputMaybe<Array<CurrentTokenOwnershipsV2BoolExp>>;
  _not?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  _or?: InputMaybe<Array<CurrentTokenOwnershipsV2BoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  composed_nfts?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
  composed_nfts_aggregate?: InputMaybe<CurrentTokenOwnershipsV2AggregateBoolExp>;
  current_token_data?: InputMaybe<CurrentTokenDatasV2BoolExp>;
  is_fungible_v2?: InputMaybe<BooleanComparisonExp>;
  is_soulbound_v2?: InputMaybe<BooleanComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  non_transferrable_by_owner?: InputMaybe<BooleanComparisonExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  property_version_v1?: InputMaybe<NumericComparisonExp>;
  storage_id?: InputMaybe<StringComparisonExp>;
  table_type_v1?: InputMaybe<StringComparisonExp>;
  token_data_id?: InputMaybe<StringComparisonExp>;
  token_properties_mutated_v1?: InputMaybe<JsonbComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type CurrentTokenOwnershipsV2MaxFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
  storage_id?: Maybe<Scalars['String']['output']>;
  table_type_v1?: Maybe<Scalars['String']['output']>;
  token_data_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2MaxOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  table_type_v1?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** aggregate min on columns */
export type CurrentTokenOwnershipsV2MinFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
  storage_id?: Maybe<Scalars['String']['output']>;
  table_type_v1?: Maybe<Scalars['String']['output']>;
  token_data_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2MinOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  table_type_v1?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** Ordering options when selecting data from "current_token_ownerships_v2". */
export type CurrentTokenOwnershipsV2OrderBy = {
  amount?: InputMaybe<OrderBy>;
  composed_nfts_aggregate?: InputMaybe<CurrentTokenOwnershipsV2AggregateOrderBy>;
  current_token_data?: InputMaybe<CurrentTokenDatasV2OrderBy>;
  is_fungible_v2?: InputMaybe<OrderBy>;
  is_soulbound_v2?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  non_transferrable_by_owner?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  table_type_v1?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_properties_mutated_v1?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** select columns of table "current_token_ownerships_v2" */
export enum CurrentTokenOwnershipsV2SelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  IsFungibleV2 = 'is_fungible_v2',
  /** column name */
  IsSoulboundV2 = 'is_soulbound_v2',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  NonTransferrableByOwner = 'non_transferrable_by_owner',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  PropertyVersionV1 = 'property_version_v1',
  /** column name */
  StorageId = 'storage_id',
  /** column name */
  TableTypeV1 = 'table_type_v1',
  /** column name */
  TokenDataId = 'token_data_id',
  /** column name */
  TokenPropertiesMutatedV1 = 'token_properties_mutated_v1',
  /** column name */
  TokenStandard = 'token_standard'
}

/** select "current_token_ownerships_v2_aggregate_bool_exp_bool_and_arguments_columns" columns of table "current_token_ownerships_v2" */
export enum CurrentTokenOwnershipsV2SelectColumnCurrentTokenOwnershipsV2AggregateBoolExpBoolAndArgumentsColumns {
  /** column name */
  IsFungibleV2 = 'is_fungible_v2',
  /** column name */
  IsSoulboundV2 = 'is_soulbound_v2',
  /** column name */
  NonTransferrableByOwner = 'non_transferrable_by_owner'
}

/** select "current_token_ownerships_v2_aggregate_bool_exp_bool_or_arguments_columns" columns of table "current_token_ownerships_v2" */
export enum CurrentTokenOwnershipsV2SelectColumnCurrentTokenOwnershipsV2AggregateBoolExpBoolOrArgumentsColumns {
  /** column name */
  IsFungibleV2 = 'is_fungible_v2',
  /** column name */
  IsSoulboundV2 = 'is_soulbound_v2',
  /** column name */
  NonTransferrableByOwner = 'non_transferrable_by_owner'
}

/** aggregate stddev on columns */
export type CurrentTokenOwnershipsV2StddevFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2StddevOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** aggregate stddev_pop on columns */
export type CurrentTokenOwnershipsV2StddevPopFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2StddevPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** aggregate stddev_samp on columns */
export type CurrentTokenOwnershipsV2StddevSampFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2StddevSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** Streaming cursor of the table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentTokenOwnershipsV2StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentTokenOwnershipsV2StreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  is_fungible_v2?: InputMaybe<Scalars['Boolean']['input']>;
  is_soulbound_v2?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  non_transferrable_by_owner?: InputMaybe<Scalars['Boolean']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  property_version_v1?: InputMaybe<Scalars['numeric']['input']>;
  storage_id?: InputMaybe<Scalars['String']['input']>;
  table_type_v1?: InputMaybe<Scalars['String']['input']>;
  token_data_id?: InputMaybe<Scalars['String']['input']>;
  token_properties_mutated_v1?: InputMaybe<Scalars['jsonb']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type CurrentTokenOwnershipsV2SumFields = {
  amount?: Maybe<Scalars['numeric']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2SumOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** aggregate var_pop on columns */
export type CurrentTokenOwnershipsV2VarPopFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2VarPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** aggregate var_samp on columns */
export type CurrentTokenOwnershipsV2VarSampFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2VarSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** aggregate variance on columns */
export type CurrentTokenOwnershipsV2VarianceFields = {
  amount?: Maybe<Scalars['Float']['output']>;
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "current_token_ownerships_v2" */
export type CurrentTokenOwnershipsV2VarianceOrderBy = {
  amount?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
};

/** columns and relationships of "current_token_pending_claims" */
export type CurrentTokenPendingClaims = {
  amount: Scalars['numeric']['output'];
  collection_data_id_hash: Scalars['String']['output'];
  collection_id: Scalars['String']['output'];
  collection_name: Scalars['String']['output'];
  creator_address: Scalars['String']['output'];
  /** An object relationship */
  current_collection_v2?: Maybe<CurrentCollectionsV2>;
  /** An object relationship */
  current_token_data_v2?: Maybe<CurrentTokenDatasV2>;
  from_address: Scalars['String']['output'];
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  name: Scalars['String']['output'];
  property_version: Scalars['numeric']['output'];
  table_handle: Scalars['String']['output'];
  to_address: Scalars['String']['output'];
  token_data_id: Scalars['String']['output'];
  token_data_id_hash: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "current_token_pending_claims". All fields are combined with a logical 'AND'. */
export type CurrentTokenPendingClaimsBoolExp = {
  _and?: InputMaybe<Array<CurrentTokenPendingClaimsBoolExp>>;
  _not?: InputMaybe<CurrentTokenPendingClaimsBoolExp>;
  _or?: InputMaybe<Array<CurrentTokenPendingClaimsBoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  collection_data_id_hash?: InputMaybe<StringComparisonExp>;
  collection_id?: InputMaybe<StringComparisonExp>;
  collection_name?: InputMaybe<StringComparisonExp>;
  creator_address?: InputMaybe<StringComparisonExp>;
  current_collection_v2?: InputMaybe<CurrentCollectionsV2BoolExp>;
  current_token_data_v2?: InputMaybe<CurrentTokenDatasV2BoolExp>;
  from_address?: InputMaybe<StringComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  name?: InputMaybe<StringComparisonExp>;
  property_version?: InputMaybe<NumericComparisonExp>;
  table_handle?: InputMaybe<StringComparisonExp>;
  to_address?: InputMaybe<StringComparisonExp>;
  token_data_id?: InputMaybe<StringComparisonExp>;
  token_data_id_hash?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_token_pending_claims". */
export type CurrentTokenPendingClaimsOrderBy = {
  amount?: InputMaybe<OrderBy>;
  collection_data_id_hash?: InputMaybe<OrderBy>;
  collection_id?: InputMaybe<OrderBy>;
  collection_name?: InputMaybe<OrderBy>;
  creator_address?: InputMaybe<OrderBy>;
  current_collection_v2?: InputMaybe<CurrentCollectionsV2OrderBy>;
  current_token_data_v2?: InputMaybe<CurrentTokenDatasV2OrderBy>;
  from_address?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  property_version?: InputMaybe<OrderBy>;
  table_handle?: InputMaybe<OrderBy>;
  to_address?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_data_id_hash?: InputMaybe<OrderBy>;
};

/** select columns of table "current_token_pending_claims" */
export enum CurrentTokenPendingClaimsSelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  CollectionDataIdHash = 'collection_data_id_hash',
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  CollectionName = 'collection_name',
  /** column name */
  CreatorAddress = 'creator_address',
  /** column name */
  FromAddress = 'from_address',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  Name = 'name',
  /** column name */
  PropertyVersion = 'property_version',
  /** column name */
  TableHandle = 'table_handle',
  /** column name */
  ToAddress = 'to_address',
  /** column name */
  TokenDataId = 'token_data_id',
  /** column name */
  TokenDataIdHash = 'token_data_id_hash'
}

/** Streaming cursor of the table "current_token_pending_claims" */
export type CurrentTokenPendingClaimsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentTokenPendingClaimsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentTokenPendingClaimsStreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  collection_data_id_hash?: InputMaybe<Scalars['String']['input']>;
  collection_id?: InputMaybe<Scalars['String']['input']>;
  collection_name?: InputMaybe<Scalars['String']['input']>;
  creator_address?: InputMaybe<Scalars['String']['input']>;
  from_address?: InputMaybe<Scalars['String']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  property_version?: InputMaybe<Scalars['numeric']['input']>;
  table_handle?: InputMaybe<Scalars['String']['input']>;
  to_address?: InputMaybe<Scalars['String']['input']>;
  token_data_id?: InputMaybe<Scalars['String']['input']>;
  token_data_id_hash?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "current_token_royalty_v1" */
export type CurrentTokenRoyaltyV1 = {
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  payee_address: Scalars['String']['output'];
  royalty_points_denominator: Scalars['numeric']['output'];
  royalty_points_numerator: Scalars['numeric']['output'];
  token_data_id: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "current_token_royalty_v1". All fields are combined with a logical 'AND'. */
export type CurrentTokenRoyaltyV1BoolExp = {
  _and?: InputMaybe<Array<CurrentTokenRoyaltyV1BoolExp>>;
  _not?: InputMaybe<CurrentTokenRoyaltyV1BoolExp>;
  _or?: InputMaybe<Array<CurrentTokenRoyaltyV1BoolExp>>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  payee_address?: InputMaybe<StringComparisonExp>;
  royalty_points_denominator?: InputMaybe<NumericComparisonExp>;
  royalty_points_numerator?: InputMaybe<NumericComparisonExp>;
  token_data_id?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "current_token_royalty_v1". */
export type CurrentTokenRoyaltyV1OrderBy = {
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  payee_address?: InputMaybe<OrderBy>;
  royalty_points_denominator?: InputMaybe<OrderBy>;
  royalty_points_numerator?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
};

/** select columns of table "current_token_royalty_v1" */
export enum CurrentTokenRoyaltyV1SelectColumn {
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  PayeeAddress = 'payee_address',
  /** column name */
  RoyaltyPointsDenominator = 'royalty_points_denominator',
  /** column name */
  RoyaltyPointsNumerator = 'royalty_points_numerator',
  /** column name */
  TokenDataId = 'token_data_id'
}

/** Streaming cursor of the table "current_token_royalty_v1" */
export type CurrentTokenRoyaltyV1StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: CurrentTokenRoyaltyV1StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type CurrentTokenRoyaltyV1StreamCursorValueInput = {
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  payee_address?: InputMaybe<Scalars['String']['input']>;
  royalty_points_denominator?: InputMaybe<Scalars['numeric']['input']>;
  royalty_points_numerator?: InputMaybe<Scalars['numeric']['input']>;
  token_data_id?: InputMaybe<Scalars['String']['input']>;
};

/** ordering argument of a cursor */
export enum CursorOrdering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

/** columns and relationships of "delegated_staking_activities" */
export type DelegatedStakingActivities = {
  amount: Scalars['numeric']['output'];
  delegator_address: Scalars['String']['output'];
  event_index: Scalars['bigint']['output'];
  event_type: Scalars['String']['output'];
  pool_address: Scalars['String']['output'];
  transaction_version: Scalars['bigint']['output'];
};

/** order by aggregate values of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesAggregateOrderBy = {
  avg?: InputMaybe<DelegatedStakingActivitiesAvgOrderBy>;
  count?: InputMaybe<OrderBy>;
  max?: InputMaybe<DelegatedStakingActivitiesMaxOrderBy>;
  min?: InputMaybe<DelegatedStakingActivitiesMinOrderBy>;
  stddev?: InputMaybe<DelegatedStakingActivitiesStddevOrderBy>;
  stddev_pop?: InputMaybe<DelegatedStakingActivitiesStddevPopOrderBy>;
  stddev_samp?: InputMaybe<DelegatedStakingActivitiesStddevSampOrderBy>;
  sum?: InputMaybe<DelegatedStakingActivitiesSumOrderBy>;
  var_pop?: InputMaybe<DelegatedStakingActivitiesVarPopOrderBy>;
  var_samp?: InputMaybe<DelegatedStakingActivitiesVarSampOrderBy>;
  variance?: InputMaybe<DelegatedStakingActivitiesVarianceOrderBy>;
};

/** order by avg() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesAvgOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Boolean expression to filter rows from the table "delegated_staking_activities". All fields are combined with a logical 'AND'. */
export type DelegatedStakingActivitiesBoolExp = {
  _and?: InputMaybe<Array<DelegatedStakingActivitiesBoolExp>>;
  _not?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
  _or?: InputMaybe<Array<DelegatedStakingActivitiesBoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  delegator_address?: InputMaybe<StringComparisonExp>;
  event_index?: InputMaybe<BigintComparisonExp>;
  event_type?: InputMaybe<StringComparisonExp>;
  pool_address?: InputMaybe<StringComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
};

/** order by max() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesMaxOrderBy = {
  amount?: InputMaybe<OrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  event_type?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by min() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesMinOrderBy = {
  amount?: InputMaybe<OrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  event_type?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Ordering options when selecting data from "delegated_staking_activities". */
export type DelegatedStakingActivitiesOrderBy = {
  amount?: InputMaybe<OrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  event_type?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** select columns of table "delegated_staking_activities" */
export enum DelegatedStakingActivitiesSelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  DelegatorAddress = 'delegator_address',
  /** column name */
  EventIndex = 'event_index',
  /** column name */
  EventType = 'event_type',
  /** column name */
  PoolAddress = 'pool_address',
  /** column name */
  TransactionVersion = 'transaction_version'
}

/** order by stddev() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesStddevOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by stddev_pop() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesStddevPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by stddev_samp() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesStddevSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Streaming cursor of the table "delegated_staking_activities" */
export type DelegatedStakingActivitiesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: DelegatedStakingActivitiesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type DelegatedStakingActivitiesStreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  delegator_address?: InputMaybe<Scalars['String']['input']>;
  event_index?: InputMaybe<Scalars['bigint']['input']>;
  event_type?: InputMaybe<Scalars['String']['input']>;
  pool_address?: InputMaybe<Scalars['String']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by sum() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesSumOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by var_pop() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesVarPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by var_samp() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesVarSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by variance() on columns of table "delegated_staking_activities" */
export type DelegatedStakingActivitiesVarianceOrderBy = {
  amount?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** columns and relationships of "delegated_staking_pool_balances" */
export type DelegatedStakingPoolBalances = {
  active_table_handle: Scalars['String']['output'];
  inactive_table_handle: Scalars['String']['output'];
  operator_commission_percentage: Scalars['numeric']['output'];
  staking_pool_address: Scalars['String']['output'];
  total_coins: Scalars['numeric']['output'];
  total_shares: Scalars['numeric']['output'];
  transaction_version: Scalars['bigint']['output'];
};

/** aggregated selection of "delegated_staking_pool_balances" */
export type DelegatedStakingPoolBalancesAggregate = {
  aggregate?: Maybe<DelegatedStakingPoolBalancesAggregateFields>;
  nodes: Array<DelegatedStakingPoolBalances>;
};

/** aggregate fields of "delegated_staking_pool_balances" */
export type DelegatedStakingPoolBalancesAggregateFields = {
  avg?: Maybe<DelegatedStakingPoolBalancesAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<DelegatedStakingPoolBalancesMaxFields>;
  min?: Maybe<DelegatedStakingPoolBalancesMinFields>;
  stddev?: Maybe<DelegatedStakingPoolBalancesStddevFields>;
  stddev_pop?: Maybe<DelegatedStakingPoolBalancesStddevPopFields>;
  stddev_samp?: Maybe<DelegatedStakingPoolBalancesStddevSampFields>;
  sum?: Maybe<DelegatedStakingPoolBalancesSumFields>;
  var_pop?: Maybe<DelegatedStakingPoolBalancesVarPopFields>;
  var_samp?: Maybe<DelegatedStakingPoolBalancesVarSampFields>;
  variance?: Maybe<DelegatedStakingPoolBalancesVarianceFields>;
};


/** aggregate fields of "delegated_staking_pool_balances" */
export type DelegatedStakingPoolBalancesAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<DelegatedStakingPoolBalancesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type DelegatedStakingPoolBalancesAvgFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "delegated_staking_pool_balances". All fields are combined with a logical 'AND'. */
export type DelegatedStakingPoolBalancesBoolExp = {
  _and?: InputMaybe<Array<DelegatedStakingPoolBalancesBoolExp>>;
  _not?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
  _or?: InputMaybe<Array<DelegatedStakingPoolBalancesBoolExp>>;
  active_table_handle?: InputMaybe<StringComparisonExp>;
  inactive_table_handle?: InputMaybe<StringComparisonExp>;
  operator_commission_percentage?: InputMaybe<NumericComparisonExp>;
  staking_pool_address?: InputMaybe<StringComparisonExp>;
  total_coins?: InputMaybe<NumericComparisonExp>;
  total_shares?: InputMaybe<NumericComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
};

/** aggregate max on columns */
export type DelegatedStakingPoolBalancesMaxFields = {
  active_table_handle?: Maybe<Scalars['String']['output']>;
  inactive_table_handle?: Maybe<Scalars['String']['output']>;
  operator_commission_percentage?: Maybe<Scalars['numeric']['output']>;
  staking_pool_address?: Maybe<Scalars['String']['output']>;
  total_coins?: Maybe<Scalars['numeric']['output']>;
  total_shares?: Maybe<Scalars['numeric']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate min on columns */
export type DelegatedStakingPoolBalancesMinFields = {
  active_table_handle?: Maybe<Scalars['String']['output']>;
  inactive_table_handle?: Maybe<Scalars['String']['output']>;
  operator_commission_percentage?: Maybe<Scalars['numeric']['output']>;
  staking_pool_address?: Maybe<Scalars['String']['output']>;
  total_coins?: Maybe<Scalars['numeric']['output']>;
  total_shares?: Maybe<Scalars['numeric']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** Ordering options when selecting data from "delegated_staking_pool_balances". */
export type DelegatedStakingPoolBalancesOrderBy = {
  active_table_handle?: InputMaybe<OrderBy>;
  inactive_table_handle?: InputMaybe<OrderBy>;
  operator_commission_percentage?: InputMaybe<OrderBy>;
  staking_pool_address?: InputMaybe<OrderBy>;
  total_coins?: InputMaybe<OrderBy>;
  total_shares?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** select columns of table "delegated_staking_pool_balances" */
export enum DelegatedStakingPoolBalancesSelectColumn {
  /** column name */
  ActiveTableHandle = 'active_table_handle',
  /** column name */
  InactiveTableHandle = 'inactive_table_handle',
  /** column name */
  OperatorCommissionPercentage = 'operator_commission_percentage',
  /** column name */
  StakingPoolAddress = 'staking_pool_address',
  /** column name */
  TotalCoins = 'total_coins',
  /** column name */
  TotalShares = 'total_shares',
  /** column name */
  TransactionVersion = 'transaction_version'
}

/** aggregate stddev on columns */
export type DelegatedStakingPoolBalancesStddevFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type DelegatedStakingPoolBalancesStddevPopFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type DelegatedStakingPoolBalancesStddevSampFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "delegated_staking_pool_balances" */
export type DelegatedStakingPoolBalancesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: DelegatedStakingPoolBalancesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type DelegatedStakingPoolBalancesStreamCursorValueInput = {
  active_table_handle?: InputMaybe<Scalars['String']['input']>;
  inactive_table_handle?: InputMaybe<Scalars['String']['input']>;
  operator_commission_percentage?: InputMaybe<Scalars['numeric']['input']>;
  staking_pool_address?: InputMaybe<Scalars['String']['input']>;
  total_coins?: InputMaybe<Scalars['numeric']['input']>;
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
};

/** aggregate sum on columns */
export type DelegatedStakingPoolBalancesSumFields = {
  operator_commission_percentage?: Maybe<Scalars['numeric']['output']>;
  total_coins?: Maybe<Scalars['numeric']['output']>;
  total_shares?: Maybe<Scalars['numeric']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type DelegatedStakingPoolBalancesVarPopFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type DelegatedStakingPoolBalancesVarSampFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type DelegatedStakingPoolBalancesVarianceFields = {
  operator_commission_percentage?: Maybe<Scalars['Float']['output']>;
  total_coins?: Maybe<Scalars['Float']['output']>;
  total_shares?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "delegated_staking_pools" */
export type DelegatedStakingPools = {
  /** An object relationship */
  current_staking_pool?: Maybe<CurrentStakingPoolVoter>;
  first_transaction_version: Scalars['bigint']['output'];
  staking_pool_address: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "delegated_staking_pools". All fields are combined with a logical 'AND'. */
export type DelegatedStakingPoolsBoolExp = {
  _and?: InputMaybe<Array<DelegatedStakingPoolsBoolExp>>;
  _not?: InputMaybe<DelegatedStakingPoolsBoolExp>;
  _or?: InputMaybe<Array<DelegatedStakingPoolsBoolExp>>;
  current_staking_pool?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
  first_transaction_version?: InputMaybe<BigintComparisonExp>;
  staking_pool_address?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "delegated_staking_pools". */
export type DelegatedStakingPoolsOrderBy = {
  current_staking_pool?: InputMaybe<CurrentStakingPoolVoterOrderBy>;
  first_transaction_version?: InputMaybe<OrderBy>;
  staking_pool_address?: InputMaybe<OrderBy>;
};

/** select columns of table "delegated_staking_pools" */
export enum DelegatedStakingPoolsSelectColumn {
  /** column name */
  FirstTransactionVersion = 'first_transaction_version',
  /** column name */
  StakingPoolAddress = 'staking_pool_address'
}

/** Streaming cursor of the table "delegated_staking_pools" */
export type DelegatedStakingPoolsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: DelegatedStakingPoolsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type DelegatedStakingPoolsStreamCursorValueInput = {
  first_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  staking_pool_address?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "delegator_distinct_pool" */
export type DelegatorDistinctPool = {
  /** An object relationship */
  current_pool_balance?: Maybe<CurrentDelegatedStakingPoolBalances>;
  delegator_address?: Maybe<Scalars['String']['output']>;
  pool_address?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  staking_pool_metadata?: Maybe<CurrentStakingPoolVoter>;
};

/** aggregated selection of "delegator_distinct_pool" */
export type DelegatorDistinctPoolAggregate = {
  aggregate?: Maybe<DelegatorDistinctPoolAggregateFields>;
  nodes: Array<DelegatorDistinctPool>;
};

/** aggregate fields of "delegator_distinct_pool" */
export type DelegatorDistinctPoolAggregateFields = {
  count: Scalars['Int']['output'];
  max?: Maybe<DelegatorDistinctPoolMaxFields>;
  min?: Maybe<DelegatorDistinctPoolMinFields>;
};


/** aggregate fields of "delegator_distinct_pool" */
export type DelegatorDistinctPoolAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<DelegatorDistinctPoolSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "delegator_distinct_pool". All fields are combined with a logical 'AND'. */
export type DelegatorDistinctPoolBoolExp = {
  _and?: InputMaybe<Array<DelegatorDistinctPoolBoolExp>>;
  _not?: InputMaybe<DelegatorDistinctPoolBoolExp>;
  _or?: InputMaybe<Array<DelegatorDistinctPoolBoolExp>>;
  current_pool_balance?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
  delegator_address?: InputMaybe<StringComparisonExp>;
  pool_address?: InputMaybe<StringComparisonExp>;
  staking_pool_metadata?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
};

/** aggregate max on columns */
export type DelegatorDistinctPoolMaxFields = {
  delegator_address?: Maybe<Scalars['String']['output']>;
  pool_address?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type DelegatorDistinctPoolMinFields = {
  delegator_address?: Maybe<Scalars['String']['output']>;
  pool_address?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "delegator_distinct_pool". */
export type DelegatorDistinctPoolOrderBy = {
  current_pool_balance?: InputMaybe<CurrentDelegatedStakingPoolBalancesOrderBy>;
  delegator_address?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
  staking_pool_metadata?: InputMaybe<CurrentStakingPoolVoterOrderBy>;
};

/** select columns of table "delegator_distinct_pool" */
export enum DelegatorDistinctPoolSelectColumn {
  /** column name */
  DelegatorAddress = 'delegator_address',
  /** column name */
  PoolAddress = 'pool_address'
}

/** Streaming cursor of the table "delegator_distinct_pool" */
export type DelegatorDistinctPoolStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: DelegatorDistinctPoolStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type DelegatorDistinctPoolStreamCursorValueInput = {
  delegator_address?: InputMaybe<Scalars['String']['input']>;
  pool_address?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "fungible_asset_activities" */
export type FungibleAssetActivities = {
  amount?: Maybe<Scalars['numeric']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  block_height: Scalars['bigint']['output'];
  entry_function_id_str?: Maybe<Scalars['String']['output']>;
  event_index: Scalars['bigint']['output'];
  gas_fee_payer_address?: Maybe<Scalars['String']['output']>;
  is_frozen?: Maybe<Scalars['Boolean']['output']>;
  is_gas_fee: Scalars['Boolean']['output'];
  is_transaction_success: Scalars['Boolean']['output'];
  /** An object relationship */
  metadata?: Maybe<FungibleAssetMetadata>;
  owner_address?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  owner_aptos_names: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  owner_aptos_names_aggregate: CurrentAptosNamesAggregate;
  storage_id: Scalars['String']['output'];
  storage_refund_amount: Scalars['numeric']['output'];
  token_standard: Scalars['String']['output'];
  transaction_timestamp: Scalars['timestamp']['output'];
  transaction_version: Scalars['bigint']['output'];
  type: Scalars['String']['output'];
};


/** columns and relationships of "fungible_asset_activities" */
export type FungibleAssetActivitiesOwnerAptosNamesArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "fungible_asset_activities" */
export type FungibleAssetActivitiesOwnerAptosNamesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};

/** order by aggregate values of table "fungible_asset_activities" */
export type FungibleAssetActivitiesAggregateOrderBy = {
  avg?: InputMaybe<FungibleAssetActivitiesAvgOrderBy>;
  count?: InputMaybe<OrderBy>;
  max?: InputMaybe<FungibleAssetActivitiesMaxOrderBy>;
  min?: InputMaybe<FungibleAssetActivitiesMinOrderBy>;
  stddev?: InputMaybe<FungibleAssetActivitiesStddevOrderBy>;
  stddev_pop?: InputMaybe<FungibleAssetActivitiesStddevPopOrderBy>;
  stddev_samp?: InputMaybe<FungibleAssetActivitiesStddevSampOrderBy>;
  sum?: InputMaybe<FungibleAssetActivitiesSumOrderBy>;
  var_pop?: InputMaybe<FungibleAssetActivitiesVarPopOrderBy>;
  var_samp?: InputMaybe<FungibleAssetActivitiesVarSampOrderBy>;
  variance?: InputMaybe<FungibleAssetActivitiesVarianceOrderBy>;
};

/** order by avg() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesAvgOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Boolean expression to filter rows from the table "fungible_asset_activities". All fields are combined with a logical 'AND'. */
export type FungibleAssetActivitiesBoolExp = {
  _and?: InputMaybe<Array<FungibleAssetActivitiesBoolExp>>;
  _not?: InputMaybe<FungibleAssetActivitiesBoolExp>;
  _or?: InputMaybe<Array<FungibleAssetActivitiesBoolExp>>;
  amount?: InputMaybe<NumericComparisonExp>;
  asset_type?: InputMaybe<StringComparisonExp>;
  block_height?: InputMaybe<BigintComparisonExp>;
  entry_function_id_str?: InputMaybe<StringComparisonExp>;
  event_index?: InputMaybe<BigintComparisonExp>;
  gas_fee_payer_address?: InputMaybe<StringComparisonExp>;
  is_frozen?: InputMaybe<BooleanComparisonExp>;
  is_gas_fee?: InputMaybe<BooleanComparisonExp>;
  is_transaction_success?: InputMaybe<BooleanComparisonExp>;
  metadata?: InputMaybe<FungibleAssetMetadataBoolExp>;
  owner_address?: InputMaybe<StringComparisonExp>;
  owner_aptos_names?: InputMaybe<CurrentAptosNamesBoolExp>;
  owner_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  storage_id?: InputMaybe<StringComparisonExp>;
  storage_refund_amount?: InputMaybe<NumericComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
  transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  type?: InputMaybe<StringComparisonExp>;
};

/** order by max() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesMaxOrderBy = {
  amount?: InputMaybe<OrderBy>;
  asset_type?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  gas_fee_payer_address?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** order by min() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesMinOrderBy = {
  amount?: InputMaybe<OrderBy>;
  asset_type?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  gas_fee_payer_address?: InputMaybe<OrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** Ordering options when selecting data from "fungible_asset_activities". */
export type FungibleAssetActivitiesOrderBy = {
  amount?: InputMaybe<OrderBy>;
  asset_type?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  gas_fee_payer_address?: InputMaybe<OrderBy>;
  is_frozen?: InputMaybe<OrderBy>;
  is_gas_fee?: InputMaybe<OrderBy>;
  is_transaction_success?: InputMaybe<OrderBy>;
  metadata?: InputMaybe<FungibleAssetMetadataOrderBy>;
  owner_address?: InputMaybe<OrderBy>;
  owner_aptos_names_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  storage_id?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** select columns of table "fungible_asset_activities" */
export enum FungibleAssetActivitiesSelectColumn {
  /** column name */
  Amount = 'amount',
  /** column name */
  AssetType = 'asset_type',
  /** column name */
  BlockHeight = 'block_height',
  /** column name */
  EntryFunctionIdStr = 'entry_function_id_str',
  /** column name */
  EventIndex = 'event_index',
  /** column name */
  GasFeePayerAddress = 'gas_fee_payer_address',
  /** column name */
  IsFrozen = 'is_frozen',
  /** column name */
  IsGasFee = 'is_gas_fee',
  /** column name */
  IsTransactionSuccess = 'is_transaction_success',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  StorageId = 'storage_id',
  /** column name */
  StorageRefundAmount = 'storage_refund_amount',
  /** column name */
  TokenStandard = 'token_standard',
  /** column name */
  TransactionTimestamp = 'transaction_timestamp',
  /** column name */
  TransactionVersion = 'transaction_version',
  /** column name */
  Type = 'type'
}

/** order by stddev() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesStddevOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by stddev_pop() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesStddevPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by stddev_samp() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesStddevSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Streaming cursor of the table "fungible_asset_activities" */
export type FungibleAssetActivitiesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: FungibleAssetActivitiesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type FungibleAssetActivitiesStreamCursorValueInput = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  asset_type?: InputMaybe<Scalars['String']['input']>;
  block_height?: InputMaybe<Scalars['bigint']['input']>;
  entry_function_id_str?: InputMaybe<Scalars['String']['input']>;
  event_index?: InputMaybe<Scalars['bigint']['input']>;
  gas_fee_payer_address?: InputMaybe<Scalars['String']['input']>;
  is_frozen?: InputMaybe<Scalars['Boolean']['input']>;
  is_gas_fee?: InputMaybe<Scalars['Boolean']['input']>;
  is_transaction_success?: InputMaybe<Scalars['Boolean']['input']>;
  owner_address?: InputMaybe<Scalars['String']['input']>;
  storage_id?: InputMaybe<Scalars['String']['input']>;
  storage_refund_amount?: InputMaybe<Scalars['numeric']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
  transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesSumOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by var_pop() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesVarPopOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by var_samp() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesVarSampOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** order by variance() on columns of table "fungible_asset_activities" */
export type FungibleAssetActivitiesVarianceOrderBy = {
  amount?: InputMaybe<OrderBy>;
  block_height?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  storage_refund_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** columns and relationships of "fungible_asset_metadata" */
export type FungibleAssetMetadata = {
  asset_type: Scalars['String']['output'];
  creator_address: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  icon_uri?: Maybe<Scalars['String']['output']>;
  last_transaction_timestamp: Scalars['timestamp']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  maximum_v2?: Maybe<Scalars['numeric']['output']>;
  name: Scalars['String']['output'];
  project_uri?: Maybe<Scalars['String']['output']>;
  supply_aggregator_table_handle_v1?: Maybe<Scalars['String']['output']>;
  supply_aggregator_table_key_v1?: Maybe<Scalars['String']['output']>;
  supply_v2?: Maybe<Scalars['numeric']['output']>;
  symbol: Scalars['String']['output'];
  token_standard: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "fungible_asset_metadata". All fields are combined with a logical 'AND'. */
export type FungibleAssetMetadataBoolExp = {
  _and?: InputMaybe<Array<FungibleAssetMetadataBoolExp>>;
  _not?: InputMaybe<FungibleAssetMetadataBoolExp>;
  _or?: InputMaybe<Array<FungibleAssetMetadataBoolExp>>;
  asset_type?: InputMaybe<StringComparisonExp>;
  creator_address?: InputMaybe<StringComparisonExp>;
  decimals?: InputMaybe<IntComparisonExp>;
  icon_uri?: InputMaybe<StringComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  maximum_v2?: InputMaybe<NumericComparisonExp>;
  name?: InputMaybe<StringComparisonExp>;
  project_uri?: InputMaybe<StringComparisonExp>;
  supply_aggregator_table_handle_v1?: InputMaybe<StringComparisonExp>;
  supply_aggregator_table_key_v1?: InputMaybe<StringComparisonExp>;
  supply_v2?: InputMaybe<NumericComparisonExp>;
  symbol?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "fungible_asset_metadata". */
export type FungibleAssetMetadataOrderBy = {
  asset_type?: InputMaybe<OrderBy>;
  creator_address?: InputMaybe<OrderBy>;
  decimals?: InputMaybe<OrderBy>;
  icon_uri?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  maximum_v2?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  project_uri?: InputMaybe<OrderBy>;
  supply_aggregator_table_handle_v1?: InputMaybe<OrderBy>;
  supply_aggregator_table_key_v1?: InputMaybe<OrderBy>;
  supply_v2?: InputMaybe<OrderBy>;
  symbol?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
};

/** select columns of table "fungible_asset_metadata" */
export enum FungibleAssetMetadataSelectColumn {
  /** column name */
  AssetType = 'asset_type',
  /** column name */
  CreatorAddress = 'creator_address',
  /** column name */
  Decimals = 'decimals',
  /** column name */
  IconUri = 'icon_uri',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  MaximumV2 = 'maximum_v2',
  /** column name */
  Name = 'name',
  /** column name */
  ProjectUri = 'project_uri',
  /** column name */
  SupplyAggregatorTableHandleV1 = 'supply_aggregator_table_handle_v1',
  /** column name */
  SupplyAggregatorTableKeyV1 = 'supply_aggregator_table_key_v1',
  /** column name */
  SupplyV2 = 'supply_v2',
  /** column name */
  Symbol = 'symbol',
  /** column name */
  TokenStandard = 'token_standard'
}

/** Streaming cursor of the table "fungible_asset_metadata" */
export type FungibleAssetMetadataStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: FungibleAssetMetadataStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type FungibleAssetMetadataStreamCursorValueInput = {
  asset_type?: InputMaybe<Scalars['String']['input']>;
  creator_address?: InputMaybe<Scalars['String']['input']>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  icon_uri?: InputMaybe<Scalars['String']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  maximum_v2?: InputMaybe<Scalars['numeric']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  project_uri?: InputMaybe<Scalars['String']['input']>;
  supply_aggregator_table_handle_v1?: InputMaybe<Scalars['String']['input']>;
  supply_aggregator_table_key_v1?: InputMaybe<Scalars['String']['input']>;
  supply_v2?: InputMaybe<Scalars['numeric']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
};

export type JsonbCastExp = {
  String?: InputMaybe<StringComparisonExp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type JsonbComparisonExp = {
  _cast?: InputMaybe<JsonbCastExp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']['input']>;
  _eq?: InputMaybe<Scalars['jsonb']['input']>;
  _gt?: InputMaybe<Scalars['jsonb']['input']>;
  _gte?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']['input']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']['input']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['jsonb']['input']>;
  _lte?: InputMaybe<Scalars['jsonb']['input']>;
  _neq?: InputMaybe<Scalars['jsonb']['input']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']['input']>>;
};

/** columns and relationships of "processor_metadata.ledger_infos" */
export type LedgerInfos = {
  chain_id: Scalars['bigint']['output'];
};

/** Boolean expression to filter rows from the table "processor_metadata.ledger_infos". All fields are combined with a logical 'AND'. */
export type LedgerInfosBoolExp = {
  _and?: InputMaybe<Array<LedgerInfosBoolExp>>;
  _not?: InputMaybe<LedgerInfosBoolExp>;
  _or?: InputMaybe<Array<LedgerInfosBoolExp>>;
  chain_id?: InputMaybe<BigintComparisonExp>;
};

/** Ordering options when selecting data from "processor_metadata.ledger_infos". */
export type LedgerInfosOrderBy = {
  chain_id?: InputMaybe<OrderBy>;
};

/** select columns of table "processor_metadata.ledger_infos" */
export enum LedgerInfosSelectColumn {
  /** column name */
  ChainId = 'chain_id'
}

/** Streaming cursor of the table "ledger_infos" */
export type LedgerInfosStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: LedgerInfosStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type LedgerInfosStreamCursorValueInput = {
  chain_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** columns and relationships of "nft_metadata_crawler.parsed_asset_uris" */
export type NftMetadataCrawlerParsedAssetUris = {
  animation_optimizer_retry_count: Scalars['Int']['output'];
  asset_uri: Scalars['String']['output'];
  cdn_animation_uri?: Maybe<Scalars['String']['output']>;
  cdn_image_uri?: Maybe<Scalars['String']['output']>;
  cdn_json_uri?: Maybe<Scalars['String']['output']>;
  image_optimizer_retry_count: Scalars['Int']['output'];
  json_parser_retry_count: Scalars['Int']['output'];
  raw_animation_uri?: Maybe<Scalars['String']['output']>;
  raw_image_uri?: Maybe<Scalars['String']['output']>;
};

/** Boolean expression to filter rows from the table "nft_metadata_crawler.parsed_asset_uris". All fields are combined with a logical 'AND'. */
export type NftMetadataCrawlerParsedAssetUrisBoolExp = {
  _and?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisBoolExp>>;
  _not?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
  _or?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisBoolExp>>;
  animation_optimizer_retry_count?: InputMaybe<IntComparisonExp>;
  asset_uri?: InputMaybe<StringComparisonExp>;
  cdn_animation_uri?: InputMaybe<StringComparisonExp>;
  cdn_image_uri?: InputMaybe<StringComparisonExp>;
  cdn_json_uri?: InputMaybe<StringComparisonExp>;
  image_optimizer_retry_count?: InputMaybe<IntComparisonExp>;
  json_parser_retry_count?: InputMaybe<IntComparisonExp>;
  raw_animation_uri?: InputMaybe<StringComparisonExp>;
  raw_image_uri?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "nft_metadata_crawler.parsed_asset_uris". */
export type NftMetadataCrawlerParsedAssetUrisOrderBy = {
  animation_optimizer_retry_count?: InputMaybe<OrderBy>;
  asset_uri?: InputMaybe<OrderBy>;
  cdn_animation_uri?: InputMaybe<OrderBy>;
  cdn_image_uri?: InputMaybe<OrderBy>;
  cdn_json_uri?: InputMaybe<OrderBy>;
  image_optimizer_retry_count?: InputMaybe<OrderBy>;
  json_parser_retry_count?: InputMaybe<OrderBy>;
  raw_animation_uri?: InputMaybe<OrderBy>;
  raw_image_uri?: InputMaybe<OrderBy>;
};

/** select columns of table "nft_metadata_crawler.parsed_asset_uris" */
export enum NftMetadataCrawlerParsedAssetUrisSelectColumn {
  /** column name */
  AnimationOptimizerRetryCount = 'animation_optimizer_retry_count',
  /** column name */
  AssetUri = 'asset_uri',
  /** column name */
  CdnAnimationUri = 'cdn_animation_uri',
  /** column name */
  CdnImageUri = 'cdn_image_uri',
  /** column name */
  CdnJsonUri = 'cdn_json_uri',
  /** column name */
  ImageOptimizerRetryCount = 'image_optimizer_retry_count',
  /** column name */
  JsonParserRetryCount = 'json_parser_retry_count',
  /** column name */
  RawAnimationUri = 'raw_animation_uri',
  /** column name */
  RawImageUri = 'raw_image_uri'
}

/** Streaming cursor of the table "nft_metadata_crawler_parsed_asset_uris" */
export type NftMetadataCrawlerParsedAssetUrisStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: NftMetadataCrawlerParsedAssetUrisStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type NftMetadataCrawlerParsedAssetUrisStreamCursorValueInput = {
  animation_optimizer_retry_count?: InputMaybe<Scalars['Int']['input']>;
  asset_uri?: InputMaybe<Scalars['String']['input']>;
  cdn_animation_uri?: InputMaybe<Scalars['String']['input']>;
  cdn_image_uri?: InputMaybe<Scalars['String']['input']>;
  cdn_json_uri?: InputMaybe<Scalars['String']['input']>;
  image_optimizer_retry_count?: InputMaybe<Scalars['Int']['input']>;
  json_parser_retry_count?: InputMaybe<Scalars['Int']['input']>;
  raw_animation_uri?: InputMaybe<Scalars['String']['input']>;
  raw_image_uri?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "num_active_delegator_per_pool" */
export type NumActiveDelegatorPerPool = {
  num_active_delegator?: Maybe<Scalars['bigint']['output']>;
  pool_address?: Maybe<Scalars['String']['output']>;
};

/** Boolean expression to filter rows from the table "num_active_delegator_per_pool". All fields are combined with a logical 'AND'. */
export type NumActiveDelegatorPerPoolBoolExp = {
  _and?: InputMaybe<Array<NumActiveDelegatorPerPoolBoolExp>>;
  _not?: InputMaybe<NumActiveDelegatorPerPoolBoolExp>;
  _or?: InputMaybe<Array<NumActiveDelegatorPerPoolBoolExp>>;
  num_active_delegator?: InputMaybe<BigintComparisonExp>;
  pool_address?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "num_active_delegator_per_pool". */
export type NumActiveDelegatorPerPoolOrderBy = {
  num_active_delegator?: InputMaybe<OrderBy>;
  pool_address?: InputMaybe<OrderBy>;
};

/** select columns of table "num_active_delegator_per_pool" */
export enum NumActiveDelegatorPerPoolSelectColumn {
  /** column name */
  NumActiveDelegator = 'num_active_delegator',
  /** column name */
  PoolAddress = 'pool_address'
}

/** Streaming cursor of the table "num_active_delegator_per_pool" */
export type NumActiveDelegatorPerPoolStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: NumActiveDelegatorPerPoolStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type NumActiveDelegatorPerPoolStreamCursorValueInput = {
  num_active_delegator?: InputMaybe<Scalars['bigint']['input']>;
  pool_address?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
export type NumericComparisonExp = {
  _eq?: InputMaybe<Scalars['numeric']['input']>;
  _gt?: InputMaybe<Scalars['numeric']['input']>;
  _gte?: InputMaybe<Scalars['numeric']['input']>;
  _in?: InputMaybe<Array<Scalars['numeric']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['numeric']['input']>;
  _lte?: InputMaybe<Scalars['numeric']['input']>;
  _neq?: InputMaybe<Scalars['numeric']['input']>;
  _nin?: InputMaybe<Array<Scalars['numeric']['input']>>;
};

/** column ordering options */
export enum OrderBy {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

/** columns and relationships of "processor_metadata.processor_status" */
export type ProcessorStatus = {
  last_success_version: Scalars['bigint']['output'];
  last_transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  last_updated: Scalars['timestamp']['output'];
  processor: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "processor_metadata.processor_status". All fields are combined with a logical 'AND'. */
export type ProcessorStatusBoolExp = {
  _and?: InputMaybe<Array<ProcessorStatusBoolExp>>;
  _not?: InputMaybe<ProcessorStatusBoolExp>;
  _or?: InputMaybe<Array<ProcessorStatusBoolExp>>;
  last_success_version?: InputMaybe<BigintComparisonExp>;
  last_transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  last_updated?: InputMaybe<TimestampComparisonExp>;
  processor?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "processor_metadata.processor_status". */
export type ProcessorStatusOrderBy = {
  last_success_version?: InputMaybe<OrderBy>;
  last_transaction_timestamp?: InputMaybe<OrderBy>;
  last_updated?: InputMaybe<OrderBy>;
  processor?: InputMaybe<OrderBy>;
};

/** select columns of table "processor_metadata.processor_status" */
export enum ProcessorStatusSelectColumn {
  /** column name */
  LastSuccessVersion = 'last_success_version',
  /** column name */
  LastTransactionTimestamp = 'last_transaction_timestamp',
  /** column name */
  LastUpdated = 'last_updated',
  /** column name */
  Processor = 'processor'
}

/** Streaming cursor of the table "processor_status" */
export type ProcessorStatusStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: ProcessorStatusStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type ProcessorStatusStreamCursorValueInput = {
  last_success_version?: InputMaybe<Scalars['bigint']['input']>;
  last_transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  last_updated?: InputMaybe<Scalars['timestamp']['input']>;
  processor?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "proposal_votes" */
export type ProposalVotes = {
  num_votes: Scalars['numeric']['output'];
  proposal_id: Scalars['bigint']['output'];
  should_pass: Scalars['Boolean']['output'];
  staking_pool_address: Scalars['String']['output'];
  transaction_timestamp: Scalars['timestamp']['output'];
  transaction_version: Scalars['bigint']['output'];
  voter_address: Scalars['String']['output'];
};

/** aggregated selection of "proposal_votes" */
export type ProposalVotesAggregate = {
  aggregate?: Maybe<ProposalVotesAggregateFields>;
  nodes: Array<ProposalVotes>;
};

/** aggregate fields of "proposal_votes" */
export type ProposalVotesAggregateFields = {
  avg?: Maybe<ProposalVotesAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<ProposalVotesMaxFields>;
  min?: Maybe<ProposalVotesMinFields>;
  stddev?: Maybe<ProposalVotesStddevFields>;
  stddev_pop?: Maybe<ProposalVotesStddevPopFields>;
  stddev_samp?: Maybe<ProposalVotesStddevSampFields>;
  sum?: Maybe<ProposalVotesSumFields>;
  var_pop?: Maybe<ProposalVotesVarPopFields>;
  var_samp?: Maybe<ProposalVotesVarSampFields>;
  variance?: Maybe<ProposalVotesVarianceFields>;
};


/** aggregate fields of "proposal_votes" */
export type ProposalVotesAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<ProposalVotesSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type ProposalVotesAvgFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "proposal_votes". All fields are combined with a logical 'AND'. */
export type ProposalVotesBoolExp = {
  _and?: InputMaybe<Array<ProposalVotesBoolExp>>;
  _not?: InputMaybe<ProposalVotesBoolExp>;
  _or?: InputMaybe<Array<ProposalVotesBoolExp>>;
  num_votes?: InputMaybe<NumericComparisonExp>;
  proposal_id?: InputMaybe<BigintComparisonExp>;
  should_pass?: InputMaybe<BooleanComparisonExp>;
  staking_pool_address?: InputMaybe<StringComparisonExp>;
  transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  voter_address?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type ProposalVotesMaxFields = {
  num_votes?: Maybe<Scalars['numeric']['output']>;
  proposal_id?: Maybe<Scalars['bigint']['output']>;
  staking_pool_address?: Maybe<Scalars['String']['output']>;
  transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
  voter_address?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type ProposalVotesMinFields = {
  num_votes?: Maybe<Scalars['numeric']['output']>;
  proposal_id?: Maybe<Scalars['bigint']['output']>;
  staking_pool_address?: Maybe<Scalars['String']['output']>;
  transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
  voter_address?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "proposal_votes". */
export type ProposalVotesOrderBy = {
  num_votes?: InputMaybe<OrderBy>;
  proposal_id?: InputMaybe<OrderBy>;
  should_pass?: InputMaybe<OrderBy>;
  staking_pool_address?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  voter_address?: InputMaybe<OrderBy>;
};

/** select columns of table "proposal_votes" */
export enum ProposalVotesSelectColumn {
  /** column name */
  NumVotes = 'num_votes',
  /** column name */
  ProposalId = 'proposal_id',
  /** column name */
  ShouldPass = 'should_pass',
  /** column name */
  StakingPoolAddress = 'staking_pool_address',
  /** column name */
  TransactionTimestamp = 'transaction_timestamp',
  /** column name */
  TransactionVersion = 'transaction_version',
  /** column name */
  VoterAddress = 'voter_address'
}

/** aggregate stddev on columns */
export type ProposalVotesStddevFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type ProposalVotesStddevPopFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type ProposalVotesStddevSampFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "proposal_votes" */
export type ProposalVotesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: ProposalVotesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type ProposalVotesStreamCursorValueInput = {
  num_votes?: InputMaybe<Scalars['numeric']['input']>;
  proposal_id?: InputMaybe<Scalars['bigint']['input']>;
  should_pass?: InputMaybe<Scalars['Boolean']['input']>;
  staking_pool_address?: InputMaybe<Scalars['String']['input']>;
  transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  voter_address?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type ProposalVotesSumFields = {
  num_votes?: Maybe<Scalars['numeric']['output']>;
  proposal_id?: Maybe<Scalars['bigint']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type ProposalVotesVarPopFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type ProposalVotesVarSampFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type ProposalVotesVarianceFields = {
  num_votes?: Maybe<Scalars['Float']['output']>;
  proposal_id?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "public_key_auth_keys" */
export type PublicKeyAuthKeys = {
  account_public_key?: Maybe<Scalars['String']['output']>;
  auth_key: Scalars['String']['output'];
  is_public_key_used: Scalars['Boolean']['output'];
  last_transaction_version: Scalars['bigint']['output'];
  public_key: Scalars['String']['output'];
  public_key_type: Scalars['String']['output'];
  signature_type: Scalars['String']['output'];
};

/** aggregated selection of "public_key_auth_keys" */
export type PublicKeyAuthKeysAggregate = {
  aggregate?: Maybe<PublicKeyAuthKeysAggregateFields>;
  nodes: Array<PublicKeyAuthKeys>;
};

/** aggregate fields of "public_key_auth_keys" */
export type PublicKeyAuthKeysAggregateFields = {
  avg?: Maybe<PublicKeyAuthKeysAvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<PublicKeyAuthKeysMaxFields>;
  min?: Maybe<PublicKeyAuthKeysMinFields>;
  stddev?: Maybe<PublicKeyAuthKeysStddevFields>;
  stddev_pop?: Maybe<PublicKeyAuthKeysStddevPopFields>;
  stddev_samp?: Maybe<PublicKeyAuthKeysStddevSampFields>;
  sum?: Maybe<PublicKeyAuthKeysSumFields>;
  var_pop?: Maybe<PublicKeyAuthKeysVarPopFields>;
  var_samp?: Maybe<PublicKeyAuthKeysVarSampFields>;
  variance?: Maybe<PublicKeyAuthKeysVarianceFields>;
};


/** aggregate fields of "public_key_auth_keys" */
export type PublicKeyAuthKeysAggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<PublicKeyAuthKeysSelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type PublicKeyAuthKeysAvgFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "public_key_auth_keys". All fields are combined with a logical 'AND'. */
export type PublicKeyAuthKeysBoolExp = {
  _and?: InputMaybe<Array<PublicKeyAuthKeysBoolExp>>;
  _not?: InputMaybe<PublicKeyAuthKeysBoolExp>;
  _or?: InputMaybe<Array<PublicKeyAuthKeysBoolExp>>;
  account_public_key?: InputMaybe<StringComparisonExp>;
  auth_key?: InputMaybe<StringComparisonExp>;
  is_public_key_used?: InputMaybe<BooleanComparisonExp>;
  last_transaction_version?: InputMaybe<BigintComparisonExp>;
  public_key?: InputMaybe<StringComparisonExp>;
  public_key_type?: InputMaybe<StringComparisonExp>;
  signature_type?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type PublicKeyAuthKeysMaxFields = {
  account_public_key?: Maybe<Scalars['String']['output']>;
  auth_key?: Maybe<Scalars['String']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  public_key?: Maybe<Scalars['String']['output']>;
  public_key_type?: Maybe<Scalars['String']['output']>;
  signature_type?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type PublicKeyAuthKeysMinFields = {
  account_public_key?: Maybe<Scalars['String']['output']>;
  auth_key?: Maybe<Scalars['String']['output']>;
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
  public_key?: Maybe<Scalars['String']['output']>;
  public_key_type?: Maybe<Scalars['String']['output']>;
  signature_type?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "public_key_auth_keys". */
export type PublicKeyAuthKeysOrderBy = {
  account_public_key?: InputMaybe<OrderBy>;
  auth_key?: InputMaybe<OrderBy>;
  is_public_key_used?: InputMaybe<OrderBy>;
  last_transaction_version?: InputMaybe<OrderBy>;
  public_key?: InputMaybe<OrderBy>;
  public_key_type?: InputMaybe<OrderBy>;
  signature_type?: InputMaybe<OrderBy>;
};

/** select columns of table "public_key_auth_keys" */
export enum PublicKeyAuthKeysSelectColumn {
  /** column name */
  AccountPublicKey = 'account_public_key',
  /** column name */
  AuthKey = 'auth_key',
  /** column name */
  IsPublicKeyUsed = 'is_public_key_used',
  /** column name */
  LastTransactionVersion = 'last_transaction_version',
  /** column name */
  PublicKey = 'public_key',
  /** column name */
  PublicKeyType = 'public_key_type',
  /** column name */
  SignatureType = 'signature_type'
}

/** aggregate stddev on columns */
export type PublicKeyAuthKeysStddevFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type PublicKeyAuthKeysStddevPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type PublicKeyAuthKeysStddevSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "public_key_auth_keys" */
export type PublicKeyAuthKeysStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: PublicKeyAuthKeysStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type PublicKeyAuthKeysStreamCursorValueInput = {
  account_public_key?: InputMaybe<Scalars['String']['input']>;
  auth_key?: InputMaybe<Scalars['String']['input']>;
  is_public_key_used?: InputMaybe<Scalars['Boolean']['input']>;
  last_transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  public_key?: InputMaybe<Scalars['String']['input']>;
  public_key_type?: InputMaybe<Scalars['String']['input']>;
  signature_type?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type PublicKeyAuthKeysSumFields = {
  last_transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type PublicKeyAuthKeysVarPopFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type PublicKeyAuthKeysVarSampFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type PublicKeyAuthKeysVarianceFields = {
  last_transaction_version?: Maybe<Scalars['Float']['output']>;
};

export type QueryRoot = {
  /** fetch data from the table: "account_transactions" */
  account_transactions: Array<AccountTransactions>;
  /** fetch aggregated fields from the table: "account_transactions" */
  account_transactions_aggregate: AccountTransactionsAggregate;
  /** fetch data from the table: "account_transactions" using primary key columns */
  account_transactions_by_pk?: Maybe<AccountTransactions>;
  /** fetch data from the table: "auth_key_account_addresses" */
  auth_key_account_addresses: Array<AuthKeyAccountAddresses>;
  /** fetch aggregated fields from the table: "auth_key_account_addresses" */
  auth_key_account_addresses_aggregate: AuthKeyAccountAddressesAggregate;
  /** fetch data from the table: "auth_key_account_addresses" using primary key columns */
  auth_key_account_addresses_by_pk?: Maybe<AuthKeyAccountAddresses>;
  /** fetch data from the table: "block_metadata_transactions" */
  block_metadata_transactions: Array<BlockMetadataTransactions>;
  /** fetch data from the table: "block_metadata_transactions" using primary key columns */
  block_metadata_transactions_by_pk?: Maybe<BlockMetadataTransactions>;
  /** fetch data from the table: "confidential_asset_activities" */
  confidential_asset_activities: Array<ConfidentialAssetActivities>;
  /** fetch data from the table: "confidential_asset_activities" using primary key columns */
  confidential_asset_activities_by_pk?: Maybe<ConfidentialAssetActivities>;
  /** fetch data from the table: "current_ans_lookup_v2" */
  current_ans_lookup_v2: Array<CurrentAnsLookupV2>;
  /** fetch data from the table: "current_ans_lookup_v2" using primary key columns */
  current_ans_lookup_v2_by_pk?: Maybe<CurrentAnsLookupV2>;
  /** fetch data from the table: "current_aptos_names" */
  current_aptos_names: Array<CurrentAptosNames>;
  /** fetch aggregated fields from the table: "current_aptos_names" */
  current_aptos_names_aggregate: CurrentAptosNamesAggregate;
  /** fetch data from the table: "current_collection_ownership_v2_view" */
  current_collection_ownership_v2_view: Array<CurrentCollectionOwnershipV2View>;
  /** fetch aggregated fields from the table: "current_collection_ownership_v2_view" */
  current_collection_ownership_v2_view_aggregate: CurrentCollectionOwnershipV2ViewAggregate;
  /** fetch data from the table: "current_collections_v2" */
  current_collections_v2: Array<CurrentCollectionsV2>;
  /** fetch data from the table: "current_collections_v2" using primary key columns */
  current_collections_v2_by_pk?: Maybe<CurrentCollectionsV2>;
  /** fetch data from the table: "current_delegated_staking_pool_balances" */
  current_delegated_staking_pool_balances: Array<CurrentDelegatedStakingPoolBalances>;
  /** fetch data from the table: "current_delegated_staking_pool_balances" using primary key columns */
  current_delegated_staking_pool_balances_by_pk?: Maybe<CurrentDelegatedStakingPoolBalances>;
  /** fetch data from the table: "current_delegated_voter" */
  current_delegated_voter: Array<CurrentDelegatedVoter>;
  /** fetch data from the table: "current_delegated_voter" using primary key columns */
  current_delegated_voter_by_pk?: Maybe<CurrentDelegatedVoter>;
  /** fetch data from the table: "current_delegator_balances" */
  current_delegator_balances: Array<CurrentDelegatorBalances>;
  /** fetch data from the table: "current_delegator_balances" using primary key columns */
  current_delegator_balances_by_pk?: Maybe<CurrentDelegatorBalances>;
  /** fetch data from the table: "current_fungible_asset_balances" */
  current_fungible_asset_balances: Array<CurrentFungibleAssetBalances>;
  /** fetch aggregated fields from the table: "current_fungible_asset_balances" */
  current_fungible_asset_balances_aggregate: CurrentFungibleAssetBalancesAggregate;
  /** fetch data from the table: "current_fungible_asset_balances" using primary key columns */
  current_fungible_asset_balances_by_pk?: Maybe<CurrentFungibleAssetBalances>;
  /** fetch data from the table: "current_objects" */
  current_objects: Array<CurrentObjects>;
  /** fetch data from the table: "current_objects" using primary key columns */
  current_objects_by_pk?: Maybe<CurrentObjects>;
  /** fetch data from the table: "current_staking_pool_voter" */
  current_staking_pool_voter: Array<CurrentStakingPoolVoter>;
  /** fetch data from the table: "current_staking_pool_voter" using primary key columns */
  current_staking_pool_voter_by_pk?: Maybe<CurrentStakingPoolVoter>;
  /** fetch data from the table: "current_table_items" */
  current_table_items: Array<CurrentTableItems>;
  /** fetch data from the table: "current_table_items" using primary key columns */
  current_table_items_by_pk?: Maybe<CurrentTableItems>;
  /** fetch data from the table: "current_token_datas_v2" */
  current_token_datas_v2: Array<CurrentTokenDatasV2>;
  /** fetch data from the table: "current_token_datas_v2" using primary key columns */
  current_token_datas_v2_by_pk?: Maybe<CurrentTokenDatasV2>;
  /** fetch data from the table: "current_token_ownerships_v2" */
  current_token_ownerships_v2: Array<CurrentTokenOwnershipsV2>;
  /** fetch aggregated fields from the table: "current_token_ownerships_v2" */
  current_token_ownerships_v2_aggregate: CurrentTokenOwnershipsV2Aggregate;
  /** fetch data from the table: "current_token_ownerships_v2" using primary key columns */
  current_token_ownerships_v2_by_pk?: Maybe<CurrentTokenOwnershipsV2>;
  /** fetch data from the table: "current_token_pending_claims" */
  current_token_pending_claims: Array<CurrentTokenPendingClaims>;
  /** fetch data from the table: "current_token_pending_claims" using primary key columns */
  current_token_pending_claims_by_pk?: Maybe<CurrentTokenPendingClaims>;
  /** fetch data from the table: "current_token_royalty_v1" */
  current_token_royalty_v1: Array<CurrentTokenRoyaltyV1>;
  /** fetch data from the table: "current_token_royalty_v1" using primary key columns */
  current_token_royalty_v1_by_pk?: Maybe<CurrentTokenRoyaltyV1>;
  /** An array relationship */
  delegated_staking_activities: Array<DelegatedStakingActivities>;
  /** fetch data from the table: "delegated_staking_activities" using primary key columns */
  delegated_staking_activities_by_pk?: Maybe<DelegatedStakingActivities>;
  /** fetch data from the table: "delegated_staking_pool_balances" */
  delegated_staking_pool_balances: Array<DelegatedStakingPoolBalances>;
  /** fetch aggregated fields from the table: "delegated_staking_pool_balances" */
  delegated_staking_pool_balances_aggregate: DelegatedStakingPoolBalancesAggregate;
  /** fetch data from the table: "delegated_staking_pool_balances" using primary key columns */
  delegated_staking_pool_balances_by_pk?: Maybe<DelegatedStakingPoolBalances>;
  /** fetch data from the table: "delegated_staking_pools" */
  delegated_staking_pools: Array<DelegatedStakingPools>;
  /** fetch data from the table: "delegated_staking_pools" using primary key columns */
  delegated_staking_pools_by_pk?: Maybe<DelegatedStakingPools>;
  /** fetch data from the table: "delegator_distinct_pool" */
  delegator_distinct_pool: Array<DelegatorDistinctPool>;
  /** fetch aggregated fields from the table: "delegator_distinct_pool" */
  delegator_distinct_pool_aggregate: DelegatorDistinctPoolAggregate;
  /** An array relationship */
  fungible_asset_activities: Array<FungibleAssetActivities>;
  /** fetch data from the table: "fungible_asset_activities" using primary key columns */
  fungible_asset_activities_by_pk?: Maybe<FungibleAssetActivities>;
  /** fetch data from the table: "fungible_asset_metadata" */
  fungible_asset_metadata: Array<FungibleAssetMetadata>;
  /** fetch data from the table: "fungible_asset_metadata" using primary key columns */
  fungible_asset_metadata_by_pk?: Maybe<FungibleAssetMetadata>;
  /** fetch data from the table: "processor_metadata.ledger_infos" */
  ledger_infos: Array<LedgerInfos>;
  /** fetch data from the table: "processor_metadata.ledger_infos" using primary key columns */
  ledger_infos_by_pk?: Maybe<LedgerInfos>;
  /** fetch data from the table: "nft_metadata_crawler.parsed_asset_uris" */
  nft_metadata_crawler_parsed_asset_uris: Array<NftMetadataCrawlerParsedAssetUris>;
  /** fetch data from the table: "nft_metadata_crawler.parsed_asset_uris" using primary key columns */
  nft_metadata_crawler_parsed_asset_uris_by_pk?: Maybe<NftMetadataCrawlerParsedAssetUris>;
  /** fetch data from the table: "num_active_delegator_per_pool" */
  num_active_delegator_per_pool: Array<NumActiveDelegatorPerPool>;
  /** fetch data from the table: "processor_metadata.processor_status" */
  processor_status: Array<ProcessorStatus>;
  /** fetch data from the table: "processor_metadata.processor_status" using primary key columns */
  processor_status_by_pk?: Maybe<ProcessorStatus>;
  /** fetch data from the table: "proposal_votes" */
  proposal_votes: Array<ProposalVotes>;
  /** fetch aggregated fields from the table: "proposal_votes" */
  proposal_votes_aggregate: ProposalVotesAggregate;
  /** fetch data from the table: "proposal_votes" using primary key columns */
  proposal_votes_by_pk?: Maybe<ProposalVotes>;
  /** fetch data from the table: "public_key_auth_keys" */
  public_key_auth_keys: Array<PublicKeyAuthKeys>;
  /** fetch aggregated fields from the table: "public_key_auth_keys" */
  public_key_auth_keys_aggregate: PublicKeyAuthKeysAggregate;
  /** fetch data from the table: "public_key_auth_keys" using primary key columns */
  public_key_auth_keys_by_pk?: Maybe<PublicKeyAuthKeys>;
  /** fetch data from the table: "signatures" */
  signatures: Array<Signatures>;
  /** fetch data from the table: "signatures" using primary key columns */
  signatures_by_pk?: Maybe<Signatures>;
  /** fetch data from the table: "table_items" */
  table_items: Array<TableItems>;
  /** fetch data from the table: "table_items" using primary key columns */
  table_items_by_pk?: Maybe<TableItems>;
  /** fetch data from the table: "table_metadatas" */
  table_metadatas: Array<TableMetadatas>;
  /** fetch data from the table: "table_metadatas" using primary key columns */
  table_metadatas_by_pk?: Maybe<TableMetadatas>;
  /** An array relationship */
  token_activities_v2: Array<TokenActivitiesV2>;
  /** An aggregate relationship */
  token_activities_v2_aggregate: TokenActivitiesV2Aggregate;
  /** fetch data from the table: "token_activities_v2" using primary key columns */
  token_activities_v2_by_pk?: Maybe<TokenActivitiesV2>;
  /** fetch data from the table: "user_transactions" */
  user_transactions: Array<UserTransactions>;
  /** fetch data from the table: "user_transactions" using primary key columns */
  user_transactions_by_pk?: Maybe<UserTransactions>;
};


export type QueryRootAccountTransactionsArgs = {
  distinct_on?: InputMaybe<Array<AccountTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AccountTransactionsOrderBy>>;
  where?: InputMaybe<AccountTransactionsBoolExp>;
};


export type QueryRootAccountTransactionsAggregateArgs = {
  distinct_on?: InputMaybe<Array<AccountTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AccountTransactionsOrderBy>>;
  where?: InputMaybe<AccountTransactionsBoolExp>;
};


export type QueryRootAccountTransactionsByPkArgs = {
  account_address: Scalars['String']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootAuthKeyAccountAddressesArgs = {
  distinct_on?: InputMaybe<Array<AuthKeyAccountAddressesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AuthKeyAccountAddressesOrderBy>>;
  where?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
};


export type QueryRootAuthKeyAccountAddressesAggregateArgs = {
  distinct_on?: InputMaybe<Array<AuthKeyAccountAddressesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AuthKeyAccountAddressesOrderBy>>;
  where?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
};


export type QueryRootAuthKeyAccountAddressesByPkArgs = {
  account_address: Scalars['String']['input'];
};


export type QueryRootBlockMetadataTransactionsArgs = {
  distinct_on?: InputMaybe<Array<BlockMetadataTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<BlockMetadataTransactionsOrderBy>>;
  where?: InputMaybe<BlockMetadataTransactionsBoolExp>;
};


export type QueryRootBlockMetadataTransactionsByPkArgs = {
  version: Scalars['bigint']['input'];
};


export type QueryRootConfidentialAssetActivitiesArgs = {
  distinct_on?: InputMaybe<Array<ConfidentialAssetActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ConfidentialAssetActivitiesOrderBy>>;
  where?: InputMaybe<ConfidentialAssetActivitiesBoolExp>;
};


export type QueryRootConfidentialAssetActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootCurrentAnsLookupV2Args = {
  distinct_on?: InputMaybe<Array<CurrentAnsLookupV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAnsLookupV2OrderBy>>;
  where?: InputMaybe<CurrentAnsLookupV2BoolExp>;
};


export type QueryRootCurrentAnsLookupV2ByPkArgs = {
  domain: Scalars['String']['input'];
  subdomain: Scalars['String']['input'];
  token_standard: Scalars['String']['input'];
};


export type QueryRootCurrentAptosNamesArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


export type QueryRootCurrentAptosNamesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


export type QueryRootCurrentCollectionOwnershipV2ViewArgs = {
  distinct_on?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewOrderBy>>;
  where?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
};


export type QueryRootCurrentCollectionOwnershipV2ViewAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewOrderBy>>;
  where?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
};


export type QueryRootCurrentCollectionsV2Args = {
  distinct_on?: InputMaybe<Array<CurrentCollectionsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionsV2OrderBy>>;
  where?: InputMaybe<CurrentCollectionsV2BoolExp>;
};


export type QueryRootCurrentCollectionsV2ByPkArgs = {
  collection_id: Scalars['String']['input'];
};


export type QueryRootCurrentDelegatedStakingPoolBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
};


export type QueryRootCurrentDelegatedStakingPoolBalancesByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type QueryRootCurrentDelegatedVoterArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatedVoterSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatedVoterOrderBy>>;
  where?: InputMaybe<CurrentDelegatedVoterBoolExp>;
};


export type QueryRootCurrentDelegatedVoterByPkArgs = {
  delegation_pool_address: Scalars['String']['input'];
  delegator_address: Scalars['String']['input'];
};


export type QueryRootCurrentDelegatorBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatorBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatorBalancesOrderBy>>;
  where?: InputMaybe<CurrentDelegatorBalancesBoolExp>;
};


export type QueryRootCurrentDelegatorBalancesByPkArgs = {
  delegator_address: Scalars['String']['input'];
  pool_address: Scalars['String']['input'];
  pool_type: Scalars['String']['input'];
  table_handle: Scalars['String']['input'];
};


export type QueryRootCurrentFungibleAssetBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentFungibleAssetBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentFungibleAssetBalancesOrderBy>>;
  where?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
};


export type QueryRootCurrentFungibleAssetBalancesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentFungibleAssetBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentFungibleAssetBalancesOrderBy>>;
  where?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
};


export type QueryRootCurrentFungibleAssetBalancesByPkArgs = {
  storage_id: Scalars['String']['input'];
};


export type QueryRootCurrentObjectsArgs = {
  distinct_on?: InputMaybe<Array<CurrentObjectsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentObjectsOrderBy>>;
  where?: InputMaybe<CurrentObjectsBoolExp>;
};


export type QueryRootCurrentObjectsByPkArgs = {
  object_address: Scalars['String']['input'];
};


export type QueryRootCurrentStakingPoolVoterArgs = {
  distinct_on?: InputMaybe<Array<CurrentStakingPoolVoterSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentStakingPoolVoterOrderBy>>;
  where?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
};


export type QueryRootCurrentStakingPoolVoterByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type QueryRootCurrentTableItemsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTableItemsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTableItemsOrderBy>>;
  where?: InputMaybe<CurrentTableItemsBoolExp>;
};


export type QueryRootCurrentTableItemsByPkArgs = {
  key_hash: Scalars['String']['input'];
  table_handle: Scalars['String']['input'];
};


export type QueryRootCurrentTokenDatasV2Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenDatasV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenDatasV2OrderBy>>;
  where?: InputMaybe<CurrentTokenDatasV2BoolExp>;
};


export type QueryRootCurrentTokenDatasV2ByPkArgs = {
  token_data_id: Scalars['String']['input'];
};


export type QueryRootCurrentTokenOwnershipsV2Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


export type QueryRootCurrentTokenOwnershipsV2AggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


export type QueryRootCurrentTokenOwnershipsV2ByPkArgs = {
  owner_address: Scalars['String']['input'];
  property_version_v1: Scalars['numeric']['input'];
  storage_id: Scalars['String']['input'];
  token_data_id: Scalars['String']['input'];
};


export type QueryRootCurrentTokenPendingClaimsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenPendingClaimsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenPendingClaimsOrderBy>>;
  where?: InputMaybe<CurrentTokenPendingClaimsBoolExp>;
};


export type QueryRootCurrentTokenPendingClaimsByPkArgs = {
  from_address: Scalars['String']['input'];
  property_version: Scalars['numeric']['input'];
  to_address: Scalars['String']['input'];
  token_data_id_hash: Scalars['String']['input'];
};


export type QueryRootCurrentTokenRoyaltyV1Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenRoyaltyV1SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenRoyaltyV1OrderBy>>;
  where?: InputMaybe<CurrentTokenRoyaltyV1BoolExp>;
};


export type QueryRootCurrentTokenRoyaltyV1ByPkArgs = {
  token_data_id: Scalars['String']['input'];
};


export type QueryRootDelegatedStakingActivitiesArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingActivitiesOrderBy>>;
  where?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
};


export type QueryRootDelegatedStakingActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootDelegatedStakingPoolBalancesArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
};


export type QueryRootDelegatedStakingPoolBalancesAggregateArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
};


export type QueryRootDelegatedStakingPoolBalancesByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootDelegatedStakingPoolsArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolsOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolsBoolExp>;
};


export type QueryRootDelegatedStakingPoolsByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type QueryRootDelegatorDistinctPoolArgs = {
  distinct_on?: InputMaybe<Array<DelegatorDistinctPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatorDistinctPoolOrderBy>>;
  where?: InputMaybe<DelegatorDistinctPoolBoolExp>;
};


export type QueryRootDelegatorDistinctPoolAggregateArgs = {
  distinct_on?: InputMaybe<Array<DelegatorDistinctPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatorDistinctPoolOrderBy>>;
  where?: InputMaybe<DelegatorDistinctPoolBoolExp>;
};


export type QueryRootFungibleAssetActivitiesArgs = {
  distinct_on?: InputMaybe<Array<FungibleAssetActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<FungibleAssetActivitiesOrderBy>>;
  where?: InputMaybe<FungibleAssetActivitiesBoolExp>;
};


export type QueryRootFungibleAssetActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootFungibleAssetMetadataArgs = {
  distinct_on?: InputMaybe<Array<FungibleAssetMetadataSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<FungibleAssetMetadataOrderBy>>;
  where?: InputMaybe<FungibleAssetMetadataBoolExp>;
};


export type QueryRootFungibleAssetMetadataByPkArgs = {
  asset_type: Scalars['String']['input'];
};


export type QueryRootLedgerInfosArgs = {
  distinct_on?: InputMaybe<Array<LedgerInfosSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<LedgerInfosOrderBy>>;
  where?: InputMaybe<LedgerInfosBoolExp>;
};


export type QueryRootLedgerInfosByPkArgs = {
  chain_id: Scalars['bigint']['input'];
};


export type QueryRootNftMetadataCrawlerParsedAssetUrisArgs = {
  distinct_on?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisOrderBy>>;
  where?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
};


export type QueryRootNftMetadataCrawlerParsedAssetUrisByPkArgs = {
  asset_uri: Scalars['String']['input'];
};


export type QueryRootNumActiveDelegatorPerPoolArgs = {
  distinct_on?: InputMaybe<Array<NumActiveDelegatorPerPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<NumActiveDelegatorPerPoolOrderBy>>;
  where?: InputMaybe<NumActiveDelegatorPerPoolBoolExp>;
};


export type QueryRootProcessorStatusArgs = {
  distinct_on?: InputMaybe<Array<ProcessorStatusSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProcessorStatusOrderBy>>;
  where?: InputMaybe<ProcessorStatusBoolExp>;
};


export type QueryRootProcessorStatusByPkArgs = {
  processor: Scalars['String']['input'];
};


export type QueryRootProposalVotesArgs = {
  distinct_on?: InputMaybe<Array<ProposalVotesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProposalVotesOrderBy>>;
  where?: InputMaybe<ProposalVotesBoolExp>;
};


export type QueryRootProposalVotesAggregateArgs = {
  distinct_on?: InputMaybe<Array<ProposalVotesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProposalVotesOrderBy>>;
  where?: InputMaybe<ProposalVotesBoolExp>;
};


export type QueryRootProposalVotesByPkArgs = {
  proposal_id: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
  voter_address: Scalars['String']['input'];
};


export type QueryRootPublicKeyAuthKeysArgs = {
  distinct_on?: InputMaybe<Array<PublicKeyAuthKeysSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<PublicKeyAuthKeysOrderBy>>;
  where?: InputMaybe<PublicKeyAuthKeysBoolExp>;
};


export type QueryRootPublicKeyAuthKeysAggregateArgs = {
  distinct_on?: InputMaybe<Array<PublicKeyAuthKeysSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<PublicKeyAuthKeysOrderBy>>;
  where?: InputMaybe<PublicKeyAuthKeysBoolExp>;
};


export type QueryRootPublicKeyAuthKeysByPkArgs = {
  auth_key: Scalars['String']['input'];
  public_key: Scalars['String']['input'];
  public_key_type: Scalars['String']['input'];
};


export type QueryRootSignaturesArgs = {
  distinct_on?: InputMaybe<Array<SignaturesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<SignaturesOrderBy>>;
  where?: InputMaybe<SignaturesBoolExp>;
};


export type QueryRootSignaturesByPkArgs = {
  is_sender_primary: Scalars['Boolean']['input'];
  multi_agent_index: Scalars['bigint']['input'];
  multi_sig_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootTableItemsArgs = {
  distinct_on?: InputMaybe<Array<TableItemsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TableItemsOrderBy>>;
  where?: InputMaybe<TableItemsBoolExp>;
};


export type QueryRootTableItemsByPkArgs = {
  transaction_version: Scalars['bigint']['input'];
  write_set_change_index: Scalars['bigint']['input'];
};


export type QueryRootTableMetadatasArgs = {
  distinct_on?: InputMaybe<Array<TableMetadatasSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TableMetadatasOrderBy>>;
  where?: InputMaybe<TableMetadatasBoolExp>;
};


export type QueryRootTableMetadatasByPkArgs = {
  handle: Scalars['String']['input'];
};


export type QueryRootTokenActivitiesV2Args = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


export type QueryRootTokenActivitiesV2AggregateArgs = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


export type QueryRootTokenActivitiesV2ByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type QueryRootUserTransactionsArgs = {
  distinct_on?: InputMaybe<Array<UserTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<UserTransactionsOrderBy>>;
  where?: InputMaybe<UserTransactionsBoolExp>;
};


export type QueryRootUserTransactionsByPkArgs = {
  version: Scalars['bigint']['input'];
};

/** columns and relationships of "signatures" */
export type Signatures = {
  any_signature_type?: Maybe<Scalars['String']['output']>;
  function_info?: Maybe<Scalars['String']['output']>;
  is_sender_primary: Scalars['Boolean']['output'];
  multi_agent_index: Scalars['bigint']['output'];
  multi_sig_index: Scalars['bigint']['output'];
  public_key: Scalars['String']['output'];
  public_key_indices: Scalars['jsonb']['output'];
  public_key_type?: Maybe<Scalars['String']['output']>;
  signature: Scalars['String']['output'];
  signer: Scalars['String']['output'];
  threshold: Scalars['bigint']['output'];
  transaction_block_height: Scalars['bigint']['output'];
  transaction_version: Scalars['bigint']['output'];
  type: Scalars['String']['output'];
};


/** columns and relationships of "signatures" */
export type SignaturesPublicKeyIndicesArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "signatures". All fields are combined with a logical 'AND'. */
export type SignaturesBoolExp = {
  _and?: InputMaybe<Array<SignaturesBoolExp>>;
  _not?: InputMaybe<SignaturesBoolExp>;
  _or?: InputMaybe<Array<SignaturesBoolExp>>;
  any_signature_type?: InputMaybe<StringComparisonExp>;
  function_info?: InputMaybe<StringComparisonExp>;
  is_sender_primary?: InputMaybe<BooleanComparisonExp>;
  multi_agent_index?: InputMaybe<BigintComparisonExp>;
  multi_sig_index?: InputMaybe<BigintComparisonExp>;
  public_key?: InputMaybe<StringComparisonExp>;
  public_key_indices?: InputMaybe<JsonbComparisonExp>;
  public_key_type?: InputMaybe<StringComparisonExp>;
  signature?: InputMaybe<StringComparisonExp>;
  signer?: InputMaybe<StringComparisonExp>;
  threshold?: InputMaybe<BigintComparisonExp>;
  transaction_block_height?: InputMaybe<BigintComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  type?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "signatures". */
export type SignaturesOrderBy = {
  any_signature_type?: InputMaybe<OrderBy>;
  function_info?: InputMaybe<OrderBy>;
  is_sender_primary?: InputMaybe<OrderBy>;
  multi_agent_index?: InputMaybe<OrderBy>;
  multi_sig_index?: InputMaybe<OrderBy>;
  public_key?: InputMaybe<OrderBy>;
  public_key_indices?: InputMaybe<OrderBy>;
  public_key_type?: InputMaybe<OrderBy>;
  signature?: InputMaybe<OrderBy>;
  signer?: InputMaybe<OrderBy>;
  threshold?: InputMaybe<OrderBy>;
  transaction_block_height?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** select columns of table "signatures" */
export enum SignaturesSelectColumn {
  /** column name */
  AnySignatureType = 'any_signature_type',
  /** column name */
  FunctionInfo = 'function_info',
  /** column name */
  IsSenderPrimary = 'is_sender_primary',
  /** column name */
  MultiAgentIndex = 'multi_agent_index',
  /** column name */
  MultiSigIndex = 'multi_sig_index',
  /** column name */
  PublicKey = 'public_key',
  /** column name */
  PublicKeyIndices = 'public_key_indices',
  /** column name */
  PublicKeyType = 'public_key_type',
  /** column name */
  Signature = 'signature',
  /** column name */
  Signer = 'signer',
  /** column name */
  Threshold = 'threshold',
  /** column name */
  TransactionBlockHeight = 'transaction_block_height',
  /** column name */
  TransactionVersion = 'transaction_version',
  /** column name */
  Type = 'type'
}

/** Streaming cursor of the table "signatures" */
export type SignaturesStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: SignaturesStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type SignaturesStreamCursorValueInput = {
  any_signature_type?: InputMaybe<Scalars['String']['input']>;
  function_info?: InputMaybe<Scalars['String']['input']>;
  is_sender_primary?: InputMaybe<Scalars['Boolean']['input']>;
  multi_agent_index?: InputMaybe<Scalars['bigint']['input']>;
  multi_sig_index?: InputMaybe<Scalars['bigint']['input']>;
  public_key?: InputMaybe<Scalars['String']['input']>;
  public_key_indices?: InputMaybe<Scalars['jsonb']['input']>;
  public_key_type?: InputMaybe<Scalars['String']['input']>;
  signature?: InputMaybe<Scalars['String']['input']>;
  signer?: InputMaybe<Scalars['String']['input']>;
  threshold?: InputMaybe<Scalars['bigint']['input']>;
  transaction_block_height?: InputMaybe<Scalars['bigint']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionRoot = {
  /** fetch data from the table: "account_transactions" */
  account_transactions: Array<AccountTransactions>;
  /** fetch aggregated fields from the table: "account_transactions" */
  account_transactions_aggregate: AccountTransactionsAggregate;
  /** fetch data from the table: "account_transactions" using primary key columns */
  account_transactions_by_pk?: Maybe<AccountTransactions>;
  /** fetch data from the table in a streaming manner: "account_transactions" */
  account_transactions_stream: Array<AccountTransactions>;
  /** fetch data from the table: "auth_key_account_addresses" */
  auth_key_account_addresses: Array<AuthKeyAccountAddresses>;
  /** fetch aggregated fields from the table: "auth_key_account_addresses" */
  auth_key_account_addresses_aggregate: AuthKeyAccountAddressesAggregate;
  /** fetch data from the table: "auth_key_account_addresses" using primary key columns */
  auth_key_account_addresses_by_pk?: Maybe<AuthKeyAccountAddresses>;
  /** fetch data from the table in a streaming manner: "auth_key_account_addresses" */
  auth_key_account_addresses_stream: Array<AuthKeyAccountAddresses>;
  /** fetch data from the table: "block_metadata_transactions" */
  block_metadata_transactions: Array<BlockMetadataTransactions>;
  /** fetch data from the table: "block_metadata_transactions" using primary key columns */
  block_metadata_transactions_by_pk?: Maybe<BlockMetadataTransactions>;
  /** fetch data from the table in a streaming manner: "block_metadata_transactions" */
  block_metadata_transactions_stream: Array<BlockMetadataTransactions>;
  /** fetch data from the table: "confidential_asset_activities" */
  confidential_asset_activities: Array<ConfidentialAssetActivities>;
  /** fetch data from the table: "confidential_asset_activities" using primary key columns */
  confidential_asset_activities_by_pk?: Maybe<ConfidentialAssetActivities>;
  /** fetch data from the table in a streaming manner: "confidential_asset_activities" */
  confidential_asset_activities_stream: Array<ConfidentialAssetActivities>;
  /** fetch data from the table: "current_ans_lookup_v2" */
  current_ans_lookup_v2: Array<CurrentAnsLookupV2>;
  /** fetch data from the table: "current_ans_lookup_v2" using primary key columns */
  current_ans_lookup_v2_by_pk?: Maybe<CurrentAnsLookupV2>;
  /** fetch data from the table in a streaming manner: "current_ans_lookup_v2" */
  current_ans_lookup_v2_stream: Array<CurrentAnsLookupV2>;
  /** fetch data from the table: "current_aptos_names" */
  current_aptos_names: Array<CurrentAptosNames>;
  /** fetch aggregated fields from the table: "current_aptos_names" */
  current_aptos_names_aggregate: CurrentAptosNamesAggregate;
  /** fetch data from the table in a streaming manner: "current_aptos_names" */
  current_aptos_names_stream: Array<CurrentAptosNames>;
  /** fetch data from the table: "current_collection_ownership_v2_view" */
  current_collection_ownership_v2_view: Array<CurrentCollectionOwnershipV2View>;
  /** fetch aggregated fields from the table: "current_collection_ownership_v2_view" */
  current_collection_ownership_v2_view_aggregate: CurrentCollectionOwnershipV2ViewAggregate;
  /** fetch data from the table in a streaming manner: "current_collection_ownership_v2_view" */
  current_collection_ownership_v2_view_stream: Array<CurrentCollectionOwnershipV2View>;
  /** fetch data from the table: "current_collections_v2" */
  current_collections_v2: Array<CurrentCollectionsV2>;
  /** fetch data from the table: "current_collections_v2" using primary key columns */
  current_collections_v2_by_pk?: Maybe<CurrentCollectionsV2>;
  /** fetch data from the table in a streaming manner: "current_collections_v2" */
  current_collections_v2_stream: Array<CurrentCollectionsV2>;
  /** fetch data from the table: "current_delegated_staking_pool_balances" */
  current_delegated_staking_pool_balances: Array<CurrentDelegatedStakingPoolBalances>;
  /** fetch data from the table: "current_delegated_staking_pool_balances" using primary key columns */
  current_delegated_staking_pool_balances_by_pk?: Maybe<CurrentDelegatedStakingPoolBalances>;
  /** fetch data from the table in a streaming manner: "current_delegated_staking_pool_balances" */
  current_delegated_staking_pool_balances_stream: Array<CurrentDelegatedStakingPoolBalances>;
  /** fetch data from the table: "current_delegated_voter" */
  current_delegated_voter: Array<CurrentDelegatedVoter>;
  /** fetch data from the table: "current_delegated_voter" using primary key columns */
  current_delegated_voter_by_pk?: Maybe<CurrentDelegatedVoter>;
  /** fetch data from the table in a streaming manner: "current_delegated_voter" */
  current_delegated_voter_stream: Array<CurrentDelegatedVoter>;
  /** fetch data from the table: "current_delegator_balances" */
  current_delegator_balances: Array<CurrentDelegatorBalances>;
  /** fetch data from the table: "current_delegator_balances" using primary key columns */
  current_delegator_balances_by_pk?: Maybe<CurrentDelegatorBalances>;
  /** fetch data from the table in a streaming manner: "current_delegator_balances" */
  current_delegator_balances_stream: Array<CurrentDelegatorBalances>;
  /** fetch data from the table: "current_fungible_asset_balances" */
  current_fungible_asset_balances: Array<CurrentFungibleAssetBalances>;
  /** fetch aggregated fields from the table: "current_fungible_asset_balances" */
  current_fungible_asset_balances_aggregate: CurrentFungibleAssetBalancesAggregate;
  /** fetch data from the table: "current_fungible_asset_balances" using primary key columns */
  current_fungible_asset_balances_by_pk?: Maybe<CurrentFungibleAssetBalances>;
  /** fetch data from the table in a streaming manner: "current_fungible_asset_balances" */
  current_fungible_asset_balances_stream: Array<CurrentFungibleAssetBalances>;
  /** fetch data from the table: "current_objects" */
  current_objects: Array<CurrentObjects>;
  /** fetch data from the table: "current_objects" using primary key columns */
  current_objects_by_pk?: Maybe<CurrentObjects>;
  /** fetch data from the table in a streaming manner: "current_objects" */
  current_objects_stream: Array<CurrentObjects>;
  /** fetch data from the table: "current_staking_pool_voter" */
  current_staking_pool_voter: Array<CurrentStakingPoolVoter>;
  /** fetch data from the table: "current_staking_pool_voter" using primary key columns */
  current_staking_pool_voter_by_pk?: Maybe<CurrentStakingPoolVoter>;
  /** fetch data from the table in a streaming manner: "current_staking_pool_voter" */
  current_staking_pool_voter_stream: Array<CurrentStakingPoolVoter>;
  /** fetch data from the table: "current_table_items" */
  current_table_items: Array<CurrentTableItems>;
  /** fetch data from the table: "current_table_items" using primary key columns */
  current_table_items_by_pk?: Maybe<CurrentTableItems>;
  /** fetch data from the table in a streaming manner: "current_table_items" */
  current_table_items_stream: Array<CurrentTableItems>;
  /** fetch data from the table: "current_token_datas_v2" */
  current_token_datas_v2: Array<CurrentTokenDatasV2>;
  /** fetch data from the table: "current_token_datas_v2" using primary key columns */
  current_token_datas_v2_by_pk?: Maybe<CurrentTokenDatasV2>;
  /** fetch data from the table in a streaming manner: "current_token_datas_v2" */
  current_token_datas_v2_stream: Array<CurrentTokenDatasV2>;
  /** fetch data from the table: "current_token_ownerships_v2" */
  current_token_ownerships_v2: Array<CurrentTokenOwnershipsV2>;
  /** fetch aggregated fields from the table: "current_token_ownerships_v2" */
  current_token_ownerships_v2_aggregate: CurrentTokenOwnershipsV2Aggregate;
  /** fetch data from the table: "current_token_ownerships_v2" using primary key columns */
  current_token_ownerships_v2_by_pk?: Maybe<CurrentTokenOwnershipsV2>;
  /** fetch data from the table in a streaming manner: "current_token_ownerships_v2" */
  current_token_ownerships_v2_stream: Array<CurrentTokenOwnershipsV2>;
  /** fetch data from the table: "current_token_pending_claims" */
  current_token_pending_claims: Array<CurrentTokenPendingClaims>;
  /** fetch data from the table: "current_token_pending_claims" using primary key columns */
  current_token_pending_claims_by_pk?: Maybe<CurrentTokenPendingClaims>;
  /** fetch data from the table in a streaming manner: "current_token_pending_claims" */
  current_token_pending_claims_stream: Array<CurrentTokenPendingClaims>;
  /** fetch data from the table: "current_token_royalty_v1" */
  current_token_royalty_v1: Array<CurrentTokenRoyaltyV1>;
  /** fetch data from the table: "current_token_royalty_v1" using primary key columns */
  current_token_royalty_v1_by_pk?: Maybe<CurrentTokenRoyaltyV1>;
  /** fetch data from the table in a streaming manner: "current_token_royalty_v1" */
  current_token_royalty_v1_stream: Array<CurrentTokenRoyaltyV1>;
  /** An array relationship */
  delegated_staking_activities: Array<DelegatedStakingActivities>;
  /** fetch data from the table: "delegated_staking_activities" using primary key columns */
  delegated_staking_activities_by_pk?: Maybe<DelegatedStakingActivities>;
  /** fetch data from the table in a streaming manner: "delegated_staking_activities" */
  delegated_staking_activities_stream: Array<DelegatedStakingActivities>;
  /** fetch data from the table: "delegated_staking_pool_balances" */
  delegated_staking_pool_balances: Array<DelegatedStakingPoolBalances>;
  /** fetch aggregated fields from the table: "delegated_staking_pool_balances" */
  delegated_staking_pool_balances_aggregate: DelegatedStakingPoolBalancesAggregate;
  /** fetch data from the table: "delegated_staking_pool_balances" using primary key columns */
  delegated_staking_pool_balances_by_pk?: Maybe<DelegatedStakingPoolBalances>;
  /** fetch data from the table in a streaming manner: "delegated_staking_pool_balances" */
  delegated_staking_pool_balances_stream: Array<DelegatedStakingPoolBalances>;
  /** fetch data from the table: "delegated_staking_pools" */
  delegated_staking_pools: Array<DelegatedStakingPools>;
  /** fetch data from the table: "delegated_staking_pools" using primary key columns */
  delegated_staking_pools_by_pk?: Maybe<DelegatedStakingPools>;
  /** fetch data from the table in a streaming manner: "delegated_staking_pools" */
  delegated_staking_pools_stream: Array<DelegatedStakingPools>;
  /** fetch data from the table: "delegator_distinct_pool" */
  delegator_distinct_pool: Array<DelegatorDistinctPool>;
  /** fetch aggregated fields from the table: "delegator_distinct_pool" */
  delegator_distinct_pool_aggregate: DelegatorDistinctPoolAggregate;
  /** fetch data from the table in a streaming manner: "delegator_distinct_pool" */
  delegator_distinct_pool_stream: Array<DelegatorDistinctPool>;
  /** An array relationship */
  fungible_asset_activities: Array<FungibleAssetActivities>;
  /** fetch data from the table: "fungible_asset_activities" using primary key columns */
  fungible_asset_activities_by_pk?: Maybe<FungibleAssetActivities>;
  /** fetch data from the table in a streaming manner: "fungible_asset_activities" */
  fungible_asset_activities_stream: Array<FungibleAssetActivities>;
  /** fetch data from the table: "fungible_asset_metadata" */
  fungible_asset_metadata: Array<FungibleAssetMetadata>;
  /** fetch data from the table: "fungible_asset_metadata" using primary key columns */
  fungible_asset_metadata_by_pk?: Maybe<FungibleAssetMetadata>;
  /** fetch data from the table in a streaming manner: "fungible_asset_metadata" */
  fungible_asset_metadata_stream: Array<FungibleAssetMetadata>;
  /** fetch data from the table: "processor_metadata.ledger_infos" */
  ledger_infos: Array<LedgerInfos>;
  /** fetch data from the table: "processor_metadata.ledger_infos" using primary key columns */
  ledger_infos_by_pk?: Maybe<LedgerInfos>;
  /** fetch data from the table in a streaming manner: "processor_metadata.ledger_infos" */
  ledger_infos_stream: Array<LedgerInfos>;
  /** fetch data from the table: "nft_metadata_crawler.parsed_asset_uris" */
  nft_metadata_crawler_parsed_asset_uris: Array<NftMetadataCrawlerParsedAssetUris>;
  /** fetch data from the table: "nft_metadata_crawler.parsed_asset_uris" using primary key columns */
  nft_metadata_crawler_parsed_asset_uris_by_pk?: Maybe<NftMetadataCrawlerParsedAssetUris>;
  /** fetch data from the table in a streaming manner: "nft_metadata_crawler.parsed_asset_uris" */
  nft_metadata_crawler_parsed_asset_uris_stream: Array<NftMetadataCrawlerParsedAssetUris>;
  /** fetch data from the table: "num_active_delegator_per_pool" */
  num_active_delegator_per_pool: Array<NumActiveDelegatorPerPool>;
  /** fetch data from the table in a streaming manner: "num_active_delegator_per_pool" */
  num_active_delegator_per_pool_stream: Array<NumActiveDelegatorPerPool>;
  /** fetch data from the table: "processor_metadata.processor_status" */
  processor_status: Array<ProcessorStatus>;
  /** fetch data from the table: "processor_metadata.processor_status" using primary key columns */
  processor_status_by_pk?: Maybe<ProcessorStatus>;
  /** fetch data from the table in a streaming manner: "processor_metadata.processor_status" */
  processor_status_stream: Array<ProcessorStatus>;
  /** fetch data from the table: "proposal_votes" */
  proposal_votes: Array<ProposalVotes>;
  /** fetch aggregated fields from the table: "proposal_votes" */
  proposal_votes_aggregate: ProposalVotesAggregate;
  /** fetch data from the table: "proposal_votes" using primary key columns */
  proposal_votes_by_pk?: Maybe<ProposalVotes>;
  /** fetch data from the table in a streaming manner: "proposal_votes" */
  proposal_votes_stream: Array<ProposalVotes>;
  /** fetch data from the table: "public_key_auth_keys" */
  public_key_auth_keys: Array<PublicKeyAuthKeys>;
  /** fetch aggregated fields from the table: "public_key_auth_keys" */
  public_key_auth_keys_aggregate: PublicKeyAuthKeysAggregate;
  /** fetch data from the table: "public_key_auth_keys" using primary key columns */
  public_key_auth_keys_by_pk?: Maybe<PublicKeyAuthKeys>;
  /** fetch data from the table in a streaming manner: "public_key_auth_keys" */
  public_key_auth_keys_stream: Array<PublicKeyAuthKeys>;
  /** fetch data from the table: "signatures" */
  signatures: Array<Signatures>;
  /** fetch data from the table: "signatures" using primary key columns */
  signatures_by_pk?: Maybe<Signatures>;
  /** fetch data from the table in a streaming manner: "signatures" */
  signatures_stream: Array<Signatures>;
  /** fetch data from the table: "table_items" */
  table_items: Array<TableItems>;
  /** fetch data from the table: "table_items" using primary key columns */
  table_items_by_pk?: Maybe<TableItems>;
  /** fetch data from the table in a streaming manner: "table_items" */
  table_items_stream: Array<TableItems>;
  /** fetch data from the table: "table_metadatas" */
  table_metadatas: Array<TableMetadatas>;
  /** fetch data from the table: "table_metadatas" using primary key columns */
  table_metadatas_by_pk?: Maybe<TableMetadatas>;
  /** fetch data from the table in a streaming manner: "table_metadatas" */
  table_metadatas_stream: Array<TableMetadatas>;
  /** An array relationship */
  token_activities_v2: Array<TokenActivitiesV2>;
  /** An aggregate relationship */
  token_activities_v2_aggregate: TokenActivitiesV2Aggregate;
  /** fetch data from the table: "token_activities_v2" using primary key columns */
  token_activities_v2_by_pk?: Maybe<TokenActivitiesV2>;
  /** fetch data from the table in a streaming manner: "token_activities_v2" */
  token_activities_v2_stream: Array<TokenActivitiesV2>;
  /** fetch data from the table: "user_transactions" */
  user_transactions: Array<UserTransactions>;
  /** fetch data from the table: "user_transactions" using primary key columns */
  user_transactions_by_pk?: Maybe<UserTransactions>;
  /** fetch data from the table in a streaming manner: "user_transactions" */
  user_transactions_stream: Array<UserTransactions>;
};


export type SubscriptionRootAccountTransactionsArgs = {
  distinct_on?: InputMaybe<Array<AccountTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AccountTransactionsOrderBy>>;
  where?: InputMaybe<AccountTransactionsBoolExp>;
};


export type SubscriptionRootAccountTransactionsAggregateArgs = {
  distinct_on?: InputMaybe<Array<AccountTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AccountTransactionsOrderBy>>;
  where?: InputMaybe<AccountTransactionsBoolExp>;
};


export type SubscriptionRootAccountTransactionsByPkArgs = {
  account_address: Scalars['String']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootAccountTransactionsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<AccountTransactionsStreamCursorInput>>;
  where?: InputMaybe<AccountTransactionsBoolExp>;
};


export type SubscriptionRootAuthKeyAccountAddressesArgs = {
  distinct_on?: InputMaybe<Array<AuthKeyAccountAddressesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AuthKeyAccountAddressesOrderBy>>;
  where?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
};


export type SubscriptionRootAuthKeyAccountAddressesAggregateArgs = {
  distinct_on?: InputMaybe<Array<AuthKeyAccountAddressesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<AuthKeyAccountAddressesOrderBy>>;
  where?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
};


export type SubscriptionRootAuthKeyAccountAddressesByPkArgs = {
  account_address: Scalars['String']['input'];
};


export type SubscriptionRootAuthKeyAccountAddressesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<AuthKeyAccountAddressesStreamCursorInput>>;
  where?: InputMaybe<AuthKeyAccountAddressesBoolExp>;
};


export type SubscriptionRootBlockMetadataTransactionsArgs = {
  distinct_on?: InputMaybe<Array<BlockMetadataTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<BlockMetadataTransactionsOrderBy>>;
  where?: InputMaybe<BlockMetadataTransactionsBoolExp>;
};


export type SubscriptionRootBlockMetadataTransactionsByPkArgs = {
  version: Scalars['bigint']['input'];
};


export type SubscriptionRootBlockMetadataTransactionsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<BlockMetadataTransactionsStreamCursorInput>>;
  where?: InputMaybe<BlockMetadataTransactionsBoolExp>;
};


export type SubscriptionRootConfidentialAssetActivitiesArgs = {
  distinct_on?: InputMaybe<Array<ConfidentialAssetActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ConfidentialAssetActivitiesOrderBy>>;
  where?: InputMaybe<ConfidentialAssetActivitiesBoolExp>;
};


export type SubscriptionRootConfidentialAssetActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootConfidentialAssetActivitiesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<ConfidentialAssetActivitiesStreamCursorInput>>;
  where?: InputMaybe<ConfidentialAssetActivitiesBoolExp>;
};


export type SubscriptionRootCurrentAnsLookupV2Args = {
  distinct_on?: InputMaybe<Array<CurrentAnsLookupV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAnsLookupV2OrderBy>>;
  where?: InputMaybe<CurrentAnsLookupV2BoolExp>;
};


export type SubscriptionRootCurrentAnsLookupV2ByPkArgs = {
  domain: Scalars['String']['input'];
  subdomain: Scalars['String']['input'];
  token_standard: Scalars['String']['input'];
};


export type SubscriptionRootCurrentAnsLookupV2StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentAnsLookupV2StreamCursorInput>>;
  where?: InputMaybe<CurrentAnsLookupV2BoolExp>;
};


export type SubscriptionRootCurrentAptosNamesArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


export type SubscriptionRootCurrentAptosNamesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


export type SubscriptionRootCurrentAptosNamesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentAptosNamesStreamCursorInput>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


export type SubscriptionRootCurrentCollectionOwnershipV2ViewArgs = {
  distinct_on?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewOrderBy>>;
  where?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
};


export type SubscriptionRootCurrentCollectionOwnershipV2ViewAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionOwnershipV2ViewOrderBy>>;
  where?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
};


export type SubscriptionRootCurrentCollectionOwnershipV2ViewStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentCollectionOwnershipV2ViewStreamCursorInput>>;
  where?: InputMaybe<CurrentCollectionOwnershipV2ViewBoolExp>;
};


export type SubscriptionRootCurrentCollectionsV2Args = {
  distinct_on?: InputMaybe<Array<CurrentCollectionsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentCollectionsV2OrderBy>>;
  where?: InputMaybe<CurrentCollectionsV2BoolExp>;
};


export type SubscriptionRootCurrentCollectionsV2ByPkArgs = {
  collection_id: Scalars['String']['input'];
};


export type SubscriptionRootCurrentCollectionsV2StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentCollectionsV2StreamCursorInput>>;
  where?: InputMaybe<CurrentCollectionsV2BoolExp>;
};


export type SubscriptionRootCurrentDelegatedStakingPoolBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
};


export type SubscriptionRootCurrentDelegatedStakingPoolBalancesByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type SubscriptionRootCurrentDelegatedStakingPoolBalancesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentDelegatedStakingPoolBalancesStreamCursorInput>>;
  where?: InputMaybe<CurrentDelegatedStakingPoolBalancesBoolExp>;
};


export type SubscriptionRootCurrentDelegatedVoterArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatedVoterSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatedVoterOrderBy>>;
  where?: InputMaybe<CurrentDelegatedVoterBoolExp>;
};


export type SubscriptionRootCurrentDelegatedVoterByPkArgs = {
  delegation_pool_address: Scalars['String']['input'];
  delegator_address: Scalars['String']['input'];
};


export type SubscriptionRootCurrentDelegatedVoterStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentDelegatedVoterStreamCursorInput>>;
  where?: InputMaybe<CurrentDelegatedVoterBoolExp>;
};


export type SubscriptionRootCurrentDelegatorBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentDelegatorBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentDelegatorBalancesOrderBy>>;
  where?: InputMaybe<CurrentDelegatorBalancesBoolExp>;
};


export type SubscriptionRootCurrentDelegatorBalancesByPkArgs = {
  delegator_address: Scalars['String']['input'];
  pool_address: Scalars['String']['input'];
  pool_type: Scalars['String']['input'];
  table_handle: Scalars['String']['input'];
};


export type SubscriptionRootCurrentDelegatorBalancesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentDelegatorBalancesStreamCursorInput>>;
  where?: InputMaybe<CurrentDelegatorBalancesBoolExp>;
};


export type SubscriptionRootCurrentFungibleAssetBalancesArgs = {
  distinct_on?: InputMaybe<Array<CurrentFungibleAssetBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentFungibleAssetBalancesOrderBy>>;
  where?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
};


export type SubscriptionRootCurrentFungibleAssetBalancesAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentFungibleAssetBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentFungibleAssetBalancesOrderBy>>;
  where?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
};


export type SubscriptionRootCurrentFungibleAssetBalancesByPkArgs = {
  storage_id: Scalars['String']['input'];
};


export type SubscriptionRootCurrentFungibleAssetBalancesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentFungibleAssetBalancesStreamCursorInput>>;
  where?: InputMaybe<CurrentFungibleAssetBalancesBoolExp>;
};


export type SubscriptionRootCurrentObjectsArgs = {
  distinct_on?: InputMaybe<Array<CurrentObjectsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentObjectsOrderBy>>;
  where?: InputMaybe<CurrentObjectsBoolExp>;
};


export type SubscriptionRootCurrentObjectsByPkArgs = {
  object_address: Scalars['String']['input'];
};


export type SubscriptionRootCurrentObjectsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentObjectsStreamCursorInput>>;
  where?: InputMaybe<CurrentObjectsBoolExp>;
};


export type SubscriptionRootCurrentStakingPoolVoterArgs = {
  distinct_on?: InputMaybe<Array<CurrentStakingPoolVoterSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentStakingPoolVoterOrderBy>>;
  where?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
};


export type SubscriptionRootCurrentStakingPoolVoterByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type SubscriptionRootCurrentStakingPoolVoterStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentStakingPoolVoterStreamCursorInput>>;
  where?: InputMaybe<CurrentStakingPoolVoterBoolExp>;
};


export type SubscriptionRootCurrentTableItemsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTableItemsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTableItemsOrderBy>>;
  where?: InputMaybe<CurrentTableItemsBoolExp>;
};


export type SubscriptionRootCurrentTableItemsByPkArgs = {
  key_hash: Scalars['String']['input'];
  table_handle: Scalars['String']['input'];
};


export type SubscriptionRootCurrentTableItemsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentTableItemsStreamCursorInput>>;
  where?: InputMaybe<CurrentTableItemsBoolExp>;
};


export type SubscriptionRootCurrentTokenDatasV2Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenDatasV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenDatasV2OrderBy>>;
  where?: InputMaybe<CurrentTokenDatasV2BoolExp>;
};


export type SubscriptionRootCurrentTokenDatasV2ByPkArgs = {
  token_data_id: Scalars['String']['input'];
};


export type SubscriptionRootCurrentTokenDatasV2StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentTokenDatasV2StreamCursorInput>>;
  where?: InputMaybe<CurrentTokenDatasV2BoolExp>;
};


export type SubscriptionRootCurrentTokenOwnershipsV2Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


export type SubscriptionRootCurrentTokenOwnershipsV2AggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenOwnershipsV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenOwnershipsV2OrderBy>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


export type SubscriptionRootCurrentTokenOwnershipsV2ByPkArgs = {
  owner_address: Scalars['String']['input'];
  property_version_v1: Scalars['numeric']['input'];
  storage_id: Scalars['String']['input'];
  token_data_id: Scalars['String']['input'];
};


export type SubscriptionRootCurrentTokenOwnershipsV2StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentTokenOwnershipsV2StreamCursorInput>>;
  where?: InputMaybe<CurrentTokenOwnershipsV2BoolExp>;
};


export type SubscriptionRootCurrentTokenPendingClaimsArgs = {
  distinct_on?: InputMaybe<Array<CurrentTokenPendingClaimsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenPendingClaimsOrderBy>>;
  where?: InputMaybe<CurrentTokenPendingClaimsBoolExp>;
};


export type SubscriptionRootCurrentTokenPendingClaimsByPkArgs = {
  from_address: Scalars['String']['input'];
  property_version: Scalars['numeric']['input'];
  to_address: Scalars['String']['input'];
  token_data_id_hash: Scalars['String']['input'];
};


export type SubscriptionRootCurrentTokenPendingClaimsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentTokenPendingClaimsStreamCursorInput>>;
  where?: InputMaybe<CurrentTokenPendingClaimsBoolExp>;
};


export type SubscriptionRootCurrentTokenRoyaltyV1Args = {
  distinct_on?: InputMaybe<Array<CurrentTokenRoyaltyV1SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentTokenRoyaltyV1OrderBy>>;
  where?: InputMaybe<CurrentTokenRoyaltyV1BoolExp>;
};


export type SubscriptionRootCurrentTokenRoyaltyV1ByPkArgs = {
  token_data_id: Scalars['String']['input'];
};


export type SubscriptionRootCurrentTokenRoyaltyV1StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<CurrentTokenRoyaltyV1StreamCursorInput>>;
  where?: InputMaybe<CurrentTokenRoyaltyV1BoolExp>;
};


export type SubscriptionRootDelegatedStakingActivitiesArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingActivitiesOrderBy>>;
  where?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
};


export type SubscriptionRootDelegatedStakingActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootDelegatedStakingActivitiesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<DelegatedStakingActivitiesStreamCursorInput>>;
  where?: InputMaybe<DelegatedStakingActivitiesBoolExp>;
};


export type SubscriptionRootDelegatedStakingPoolBalancesArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
};


export type SubscriptionRootDelegatedStakingPoolBalancesAggregateArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolBalancesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolBalancesOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
};


export type SubscriptionRootDelegatedStakingPoolBalancesByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootDelegatedStakingPoolBalancesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<DelegatedStakingPoolBalancesStreamCursorInput>>;
  where?: InputMaybe<DelegatedStakingPoolBalancesBoolExp>;
};


export type SubscriptionRootDelegatedStakingPoolsArgs = {
  distinct_on?: InputMaybe<Array<DelegatedStakingPoolsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatedStakingPoolsOrderBy>>;
  where?: InputMaybe<DelegatedStakingPoolsBoolExp>;
};


export type SubscriptionRootDelegatedStakingPoolsByPkArgs = {
  staking_pool_address: Scalars['String']['input'];
};


export type SubscriptionRootDelegatedStakingPoolsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<DelegatedStakingPoolsStreamCursorInput>>;
  where?: InputMaybe<DelegatedStakingPoolsBoolExp>;
};


export type SubscriptionRootDelegatorDistinctPoolArgs = {
  distinct_on?: InputMaybe<Array<DelegatorDistinctPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatorDistinctPoolOrderBy>>;
  where?: InputMaybe<DelegatorDistinctPoolBoolExp>;
};


export type SubscriptionRootDelegatorDistinctPoolAggregateArgs = {
  distinct_on?: InputMaybe<Array<DelegatorDistinctPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<DelegatorDistinctPoolOrderBy>>;
  where?: InputMaybe<DelegatorDistinctPoolBoolExp>;
};


export type SubscriptionRootDelegatorDistinctPoolStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<DelegatorDistinctPoolStreamCursorInput>>;
  where?: InputMaybe<DelegatorDistinctPoolBoolExp>;
};


export type SubscriptionRootFungibleAssetActivitiesArgs = {
  distinct_on?: InputMaybe<Array<FungibleAssetActivitiesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<FungibleAssetActivitiesOrderBy>>;
  where?: InputMaybe<FungibleAssetActivitiesBoolExp>;
};


export type SubscriptionRootFungibleAssetActivitiesByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootFungibleAssetActivitiesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<FungibleAssetActivitiesStreamCursorInput>>;
  where?: InputMaybe<FungibleAssetActivitiesBoolExp>;
};


export type SubscriptionRootFungibleAssetMetadataArgs = {
  distinct_on?: InputMaybe<Array<FungibleAssetMetadataSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<FungibleAssetMetadataOrderBy>>;
  where?: InputMaybe<FungibleAssetMetadataBoolExp>;
};


export type SubscriptionRootFungibleAssetMetadataByPkArgs = {
  asset_type: Scalars['String']['input'];
};


export type SubscriptionRootFungibleAssetMetadataStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<FungibleAssetMetadataStreamCursorInput>>;
  where?: InputMaybe<FungibleAssetMetadataBoolExp>;
};


export type SubscriptionRootLedgerInfosArgs = {
  distinct_on?: InputMaybe<Array<LedgerInfosSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<LedgerInfosOrderBy>>;
  where?: InputMaybe<LedgerInfosBoolExp>;
};


export type SubscriptionRootLedgerInfosByPkArgs = {
  chain_id: Scalars['bigint']['input'];
};


export type SubscriptionRootLedgerInfosStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<LedgerInfosStreamCursorInput>>;
  where?: InputMaybe<LedgerInfosBoolExp>;
};


export type SubscriptionRootNftMetadataCrawlerParsedAssetUrisArgs = {
  distinct_on?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<NftMetadataCrawlerParsedAssetUrisOrderBy>>;
  where?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
};


export type SubscriptionRootNftMetadataCrawlerParsedAssetUrisByPkArgs = {
  asset_uri: Scalars['String']['input'];
};


export type SubscriptionRootNftMetadataCrawlerParsedAssetUrisStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<NftMetadataCrawlerParsedAssetUrisStreamCursorInput>>;
  where?: InputMaybe<NftMetadataCrawlerParsedAssetUrisBoolExp>;
};


export type SubscriptionRootNumActiveDelegatorPerPoolArgs = {
  distinct_on?: InputMaybe<Array<NumActiveDelegatorPerPoolSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<NumActiveDelegatorPerPoolOrderBy>>;
  where?: InputMaybe<NumActiveDelegatorPerPoolBoolExp>;
};


export type SubscriptionRootNumActiveDelegatorPerPoolStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<NumActiveDelegatorPerPoolStreamCursorInput>>;
  where?: InputMaybe<NumActiveDelegatorPerPoolBoolExp>;
};


export type SubscriptionRootProcessorStatusArgs = {
  distinct_on?: InputMaybe<Array<ProcessorStatusSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProcessorStatusOrderBy>>;
  where?: InputMaybe<ProcessorStatusBoolExp>;
};


export type SubscriptionRootProcessorStatusByPkArgs = {
  processor: Scalars['String']['input'];
};


export type SubscriptionRootProcessorStatusStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<ProcessorStatusStreamCursorInput>>;
  where?: InputMaybe<ProcessorStatusBoolExp>;
};


export type SubscriptionRootProposalVotesArgs = {
  distinct_on?: InputMaybe<Array<ProposalVotesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProposalVotesOrderBy>>;
  where?: InputMaybe<ProposalVotesBoolExp>;
};


export type SubscriptionRootProposalVotesAggregateArgs = {
  distinct_on?: InputMaybe<Array<ProposalVotesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<ProposalVotesOrderBy>>;
  where?: InputMaybe<ProposalVotesBoolExp>;
};


export type SubscriptionRootProposalVotesByPkArgs = {
  proposal_id: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
  voter_address: Scalars['String']['input'];
};


export type SubscriptionRootProposalVotesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<ProposalVotesStreamCursorInput>>;
  where?: InputMaybe<ProposalVotesBoolExp>;
};


export type SubscriptionRootPublicKeyAuthKeysArgs = {
  distinct_on?: InputMaybe<Array<PublicKeyAuthKeysSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<PublicKeyAuthKeysOrderBy>>;
  where?: InputMaybe<PublicKeyAuthKeysBoolExp>;
};


export type SubscriptionRootPublicKeyAuthKeysAggregateArgs = {
  distinct_on?: InputMaybe<Array<PublicKeyAuthKeysSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<PublicKeyAuthKeysOrderBy>>;
  where?: InputMaybe<PublicKeyAuthKeysBoolExp>;
};


export type SubscriptionRootPublicKeyAuthKeysByPkArgs = {
  auth_key: Scalars['String']['input'];
  public_key: Scalars['String']['input'];
  public_key_type: Scalars['String']['input'];
};


export type SubscriptionRootPublicKeyAuthKeysStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<PublicKeyAuthKeysStreamCursorInput>>;
  where?: InputMaybe<PublicKeyAuthKeysBoolExp>;
};


export type SubscriptionRootSignaturesArgs = {
  distinct_on?: InputMaybe<Array<SignaturesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<SignaturesOrderBy>>;
  where?: InputMaybe<SignaturesBoolExp>;
};


export type SubscriptionRootSignaturesByPkArgs = {
  is_sender_primary: Scalars['Boolean']['input'];
  multi_agent_index: Scalars['bigint']['input'];
  multi_sig_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootSignaturesStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<SignaturesStreamCursorInput>>;
  where?: InputMaybe<SignaturesBoolExp>;
};


export type SubscriptionRootTableItemsArgs = {
  distinct_on?: InputMaybe<Array<TableItemsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TableItemsOrderBy>>;
  where?: InputMaybe<TableItemsBoolExp>;
};


export type SubscriptionRootTableItemsByPkArgs = {
  transaction_version: Scalars['bigint']['input'];
  write_set_change_index: Scalars['bigint']['input'];
};


export type SubscriptionRootTableItemsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<TableItemsStreamCursorInput>>;
  where?: InputMaybe<TableItemsBoolExp>;
};


export type SubscriptionRootTableMetadatasArgs = {
  distinct_on?: InputMaybe<Array<TableMetadatasSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TableMetadatasOrderBy>>;
  where?: InputMaybe<TableMetadatasBoolExp>;
};


export type SubscriptionRootTableMetadatasByPkArgs = {
  handle: Scalars['String']['input'];
};


export type SubscriptionRootTableMetadatasStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<TableMetadatasStreamCursorInput>>;
  where?: InputMaybe<TableMetadatasBoolExp>;
};


export type SubscriptionRootTokenActivitiesV2Args = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


export type SubscriptionRootTokenActivitiesV2AggregateArgs = {
  distinct_on?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<TokenActivitiesV2OrderBy>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


export type SubscriptionRootTokenActivitiesV2ByPkArgs = {
  event_index: Scalars['bigint']['input'];
  transaction_version: Scalars['bigint']['input'];
};


export type SubscriptionRootTokenActivitiesV2StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<TokenActivitiesV2StreamCursorInput>>;
  where?: InputMaybe<TokenActivitiesV2BoolExp>;
};


export type SubscriptionRootUserTransactionsArgs = {
  distinct_on?: InputMaybe<Array<UserTransactionsSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<UserTransactionsOrderBy>>;
  where?: InputMaybe<UserTransactionsBoolExp>;
};


export type SubscriptionRootUserTransactionsByPkArgs = {
  version: Scalars['bigint']['input'];
};


export type SubscriptionRootUserTransactionsStreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<UserTransactionsStreamCursorInput>>;
  where?: InputMaybe<UserTransactionsBoolExp>;
};

/** columns and relationships of "table_items" */
export type TableItems = {
  decoded_key: Scalars['jsonb']['output'];
  decoded_value?: Maybe<Scalars['jsonb']['output']>;
  key: Scalars['String']['output'];
  table_handle: Scalars['String']['output'];
  transaction_version: Scalars['bigint']['output'];
  write_set_change_index: Scalars['bigint']['output'];
};


/** columns and relationships of "table_items" */
export type TableItemsDecodedKeyArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "table_items" */
export type TableItemsDecodedValueArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "table_items". All fields are combined with a logical 'AND'. */
export type TableItemsBoolExp = {
  _and?: InputMaybe<Array<TableItemsBoolExp>>;
  _not?: InputMaybe<TableItemsBoolExp>;
  _or?: InputMaybe<Array<TableItemsBoolExp>>;
  decoded_key?: InputMaybe<JsonbComparisonExp>;
  decoded_value?: InputMaybe<JsonbComparisonExp>;
  key?: InputMaybe<StringComparisonExp>;
  table_handle?: InputMaybe<StringComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  write_set_change_index?: InputMaybe<BigintComparisonExp>;
};

/** Ordering options when selecting data from "table_items". */
export type TableItemsOrderBy = {
  decoded_key?: InputMaybe<OrderBy>;
  decoded_value?: InputMaybe<OrderBy>;
  key?: InputMaybe<OrderBy>;
  table_handle?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  write_set_change_index?: InputMaybe<OrderBy>;
};

/** select columns of table "table_items" */
export enum TableItemsSelectColumn {
  /** column name */
  DecodedKey = 'decoded_key',
  /** column name */
  DecodedValue = 'decoded_value',
  /** column name */
  Key = 'key',
  /** column name */
  TableHandle = 'table_handle',
  /** column name */
  TransactionVersion = 'transaction_version',
  /** column name */
  WriteSetChangeIndex = 'write_set_change_index'
}

/** Streaming cursor of the table "table_items" */
export type TableItemsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: TableItemsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type TableItemsStreamCursorValueInput = {
  decoded_key?: InputMaybe<Scalars['jsonb']['input']>;
  decoded_value?: InputMaybe<Scalars['jsonb']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  table_handle?: InputMaybe<Scalars['String']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  write_set_change_index?: InputMaybe<Scalars['bigint']['input']>;
};

/** columns and relationships of "table_metadatas" */
export type TableMetadatas = {
  handle: Scalars['String']['output'];
  key_type: Scalars['String']['output'];
  value_type: Scalars['String']['output'];
};

/** Boolean expression to filter rows from the table "table_metadatas". All fields are combined with a logical 'AND'. */
export type TableMetadatasBoolExp = {
  _and?: InputMaybe<Array<TableMetadatasBoolExp>>;
  _not?: InputMaybe<TableMetadatasBoolExp>;
  _or?: InputMaybe<Array<TableMetadatasBoolExp>>;
  handle?: InputMaybe<StringComparisonExp>;
  key_type?: InputMaybe<StringComparisonExp>;
  value_type?: InputMaybe<StringComparisonExp>;
};

/** Ordering options when selecting data from "table_metadatas". */
export type TableMetadatasOrderBy = {
  handle?: InputMaybe<OrderBy>;
  key_type?: InputMaybe<OrderBy>;
  value_type?: InputMaybe<OrderBy>;
};

/** select columns of table "table_metadatas" */
export enum TableMetadatasSelectColumn {
  /** column name */
  Handle = 'handle',
  /** column name */
  KeyType = 'key_type',
  /** column name */
  ValueType = 'value_type'
}

/** Streaming cursor of the table "table_metadatas" */
export type TableMetadatasStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: TableMetadatasStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type TableMetadatasStreamCursorValueInput = {
  handle?: InputMaybe<Scalars['String']['input']>;
  key_type?: InputMaybe<Scalars['String']['input']>;
  value_type?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
export type TimestampComparisonExp = {
  _eq?: InputMaybe<Scalars['timestamp']['input']>;
  _gt?: InputMaybe<Scalars['timestamp']['input']>;
  _gte?: InputMaybe<Scalars['timestamp']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamp']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamp']['input']>;
  _lte?: InputMaybe<Scalars['timestamp']['input']>;
  _neq?: InputMaybe<Scalars['timestamp']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamp']['input']>>;
};

/** columns and relationships of "token_activities_v2" */
export type TokenActivitiesV2 = {
  after_value?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  aptos_names_from: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  aptos_names_from_aggregate: CurrentAptosNamesAggregate;
  /** An array relationship */
  aptos_names_to: Array<CurrentAptosNames>;
  /** An aggregate relationship */
  aptos_names_to_aggregate: CurrentAptosNamesAggregate;
  before_value?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  current_token_data?: Maybe<CurrentTokenDatasV2>;
  entry_function_id_str?: Maybe<Scalars['String']['output']>;
  event_account_address: Scalars['String']['output'];
  event_index: Scalars['bigint']['output'];
  from_address?: Maybe<Scalars['String']['output']>;
  is_fungible_v2?: Maybe<Scalars['Boolean']['output']>;
  property_version_v1: Scalars['numeric']['output'];
  to_address?: Maybe<Scalars['String']['output']>;
  token_amount: Scalars['numeric']['output'];
  token_data_id: Scalars['String']['output'];
  token_standard: Scalars['String']['output'];
  transaction_timestamp: Scalars['timestamp']['output'];
  transaction_version: Scalars['bigint']['output'];
  type: Scalars['String']['output'];
};


/** columns and relationships of "token_activities_v2" */
export type TokenActivitiesV2AptosNamesFromArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "token_activities_v2" */
export type TokenActivitiesV2AptosNamesFromAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "token_activities_v2" */
export type TokenActivitiesV2AptosNamesToArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};


/** columns and relationships of "token_activities_v2" */
export type TokenActivitiesV2AptosNamesToAggregateArgs = {
  distinct_on?: InputMaybe<Array<CurrentAptosNamesSelectColumn>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<CurrentAptosNamesOrderBy>>;
  where?: InputMaybe<CurrentAptosNamesBoolExp>;
};

/** aggregated selection of "token_activities_v2" */
export type TokenActivitiesV2Aggregate = {
  aggregate?: Maybe<TokenActivitiesV2AggregateFields>;
  nodes: Array<TokenActivitiesV2>;
};

export type TokenActivitiesV2AggregateBoolExp = {
  bool_and?: InputMaybe<TokenActivitiesV2AggregateBoolExpBoolAnd>;
  bool_or?: InputMaybe<TokenActivitiesV2AggregateBoolExpBoolOr>;
  count?: InputMaybe<TokenActivitiesV2AggregateBoolExpCount>;
};

export type TokenActivitiesV2AggregateBoolExpBoolAnd = {
  arguments: TokenActivitiesV2SelectColumnTokenActivitiesV2AggregateBoolExpBoolAndArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<TokenActivitiesV2BoolExp>;
  predicate: BooleanComparisonExp;
};

export type TokenActivitiesV2AggregateBoolExpBoolOr = {
  arguments: TokenActivitiesV2SelectColumnTokenActivitiesV2AggregateBoolExpBoolOrArgumentsColumns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<TokenActivitiesV2BoolExp>;
  predicate: BooleanComparisonExp;
};

export type TokenActivitiesV2AggregateBoolExpCount = {
  arguments?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<TokenActivitiesV2BoolExp>;
  predicate: IntComparisonExp;
};

/** aggregate fields of "token_activities_v2" */
export type TokenActivitiesV2AggregateFields = {
  avg?: Maybe<TokenActivitiesV2AvgFields>;
  count: Scalars['Int']['output'];
  max?: Maybe<TokenActivitiesV2MaxFields>;
  min?: Maybe<TokenActivitiesV2MinFields>;
  stddev?: Maybe<TokenActivitiesV2StddevFields>;
  stddev_pop?: Maybe<TokenActivitiesV2StddevPopFields>;
  stddev_samp?: Maybe<TokenActivitiesV2StddevSampFields>;
  sum?: Maybe<TokenActivitiesV2SumFields>;
  var_pop?: Maybe<TokenActivitiesV2VarPopFields>;
  var_samp?: Maybe<TokenActivitiesV2VarSampFields>;
  variance?: Maybe<TokenActivitiesV2VarianceFields>;
};


/** aggregate fields of "token_activities_v2" */
export type TokenActivitiesV2AggregateFieldsCountArgs = {
  columns?: InputMaybe<Array<TokenActivitiesV2SelectColumn>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "token_activities_v2" */
export type TokenActivitiesV2AggregateOrderBy = {
  avg?: InputMaybe<TokenActivitiesV2AvgOrderBy>;
  count?: InputMaybe<OrderBy>;
  max?: InputMaybe<TokenActivitiesV2MaxOrderBy>;
  min?: InputMaybe<TokenActivitiesV2MinOrderBy>;
  stddev?: InputMaybe<TokenActivitiesV2StddevOrderBy>;
  stddev_pop?: InputMaybe<TokenActivitiesV2StddevPopOrderBy>;
  stddev_samp?: InputMaybe<TokenActivitiesV2StddevSampOrderBy>;
  sum?: InputMaybe<TokenActivitiesV2SumOrderBy>;
  var_pop?: InputMaybe<TokenActivitiesV2VarPopOrderBy>;
  var_samp?: InputMaybe<TokenActivitiesV2VarSampOrderBy>;
  variance?: InputMaybe<TokenActivitiesV2VarianceOrderBy>;
};

/** aggregate avg on columns */
export type TokenActivitiesV2AvgFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "token_activities_v2" */
export type TokenActivitiesV2AvgOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Boolean expression to filter rows from the table "token_activities_v2". All fields are combined with a logical 'AND'. */
export type TokenActivitiesV2BoolExp = {
  _and?: InputMaybe<Array<TokenActivitiesV2BoolExp>>;
  _not?: InputMaybe<TokenActivitiesV2BoolExp>;
  _or?: InputMaybe<Array<TokenActivitiesV2BoolExp>>;
  after_value?: InputMaybe<StringComparisonExp>;
  aptos_names_from?: InputMaybe<CurrentAptosNamesBoolExp>;
  aptos_names_from_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  aptos_names_to?: InputMaybe<CurrentAptosNamesBoolExp>;
  aptos_names_to_aggregate?: InputMaybe<CurrentAptosNamesAggregateBoolExp>;
  before_value?: InputMaybe<StringComparisonExp>;
  current_token_data?: InputMaybe<CurrentTokenDatasV2BoolExp>;
  entry_function_id_str?: InputMaybe<StringComparisonExp>;
  event_account_address?: InputMaybe<StringComparisonExp>;
  event_index?: InputMaybe<BigintComparisonExp>;
  from_address?: InputMaybe<StringComparisonExp>;
  is_fungible_v2?: InputMaybe<BooleanComparisonExp>;
  property_version_v1?: InputMaybe<NumericComparisonExp>;
  to_address?: InputMaybe<StringComparisonExp>;
  token_amount?: InputMaybe<NumericComparisonExp>;
  token_data_id?: InputMaybe<StringComparisonExp>;
  token_standard?: InputMaybe<StringComparisonExp>;
  transaction_timestamp?: InputMaybe<TimestampComparisonExp>;
  transaction_version?: InputMaybe<BigintComparisonExp>;
  type?: InputMaybe<StringComparisonExp>;
};

/** aggregate max on columns */
export type TokenActivitiesV2MaxFields = {
  after_value?: Maybe<Scalars['String']['output']>;
  before_value?: Maybe<Scalars['String']['output']>;
  entry_function_id_str?: Maybe<Scalars['String']['output']>;
  event_account_address?: Maybe<Scalars['String']['output']>;
  event_index?: Maybe<Scalars['bigint']['output']>;
  from_address?: Maybe<Scalars['String']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
  to_address?: Maybe<Scalars['String']['output']>;
  token_amount?: Maybe<Scalars['numeric']['output']>;
  token_data_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
  transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "token_activities_v2" */
export type TokenActivitiesV2MaxOrderBy = {
  after_value?: InputMaybe<OrderBy>;
  before_value?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_account_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  from_address?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  to_address?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** aggregate min on columns */
export type TokenActivitiesV2MinFields = {
  after_value?: Maybe<Scalars['String']['output']>;
  before_value?: Maybe<Scalars['String']['output']>;
  entry_function_id_str?: Maybe<Scalars['String']['output']>;
  event_account_address?: Maybe<Scalars['String']['output']>;
  event_index?: Maybe<Scalars['bigint']['output']>;
  from_address?: Maybe<Scalars['String']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
  to_address?: Maybe<Scalars['String']['output']>;
  token_amount?: Maybe<Scalars['numeric']['output']>;
  token_data_id?: Maybe<Scalars['String']['output']>;
  token_standard?: Maybe<Scalars['String']['output']>;
  transaction_timestamp?: Maybe<Scalars['timestamp']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "token_activities_v2" */
export type TokenActivitiesV2MinOrderBy = {
  after_value?: InputMaybe<OrderBy>;
  before_value?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_account_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  from_address?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  to_address?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** Ordering options when selecting data from "token_activities_v2". */
export type TokenActivitiesV2OrderBy = {
  after_value?: InputMaybe<OrderBy>;
  aptos_names_from_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  aptos_names_to_aggregate?: InputMaybe<CurrentAptosNamesAggregateOrderBy>;
  before_value?: InputMaybe<OrderBy>;
  current_token_data?: InputMaybe<CurrentTokenDatasV2OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  event_account_address?: InputMaybe<OrderBy>;
  event_index?: InputMaybe<OrderBy>;
  from_address?: InputMaybe<OrderBy>;
  is_fungible_v2?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  to_address?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  token_data_id?: InputMaybe<OrderBy>;
  token_standard?: InputMaybe<OrderBy>;
  transaction_timestamp?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
};

/** select columns of table "token_activities_v2" */
export enum TokenActivitiesV2SelectColumn {
  /** column name */
  AfterValue = 'after_value',
  /** column name */
  BeforeValue = 'before_value',
  /** column name */
  EntryFunctionIdStr = 'entry_function_id_str',
  /** column name */
  EventAccountAddress = 'event_account_address',
  /** column name */
  EventIndex = 'event_index',
  /** column name */
  FromAddress = 'from_address',
  /** column name */
  IsFungibleV2 = 'is_fungible_v2',
  /** column name */
  PropertyVersionV1 = 'property_version_v1',
  /** column name */
  ToAddress = 'to_address',
  /** column name */
  TokenAmount = 'token_amount',
  /** column name */
  TokenDataId = 'token_data_id',
  /** column name */
  TokenStandard = 'token_standard',
  /** column name */
  TransactionTimestamp = 'transaction_timestamp',
  /** column name */
  TransactionVersion = 'transaction_version',
  /** column name */
  Type = 'type'
}

/** select "token_activities_v2_aggregate_bool_exp_bool_and_arguments_columns" columns of table "token_activities_v2" */
export enum TokenActivitiesV2SelectColumnTokenActivitiesV2AggregateBoolExpBoolAndArgumentsColumns {
  /** column name */
  IsFungibleV2 = 'is_fungible_v2'
}

/** select "token_activities_v2_aggregate_bool_exp_bool_or_arguments_columns" columns of table "token_activities_v2" */
export enum TokenActivitiesV2SelectColumnTokenActivitiesV2AggregateBoolExpBoolOrArgumentsColumns {
  /** column name */
  IsFungibleV2 = 'is_fungible_v2'
}

/** aggregate stddev on columns */
export type TokenActivitiesV2StddevFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "token_activities_v2" */
export type TokenActivitiesV2StddevOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** aggregate stddev_pop on columns */
export type TokenActivitiesV2StddevPopFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "token_activities_v2" */
export type TokenActivitiesV2StddevPopOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** aggregate stddev_samp on columns */
export type TokenActivitiesV2StddevSampFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "token_activities_v2" */
export type TokenActivitiesV2StddevSampOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** Streaming cursor of the table "token_activities_v2" */
export type TokenActivitiesV2StreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: TokenActivitiesV2StreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type TokenActivitiesV2StreamCursorValueInput = {
  after_value?: InputMaybe<Scalars['String']['input']>;
  before_value?: InputMaybe<Scalars['String']['input']>;
  entry_function_id_str?: InputMaybe<Scalars['String']['input']>;
  event_account_address?: InputMaybe<Scalars['String']['input']>;
  event_index?: InputMaybe<Scalars['bigint']['input']>;
  from_address?: InputMaybe<Scalars['String']['input']>;
  is_fungible_v2?: InputMaybe<Scalars['Boolean']['input']>;
  property_version_v1?: InputMaybe<Scalars['numeric']['input']>;
  to_address?: InputMaybe<Scalars['String']['input']>;
  token_amount?: InputMaybe<Scalars['numeric']['input']>;
  token_data_id?: InputMaybe<Scalars['String']['input']>;
  token_standard?: InputMaybe<Scalars['String']['input']>;
  transaction_timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  transaction_version?: InputMaybe<Scalars['bigint']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type TokenActivitiesV2SumFields = {
  event_index?: Maybe<Scalars['bigint']['output']>;
  property_version_v1?: Maybe<Scalars['numeric']['output']>;
  token_amount?: Maybe<Scalars['numeric']['output']>;
  transaction_version?: Maybe<Scalars['bigint']['output']>;
};

/** order by sum() on columns of table "token_activities_v2" */
export type TokenActivitiesV2SumOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** aggregate var_pop on columns */
export type TokenActivitiesV2VarPopFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "token_activities_v2" */
export type TokenActivitiesV2VarPopOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** aggregate var_samp on columns */
export type TokenActivitiesV2VarSampFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "token_activities_v2" */
export type TokenActivitiesV2VarSampOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** aggregate variance on columns */
export type TokenActivitiesV2VarianceFields = {
  event_index?: Maybe<Scalars['Float']['output']>;
  property_version_v1?: Maybe<Scalars['Float']['output']>;
  token_amount?: Maybe<Scalars['Float']['output']>;
  transaction_version?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "token_activities_v2" */
export type TokenActivitiesV2VarianceOrderBy = {
  event_index?: InputMaybe<OrderBy>;
  property_version_v1?: InputMaybe<OrderBy>;
  token_amount?: InputMaybe<OrderBy>;
  transaction_version?: InputMaybe<OrderBy>;
};

/** columns and relationships of "user_transactions" */
export type UserTransactions = {
  block_height: Scalars['bigint']['output'];
  entry_function_contract_address?: Maybe<Scalars['String']['output']>;
  entry_function_function_name?: Maybe<Scalars['String']['output']>;
  entry_function_id_str: Scalars['String']['output'];
  entry_function_module_name?: Maybe<Scalars['String']['output']>;
  epoch: Scalars['bigint']['output'];
  expiration_timestamp_secs: Scalars['timestamp']['output'];
  gas_unit_price: Scalars['numeric']['output'];
  max_gas_amount: Scalars['numeric']['output'];
  parent_signature_type: Scalars['String']['output'];
  sender: Scalars['String']['output'];
  sequence_number?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  signature?: Maybe<Signatures>;
  timestamp: Scalars['timestamp']['output'];
  version: Scalars['bigint']['output'];
};

/** Boolean expression to filter rows from the table "user_transactions". All fields are combined with a logical 'AND'. */
export type UserTransactionsBoolExp = {
  _and?: InputMaybe<Array<UserTransactionsBoolExp>>;
  _not?: InputMaybe<UserTransactionsBoolExp>;
  _or?: InputMaybe<Array<UserTransactionsBoolExp>>;
  block_height?: InputMaybe<BigintComparisonExp>;
  entry_function_contract_address?: InputMaybe<StringComparisonExp>;
  entry_function_function_name?: InputMaybe<StringComparisonExp>;
  entry_function_id_str?: InputMaybe<StringComparisonExp>;
  entry_function_module_name?: InputMaybe<StringComparisonExp>;
  epoch?: InputMaybe<BigintComparisonExp>;
  expiration_timestamp_secs?: InputMaybe<TimestampComparisonExp>;
  gas_unit_price?: InputMaybe<NumericComparisonExp>;
  max_gas_amount?: InputMaybe<NumericComparisonExp>;
  parent_signature_type?: InputMaybe<StringComparisonExp>;
  sender?: InputMaybe<StringComparisonExp>;
  sequence_number?: InputMaybe<BigintComparisonExp>;
  signature?: InputMaybe<SignaturesBoolExp>;
  timestamp?: InputMaybe<TimestampComparisonExp>;
  version?: InputMaybe<BigintComparisonExp>;
};

/** Ordering options when selecting data from "user_transactions". */
export type UserTransactionsOrderBy = {
  block_height?: InputMaybe<OrderBy>;
  entry_function_contract_address?: InputMaybe<OrderBy>;
  entry_function_function_name?: InputMaybe<OrderBy>;
  entry_function_id_str?: InputMaybe<OrderBy>;
  entry_function_module_name?: InputMaybe<OrderBy>;
  epoch?: InputMaybe<OrderBy>;
  expiration_timestamp_secs?: InputMaybe<OrderBy>;
  gas_unit_price?: InputMaybe<OrderBy>;
  max_gas_amount?: InputMaybe<OrderBy>;
  parent_signature_type?: InputMaybe<OrderBy>;
  sender?: InputMaybe<OrderBy>;
  sequence_number?: InputMaybe<OrderBy>;
  signature?: InputMaybe<SignaturesOrderBy>;
  timestamp?: InputMaybe<OrderBy>;
  version?: InputMaybe<OrderBy>;
};

/** select columns of table "user_transactions" */
export enum UserTransactionsSelectColumn {
  /** column name */
  BlockHeight = 'block_height',
  /** column name */
  EntryFunctionContractAddress = 'entry_function_contract_address',
  /** column name */
  EntryFunctionFunctionName = 'entry_function_function_name',
  /** column name */
  EntryFunctionIdStr = 'entry_function_id_str',
  /** column name */
  EntryFunctionModuleName = 'entry_function_module_name',
  /** column name */
  Epoch = 'epoch',
  /** column name */
  ExpirationTimestampSecs = 'expiration_timestamp_secs',
  /** column name */
  GasUnitPrice = 'gas_unit_price',
  /** column name */
  MaxGasAmount = 'max_gas_amount',
  /** column name */
  ParentSignatureType = 'parent_signature_type',
  /** column name */
  Sender = 'sender',
  /** column name */
  SequenceNumber = 'sequence_number',
  /** column name */
  Timestamp = 'timestamp',
  /** column name */
  Version = 'version'
}

/** Streaming cursor of the table "user_transactions" */
export type UserTransactionsStreamCursorInput = {
  /** Stream column input with initial value */
  initial_value: UserTransactionsStreamCursorValueInput;
  /** cursor ordering */
  ordering?: InputMaybe<CursorOrdering>;
};

/** Initial value of the column from where the streaming should start */
export type UserTransactionsStreamCursorValueInput = {
  block_height?: InputMaybe<Scalars['bigint']['input']>;
  entry_function_contract_address?: InputMaybe<Scalars['String']['input']>;
  entry_function_function_name?: InputMaybe<Scalars['String']['input']>;
  entry_function_id_str?: InputMaybe<Scalars['String']['input']>;
  entry_function_module_name?: InputMaybe<Scalars['String']['input']>;
  epoch?: InputMaybe<Scalars['bigint']['input']>;
  expiration_timestamp_secs?: InputMaybe<Scalars['timestamp']['input']>;
  gas_unit_price?: InputMaybe<Scalars['numeric']['input']>;
  max_gas_amount?: InputMaybe<Scalars['numeric']['input']>;
  parent_signature_type?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<Scalars['String']['input']>;
  sequence_number?: InputMaybe<Scalars['bigint']['input']>;
  timestamp?: InputMaybe<Scalars['timestamp']['input']>;
  version?: InputMaybe<Scalars['bigint']['input']>;
};
