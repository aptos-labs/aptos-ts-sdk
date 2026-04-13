// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { VERSION } from "../version";
import { AnyNumber, AptosRequest, AptosResponse, Client, ClientRequest, ClientResponse, MimeType } from "../types";
import { AptosApiType } from "../utils";
import { AptosApiError } from "../errors";

/**
 * `@aptos-labs/aptos-client` v3 uses the Fetch `Headers` API for request/response headers.
 * The SDK historically exposed plain objects with lower-case keys (matching axios-style tests
 * and bracket access like `headers["x-aptos-cursor"]`). Normalize here for a stable surface.
 */
function headersToPlainObject(headers: unknown): Record<string, string> {
  if (headers == null) {
    return {};
  }
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  if (typeof headers === "object" && !Array.isArray(headers)) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        out[key.toLowerCase()] = String(value);
      }
    }
    return out;
  }
  return {};
}

function normalizeClientResponseConfig(config: unknown): unknown {
  if (config == null || typeof config !== "object") {
    return config;
  }
  const c = config as { headers?: unknown };
  return { ...c, headers: headersToPlainObject(c.headers) };
}

/**
 * aptos-client can throw before returning (e.g. JSON parse failure on a non-JSON body).
 * Surface those as AptosApiError so `error.request` still carries SDK fields like `overrides`.
 */
function throwProviderErrorAsAptosApiError(
  apiType: AptosApiType,
  aptosRequest: AptosRequest,
  fullUrl: string,
  err: unknown,
): never {
  const message = err instanceof Error ? err.message : String(err);
  const aptosResponse = {
    status: 0,
    statusText: "Client error",
    data: { message, error_code: "client_error", vm_error_code: null },
    headers: {},
    url: fullUrl,
  };
  throw new AptosApiError({ apiType, aptosRequest, aptosResponse });
}

/**
 * Sends a request using the specified options and returns the response.
 *
 * @param options - The options for the request.
 * @param options.url - The URL to send the request to.
 * @param options.method - The HTTP method to use for the request.
 * @param options.body - The body of the request.
 * @param options.contentType - The content type of the request.
 * @param options.params - The query parameters to include in the request.
 * @param options.overrides - Additional overrides for the request.
 * @param options.overrides.HEADERS - Custom headers to include in the request.
 * @param options.overrides.AUTH_TOKEN - The authorization token for the request.
 * @param options.overrides.API_KEY - The API key for the request.
 * @param options.overrides.http2 - Whether to use HTTP/2 for the request.
 * @param options.originMethod - The origin method for the request.
 * @param client - The client used to make the request.
 *
 * @returns The response from the request.
 * @group Implementation
 * @category Client
 */
export async function request<Req, Res>(options: ClientRequest<Req>, client: Client): Promise<ClientResponse<Res>> {
  const { url, method, body, contentType, params, overrides, originMethod } = options;
  const headers: Record<string, string | AnyNumber | boolean | undefined> = {
    ...overrides?.HEADERS,
    "x-aptos-client": `aptos-typescript-sdk/${VERSION}`,
    "content-type": contentType ?? MimeType.JSON,
    "x-aptos-typescript-sdk-origin-method": originMethod,
  };

  if (overrides?.AUTH_TOKEN) {
    headers.Authorization = `Bearer ${overrides?.AUTH_TOKEN}`;
  }
  if (overrides?.API_KEY) {
    headers.Authorization = `Bearer ${overrides?.API_KEY}`;
  }

  /*
   * make a call using the @aptos-labs/aptos-client package
   * {@link https://www.npmjs.com/package/@aptos-labs/aptos-client}
   */
  return client.provider<Req, Res>({
    url,
    method,
    body,
    params,
    headers,
    overrides,
    http2: overrides?.http2,
  });
}

/**
 * The main function to use when making an API request, returning the response or throwing an AptosApiError on failure.
 *
 * @param aptosRequestOpts - Options for the Aptos request, including the URL and path.
 * @param aptosConfig - The configuration information for the SDK client instance.
 * @param apiType - The type of API being accessed, which determines how the response is handled.
 * @returns The response from the API request or throws an AptosApiError if the request fails.
 * @group Implementation
 * @category Client
 */
export async function aptosRequest<Req extends {}, Res extends {}>(
  aptosRequestOpts: AptosRequest,
  aptosConfig: AptosConfig,
  apiType: AptosApiType,
): Promise<AptosResponse<Req, Res>> {
  const { url, path } = aptosRequestOpts;
  const fullUrl = path ? `${url}/${path}` : url;
  let clientResponse: ClientResponse<Res>;
  try {
    clientResponse = await request<Req, Res>({ ...aptosRequestOpts, url: fullUrl }, aptosConfig.client);
  } catch (err) {
    if (err instanceof AptosApiError) {
      throw err;
    }
    throwProviderErrorAsAptosApiError(apiType, aptosRequestOpts, fullUrl, err);
  }

  const aptosResponse: AptosResponse<Req, Res> = {
    status: clientResponse.status,
    statusText: clientResponse.statusText ?? "No status text provided",
    data: clientResponse.data,
    headers: headersToPlainObject(clientResponse.headers),
    config: normalizeClientResponseConfig(clientResponse.config),
    request: clientResponse.request,
    url: fullUrl,
  };

  // Handle case for `Unauthorized` error (i.e. API_KEY error)
  if (aptosResponse.status === 401) {
    throw new AptosApiError({ apiType, aptosRequest: aptosRequestOpts, aptosResponse });
  }

  // to support both fullnode and indexer responses,
  // check if it is an indexer query, and adjust response.data
  if (apiType === AptosApiType.INDEXER) {
    const indexerResponse = aptosResponse.data as any;
    // Handle Indexer general errors
    if (indexerResponse.errors) {
      throw new AptosApiError({
        apiType,
        aptosRequest: aptosRequestOpts,
        aptosResponse,
      });
    }
    aptosResponse.data = indexerResponse.data as Res;
  } else if (apiType === AptosApiType.PEPPER || apiType === AptosApiType.PROVER) {
    if (aptosResponse.status >= 400) {
      throw new AptosApiError({ apiType, aptosRequest: aptosRequestOpts, aptosResponse });
    }
  }

  if (aptosResponse.status >= 200 && aptosResponse.status < 300) {
    return aptosResponse;
  }

  // We have to explicitly check for all request types, because if the error is a non-indexer error, but
  // comes from an indexer request (e.g. 404), we'll need to mention it appropriately
  throw new AptosApiError({ apiType, aptosRequest: aptosRequestOpts, aptosResponse });
}
