// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosApiError } from "../core/errors.js";
import { VERSION } from "../version.js";
import type { AptosRequest, AptosResponse, ClientConfig } from "./types.js";
import { AptosApiType, MimeType } from "./types.js";

function buildQueryString(params?: Record<string, string | number | bigint | boolean | undefined>): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
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
      headers[key] = String(value);
    }
  }
  if (overrides?.AUTH_TOKEN) {
    headers.Authorization = `Bearer ${overrides.AUTH_TOKEN}`;
  } else if (overrides?.API_KEY) {
    headers.Authorization = `Bearer ${overrides.API_KEY}`;
  }
  return headers;
}

/**
 * Executes a single HTTP request to an Aptos API endpoint and returns the parsed response.
 *
 * Handles:
 * - Building the full URL with query string parameters
 * - Setting `content-type`, `accept`, SDK version, and authorization headers
 * - Serializing the request body (JSON, BCS bytes, or plain string)
 * - Parsing the response body based on the `content-type` header
 * - Throwing an {@link AptosApiError} for non-2xx responses, 401, or GraphQL errors
 *
 * This is the low-level fetch primitive used by {@link get} and {@link post}.
 * Most callers should prefer those helpers rather than calling `aptosRequest` directly.
 *
 * @typeParam Res - The expected type of the parsed response body.
 * @param options - The request options (URL, method, path, body, headers, etc.).
 * @param apiType - The Aptos API service being called (used for error context).
 * @returns A promise that resolves to an {@link AptosResponse} containing the parsed data.
 * @throws {AptosApiError} If the response is an error (4xx/5xx or a GraphQL error payload).
 */
export async function aptosRequest<Res>(options: AptosRequest, apiType: AptosApiType): Promise<AptosResponse<Res>> {
  const { url, method, path, body, contentType, acceptType, params, originMethod, overrides } = options;

  const fullUrl = `${path ? `${url}/${path}` : url}${buildQueryString(params)}`;

  const headers = mergeHeaders(overrides, contentType ?? MimeType.JSON, acceptType ?? MimeType.JSON, originMethod);

  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined && method === "POST") {
    if (typeof body === "string") {
      init.body = body;
    } else if (body instanceof Uint8Array) {
      init.body = body as unknown as BodyInit;
    } else {
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(fullUrl, init);

  // Determine response data based on accept type
  let data: unknown;
  const responseContentType = response.headers.get("content-type") ?? "";
  if (responseContentType.includes("application/json") || acceptType === MimeType.JSON || !acceptType) {
    data = await response.json();
  } else if (responseContentType.includes("application/x-bcs") || acceptType === MimeType.BCS) {
    data = new Uint8Array(await response.arrayBuffer());
  } else {
    data = await response.text();
  }

  const result: AptosResponse<Res> = {
    status: response.status,
    statusText: response.statusText,
    data: data as Res,
    url: fullUrl,
    headers: response.headers,
  };

  const throwError = (): never => {
    // biome-ignore lint/suspicious/noExplicitAny: bridging client and error-layer request/response types
    throw new AptosApiError({ apiType, aptosRequest: options as any, aptosResponse: result as any });
  };

  // Error handling
  if (response.status === 401) {
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
    if (response.status >= 400) {
      throwError();
    }
  } else if (response.status < 200 || response.status >= 300) {
    throwError();
  }

  return result;
}
