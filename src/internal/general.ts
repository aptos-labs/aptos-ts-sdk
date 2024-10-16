// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/general}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * general namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { getAptosFullNode, postAptosIndexer } from "../client";
import { GetChainTopUserTransactionsResponse, GetProcessorStatusResponse, GraphqlQuery, LedgerInfo } from "../types";
import { GetChainTopUserTransactionsQuery, GetProcessorStatusQuery } from "../types/generated/operations";
import { GetChainTopUserTransactions, GetProcessorStatus } from "../types/generated/queries";
import { ProcessorType } from "../utils/const";

/**
 * Retrieves information about the current ledger.
 *
 * @param args - The arguments for retrieving ledger information.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 */
export async function getLedgerInfo(args: { aptosConfig: AptosConfig }): Promise<LedgerInfo> {
  const { aptosConfig } = args;
  const { data } = await getAptosFullNode<{}, LedgerInfo>({
    aptosConfig,
    originMethod: "getLedgerInfo",
    path: "",
  });
  return data;
}

/**
 * Retrieves the top user transactions for a specific blockchain chain.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.limit - The maximum number of transactions to retrieve.
 * @returns An array of user transactions.
 */
export async function getChainTopUserTransactions(args: {
  aptosConfig: AptosConfig;
  limit: number;
}): Promise<GetChainTopUserTransactionsResponse> {
  const { aptosConfig, limit } = args;
  const graphqlQuery = {
    query: GetChainTopUserTransactions,
    variables: { limit },
  };

  const data = await queryIndexer<GetChainTopUserTransactionsQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getChainTopUserTransactions",
  });

  return data.user_transactions;
}

/**
 * Executes a GraphQL query against the Aptos indexer and retrieves the resulting data.
 *
 * @param args - The arguments for the query.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.query - The GraphQL query to be executed.
 * @param args.originMethod - An optional string to specify the origin method for tracking purposes.
 * @returns The data returned from the query execution.
 */
export async function queryIndexer<T extends {}>(args: {
  aptosConfig: AptosConfig;
  query: GraphqlQuery;
  originMethod?: string;
}): Promise<T> {
  const { aptosConfig, query, originMethod } = args;
  const { data } = await postAptosIndexer<GraphqlQuery, T>({
    aptosConfig,
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
 * @param args.aptosConfig - The configuration object for Aptos.
 * @returns The statuses of the processors.
 */
export async function getProcessorStatuses(args: { aptosConfig: AptosConfig }): Promise<GetProcessorStatusResponse> {
  const { aptosConfig } = args;

  const graphqlQuery = {
    query: GetProcessorStatus,
  };

  const data = await queryIndexer<GetProcessorStatusQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getProcessorStatuses",
  });

  return data.processor_status;
}

/**
 * Retrieves the last success version from the indexer.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @returns The last success version as a BigInt.
 */
export async function getIndexerLastSuccessVersion(args: { aptosConfig: AptosConfig }): Promise<bigint> {
  const response = await getProcessorStatuses({ aptosConfig: args.aptosConfig });
  return BigInt(response[0].last_success_version);
}

/**
 * Retrieves the status of a specified processor in the Aptos network.
 * This function allows you to check the current operational status of a processor, which can be useful for monitoring and troubleshooting.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.processorType - The type of processor whose status you want to retrieve.
 * @returns The status of the specified processor.
 */
export async function getProcessorStatus(args: {
  aptosConfig: AptosConfig;
  processorType: ProcessorType;
}): Promise<GetProcessorStatusResponse[0]> {
  const { aptosConfig, processorType } = args;

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
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getProcessorStatus",
  });

  return data.processor_status[0];
}
