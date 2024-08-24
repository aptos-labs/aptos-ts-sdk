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

export async

/**
 * Retrieves information about the current ledger, including the chain ID.
 * 
 * @param args - The arguments for retrieving ledger information.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET }); // Specify your network
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the current ledger information
 *   const ledgerInfo = await aptos.getLedgerInfo({ aptosConfig: config });
 *   console.log(ledgerInfo); // Log the ledger information
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getLedgerInfo(args: { aptosConfig: AptosConfig }): Promise<LedgerInfo> {
  const { aptosConfig } = args;
  const { data } = await getAptosFullNode<{}, LedgerInfo>({
    aptosConfig,
    originMethod: "getLedgerInfo",
    path: "",
  });
  return data;
}

export async

/**
 * Retrieves the top user transactions on the Aptos blockchain based on the specified limit.
 * 
 * @param args - The parameters for the function.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.limit - The maximum number of user transactions to retrieve.
 * @returns An array of user transactions.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch the top user transactions with a limit of 5
 *   const transactions = await aptos.getChainTopUserTransactions({
 *     aptosConfig: config,
 *     limit: 5, // specify your desired limit
 *   });
 * 
 *   console.log(transactions);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getChainTopUserTransactions(args: {
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

export async

/**
 * Retrieves the current statuses of the processors in the Aptos network.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Getting processor statuses
 *   const processorStatuses = await aptos.getProcessorStatuses({ aptosConfig: config });
 * 
 *   console.log(processorStatuses);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getProcessorStatuses(args: { aptosConfig: AptosConfig }): Promise<GetProcessorStatusResponse> {
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

export async

/**
 * Retrieves the last successful version from the indexer.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos, which includes network details.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the last successful version from the indexer
 *   const lastSuccessVersion = await aptos.getIndexerLastSuccessVersion({ aptosConfig: config });
 *   console.log("Last Successful Version:", lastSuccessVersion.toString());
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getIndexerLastSuccessVersion(args: { aptosConfig: AptosConfig }): Promise<bigint> {
  const response = await getProcessorStatuses({ aptosConfig: args.aptosConfig });
  return BigInt(response[0].last_success_version);
}

export async

/**
 * Retrieves the status of a specified processor in the Aptos network.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.processorType - The type of processor whose status is being queried.
 * @returns The status of the specified processor.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the status of the specified processor
 *   const processorStatus = await aptos.getProcessorStatus({
 *     aptosConfig: config,
 *     processorType: "someProcessorType", // replace with a real processor type
 *   });
 * 
 *   console.log(processorStatus);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getProcessorStatus(args: {
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