// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { get } from "../client/get.js";
import { post } from "../client/post.js";
import { MimeType } from "../client/types.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import type { Block, GasEstimation, LedgerInfo, ViewFunctionPayload } from "./types.js";

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

export async function getChainId(config: AptosConfig): Promise<number> {
  const info = await getLedgerInfo(config);
  return info.chain_id;
}

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
