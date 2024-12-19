import { AptosApiType } from "../utils/const";
import { getErrorMessage } from "../utils/helpers";
import { AptosRequest, AptosResponse } from "../types";

export enum KeylessErrorCategory {
  API_ERROR,
  EXTERNAL_API_ERROR,
  SESSION_EXPIRED,
  INVALID_STATE,
  UNKNOWN,
}

export enum KeylessErrorResolutionTip {
  REAUTHENTICATE = "Re-authentiate to continue using your keyless account",
  // eslint-disable-next-line max-len
  REAUTHENTICATE_UNSURE = "Try re-authentiating. If the error persists join the telegram group at https://t.me/+h5CN-W35yUFiYzkx for further support",
  UPDATE_REQUEST_PARAMS = "Update the invalid request parameters and reauthenticate.",
  // eslint-disable-next-line max-len
  RATE_LIMIT_EXCEEDED = "Cache the keyless account and reuse it to avoid making too many requests.  Keyless accounts are valid until either the EphemeralKeyPair expires, when the JWK is rotated, or when the proof verifying key is changed, whichever comes soonest.",
  // eslint-disable-next-line max-len
  SERVER_ERROR = "Try again later.  See aptosApiError error for more context. For additional support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  // eslint-disable-next-line max-len
  CALL_PRECHECK = "Call `await account.checkKeylessAccountValidity()` to wait for asyncronous changes and check for account validity before signing or serializing.",
  REINSTANTIATE = "Try instantiating the account again.  Avoid manipulating the account object directly",
  JOIN_SUPPORT_GROUP = "For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  UNKNOWN = "Error unknown. For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
}

export enum KeylessErrorType {
  EPHEMERAL_KEY_PAIR_EXPIRED,

  PROOF_NOT_FOUND,

  ASYNC_PROOF_FETCH_FAILED,

  INVALID_PROOF_VERIFICATION_FAILED,

  INVALID_PROOF_VERIFICATION_KEY_NOT_FOUND,

  INVALID_JWT_SIG,

  INVALID_JWT_JWK_NOT_FOUND,

  INVALID_JWT_ISS_NOT_RECOGNIZED,

  INVALID_JWT_FEDERATED_ISS_NOT_SUPPORTED,

  INVALID_TW_SIG_VERIFICATION_FAILED,

  INVALID_TW_SIG_PUBLIC_KEY_NOT_FOUND,

  INVALID_EXPIRY_HORIZON,

  JWT_PARSING_ERROR,

  JWK_FETCH_FAILED,

  JWK_FETCH_FAILED_FEDERATED,

  RATE_LIMIT_EXCEEDED,

  PEPPER_SERVICE_INTERNAL_ERROR,

  PEPPER_SERVICE_BAD_REQUEST,

  PEPPER_SERVICE_OTHER,

  PROVER_SERVICE_INTERNAL_ERROR,

  PROVER_SERVICE_BAD_REQUEST,

  PROVER_SERVICE_OTHER,

  FULL_NODE_CONFIG_LOOKUP_ERROR,

  FULL_NODE_VERIFICATION_KEY_LOOKUP_ERROR,

  FULL_NODE_JWKS_LOOKUP_ERROR,

  FULL_NODE_OTHER,

  UNKNOWN,
}

