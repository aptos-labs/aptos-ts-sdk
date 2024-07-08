// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { AptosApiError, AptosResponse } from "./types";
import { VERSION } from "../version";
import { AnyNumber, AptosRequest, Client, ClientRequest, ClientResponse, MimeType } from "../types";
import { AptosApiType } from "../utils";

/**
 * Given a url and method, sends the request with axios and
 * returns the response.
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
  });
}

/**
 * The main function to use when doing an API request.
 *
 * @param aptosRequestOpts AptosRequest
 * @param aptosConfig The config information for the SDK client instance
 * @returns the response or AptosApiError
 */
export async function aptosRequest<Req extends {}, Res extends {}>(
  aptosRequestOpts: AptosRequest,
  aptosConfig: AptosConfig,
  apiType: AptosApiType,
): Promise<AptosResponse<Req, Res>> {
  const { url, path } = aptosRequestOpts;
  const fullUrl = path ? `${url}/${path}` : url;
  const clientResponse = await request<Req, Res>({ ...aptosRequestOpts, url: fullUrl }, aptosConfig.client);

  const aptosResponse: AptosResponse<Req, Res> = {
    status: clientResponse.status,
    statusText: clientResponse.statusText!,
    data: clientResponse.data,
    headers: clientResponse.headers,
    config: clientResponse.config,
    request: clientResponse.request,
    url: fullUrl,
  };

  // Handle case for `Unauthorized` error (i.e API_KEY error)
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
