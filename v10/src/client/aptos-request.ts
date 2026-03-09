// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bcsRequest, jsonRequest } from "@aptos-labs/aptos-client";
import { AptosApiError } from "../core/errors.js";
import { VERSION } from "../version.js";
import type { AptosRequest, AptosResponse, Client, ClientConfig, ClientRequest } from "./types.js";
import { AptosApiType, MimeType } from "./types.js";

/** RFC 7230 token characters for header field names. */
const SAFE_HEADER_KEY = /^[!#$%&'*+\-.^_`|~0-9a-zA-Z]+$/;

function validateHeaderValue(key: string, value: string): void {
  if (/[\r\n\0]/.test(value)) {
    throw new Error(`Header value for '${key}' contains illegal characters (CR, LF, or NUL)`);
  }
}

function mergeHeaders(
  overrides: ClientConfig | undefined,
  contentType: string,
  acceptType: string,
  originMethod?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": contentType,
    accept: acceptType,
    "x-aptos-client": `aptos-typescript-sdk/${VERSION}`,
  };
  if (originMethod) {
    headers["x-aptos-typescript-sdk-origin-method"] = originMethod;
  }
  if (overrides?.HEADERS) {
    for (const [key, value] of Object.entries(overrides.HEADERS)) {
      if (!SAFE_HEADER_KEY.test(key)) {
        throw new Error(`Invalid header key: '${key}'`);
      }
      const strValue = String(value);
      validateHeaderValue(key, strValue);
      headers[key] = strValue;
    }
  }
  if (overrides?.AUTH_TOKEN) {
    validateHeaderValue("Authorization", overrides.AUTH_TOKEN);
    headers.Authorization = `Bearer ${overrides.AUTH_TOKEN}`;
  } else if (overrides?.API_KEY) {
    validateHeaderValue("Authorization", overrides.API_KEY);
    headers.Authorization = `Bearer ${overrides.API_KEY}`;
  }
  return headers;
}

/**
 * Convert raw response headers (plain object from `got`, or `Headers` from `fetch`)
 * into a standard `Headers` instance for consistent API access.
 */
function toHeaders(raw: unknown): Headers {
  if (raw instanceof Headers) return raw;
  const h = new Headers();
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, string | string[]>)) {
      if (Array.isArray(value)) {
        for (const v of value) h.append(key, v);
      } else if (value != null) {
        h.set(key, String(value));
      }
    }
  }
  return h;
}

/**
 * Executes a single HTTP request to an Aptos API endpoint and returns the parsed response.
 *
 * Uses `@aptos-labs/aptos-client` under the hood, which provides HTTP/2 in Node.js
 * (via `got`) and native `fetch` in browsers.
 *
 * Handles:
 * - Building the full URL with query string parameters
 * - Setting `content-type`, `accept`, SDK version, and authorization headers
 * - Serializing the request body (JSON or BCS bytes)
 * - Parsing the response body (JSON via `aptosClient`, binary via `bcsRequest`)
 * - Throwing an {@link AptosApiError} for non-2xx responses, 401, or GraphQL errors
 *
 * This is the low-level request primitive used by {@link get} and {@link post}.
 * Most callers should prefer those helpers rather than calling `aptosRequest` directly.
 *
 * @typeParam Res - The expected type of the parsed response body.
 * @param options - The request options (URL, method, path, body, headers, etc.).
 * @param apiType - The Aptos API service being called (used for error context).
 * @param client - Optional custom HTTP client. When provided, `client.sendRequest()` is used
 *   instead of the default `jsonRequest`/`bcsRequest` from `@aptos-labs/aptos-client`.
 * @returns A promise that resolves to an {@link AptosResponse} containing the parsed data.
 * @throws {AptosApiError} If the response is an error (4xx/5xx or a GraphQL error payload).
 */
export async function aptosRequest<Res>(
  options: AptosRequest,
  apiType: AptosApiType,
  client?: Client,
): Promise<AptosResponse<Res>> {
  const { url, method, path, body, contentType, acceptType, params, originMethod, overrides } = options;

  const fullUrl = path ? `${url}/${path}` : url;

  // Validate URL scheme to prevent SSRF via non-HTTP protocols
  if (!fullUrl.startsWith("https://") && !fullUrl.startsWith("http://")) {
    throw new Error(`Invalid URL scheme: ${fullUrl}. Only http:// and https:// are supported.`);
  }

  const headers = mergeHeaders(overrides, contentType ?? MimeType.JSON, acceptType ?? MimeType.JSON, originMethod);

  // Filter out undefined param values — got's searchParams would stringify them as "undefined"
  const filteredParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
    : undefined;

  const isBcs = acceptType != null && acceptType !== MimeType.JSON;

  const clientRequest: ClientRequest = {
    url: fullUrl,
    method,
    body: body !== undefined && method === "POST" ? body : undefined,
    params: filteredParams as ClientRequest["params"],
    headers,
    http2: overrides?.http2,
  };

  const response = client
    ? await client.sendRequest<Res>(clientRequest)
    : isBcs
      ? await bcsRequest(clientRequest)
      : await jsonRequest<Res>(clientRequest);

  // Normalize: bcsRequest returns Buffer (Node) or ArrayBuffer (browser) — always
  // produce a plain Uint8Array so callers get a consistent type.
  const data: unknown = isBcs ? new Uint8Array(response.data as ArrayBuffer) : response.data;

  const result: AptosResponse<Res> = {
    status: response.status,
    statusText: response.statusText,
    data: data as Res,
    url: fullUrl,
    headers: toHeaders(response.headers),
  };

  const throwError = (): never => {
    // biome-ignore lint/suspicious/noExplicitAny: bridging client and error-layer request/response types
    throw new AptosApiError({ apiType, aptosRequest: options as any, aptosResponse: result as any });
  };

  // Error handling
  if (result.status === 401) {
    throwError();
  }

  if (apiType === AptosApiType.INDEXER) {
    const indexerData = data as Record<string, unknown>;
    if (indexerData.errors) {
      throwError();
    }
    if (indexerData.data !== undefined) {
      result.data = indexerData.data as Res;
    }
  }

  if (apiType === AptosApiType.PEPPER || apiType === AptosApiType.PROVER) {
    if (result.status >= 400) {
      throwError();
    }
  } else if (result.status < 200 || result.status >= 300) {
    throwError();
  }

  return result;
}
