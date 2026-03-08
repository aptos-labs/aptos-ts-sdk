import { AptosApiType } from "./constants.js";

// ── Keyless Errors ──

/** High-level categories for classifying Keyless authentication errors. */
export enum KeylessErrorCategory {
  /** An error from an Aptos-operated API (pepper, prover, full node). */
  API_ERROR,
  /** An error from an external API (e.g., OIDC provider JWKS endpoint). */
  EXTERNAL_API_ERROR,
  /** The keyless session has expired and re-authentication is required. */
  SESSION_EXPIRED,
  /** The keyless account is in an invalid internal state. */
  INVALID_STATE,
  /** The keyless signature failed verification on-chain. */
  INVALID_SIGNATURE,
  /** An unknown or uncategorized error. */
  UNKNOWN,
}

/** Human-readable resolution tips for Keyless errors, guiding developers toward a fix. */
export enum KeylessErrorResolutionTip {
  REAUTHENTICATE = "Re-authentiate to continue using your keyless account",
  REAUTHENTICATE_UNSURE = "Try re-authentiating. If the error persists join the telegram group at https://t.me/+h5CN-W35yUFiYzkx for further support",
  UPDATE_REQUEST_PARAMS = "Update the invalid request parameters and reauthenticate.",
  RATE_LIMIT_EXCEEDED = "Cache the keyless account and reuse it to avoid making too many requests.  Keyless accounts are valid until either the EphemeralKeyPair expires, when the JWK is rotated, or when the proof verifying key is changed, whichever comes soonest.",
  SERVER_ERROR = "Try again later.  See aptosApiError error for more context. For additional support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  CALL_PRECHECK = "Call `await account.checkKeylessAccountValidity()` to wait for asyncronous changes and check for account validity before signing or serializing.",
  REINSTANTIATE = "Try instantiating the account again.  Avoid manipulating the account object directly",
  JOIN_SUPPORT_GROUP = "For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  UNKNOWN = "Error unknown. For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
}

/** Specific error types that can occur during Keyless account operations. */
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
  SIGNATURE_TYPE_INVALID,
  SIGNATURE_EXPIRED,
  MAX_EXPIRY_HORIZON_EXCEEDED,
  EPHEMERAL_SIGNATURE_VERIFICATION_FAILED,
  TRAINING_WHEELS_SIGNATURE_MISSING,
  TRAINING_WHEELS_SIGNATURE_VERIFICATION_FAILED,
  PROOF_VERIFICATION_FAILED,
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
    "The JWT issuer is not supported by Federated Keyless.",
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
  [KeylessErrorType.JWT_PARSING_ERROR]: [
    "Error when parsing JWT.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REINSTANTIATE,
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
  [KeylessErrorType.SIGNATURE_TYPE_INVALID]: [
    "The signature is not a valid Keyless signature.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.JOIN_SUPPORT_GROUP,
  ],
  [KeylessErrorType.SIGNATURE_EXPIRED]: [
    "The ephemeral key pair used to sign the message has expired.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.MAX_EXPIRY_HORIZON_EXCEEDED]: [
    "The expiry horizon on the signature exceeds the maximum allowed value.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.EPHEMERAL_SIGNATURE_VERIFICATION_FAILED]: [
    "Failed to verify the ephemeral signature with the ephemeral public key.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.TRAINING_WHEELS_SIGNATURE_MISSING]: [
    "The training wheels signature is missing but is required by the Keyless configuration.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.TRAINING_WHEELS_SIGNATURE_VERIFICATION_FAILED]: [
    "Failed to verify the training wheels signature with the training wheels public key.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.PROOF_VERIFICATION_FAILED]: [
    "The proof verification failed.",
    KeylessErrorCategory.INVALID_SIGNATURE,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.UNKNOWN]: [
    "An unknown error has occurred.",
    KeylessErrorCategory.UNKNOWN,
    KeylessErrorResolutionTip.UNKNOWN,
  ],
};

/**
 * Error class for Keyless authentication failures.
 *
 * Provides structured error information including category, type, resolution tips,
 * and optional inner errors from API calls.
 */
export class KeylessError extends Error {
  /** The underlying error that caused this KeylessError, if any. */
  readonly innerError?: unknown;
  /** The broad category of this error. */
  readonly category: KeylessErrorCategory;
  /** A human-readable tip for resolving this error. */
  readonly resolutionTip: KeylessErrorResolutionTip;
  /** The specific error type. */
  readonly type: KeylessErrorType;
  /** Additional details about the error context. */
  readonly details?: string;

