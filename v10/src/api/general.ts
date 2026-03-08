// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { get } from "../client/get.js";
import { post } from "../client/post.js";
import { MimeType } from "../client/types.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import type { Block, GasEstimation, LedgerInfo, ViewFunctionPayload } from "./types.js";

/**
 * Retrieves the current ledger information from the fullnode, including chain ID, epoch, and latest version.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @returns The current ledger information.
 */
export async function getLedgerInfo(config: AptosConfig): Promise<LedgerInfo> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<LedgerInfo>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: "",
    originMethod: "getLedgerInfo",
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves the chain ID of the connected Aptos network.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @returns The chain ID as a number (e.g. 1 for mainnet, 2 for testnet).
 */
export async function getChainId(config: AptosConfig): Promise<number> {
  const info = await getLedgerInfo(config);
  return info.chain_id;
}

/**
 * Retrieves a block by its ledger version number.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param ledgerVersion - The ledger version contained within the target block.
 * @param options - Optional parameters.
 * @param options.withTransactions - If `true`, includes the transactions within the block.
 * @returns The block containing the specified ledger version.
 */
export async function getBlockByVersion(
  config: AptosConfig,
  ledgerVersion: AnyNumber,
  options?: { withTransactions?: boolean },
): Promise<Block> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<Block>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `blocks/by_version/${ledgerVersion}`,
    originMethod: "getBlockByVersion",
    params: { with_transactions: options?.withTransactions },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves a block by its height.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param blockHeight - The height of the block to retrieve.
 * @param options - Optional parameters.
 * @param options.withTransactions - If `true`, includes the transactions within the block.
 * @returns The block at the specified height.
 */
export async function getBlockByHeight(
  config: AptosConfig,
  blockHeight: AnyNumber,
  options?: { withTransactions?: boolean },
): Promise<Block> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<Block>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `blocks/by_height/${blockHeight}`,
    originMethod: "getBlockByHeight",
    params: { with_transactions: options?.withTransactions },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Executes a Move view function on-chain and returns its result without submitting a transaction.
 * View functions are read-only and do not modify blockchain state.
 *
 * @typeParam T - The expected return type tuple of the view function.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param payload - The view function payload containing the function name, type arguments, and arguments.
 * @param options - Optional parameters.
 * @param options.ledgerVersion - The ledger version to execute the view function against. Defaults to the latest version.
 * @returns The return values of the view function.
 *
 * @example
 * ```typescript
 * const [balance] = await view<[string]>(config, {
 *   function: "0x1::coin::balance",
 *   type_arguments: ["0x1::aptos_coin::AptosCoin"],
 *   arguments: ["0x1"],
 * });
 * ```
 */
export async function view<T extends unknown[]>(
  config: AptosConfig,
  payload: ViewFunctionPayload,
  options?: { ledgerVersion?: AnyNumber },
): Promise<T> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await post<T>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: "view",
    originMethod: "view",
    body: payload,
    params: { ledger_version: options?.ledgerVersion },
    contentType: MimeType.JSON,
    acceptType: MimeType.JSON,
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}

/**
 * Retrieves the current gas price estimation from the fullnode.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @returns The gas price estimation including deprioritized, normal, and prioritized estimates.
 */
export async function getGasPriceEstimation(config: AptosConfig): Promise<GasEstimation> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await get<GasEstimation>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: "estimate_gas_price",
    originMethod: "getGasPriceEstimation",
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}
