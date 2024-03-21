// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  getBlockByHeight,
  getBlockByVersion,
  getChainTopUserTransactions,
  getIndexerLastSuccessVersion,
  getLedgerInfo,
  getProcessorStatus,
  getTableItem,
  queryIndexer,
} from "../internal/general";
import { view } from "../internal/view";
import {
  AnyNumber,
  Block,
  GetChainTopUserTransactionsResponse,
  GetProcessorStatusResponse,
  GraphqlQuery,
  LedgerInfo,
  LedgerVersionArg,
  MoveValue,
  TableItemRequest,
} from "../types";
import { ProcessorType } from "../utils/const";
import { InputViewFunctionData } from "../transactions";

/**
 * A class to query all `General` Aptos related queries
 */
export class General {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries for the Aptos ledger info
   *
   * @returns Aptos Ledger Info
   *
   * @example An example of the returned data
   * ```
   * {
   * "chain_id": 4,
   * "epoch": "8",
   * "ledger_version": "714",
   * "oldest_ledger_version": "0",
   * "ledger_timestamp": "1694695496521775",
   * "node_role": "validator",
   * "oldest_block_height": "0",
   * "block_height": "359",
   * "git_hash": "c82193f36f4e185fed9f68c4ad21f6c6dd390c6e"
   * }
   * ```
   */
  async getLedgerInfo(): Promise<LedgerInfo> {
    return getLedgerInfo({ aptosConfig: this.config });
  }

  /**
   * Queries for the chain id
   *
   * @returns The chain id
   */
  async getChainId(): Promise<number> {
    const result = await this.getLedgerInfo();
    return result.chain_id;
  }

  /**
   * Queries for block by transaction version
   *
   * @param args.ledgerVersion Ledger version to lookup block information for
   * @param args.options.withTransactions If set to true, include all transactions in the block
   *
   * @returns Block information with optional transactions
   */
  async getBlockByVersion(args: {
    ledgerVersion: AnyNumber;
    options?: { withTransactions?: boolean };
  }): Promise<Block> {
    return getBlockByVersion({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Get block by block height
   *
   * @param args.blockHeight Block height to lookup.  Starts at 0
   * @param args.options.withTransactions If set to true, include all transactions in the block
   *
   * @returns Block with optional transactions
   */
  async getBlockByHeight(args: { blockHeight: AnyNumber; options?: { withTransactions?: boolean } }): Promise<Block> {
    return getBlockByHeight({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for a table item for a table identified by the handle and the key for the item.
   * Key and value types need to be passed in to help with key serialization and value deserialization.
   * @param args.handle A pointer to where that table is stored
   * @param args.data Object that describes table item
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @example https://api.devnet.aptoslabs.com/v1/accounts/0x1/resource/0x1::coin::CoinInfo%3C0x1::aptos_coin::AptosCoin%3E
   * {
   *  data.key_type = "address" // Move type of table key
   *  data.value_type = "u128" // Move type of table value
   *  data.key = "0x619dc29a0aac8fa146714058e8dd6d2d0f3bdf5f6331907bf91f3acd81e6935" // Value of table key
   * }
   *
   * @returns Table item value rendered in JSON
   */
  async getTableItem<T>(args: { handle: string; data: TableItemRequest; options?: LedgerVersionArg }): Promise<T> {
    return getTableItem<T>({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for a Move view function
   * @param args.payload Payload for the view function
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   * @example
   * `
   * const payload: ViewRequest = {
   *  function: "0x1::coin::balance",
   *  typeArguments: ["0x1::aptos_coin::AptosCoin"],
   *  functionArguments: [accountAddress],
   * };
   * `
   *
   * @returns an array of Move values
   */
  async view<T extends Array<MoveValue>>(args: {
    payload: InputViewFunctionData;
    options?: LedgerVersionArg;
  }): Promise<T> {
    return view<T>({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries top user transactions
   *
   * @param args.limit The number of transactions to return
   * @returns GetChainTopUserTransactionsResponse
   */
  async getChainTopUserTransactions(args: { limit: number }): Promise<GetChainTopUserTransactionsResponse> {
    return getChainTopUserTransactions({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * A generic function for retrieving data from Aptos Indexer.
   * For more detailed queries specification see
   * {@link https://cloud.hasura.io/public/graphiql?endpoint=https://api.mainnet.aptoslabs.com/v1/graphql}
   *
   * @param args.query.query A GraphQL query
   * @param args.query.variables The variables for the query
   * @example
   * ```
   * {
   *  query: `query MyQuery {
        ledger_infos {
          chain_id
        }
      }`;
   * }
   * ```
   *
   * @return The provided T type
   */
  async queryIndexer<T extends {}>(args: { query: GraphqlQuery }): Promise<T> {
    return queryIndexer<T>({
      aptosConfig: this.config,
      ...args,
    });
  }

  /**
   * Queries for the last successful indexer version
   *
   * This is useful to tell what ledger version the indexer is updated to, as it can be behind the full nodes.
   */
  async getIndexerLastSuccessVersion(): Promise<bigint> {
    return getIndexerLastSuccessVersion({ aptosConfig: this.config });
  }

  /**
   * Query the processor status for a specific processor type.
   *
   * @param processorType The processor type to query
   * @returns
   */
  async getProcessorStatus(processorType: ProcessorType): Promise<GetProcessorStatusResponse[0]> {
    return getProcessorStatus({ aptosConfig: this.config, processorType });
  }
}
