// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @module client
 *
 * HTTP client layer for the Aptos SDK.
 *
 * Provides low-level primitives for making GET and POST requests to Aptos API
 * endpoints (full node, indexer, faucet, pepper, prover), including automatic
 * pagination helpers and request/response type definitions.
 *
 * Key exports:
 * - {@link aptosRequest} — core fetch wrapper with error handling
 * - {@link get} / {@link post} — typed GET/POST helpers
 * - {@link paginateWithCursor} / {@link paginateWithObfuscatedCursor} — auto-pagination
 * - {@link AptosRequest} / {@link AptosResponse} — request and response types
 * - {@link ClientConfig} / {@link FullNodeConfig} / {@link IndexerConfig} / {@link FaucetConfig} — auth/header config
 * - {@link MimeType} — MIME type constants for BCS and JSON encoding
 * - {@link AptosApiType} — enum of Aptos API service types
 */
export { aptosRequest } from "./aptos-request.js";
export type { GetRequestOptions } from "./get.js";
export { get, paginateWithCursor, paginateWithObfuscatedCursor } from "./get.js";
export type { PostRequestOptions } from "./post.js";
export { post } from "./post.js";
export type {
  AptosRequest,
  AptosResponse,
  ClientConfig,
  FaucetConfig,
  FullNodeConfig,
  IndexerConfig,
  PaginationArgs,
} from "./types.js";
export {
  AptosApiType,
  MimeType,
} from "./types.js";
