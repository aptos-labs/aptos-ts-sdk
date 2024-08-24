// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  getChainTopUserTransactions,
  getIndexerLastSuccessVersion,
  getLedgerInfo,
  getProcessorStatus,
  queryIndexer,
} from "../internal/general";
import { getBlockByHeight, getBlockByVersion } from "../internal/transaction";
import { view, viewJson } from "../internal/view";
import {
  AnyNumber,
  Block,
  GetChainTopUserTransactionsResponse,
  GetProcessorStatusResponse,
  GraphqlQuery,
  LedgerInfo,
  LedgerVersionArg,
  MoveValue,
} from "../types";
import { ProcessorType } from "../utils/const";
import { InputViewFunctionData, InputViewFunctionJsonData } from "../transactions";

/**
 * A class to query all `General` Aptos related queries
 */
export class General {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

/**
 * Queries for the Aptos ledger information, providing details such as the chain ID, epoch, and ledger version.
 *
 * @returns The Aptos Ledger Info.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET }); // Specify your network
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the ledger information
 *   const ledgerInfo = await aptos.getLedgerInfo();
 *   console.log(ledgerInfo); // Display the fetched ledger information
 * }
 * runExample().catch(console.error);
 */


  async getLedgerInfo(): Promise<LedgerInfo> {
    return getLedgerInfo({ aptosConfig: this.config });
  }

/**
 * Retrieves the chain ID of the current blockchain network.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Fetch the chain ID
 *   const chainId = await aptos.getChainId();
 *   console.log("Chain ID:", chainId);
 * }
 * runExample().catch(console.error);
 *
 * @returns The chain ID as a string.
 */


  async getChainId(): Promise<number> {
    const result = await this.getLedgerInfo();
    return result.chain_id;
  }

/**
 * Retrieves block information by its ledger version.
 * 
 * @param args - The arguments for retrieving the block.
 * @param args.ledgerVersion - The ledger version to lookup block information for.
 * @param args.options - Optional parameters for the request.
 * @param args.options.withTransactions - If set to true, include all transactions in the block.
 * 
 * @returns Block information with optional transactions.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve block information for ledger version 5
 *   const block = await aptos.getBlockByVersion({ ledgerVersion: 5, options: { withTransactions: true } });
 *   console.log(block);
 * }
 * runExample().catch(console.error);
 * ```
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
 * Retrieve a block by its height from the blockchain.
 * 
 * @param args - The parameters for retrieving the block.
 * @param args.blockHeight - The block height to look up, starting at 0.
 * @param args.options - Optional parameters for the request.
 * @param args.options.withTransactions - If set to true, include all transactions in the block.
 * 
 * @returns The block with optional transactions included.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the block at height 5, including transactions
 *   const block = await aptos.getBlockByHeight({ blockHeight: 5, options: { withTransactions: true } });
 *   console.log(block);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getBlockByHeight(args: { blockHeight: AnyNumber; options?: { withTransactions?: boolean } }): Promise<Block> {
    return getBlockByHeight({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries for a Move view function
   * @param args.payload Payload for the view function
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @example
   * const data = await aptos.view({
   *  payload: {
   *   function: "0x1::coin::balance",
   *   typeArguments: ["0x1::aptos_coin::AptosCoin"],
   *   functionArguments: [accountAddress],
   *  }
   * })
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
   * Queries for a Move view function with JSON, this provides compatability with the old `aptos` package
   * @param args.payload Payload for the view function
   * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
   *
   * @example
   * const data = await aptos.view({
   *  payload: {
   *   function: "0x1::coin::balance",
   *   typeArguments: ["0x1::aptos_coin::AptosCoin"],
   *   functionArguments: [accountAddress.toString()],
   *  }
   * })
   *
   * @returns an array of Move values
   */
  async viewJson<T extends Array<MoveValue>>(args: {
    payload: InputViewFunctionJsonData;
    options?: LedgerVersionArg;
  }): Promise<T> {
    return viewJson<T>({ aptosConfig: this.config, ...args });
  }

/**
 * Queries the top user transactions based on the specified limit.
 * 
 * @param args - The arguments for the query.
 * @param args.limit - The number of transactions to return.
 * @returns GetChainTopUserTransactionsResponse
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch the top 5 user transactions
 *   const topUserTransactions = await aptos.getChainTopUserTransactions({ limit: 5 });
 *   console.log(topUserTransactions);
 * }
 * runExample().catch(console.error);
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
   * @example
   * const topUserTransactions = await aptos.queryIndexer({
   *  query: `query MyQuery {
   *   ledger_infos {
   *     chain_id
   *   }}`;
   * })
   *
   * @param args.query.query A GraphQL query
   * @param args.query.variables The variables for the query
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
 * Queries for the last successful indexer version to determine the ledger version the indexer is updated to, as it can be behind the full nodes.
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Get the last successful indexer version
 *   const version = await aptos.getIndexerLastSuccessVersion();
 *   console.log(`Last successful indexer version: ${version}`);
 * }
 * runExample().catch(console.error);
 */


  async getIndexerLastSuccessVersion(): Promise<bigint> {
    return getIndexerLastSuccessVersion({ aptosConfig: this.config });
  }

/**
 * Query the processor status for a specific processor type.
 * 
 * @param processorType The processor type to query.
 * @returns The status of the specified processor type.
 * 
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the processor status for the account transactions processor
 *   const status = await aptos.getProcessorStatus("account_transactions_processor");
 *   console.log(status);
 * }
 * runExample().catch(console.error);
 */


  async getProcessorStatus(processorType: ProcessorType): Promise<GetProcessorStatusResponse[0]> {
    return getProcessorStatus({ aptosConfig: this.config, processorType });
  }
}