  /**
   * @param args.innerError - The underlying error, if any.
   * @param args.category - The error category.
   * @param args.resolutionTip - A resolution tip for the developer.
   * @param args.type - The specific error type.
   * @param args.message - Optional custom message (defaults to the message for the given type).
   * @param args.details - Optional additional details.
   */
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
      result += `\nError: ${innerError instanceof Error ? innerError.message : String(innerError)}`;
    }
    result += `\nKeylessErrorResolutionTip: ${tip}`;
    return result;
  }

  /**
   * Creates a KeylessError from a {@link KeylessErrorType}, automatically looking up
   * the default message, category, and resolution tip.
   * @param args.type - The specific error type.
   * @param args.error - The underlying error, if any.
   * @param args.details - Optional additional details.
   * @returns A new KeylessError instance.
   */
  static fromErrorType(args: { type: KeylessErrorType; error?: unknown; details?: string }): KeylessError {
    const { error, type, details } = args;
    const [message, category, resolutionTip] = KeylessErrors[type];
    return new KeylessError({ message, details, innerError: error, category, resolutionTip, type });
  }
}

// ── API Errors ──

/** Describes the parameters of an outgoing HTTP request to an Aptos API. */
export interface AptosRequest {
  url: string;
  method: string;
  body?: unknown;
  contentType?: string;
  params?: Record<string, string | string[] | undefined>;
  overrides?: Record<string, unknown>;
  originMethod?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Describes an HTTP response received from an Aptos API.
 * @typeParam Res - The type of the response body data.
 * @typeParam Req - The type of the underlying request object.
 */
export interface AptosResponse<Res, Req> {
  status: number;
  statusText: string;
  data: Res;
  url: string;
  headers?: Record<string, string | undefined>;
  config?: unknown;
  request?: Req;
}

/**
 * Error thrown when an Aptos API request fails.
 * Contains the request details, HTTP status, and response body for debugging.
 */
export class AptosApiError extends Error {
  /** The URL that was requested. */
  readonly url: string;
  /** The HTTP status code of the response. */
  readonly status: number;
  /** The HTTP status text of the response. */
  readonly statusText: string;
  /** The response body data. */
  readonly data: unknown;
  /** The original request parameters. */
  readonly request: AptosRequest;

  /**
   * @param args.apiType - The type of API that was called (fullnode, indexer, etc.).
   * @param args.aptosRequest - The original request parameters.
   * @param args.aptosResponse - The response received from the API.
   */
  constructor(args: {
    apiType: AptosApiType;
    aptosRequest: AptosRequest;
    aptosResponse: AptosResponse<unknown, unknown>;
  }) {
    const { apiType, aptosRequest, aptosResponse } = args;
    super(deriveErrorMessage({ apiType, aptosRequest, aptosResponse }));
    this.name = "AptosApiError";
    this.url = aptosResponse.url;
    this.status = aptosResponse.status;
    this.statusText = aptosResponse.statusText;
    this.data = aptosResponse.data;
    this.request = aptosRequest;
  }
}

function deriveErrorMessage(args: {
  apiType: AptosApiType;
  aptosRequest: AptosRequest;
  aptosResponse: AptosResponse<unknown, unknown>;
}): string {
  const { apiType, aptosRequest, aptosResponse } = args;
  const traceId = aptosResponse.headers?.traceparent?.split("-")[1];
  const traceIdString = traceId ? `(trace_id:${traceId}) ` : "";

  const errorPrelude = `Request to [${apiType}]: ${aptosRequest.method} ${
    aptosResponse.url ?? aptosRequest.url
  } ${traceIdString}failed with`;

  const data = aptosResponse.data as Record<string, unknown> | undefined;
  if (
    apiType === AptosApiType.INDEXER &&
    (data?.errors as Array<{ message?: string }> | undefined)?.[0]?.message != null
  ) {
    return `${errorPrelude}: ${(data?.errors as Array<{ message: string }>)[0].message}`;
  }

  if (data?.message != null && data?.error_code != null) {
    return `${errorPrelude}: ${JSON.stringify(aptosResponse.data)}`;
  }

  const MAX_LEN = 400;
  const serialized = JSON.stringify(aptosResponse.data);
  const body =
    serialized.length <= MAX_LEN
      ? serialized
      : `truncated(original_size:${serialized.length}): ${serialized.slice(0, MAX_LEN / 2)}...${serialized.slice(-MAX_LEN / 2)}`;

  return `${errorPrelude} status: ${aptosResponse.statusText}(code:${aptosResponse.status}) and response body: ${body}`;
}
