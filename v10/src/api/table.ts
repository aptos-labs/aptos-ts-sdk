// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { post } from "../client/post.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import type { TableItemRequest } from "./types.js";

export async function getTableItem<T = unknown>(
  config: AptosConfig,
  handle: string,
  data: TableItemRequest,
  options?: { ledgerVersion?: AnyNumber },
): Promise<T> {
  const url = config.getRequestUrl(AptosApiType.FULLNODE);
  const response = await post<T>({
    url,
    apiType: AptosApiType.FULLNODE,
    path: `tables/${handle}/item`,
    originMethod: "getTableItem",
    body: data,
    params: { ledger_version: options?.ledgerVersion },
    overrides: config.getMergedFullnodeConfig(),
  });
  return response.data;
}
