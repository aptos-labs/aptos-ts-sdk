import { CedraConfig } from "../api/cedraConfig";
import { postCedraFullNode } from "../client";
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

/**
 * Retrieves a specific item from a table in the Cedra blockchain.
 *
 * @param args - The arguments for retrieving the table item.
 * @param args.cedraConfig - The configuration for connecting to the Cedra blockchain.
 * @param args.handle - The identifier for the table from which to retrieve the item.
 * @param args.data - The request data for the table item.
 * @param args.options - Optional parameters for the request, including ledger version.
 * @group Implementation
 */
export async function getTableItem<T>(args: {
  cedraConfig: CedraConfig;
  handle: string;
  data: TableItemRequest;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { cedraConfig, handle, data, options } = args;
  const response = await postCedraFullNode<TableItemRequest, any>({
    cedraConfig,
    originMethod: "getTableItem",
    path: `tables/${handle}/item`,
    params: { ledger_version: options?.ledgerVersion },
    body: data,
  });
  return response.data as T;
}

/**
 * Retrieves table items data based on specified conditions and pagination options.
 *
 * @param args - The arguments for retrieving table items data.
 * @param args.cedraConfig - The configuration object for Cedra.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.where - Conditions to filter the table items.
 * @param args.options.orderBy - The criteria to sort the results.
 * @group Implementation
 */
export async function getTableItemsData(args: {
  cedraConfig: CedraConfig;
  options?: PaginationArgs & WhereArg<TableItemsBoolExp> & OrderByArg<GetTableItemsDataResponse[0]>;
}) {
  const { cedraConfig, options } = args;

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
    cedraConfig,
    query: graphqlQuery,
    originMethod: "getTableItemsData",
  });

  return data.table_items;
}

/**
 * Retrieves metadata for table items based on specified options.
 *
 * @param args - The arguments for retrieving table items metadata.
 * @param args.cedraConfig - The configuration object for Cedra.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.where - Conditions to filter the results.
 * @param args.options.orderBy - The order in which to return the results.
 * @returns A promise that resolves to an array of table metadata.
 * @group Implementation
 */
export async function getTableItemsMetadata(args: {
  cedraConfig: CedraConfig;
  options?: PaginationArgs & WhereArg<TableMetadatasBoolExp> & OrderByArg<GetTableItemsMetadataResponse[0]>;
}): Promise<GetTableItemsMetadataResponse> {
  const { cedraConfig, options } = args;

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
    cedraConfig,
    query: graphqlQuery,
    originMethod: "getTableItemsMetadata",
  });

  return data.table_metadatas;
}
