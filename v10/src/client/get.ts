// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { aptosRequest } from "./aptos-request.js";
import type { AptosResponse, ClientConfig } from "./types.js";
import { AptosApiType, MimeType } from "./types.js";

export interface GetRequestOptions {
  url: string;
  apiType: AptosApiType;
  path: string;
  originMethod: string;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  contentType?: MimeType;
  acceptType?: MimeType;
  overrides?: ClientConfig;
}

export async function get<Res>(options: GetRequestOptions): Promise<AptosResponse<Res>> {
  const { url, apiType, path, originMethod, params, contentType, acceptType, overrides } = options;
  return aptosRequest<Res>(
    { url, method: "GET", path, originMethod, params, contentType, acceptType, overrides },
    apiType,
  );
}

export async function paginateWithCursor<Res extends Array<{}>>(options: GetRequestOptions): Promise<Res> {
  let out: Res = [] as unknown as Res;
  let cursor: string | undefined;
  const requestParams = (options.params ?? {}) as Record<string, string | AnyNumber | boolean | undefined>;
  do {
    const response = await get<Res>({ ...options, params: requestParams });
    cursor = response.headers.get("x-aptos-cursor") ?? undefined;
    out = out.concat(response.data) as Res;
    (requestParams as Record<string, string | undefined>).start = cursor;
  } while (cursor !== undefined);
  return out;
}

export async function paginateWithObfuscatedCursor<Res extends Array<{}>>(options: GetRequestOptions): Promise<Res> {
  let out: Res = [] as unknown as Res;
  let cursor: string | undefined;
  const requestParams = (options.params ?? {}) as Record<string, string | AnyNumber | boolean | undefined>;
  const totalLimit = requestParams.limit as number | undefined;
  do {
    // Only pass start + limit to the server
    const serverParams: Record<string, string | AnyNumber | boolean | undefined> = {};
    if (typeof requestParams.cursor === "string") {
      serverParams.start = requestParams.cursor;
    }
    if (requestParams.limit !== undefined) {
      serverParams.limit = requestParams.limit;
    }

    const response = await get<Res>({ ...options, params: serverParams });
    cursor = response.headers.get("x-aptos-cursor") ?? undefined;
    out = out.concat(response.data) as Res;
    (requestParams as Record<string, string | undefined>).cursor = cursor;

    if (totalLimit !== undefined) {
      const remaining = totalLimit - out.length;
      if (remaining <= 0) break;
      requestParams.limit = remaining;
    }
  } while (cursor !== undefined);
  return out;
}
