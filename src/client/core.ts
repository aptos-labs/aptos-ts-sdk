// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { CedraConfig } from "../api/cedraConfig";
import { VERSION } from "../version";
import { AnyNumber, CedraRequest, CedraResponse, Client, ClientRequest, ClientResponse, MimeType } from "../types";
import { CedraApiType } from "../utils";
import { CedraApiError } from "../errors";

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
    "x-cedra-client": `cedra-typescript-sdk/${VERSION}`,
    "content-type": contentType ?? MimeType.JSON,
    "x-cedra-typescript-sdk-origin-method": originMethod,
  };

  if (overrides?.AUTH_TOKEN) {
    headers.Authorization = `Bearer ${overrides?.AUTH_TOKEN}`;
  }
  if (overrides?.API_KEY) {
    headers.Authorization = `Bearer ${overrides?.API_KEY}`;
  }

  /*
   * make a call using the @cedra-labs/cedra-client package
   * {@link https://www.npmjs.com/package/@cedra-labs/cedra-client}
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
 * The main function to use when making an API request, returning the response or throwing an CedraApiError on failure.
 *
 * @param cedraRequestOpts - Options for the Cedra request, including the URL and path.
 * @param cedraConfig - The configuration information for the SDK client instance.
 * @param apiType - The type of API being accessed, which determines how the response is handled.
 * @returns The response from the API request or throws an CedraApiError if the request fails.
 * @group Implementation
 * @category Client
 */
export async function cedraRequest<Req extends {}, Res extends {}>(
  cedraRequestOpts: CedraRequest,
  cedraConfig: CedraConfig,
  apiType: CedraApiType,
): Promise<CedraResponse<Req, Res>> {
  const { url, path } = cedraRequestOpts;
  const fullUrl = path ? `${url}/${path}` : url;
  const clientResponse = await request<Req, Res>({ ...cedraRequestOpts, url: fullUrl }, cedraConfig.client);

  const cedraResponse: CedraResponse<Req, Res> = {
    status: clientResponse.status,
    statusText: clientResponse.statusText ?? "No status text provided",
    data: clientResponse.data,
    headers: clientResponse.headers,
    config: clientResponse.config,
    request: clientResponse.request,
    url: fullUrl,
  };

  // Handle case for `Unauthorized` error (i.e. API_KEY error)
  if (cedraResponse.status === 401) {
    throw new CedraApiError({ apiType, cedraRequest: cedraRequestOpts, cedraResponse });
  }

  // to support both fullnode and indexer responses,
  // check if it is an indexer query, and adjust response.data
  if (apiType === CedraApiType.INDEXER) {
    const indexerResponse = cedraResponse.data as any;
    // Handle Indexer general errors
    if (indexerResponse.errors) {
      throw new CedraApiError({
        apiType,
        cedraRequest: cedraRequestOpts,
        cedraResponse,
      });
    }
    cedraResponse.data = indexerResponse.data as Res;
  } else if (apiType === CedraApiType.PEPPER || apiType === CedraApiType.PROVER) {
    if (cedraResponse.status >= 400) {
      throw new CedraApiError({ apiType, cedraRequest: cedraRequestOpts, cedraResponse });
    }
  }

  if (cedraResponse.status >= 200 && cedraResponse.status < 300) {
    return cedraResponse;
  }

  // We have to explicitly check for all request types, because if the error is a non-indexer error, but
  // comes from an indexer request (e.g. 404), we'll need to mention it appropriately
  throw new CedraApiError({ apiType, cedraRequest: cedraRequestOpts, cedraResponse });
}
