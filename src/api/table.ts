import { getTableItem, getTableItemsData, getTableItemsMetadata } from "../internal/table";
import {
  TableItemRequest,
  LedgerVersionArg,
  AnyNumber,
  PaginationArgs,
  WhereArg,
  OrderByArg,
  GetTableItemsDataResponse,
  GetTableItemsMetadataResponse,
} from "../types";
import { TableItemsBoolExp, TableMetadatasBoolExp } from "../types/generated/types";
import { ProcessorType } from "../utils";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `Table` Aptos related queries
 */
export class Table {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries for a table item for a table identified by the handle and the key for the item.
   * Key and value types need to be passed in to help with key serialization and value deserialization.
   *
   * Note, this query calls the fullnode server
   *
   * @example https://api.devnet.aptoslabs.com/v1/accounts/0x1/resource/0x1::coin::CoinInfo%3C0x1::aptos_coin::AptosCoin%3E
   * const tableItem = await aptos.getTableItem({
   *  handle: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca",
   *  data: {
   *   key_type: "address", // Move type of table key
   *   value_type: "u128", // Move type of table value
   *   key: "0x619dc29a0aac8fa146714058e8dd6d2d0f3bdf5f6331907bf91f3acd81e6935" // Value of table key
   *  },
   * })
   *
   * @param args.handle A pointer to where that table is stored
   * @param args.data Object that describes table item
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @returns Table item value rendered in JSON
   */
  async getTableItem<T>(args: { handle: string; data: TableItemRequest; options?: LedgerVersionArg }): Promise<T> {
    return getTableItem<T>({ aptosConfig: this.config, ...args });
  }

/**
 * Queries for table items data, allowing for optional filtering and pagination.
 * 
 * @param args - The arguments for querying table items data.
 * @param args.minimumLedgerVersion - Optional minimum ledger version to wait for before querying.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.where - Conditions to filter the response.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.orderBy - The order in which to return the items.
 * 
 * Note: This query calls the indexer server.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Querying for table items data with specific filters
 *   const data = await aptos.getTableItemsData({
 *     minimumLedgerVersion: 1, // replace with a real ledger version if needed
 *     options: {
 *       where: {
 *         table_handle: { _eq: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca" },
 *         transaction_version: { _eq: "0" }
 *       },
 *       limit: 10, // specify the maximum number of items to return
 *       offset: 0, // specify the number of items to skip
 *     },
 *   });
 * 
 *   console.log(data);
 * }
 * runExample().catch(console.error);
 * ```
 * 
 * @returns GetTableItemsDataResponse
 */


  async getTableItemsData(args: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & WhereArg<TableItemsBoolExp> & OrderByArg<GetTableItemsDataResponse[0]>;
  }): Promise<GetTableItemsDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.DEFAULT,
    });
    return getTableItemsData({ aptosConfig: this.config, ...args });
  }

/**
 * Queries for metadata of table items, allowing for filtering and pagination.
 * 
 * @param args - The arguments for querying table items metadata.
 * @param args.minimumLedgerVersion - Optional minimum ledger version to wait for before querying.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.where - Conditions to filter the response.
 * @param args.options.offset - The number of items to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of items to return.
 * @param args.options.orderBy - The order in which to return the items.
 * 
 * @returns GetTableItemsMetadataResponse - The metadata of the queried table items.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Querying for table items metadata with a specific filter
 *   const data = await aptos.getTableItemsMetadata({
 *     minimumLedgerVersion: 1, // replace with a real ledger version if needed
 *     options: {
 *       where: { handle: { _eq: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca" } },
 *       limit: 10,
 *       offset: 0,
 *     },
 *   });
 * 
 *   console.log(data);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getTableItemsMetadata(args: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & WhereArg<TableMetadatasBoolExp> & OrderByArg<GetTableItemsMetadataResponse[0]>;
  }): Promise<GetTableItemsMetadataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.DEFAULT,
    });
    return getTableItemsMetadata({ aptosConfig: this.config, ...args });
  }
}