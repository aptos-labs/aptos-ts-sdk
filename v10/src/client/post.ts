// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AnyNumber } from "../bcs/types.js";
import { aptosRequest } from "./aptos-request.js";
import type { AptosApiType, AptosResponse, ClientConfig, MimeType } from "./types.js";

export interface PostRequestOptions {
  url: string;
  apiType: AptosApiType;
  path: string;
  originMethod: string;
  body?: unknown;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  contentType?: MimeType;
  acceptType?: MimeType;
  overrides?: ClientConfig;
}

export async function post<Res>(options: PostRequestOptions): Promise<AptosResponse<Res>> {
  const { url, apiType, path, originMethod, body, params, contentType, acceptType, overrides } = options;
  return aptosRequest<Res>(
    { url, method: "POST", path, originMethod, body, params, contentType, acceptType, overrides },
    apiType,
  );
}
