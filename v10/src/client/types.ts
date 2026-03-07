// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";

// Re-export AptosApiType from core so client consumers don't need two imports
export { AptosApiType } from "../core/constants.js";

// ── MIME types ──

export enum MimeType {
  JSON = "application/json",
  BCS = "application/x-bcs",
  BCS_SIGNED_TRANSACTION = "application/x.aptos.signed_transaction+bcs",
  BCS_VIEW_FUNCTION = "application/x.aptos.view_function+bcs",
}

// ── Client config ──

export interface ClientConfig {
  HEADERS?: Record<string, string | number | boolean>;
  API_KEY?: string;
  AUTH_TOKEN?: string;
}

export interface FullNodeConfig extends ClientConfig {}
export interface IndexerConfig extends ClientConfig {}
export interface FaucetConfig extends ClientConfig {}

// ── Request / Response ──

export interface AptosRequest {
  url: string;
  method: "GET" | "POST";
  path?: string;
  body?: unknown;
  contentType?: string;
  acceptType?: string;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  originMethod?: string;
  overrides?: ClientConfig;
}

export interface AptosResponse<Res> {
  status: number;
  statusText: string;
  data: Res;
  url: string;
  headers: Headers;
}

// ── Pagination ──

export interface PaginationArgs {
  offset?: number;
  limit?: number;
}
