// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { VERSION } from "../version";
import { AnyNumber, AptosRequest, AptosResponse, Client, ClientRequest, ClientResponse, MimeType } from "../types";
import { AptosApiType } from "../utils";
import { AptosApiError } from "../errors";

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

const HTTP_STATUS_GONE = 410;

const CREDENTIAL_HEADERS = new Set(["authorization", "cookie", "x-api-key"]);

const warnedArchivalEndpoints = new Set<string>();

type ArchivalRetryTarget = {
  url: string;
  forwardCredentials: boolean;
};

/**
 * Registrable domain, approximated as the last two labels.
 * Hosts under a multi-part suffix like `co.uk` compare equal.
 */
function siteOf(hostname: string): string {
  return hostname.toLowerCase().split(".").slice(-2).join(".");
}

/**
 * Validates the archival endpoint advertised in a pruning error, returning undefined if it is unusable.
 *
 * The endpoint is chosen by the node rather than the caller, so it must be an absolute http(s) URL that does
 * not downgrade an https request, and credentials are only forwarded to it when it is same-site.
 */
function resolveArchivalRetryTarget(originalUrl: string, responseData: any): ArchivalRetryTarget | undefined {
  const advertisedEndpoint = responseData?.archival_endpoint;
  if (typeof advertisedEndpoint !== "string" || advertisedEndpoint.length === 0) {
    return undefined;
  }

  let archivalUrl: URL;
  let originUrl: URL;
  try {
    archivalUrl = new URL(advertisedEndpoint);
    originUrl = new URL(originalUrl);
  } catch {
    return undefined;
  }

  if (archivalUrl.protocol !== "https:" && archivalUrl.protocol !== "http:") {
    return undefined;
  }
  if (originUrl.protocol === "https:" && archivalUrl.protocol !== "https:") {
    return undefined;
  }

  return {
    url: advertisedEndpoint.replace(/\/+$/, ""),
    forwardCredentials: siteOf(archivalUrl.hostname) === siteOf(originUrl.hostname),
  };
}

function hasCredentials(overrides: AptosRequest["overrides"]): boolean {
  if (!overrides) {
    return false;
  }
  if (overrides.API_KEY || overrides.AUTH_TOKEN) {
    return true;
  }
  return Object.keys(overrides.HEADERS ?? {}).some((name) => CREDENTIAL_HEADERS.has(name.toLowerCase()));
}

function withoutCredentials(overrides: AptosRequest["overrides"]): AptosRequest["overrides"] {
  if (!overrides) {
    return overrides;
  }
  const { API_KEY, AUTH_TOKEN, HEADERS, ...rest } = overrides;
  if (!HEADERS) {
    return rest;
  }
  return {
    ...rest,
    HEADERS: Object.fromEntries(
      Object.entries(HEADERS).filter(([name]) => !CREDENTIAL_HEADERS.has(name.toLowerCase())),
    ),
  };
}

function warnOnceAboutDroppedCredentials(originalUrl: string, archivalUrl: string): void {
  if (warnedArchivalEndpoints.has(archivalUrl)) {
    return;
  }
  warnedArchivalEndpoints.add(archivalUrl);
  console.warn(
    `[Aptos SDK] ${originalUrl} reported pruned data and advertised the archival endpoint ${archivalUrl}. ` +
      "Retrying there without credentials because it is not on the same site. If that endpoint requires " +
      "authentication, set it as your `fullnode` URL, or disable this retry with `archivalFallback: false`.",
  );
}

/** Sends a request and shapes the client response into an `AptosResponse`, without interpreting the status. */
async function sendAptosRequest<Req extends {}, Res extends {}>(
  aptosRequestOpts: AptosRequest,
  aptosConfig: AptosConfig,
): Promise<AptosResponse<Req, Res>> {
  const { url, path } = aptosRequestOpts;
  const fullUrl = path ? `${url}/${path}` : url;
  const clientResponse = await request<Req, Res>({ ...aptosRequestOpts, url: fullUrl }, aptosConfig.client);

  return {
    status: clientResponse.status,
    statusText: clientResponse.statusText ?? "No status text provided",
    data: clientResponse.data,
    headers: clientResponse.headers,
    config: clientResponse.config,
    request: clientResponse.request,
    url: fullUrl,
  };
}

/** Returns the response on success, or throws an `AptosApiError` describing the failure. */
function handleAptosResponse<Req extends {}, Res extends {}>(
  aptosResponse: AptosResponse<Req, Res>,
  aptosRequestOpts: AptosRequest,
  apiType: AptosApiType,
): AptosResponse<Req, Res> {
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

/**
 * The main function to use when making an API request, returning the response or throwing an AptosApiError on failure.
 *
 * A Node API read of pruned data answers `410 Gone` with an `archival_endpoint`. Such requests are replayed
 * once against that endpoint and the result returned transparently. Opt out with `archivalFallback: false`.
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
  const aptosResponse = await sendAptosRequest<Req, Res>(aptosRequestOpts, aptosConfig);

  const archivalTarget =
    apiType === AptosApiType.FULLNODE && aptosResponse.status === HTTP_STATUS_GONE && aptosConfig.archivalFallback
      ? resolveArchivalRetryTarget(aptosResponse.url, aptosResponse.data)
      : undefined;

  if (archivalTarget === undefined) {
    return handleAptosResponse<Req, Res>(aptosResponse, aptosRequestOpts, apiType);
  }

  if (!archivalTarget.forwardCredentials && hasCredentials(aptosRequestOpts.overrides)) {
    warnOnceAboutDroppedCredentials(aptosResponse.url, archivalTarget.url);
  }

  const archivalRequestOpts: AptosRequest = {
    ...aptosRequestOpts,
    url: archivalTarget.url,
    overrides: archivalTarget.forwardCredentials
      ? aptosRequestOpts.overrides
      : withoutCredentials(aptosRequestOpts.overrides),
  };

  let archivalResponse: AptosResponse<Req, Res>;
  try {
    archivalResponse = await sendAptosRequest<Req, Res>(archivalRequestOpts, aptosConfig);
  } catch {
    // Archival was unreachable, so the pruning error remains the more useful one to surface.
    throw new AptosApiError({ apiType, aptosRequest: aptosRequestOpts, aptosResponse });
  }

  return handleAptosResponse<Req, Res>(archivalResponse, archivalRequestOpts, apiType);
}
