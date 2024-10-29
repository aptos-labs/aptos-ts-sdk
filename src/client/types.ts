// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosRequest } from "../types";
import { AptosApiType } from "../utils/const.js";

/**
 * The API response type
 *
 * @param status - the response status. i.e. 200
 * @param statusText - the response message
 * @param data the response data
 * @param url the url the request was made to
 * @param headers the response headers
 * @param config (optional) - the request object
 * @param request (optional) - the request object
 */
export interface AptosResponse<Req, Res> {
  status: number;
  statusText: string;
  data: Res;
  url: string;
  headers: any;
  config?: any;
  request?: Req;
}

/**
 * Options for handling errors in the Aptos API.
 */
type AptosApiErrorOpts = {
  apiType: AptosApiType;
  aptosRequest: AptosRequest;
  aptosResponse: AptosResponse<any, any>;
};

/**
 * Represents an error returned from the Aptos API.
 * This class encapsulates the details of the error, including the request URL, response status, and additional data.
 *
 * @param name - The name of the error, which is always "AptosApiError".
 * @param url - The URL to which the request was made.
 * @param status - The HTTP response status code (e.g., 400).
 * @param statusText - The message associated with the response status.
 * @param data - The response data returned from the API.
 * @param request - The original AptosRequest that triggered the error.
 */
export class AptosApiError extends Error {
  readonly url: string;

  readonly status: number;

  readonly statusText: string;

  readonly data: any;

  readonly request: AptosRequest;

  /**
   * Constructs an instance of AptosApiError with relevant error details.
   *
   * @param opts - The options for creating the AptosApiError.
   * @param opts.apiType - The type of API that generated the error.
   * @param opts.aptosRequest - The request object that caused the error.
   * @param opts.aptosResponse - The response object containing error details.
   *
   * @internal This constructor is for SDK internal use - do not instantiate outside the SDK codebase.
   */
  constructor({ apiType, aptosRequest, aptosResponse }: AptosApiErrorOpts) {
    super(deriveErrorMessage({ apiType, aptosRequest, aptosResponse }));

    this.name = "AptosApiError";
    this.url = aptosResponse.url;
    this.status = aptosResponse.status;
    this.statusText = aptosResponse.statusText;
    this.data = aptosResponse.data;
    this.request = aptosRequest;
  }
}

/**
 * Derives an error message from the Aptos API response, providing context for debugging.
 * This function helps in understanding the nature of the error encountered during an API request.
 *
 * @param {AptosApiErrorOpts} opts - The options for deriving the error message.
 * @param {AptosApiType} opts.apiType - The type of API being called.
 * @param {AptosRequest} opts.aptosRequest - The original request made to the Aptos API.
 * @param {AptosResponse} opts.aptosResponse - The response received from the Aptos API.
 */
function deriveErrorMessage({ apiType, aptosRequest, aptosResponse }: AptosApiErrorOpts): string {
  // extract the W3C trace_id from the response headers if it exists. Some services set this in the response, and it's useful for debugging.
  // See https://www.w3.org/TR/trace-context/#relationship-between-the-headers .
  const traceId = aptosResponse.headers?.traceparent?.split("-")[1];
  const traceIdString = traceId ? `(trace_id:${traceId}) ` : "";

  const errorPrelude: string = `Request to [${apiType}]: ${aptosRequest.method} ${
    aptosResponse.url ?? aptosRequest.url
  } ${traceIdString}failed with`;

  // handle graphql responses from indexer api and extract the error message of the first error
  if (apiType === AptosApiType.INDEXER && aptosResponse.data?.errors?.[0]?.message != null) {
    return `${errorPrelude}: ${aptosResponse.data.errors[0].message}`;
  }

  // Received well-known structured error response body - simply serialize and return it.
  // We don't need http status codes etc. in this case.
  if (aptosResponse.data?.message != null && aptosResponse.data?.error_code != null) {
    return `${errorPrelude}: ${JSON.stringify(aptosResponse.data)}`;
  }

  // This is the generic/catch-all case. We received some response from the API, but it doesn't appear to be a well-known structure.
  // We print http status codes and the response body (after some trimming),
  // in the hope that this gives enough context what went wrong without printing overly huge messages.
  return `${errorPrelude} status: ${aptosResponse.statusText}(code:${
    aptosResponse.status
  }) and response body: ${serializeAnyPayloadForErrorMessage(aptosResponse.data)}`;
}

const SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH = 400;

/**
 * This function accepts a payload of any type (probably an object) and serializes it to a string
 * Since we don't know the type or size of the payload, and we don't want to add a huge object in full to the error message
 * we limit the to the first 200 and last 200 characters of the serialized payload and put a "..." in the middle.
 * @param payload - The payload to serialize, which can be of any type.
 *
 * @returns A string representation of the serialized payload, potentially truncated.
 */
function serializeAnyPayloadForErrorMessage(payload: any): string {
  const serializedPayload = JSON.stringify(payload);
  if (serializedPayload.length <= SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH) {
    return serializedPayload;
  }
  return `truncated(original_size:${serializedPayload.length}): ${serializedPayload.slice(
    0,
    SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH / 2,
  )}...${serializedPayload.slice(-SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH / 2)}`;
}
