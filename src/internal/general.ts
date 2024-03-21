// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/general}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * general namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { getAptosFullNode, postAptosFullNode, postAptosIndexer } from "../client";
import {
  AnyNumber,
  Block,
  GetChainTopUserTransactionsResponse,
  GetProcessorStatusResponse,
  GraphqlQuery,
  LedgerInfo,
  LedgerVersionArg,
  TableItemRequest,
} from "../types";
import { GetChainTopUserTransactionsQuery, GetProcessorStatusQuery } from "../types/generated/operations";
import { GetChainTopUserTransactions, GetProcessorStatus } from "../types/generated/queries";
import { ProcessorType } from "../utils/const";

export async function getLedgerInfo(args: { aptosConfig: AptosConfig }): Promise<LedgerInfo> {
  const { aptosConfig } = args;
  const { data } = await getAptosFullNode<{}, LedgerInfo>({
    aptosConfig,
    originMethod: "getLedgerInfo",
    path: "",
  });
  return data;
}

export async function getBlockByVersion(args: {
  aptosConfig: AptosConfig;
  ledgerVersion: AnyNumber;
  options?: { withTransactions?: boolean };
}): Promise<Block> {
  const { aptosConfig, ledgerVersion, options } = args;
  const { data } = await getAptosFullNode<{}, Block>({
    aptosConfig,
    originMethod: "getBlockByVersion",
    path: `blocks/by_version/${ledgerVersion}`,
    params: { with_transactions: options?.withTransactions },
  });
  return data;
}

export async function getBlockByHeight(args: {
  aptosConfig: AptosConfig;
  blockHeight: AnyNumber;
  options?: { withTransactions?: boolean };
}): Promise<Block> {
  const { aptosConfig, blockHeight, options } = args;
  const { data } = await getAptosFullNode<{}, Block>({
    aptosConfig,
    originMethod: "getBlockByHeight",
    path: `blocks/by_height/${blockHeight}`,
    params: { with_transactions: options?.withTransactions },
  });
  return data;
}

export async function getTableItem<T>(args: {
  aptosConfig: AptosConfig;
  handle: string;
  data: TableItemRequest;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, handle, data, options } = args;
  const response = await postAptosFullNode<TableItemRequest, any>({
    aptosConfig,
    originMethod: "getTableItem",
    path: `tables/${handle}/item`,
    params: { ledger_version: options?.ledgerVersion },
    body: data,
  });
  return response.data as T;
}

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

export async function getIndexerLastSuccessVersion(args: { aptosConfig: AptosConfig }): Promise<bigint> {
  const response = await getProcessorStatuses({ aptosConfig: args.aptosConfig });
  return BigInt(response[0].last_success_version);
}

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