const KeylessErrors: { [key in KeylessErrorType]: [string, KeylessErrorCategory, KeylessErrorResolutionTip] } = {
  [KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED]: [
    "The ephemeral keypair has expired.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.PROOF_NOT_FOUND]: [
    "The required proof could not be found.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.CALL_PRECHECK,
  ],
  [KeylessErrorType.ASYNC_PROOF_FETCH_FAILED]: [
    "The required proof failed to fetch.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_PROOF_VERIFICATION_FAILED]: [
    "The provided proof is invalid.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_PROOF_VERIFICATION_KEY_NOT_FOUND]: [
    "The verification key used to authenticate was updated.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_JWT_SIG]: [
    "The JWK was found, but JWT failed verification",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_JWT_JWK_NOT_FOUND]: [
    "The JWK required to verify the JWT could not be found. The JWK may have been rotated out.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_JWT_ISS_NOT_RECOGNIZED]: [
    "The JWT issuer is not recognized.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.INVALID_JWT_FEDERATED_ISS_NOT_SUPPORTED]: [
    "The JWT issuer is not supported by the Federated Keyless ",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_TW_SIG_VERIFICATION_FAILED]: [
    "The training wheels signature is invalid.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_TW_SIG_PUBLIC_KEY_NOT_FOUND]: [
    "The public key used to verify the training wheels signature was not found.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_EXPIRY_HORIZON]: [
    "The expiry horizon is invalid.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.JWK_FETCH_FAILED]: [
    "Failed to fetch JWKS.",
    KeylessErrorCategory.EXTERNAL_API_ERROR,
    KeylessErrorResolutionTip.JOIN_SUPPORT_GROUP,
  ],
  [KeylessErrorType.JWK_FETCH_FAILED_FEDERATED]: [
    "Failed to fetch JWKS for Federated Keyless provider.",
    KeylessErrorCategory.EXTERNAL_API_ERROR,
    KeylessErrorResolutionTip.JOIN_SUPPORT_GROUP,
  ],
  [KeylessErrorType.RATE_LIMIT_EXCEEDED]: [
    "Rate limit exceeded. Too many requests in a short period.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.RATE_LIMIT_EXCEEDED,
  ],
  [KeylessErrorType.PEPPER_SERVICE_INTERNAL_ERROR]: [
    "Internal error from Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PEPPER_SERVICE_BAD_REQUEST]: [
    "Bad request sent to Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.PEPPER_SERVICE_OTHER]: [
    "Unknown error from Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PROVER_SERVICE_INTERNAL_ERROR]: [
    "Internal error from Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PROVER_SERVICE_BAD_REQUEST]: [
    "Bad request sent to Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.PROVER_SERVICE_OTHER]: [
    "Unknown error from Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.JWT_PARSING_ERROR]: [
    "Error when parsing JWT. This should never happen. Join https://t.me/+h5CN-W35yUFiYzkx for support",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REINSTANTIATE,
  ],
  [KeylessErrorType.FULL_NODE_CONFIG_LOOKUP_ERROR]: [
    "Error when looking up on-chain keyless configuration.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.FULL_NODE_VERIFICATION_KEY_LOOKUP_ERROR]: [
    "Error when looking up on-chain verification key.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.FULL_NODE_JWKS_LOOKUP_ERROR]: [
    "Error when looking up on-chain JWKS.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.FULL_NODE_OTHER]: [
    "Unknown error from full node.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.UNKNOWN]: [
    "An unknown error has occurred.",
    KeylessErrorCategory.UNKNOWN,
    KeylessErrorResolutionTip.UNKNOWN,
  ],
};

export class KeylessError extends Error {
  readonly innerError?: unknown;

  readonly category: KeylessErrorCategory;

  readonly resolutionTip: KeylessErrorResolutionTip;

  readonly type: KeylessErrorType;

  readonly details?: string;

  /** @internal this constructor is for sdk internal use - do not instantiate outside of the SDK codebase */
  constructor(args: {
    innerError?: unknown;
    category: KeylessErrorCategory;
    resolutionTip: KeylessErrorResolutionTip;
    type: KeylessErrorType;
    message?: string;
    details?: string;
  }) {
    const { innerError, category, resolutionTip, type, message = KeylessErrors[type][0], details } = args;
    super(message);
    this.name = "KeylessError";
    this.innerError = innerError;
    this.category = category;
    this.resolutionTip = resolutionTip;
    this.type = type;
    this.details = details;
    this.message = KeylessError.constructMessage(message, resolutionTip, innerError, details);
  }

  static constructMessage(
    message: string,
    tip: KeylessErrorResolutionTip,
    innerError?: unknown,
    details?: string,
  ): string {
    let result = `\nMessage: ${message}`;
    if (details) {
      result += `\nDetails: ${details}`;
    }
    if (innerError instanceof AptosApiError) {
      result += `\nAptosApiError: ${innerError.message}`;
    } else if (innerError !== undefined) {
      result += `\nError: ${getErrorMessage(innerError)}`;
    }
    result += `\nKeylessErrorResolutionTip: ${tip}`;
    return result;
  }

  /**
   * Static constructor that creates a KeylessError instance using the KeylessErrors constant
   * @param args.type The type of KeylessError
   * @param args.aptosApiError optional AptosApiError supplied for api errors
   * @param args.details optional details to include in the error message
   * @returns A new KeylessError instance
   */
  static fromErrorType(args: { type: KeylessErrorType; error?: unknown; details?: string }): KeylessError {
    const { error, type, details } = args;

    const [message, category, resolutionTip] = KeylessErrors[type];
    return new KeylessError({
      message,
      details,
      innerError: error,
      category,
      resolutionTip,
      type,
    });
  }
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
  // eslint-disable-next-line max-len
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
