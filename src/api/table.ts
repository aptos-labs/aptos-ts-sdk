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
import { CedraConfig } from "./cedraConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `Table` Cedra related queries.
 * @group Table
 */
export class Table {
  readonly config: CedraConfig;

  /**
   * Initializes a new instance of the Cedra client with the specified configuration.
   * This allows you to interact with the Cedra blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Cedra client.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Cedra client with testnet configuration
   *     const config = new CedraConfig({ network: Network.TESTNET });
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Table
   */
  constructor(config: CedraConfig) {
    this.config = config;
  }

  /**
   * Queries for a specific item in a table identified by the handle and the key for the item.
   * This function allows you to retrieve structured data from a table in the Cedra blockchain.
   *
   * @param args.handle A pointer to where that table is stored.
   * @param args.data Object that describes the table item, including key and value types.
   * @param args.data.key_type The Move type of the table key.
   * @param args.data.value_type The Move type of the table value.
   * @param args.data.key The value of the table key.
   * @param args.options.ledgerVersion The ledger version to query; if not provided, it will get the latest version.
   *
   * @returns Table item value rendered in JSON.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve a table item from the Cedra blockchain
   *   const tableItem = await cedra.getTableItem({
   *     handle: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca",
   *     data: {
   *       key_type: "address", // Move type of table key
   *       value_type: "u128", // Move type of table value
   *       key: "0x619dc29a0aac8fa146714058e8dd6d2d0f3bdf5f6331907bf91f3acd81e6935" // Value of table key
   *     },
   *   });
   *
   *   console.log(tableItem);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Table
   */
  async getTableItem<T>(args: { handle: string; data: TableItemRequest; options?: LedgerVersionArg }): Promise<T> {
    return getTableItem<T>({ cedraConfig: this.config, ...args });
  }

  /**
   * Queries for table items data with optional filtering and pagination.
   * This function allows you to retrieve specific data from a table based on provided criteria.
   *
   * @param args - The arguments for querying table items data.
   * @param args.minimumLedgerVersion - Optional minimum ledger version to wait for before querying.
   * @param args.options - Optional parameters for pagination and filtering.
   * @param args.options.where - Conditions to filter the response.
   * @param args.options.offset - The number of items to skip before starting to collect the result set.
   * @param args.options.limit - The maximum number of items to return.
   * @param args.options.orderBy - The criteria to order the results.
   *
   * Note: This query calls the indexer server.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve table items data with specific filtering options
   *   const data = await cedra.getTableItemsData({
   *     minimumLedgerVersion: 1, // specify your own minimum ledger version if needed
   *     options: {
   *       where: {
   *         table_handle: { _eq: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca" },
   *         transaction_version: { _eq: "0" }
   *       },
   *       limit: 10, // specify your own limit if needed
   *     },
   *   });
   *
   *   console.log(data);
   * }
   * runExample().catch(console.error);
   * ```
   *
   * @returns GetTableItemsDataResponse
   * @group Table
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
    return getTableItemsData({ cedraConfig: this.config, ...args });
  }

  /**
   * Queries for the metadata of table items, allowing for filtering and pagination.
   *
   * @param args - The parameters for the query.
   * @param args.minimumLedgerVersion - Optional minimum ledger version to wait for before querying.
   * @param args.options - Optional parameters for pagination and filtering.
   * @param args.options.where - Conditions to filter the response.
   * @param args.options.offset - The offset for pagination.
   * @param args.options.limit - The maximum number of items to return.
   * @param args.options.orderBy - The order in which to return the items.
   *
   * Note that this query calls the indexer server.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching table items metadata with a filter condition
   *   const data = await cedra.getTableItemsMetadata({
   *     minimumLedgerVersion: 1, // specify your own minimum ledger version if needed
   *     options: {
   *       where: { handle: { _eq: "0x1b854694ae746cdbd8d44186ca4929b2b337df21d1c74633be19b2710552fdca" } },
   *       limit: 10, // specify your own limit if needed
   *     },
   *   });
   *
   *   console.log(data);
   * }
   * runExample().catch(console.error);
   * ```
   *
   * @returns GetTableItemsMetadataResponse
   * @group Table
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
    return getTableItemsMetadata({ cedraConfig: this.config, ...args });
  }
}
