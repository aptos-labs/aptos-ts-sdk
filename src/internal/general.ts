// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/general}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * general namespace and without having a dependency cycle error.
 * @group Implementation
 */

import { CedraConfig } from "../api/cedraConfig";
import { getCedraFullNode, postCedraIndexer } from "../client";
import { GetChainTopUserTransactionsResponse, GetProcessorStatusResponse, GraphqlQuery, LedgerInfo } from "../types";
import { GetChainTopUserTransactionsQuery, GetProcessorStatusQuery } from "../types/generated/operations";
import { GetChainTopUserTransactions, GetProcessorStatus } from "../types/generated/queries";
import { ProcessorType } from "../utils/const";

/**
 * Retrieves information about the current ledger.
 *
 * @param args - The arguments for retrieving ledger information.
 * @param args.cedraConfig - The configuration object for connecting to the Cedra network.
 * @group Implementation
 */
export async function getLedgerInfo(args: { cedraConfig: CedraConfig }): Promise<LedgerInfo> {
  const { cedraConfig } = args;
  const { data } = await getCedraFullNode<{}, LedgerInfo>({
    cedraConfig,
    originMethod: "getLedgerInfo",
    path: "",
  });
  return data;
}

/**
 * Retrieves the top user transactions for a specific blockchain chain.
 *
 * @param args - The arguments for the function.
 * @param args.cedraConfig - The configuration object for Cedra.
 * @param args.limit - The maximum number of transactions to retrieve.
 * @returns An array of user transactions.
 * @group Implementation
 */
export async function getChainTopUserTransactions(args: {
  cedraConfig: CedraConfig;
  limit: number;
}): Promise<GetChainTopUserTransactionsResponse> {
  const { cedraConfig, limit } = args;
  const graphqlQuery = {
    query: GetChainTopUserTransactions,
    variables: { limit },
  };

  const data = await queryIndexer<GetChainTopUserTransactionsQuery>({
    cedraConfig,
    query: graphqlQuery,
    originMethod: "getChainTopUserTransactions",
  });

  return data.user_transactions;
}

/**
 * Executes a GraphQL query against the Cedra indexer and retrieves the resulting data.
 *
 * @param args - The arguments for the query.
 * @param args.cedraConfig - The configuration settings for the Cedra client.
 * @param args.query - The GraphQL query to be executed.
 * @param args.originMethod - An optional string to specify the origin method for tracking purposes.
 * @returns The data returned from the query execution.
 * @group Implementation
 */
export async function queryIndexer<T extends {}>(args: {
  cedraConfig: CedraConfig;
  query: GraphqlQuery;
  originMethod?: string;
}): Promise<T> {
  const { cedraConfig, query, originMethod } = args;
  const { data } = await postCedraIndexer<GraphqlQuery, T>({
    cedraConfig,
    originMethod: originMethod ?? "queryIndexer",
    path: "",
    body: query,
    overrides: { WITH_CREDENTIALS: false },
  });
  return data;
}

/**
 * Retrieves the current statuses of processors.
 *
 * @param args - The arguments for the function.
 * @param args.cedraConfig - The configuration object for Cedra.
 * @returns The statuses of the processors.
 * @group Implementation
 */
export async function getProcessorStatuses(args: { cedraConfig: CedraConfig }): Promise<GetProcessorStatusResponse> {
  const { cedraConfig } = args;

  const graphqlQuery = {
    query: GetProcessorStatus,
  };

  const data = await queryIndexer<GetProcessorStatusQuery>({
    cedraConfig,
    query: graphqlQuery,
    originMethod: "getProcessorStatuses",
  });

  return data.processor_metadata_processor_status;
}

/**
 * Retrieves the last success version from the indexer.
 *
 * @param args - The arguments for the function.
 * @param args.cedraConfig - The configuration object for Cedra.
 * @returns The last success version as a BigInt.
 * @group Implementation
 */
export async function getIndexerLastSuccessVersion(args: { cedraConfig: CedraConfig }): Promise<bigint> {
  const response = await getProcessorStatuses({ cedraConfig: args.cedraConfig });
  return BigInt(response[0].last_success_version);
}

/**
 * Retrieves the status of a specified processor in the Cedra network.
 * This function allows you to check the current operational status of a processor, which can be useful for monitoring and troubleshooting.
 *
 * @param args - The arguments for the function.
 * @param args.cedraConfig - The configuration object for connecting to the Cedra network.
 * @param args.processorType - The type of processor whose status you want to retrieve.
 * @returns The status of the specified processor.
 * @group Implementation
 */
export async function getProcessorStatus(args: {
  cedraConfig: CedraConfig;
  processorType: ProcessorType;
}): Promise<GetProcessorStatusResponse[0]> {
  const { cedraConfig, processorType } = args;

  const whereCondition: { processor: { _eq: string } } = {
    processor: { _eq: processorType },
  };

  const graphqlQuery = {
    query: GetProcessorStatus,
    variables: {
      where_condition: whereCondition,
    },
  };

  const data = await queryIndexer<GetProcessorStatusQuery>({
    cedraConfig,
    query: graphqlQuery,
    originMethod: "getProcessorStatus",
  });

  return data.processor_metadata_processor_status[0];
}
