// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { post } from "../client/post.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import type { TableItemRequest } from "./types.js";

/**
 * Retrieves a single item from a Move table by its key.
 * @typeParam T - The expected type of the table value.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param handle - The table handle (a hex-encoded address identifying the table).
 * @param data - The table item request specifying the key type, value type, and key to look up.
 * @param options - Optional parameters.
 * @param options.ledgerVersion - The ledger version to query at. Defaults to the latest version.
 * @returns The deserialized table value.
 */
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
    client: config.client,
  });
  return response.data;
}
