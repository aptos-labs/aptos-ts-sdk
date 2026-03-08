// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { aptosRequest } from "./aptos-request.js";
import type { AptosApiType, AptosResponse, ClientConfig, MimeType } from "./types.js";

/**
 * Options for a GET request to an Aptos API endpoint.
 * Passed to {@link get}, {@link paginateWithCursor}, and {@link paginateWithObfuscatedCursor}.
 */
export interface GetRequestOptions {
  /** The base URL of the API endpoint. */
  url: string;
  /** The Aptos API service type (used for error context and routing). */
  apiType: AptosApiType;
  /** The path segment to append to the base URL. */
  path: string;
  /** The SDK method name that originated this request (for debugging headers). */
  originMethod: string;
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
 * Performs a GET request to an Aptos API endpoint.
 *
 * @typeParam Res - The expected type of the parsed response body.
 * @param options - The request options including URL, path, params, and auth overrides.
 * @returns A promise that resolves to an {@link AptosResponse} with the parsed response body.
 * @throws {AptosApiError} If the response indicates an error.
 *
 * @example
 * ```typescript
 * const response = await get<AccountData>({
 *   url: "https://fullnode.mainnet.aptoslabs.com/v1",
 *   apiType: AptosApiType.FULLNODE,
 *   path: "accounts/0x1",
 *   originMethod: "getAccountInfo",
 * });
 * ```
 */
export async function get<Res>(options: GetRequestOptions): Promise<AptosResponse<Res>> {
  const { url, apiType, path, originMethod, params, contentType, acceptType, overrides } = options;
  return aptosRequest<Res>(
    { url, method: "GET", path, originMethod, params, contentType, acceptType, overrides },
    apiType,
  );
}

/**
 * Performs a paginated GET request using the `x-aptos-cursor` response header.
 * Fetches all pages automatically by following cursors until no more pages remain,
 * then returns the concatenated results.
 *
 * Use this for endpoints that paginate via an opaque cursor returned in the
 * `x-aptos-cursor` header (e.g. full node REST API list endpoints).
 *
 * @typeParam Res - An array type extending `Array<Record<string, unknown>>`.
 * @param options - The request options. `params.limit` controls the page size; it is
 *   passed to the server on every request. `params.start` is managed internally.
 * @returns A promise that resolves to the full concatenated result set.
 * @throws {AptosApiError} If any individual page request fails.
 *
 * @example
 * ```typescript
 * const allTxns = await paginateWithCursor<TransactionResponse[]>({
 *   url: "https://fullnode.mainnet.aptoslabs.com/v1",
 *   apiType: AptosApiType.FULLNODE,
 *   path: "transactions",
 *   originMethod: "getTransactions",
 *   params: { limit: 25 },
 * });
 * ```
 */
export async function paginateWithCursor<Res extends Array<Record<string, unknown>>>(
  options: GetRequestOptions,
): Promise<Res> {
  let out: Res = [] as unknown as Res;
  let cursor: string | undefined;
  const requestParams = (options.params ?? {}) as Record<string, string | AnyNumber | boolean | undefined>;
  do {
    const response = await get<Res>({ ...options, params: requestParams });
    cursor = response.headers.get("x-aptos-cursor") ?? undefined;
    out = out.concat(response.data) as Res;
    (requestParams as Record<string, string | undefined>).start = cursor;
  } while (cursor !== undefined);
  return out;
}

/**
 * Performs a paginated GET request using an obfuscated (opaque) cursor.
 * Similar to {@link paginateWithCursor} but tracks the cursor in `params.cursor`
 * instead of `params.start`, and respects a total `limit` cap across all pages.
 *
 * Use this for endpoints where the caller controls a soft total limit and the
 * server returns pages smaller than the requested total.
 *
 * @typeParam Res - An array type extending `Array<Record<string, unknown>>`.
 * @param options - The request options. `params.limit` sets the maximum total items
 *   to return (not just per-page). `params.cursor` is managed internally.
 * @returns A promise that resolves to the full concatenated result set, up to the
 *   total limit if one was specified.
 * @throws {AptosApiError} If any individual page request fails.
 */
export async function paginateWithObfuscatedCursor<Res extends Array<Record<string, unknown>>>(
  options: GetRequestOptions,
): Promise<Res> {
  let out: Res = [] as unknown as Res;
  let cursor: string | undefined;
  const requestParams = (options.params ?? {}) as Record<string, string | AnyNumber | boolean | undefined>;
  const totalLimit = requestParams.limit as number | undefined;
  do {
    // Only pass start + limit to the server
    const serverParams: Record<string, string | AnyNumber | boolean | undefined> = {};
    if (typeof requestParams.cursor === "string") {
      serverParams.start = requestParams.cursor;
    }
    if (requestParams.limit !== undefined) {
      serverParams.limit = requestParams.limit;
    }

    const response = await get<Res>({ ...options, params: serverParams });
    cursor = response.headers.get("x-aptos-cursor") ?? undefined;
    out = out.concat(response.data) as Res;
    (requestParams as Record<string, string | undefined>).cursor = cursor;

    if (totalLimit !== undefined) {
      const remaining = totalLimit - out.length;
      if (remaining <= 0) break;
      requestParams.limit = remaining;
    }
  } while (cursor !== undefined);
  return out;
}
