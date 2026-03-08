// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { aptosRequest } from "./aptos-request.js";
import type { AptosApiType, AptosResponse, ClientConfig, MimeType } from "./types.js";

/**
 * Options for a POST request to an Aptos API endpoint.
 * Passed to the {@link post} helper function.
 */
export interface PostRequestOptions {
  /** The base URL of the API endpoint. */
  url: string;
  /** The Aptos API service type (used for error context and routing). */
  apiType: AptosApiType;
  /** The path segment to append to the base URL. */
  path: string;
  /** The SDK method name that originated this request (for debugging headers). */
  originMethod: string;
  /** The request body. Serialized as JSON unless a binary `contentType` is provided. */
  body?: unknown;
  /** Optional query string parameters. Undefined values are omitted. */
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  /** MIME type for the request `content-type` header. Defaults to JSON. */
  contentType?: MimeType;
  /** Expected MIME type for the response (`accept` header). Defaults to JSON. */
  acceptType?: MimeType;
  /** Per-request client configuration overrides (auth, headers, etc.). */
  overrides?: ClientConfig;
}

/**
 * Performs a POST request to an Aptos API endpoint.
 *
 * @typeParam Res - The expected type of the parsed response body.
 * @param options - The request options including URL, path, body, and auth overrides.
 * @returns A promise that resolves to an {@link AptosResponse} with the parsed response body.
 * @throws {AptosApiError} If the response indicates an error.
 *
 * @example
 * ```typescript
 * const response = await post<PendingTransactionResponse>({
 *   url: "https://fullnode.mainnet.aptoslabs.com/v1",
 *   apiType: AptosApiType.FULLNODE,
 *   path: "transactions",
 *   originMethod: "submitTransaction",
 *   body: signedTxnBytes,
 *   contentType: MimeType.BCS_SIGNED_TRANSACTION,
 * });
 * ```
 */
export async function post<Res>(options: PostRequestOptions): Promise<AptosResponse<Res>> {
  const { url, apiType, path, originMethod, body, params, contentType, acceptType, overrides } = options;
  return aptosRequest<Res>(
    { url, method: "POST", path, originMethod, body, params, contentType, acceptType, overrides },
    apiType,
  );
}
