// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";

// Re-export AptosApiType from core so client consumers don't need two imports
export { AptosApiType } from "../core/constants.js";

// ── MIME types ──

/**
 * MIME type constants used in Aptos HTTP request and response headers.
 * Passed as `contentType` and `acceptType` in request options to control
 * the encoding format of request bodies and expected response bodies.
 */
export enum MimeType {
  /** Standard JSON content type. Used for most REST API calls. */
  JSON = "application/json",
  /** BCS-encoded binary content type. Used for raw binary payloads. */
  BCS = "application/x-bcs",
  /** BCS-encoded signed transaction. Used when submitting signed transactions. */
  BCS_SIGNED_TRANSACTION = "application/x.aptos.signed_transaction+bcs",
  /** BCS-encoded view function payload. Used for BCS view function calls. */
  BCS_VIEW_FUNCTION = "application/x.aptos.view_function+bcs",
}

// ── Client config ──

/**
 * Configuration options that can be applied to any Aptos HTTP client request.
 * Can be passed at the `AptosConfig` level (as defaults) or overridden per-request.
 */
export interface ClientConfig {
  /** Additional HTTP headers to include with every request. */
  HEADERS?: Record<string, string | number | boolean>;
  /**
   * API key used for authentication. Sent as a `Bearer` token in the
   * `Authorization` header. Takes precedence over {@link AUTH_TOKEN} if both are set.
   */
  API_KEY?: string;
  /**
   * Authentication bearer token. Sent in the `Authorization` header.
   * Use {@link API_KEY} instead when connecting to a hosted Aptos API endpoint.
   */
  AUTH_TOKEN?: string;
}

/** Client configuration specific to full node REST API requests. */
export interface FullNodeConfig extends ClientConfig {}
/** Client configuration specific to indexer GraphQL API requests. */
export interface IndexerConfig extends ClientConfig {}
/** Client configuration specific to faucet API requests. */
export interface FaucetConfig extends ClientConfig {}

// ── Request / Response ──

/**
 * Parameters for a single HTTP request to an Aptos API endpoint.
 * Constructed internally by {@link get} and {@link post}; rarely used directly.
 */
export interface AptosRequest {
  /** The base URL of the API endpoint (e.g. `"https://fullnode.mainnet.aptoslabs.com/v1"`). */
  url: string;
  /** The HTTP method to use. */
  method: "GET" | "POST";
  /** Optional path segment appended to `url` with a `/` separator. */
  path?: string;
  /** Optional request body. Serialized to JSON unless a binary `contentType` is specified. */
  body?: unknown;
  /** MIME type for the request body. Defaults to {@link MimeType.JSON}. */
  contentType?: string;
  /** Expected MIME type for the response body. Defaults to {@link MimeType.JSON}. */
  acceptType?: string;
  /** Query string parameters. Values are URL-encoded and appended to the URL. */
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  /** The SDK method name that originated this request (for debugging via `x-aptos-typescript-sdk-origin-method` header). */
  originMethod?: string;
  /** Per-request overrides for {@link ClientConfig} options (headers, auth tokens, etc.). */
  overrides?: ClientConfig;
}

/**
 * The parsed response returned from an Aptos API request.
 * @typeParam Res - The expected type of the `data` field.
 */
export interface AptosResponse<Res> {
  /** The HTTP status code (e.g. 200, 400, 404). */
  status: number;
  /** The HTTP status text (e.g. `"OK"`, `"Not Found"`). */
  statusText: string;
  /** The deserialized response body. JSON responses are parsed; BCS responses are `Uint8Array`. */
  data: Res;
  /** The full URL that was requested (including query string). */
  url: string;
  /** The response headers returned by the server. */
  headers: Headers;
}

// ── Pagination ──

/**
 * Standard pagination parameters accepted by list/query endpoints.
 * Pass these in the `options` object of list API calls to page through results.
 *
 * @example
 * ```typescript
 * const txns = await aptos.getTransactions({ offset: 100, limit: 25 });
 * ```
 */
export interface PaginationArgs {
  /** The zero-based index of the first item to return. */
  offset?: number;
  /** The maximum number of items to return. */
  limit?: number;
}
