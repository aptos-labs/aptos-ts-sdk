// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { AptosApiError, AptosResponse } from "./types";
import { VERSION } from "../version";
import { AptosRequest, MimeType, ClientRequest, ClientResponse, Client, AnyNumber } from "../types";

/**
 * Meaningful errors map
 */
const errors: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

/**
 * Given a url and method, sends the request with axios and
 * returns the response.
 */
export async function request<Req, Res>(options: ClientRequest<Req>, client: Client): Promise<ClientResponse<Res>> {
  const { url, method, body, contentType, params, overrides } = options;
  const headers: Record<string, string | AnyNumber | boolean | undefined> = {
    ...overrides?.HEADERS,
    "x-aptos-client": `aptos-ts-sdk/${VERSION}`,
    "content-type": contentType ?? MimeType.JSON,
  };

  if (overrides?.TOKEN) {
    headers.Authorization = `Bearer ${overrides?.TOKEN}`;
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
  });
}

/**
 * The main function to use when doing an API request.
 *
 * @param options AptosRequest
 * @param aptosConfig The config information for the SDK client instance
 * @returns the response or AptosApiError
 */
export async function aptosRequest<Req, Res>(
  options: AptosRequest,
  aptosConfig: AptosConfig,
): Promise<AptosResponse<Req, Res>> {
  const { url, path } = options;
  const fullUrl = `${url}/${path ?? ""}`;
  const response = await request<Req, Res>({ ...options, url: fullUrl }, aptosConfig.client);

  const result: AptosResponse<Req, Res> = {
    status: response.status,
    statusText: response.statusText!,
    data: response.data,
    headers: response.headers,
    config: response.config,
    request: response.request,
    url: fullUrl,
  };

  // to support both fullnode and indexer responses,
  // check if it is an indexer query, and adjust response.data
  if (aptosConfig.isIndexerRequest(url)) {
    const indexerResponse = result.data as any;
    // errors from indexer
    if (indexerResponse.errors) {
      throw new AptosApiError(
        options,
        result,
        indexerResponse.errors[0].message ?? `Unhandled Error ${response.status} : ${response.statusText}`,
      );
    }
    result.data = indexerResponse.data as Res;
  }

  if (result.status >= 200 && result.status < 300) {
    return result;
  }

  const errorMessage = errors[result.status];

  throw new AptosApiError(
    options,
    result,
    errorMessage ?? `Unhandled Error ${response.status} : ${response.statusText}`,
  );
}
