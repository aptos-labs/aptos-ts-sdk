import { AptosConfig } from "../api/aptosConfig";
import { postAptosFullNode } from "../client";
import {
  TableItemRequest,
  LedgerVersionArg,
  PaginationArgs,
  WhereArg,
  OrderByArg,
  GetTableItemsDataResponse,
  GetTableItemsMetadataResponse,
} from "../types";
import { GetTableItemsDataQuery, GetTableItemsMetadataQuery } from "../types/generated/operations";
import { GetTableItemsData, GetTableItemsMetadata } from "../types/generated/queries";
import { TableItemsBoolExp, TableMetadatasBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

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

export async

/**
 * Retrieves table items based on specified conditions and pagination options.
 * 
 * @param args - The arguments for retrieving table items.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.where - Conditions to filter the table items.
 * @param args.options.offset - The starting point for pagination.
 * @param args.options.limit - The maximum number of items to retrieve.
 * @param args.options.orderBy - The order in which to return the items.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const items = await aptos.getTableItemsData({
 *     aptosConfig: config,
 *     options: {
 *       where: { /* specify your conditions here */ },
 *       offset: 0, // starting from the first item
 *       limit: 10, // retrieving a maximum of 10 items
 *       orderBy: { /* specify your order here */ },
 *     },
 *   });
 * 
 *   console.log(items); // Output the retrieved table items
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTableItemsData(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & WhereArg<TableItemsBoolExp> & OrderByArg<GetTableItemsDataResponse[0]>;
}) {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetTableItemsData,
    variables: {
      where_condition: options?.where,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetTableItemsDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getTableItemsData",
  });

  return data.table_items;
}

export async

/**
 * Retrieves metadata for table items based on specified options.
 * This function allows you to query for specific metadata attributes of table items, enabling better data management and analysis.
 * 
 * @param args - The arguments for retrieving table items metadata.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.options - Optional parameters for pagination, filtering, and ordering the results.
 * @param args.options.where - Conditions to filter the table metadata.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.orderBy - Specifies the order in which to return the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve table items metadata with optional filtering and pagination
 *   const metadata = await aptos.getTableItemsMetadata({
 *     aptosConfig: config,
 *     options: {
 *       where: { table_name: { _eq: "my_table" } }, // replace with your own condition
 *       offset: 0,
 *       limit: 10,
 *       orderBy: { created_at: "desc" }, // replace with your own order criteria
 *     },
 *   });
 * 
 *   console.log(metadata);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTableItemsMetadata(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & WhereArg<TableMetadatasBoolExp> & OrderByArg<GetTableItemsMetadataResponse[0]>;
}): Promise<GetTableItemsMetadataResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetTableItemsMetadata,
    variables: {
      where_condition: options?.where,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetTableItemsMetadataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getTableItemsMetadata",
  });

  return data.table_metadatas;
}