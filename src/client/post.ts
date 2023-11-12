// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { aptosRequest } from "./core";
import { AptosResponse } from "./types";
import { AnyNumber, ClientConfig, MimeType } from "../types";
import { AptosApiType } from "../utils/const";

export type PostRequestOptions = {
  /**
   * The config for the API client
   */
  aptosConfig: AptosConfig;
  /**
   * The type of API endpoint to call e.g. fullnode, indexer, etc
   */
  type: AptosApiType;
  /**
   * The name of the API method
   */
  originMethod: string;
  /**
   * The URL path to the API method
   */
  path: string;
  /**
   * The content type of the request body
   */
  contentType?: MimeType;
  /**
   * The accepted content type of the response of the API
   */
  acceptType?: MimeType;
  /**
   * The query parameters for the request
   */
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  /**
   * The body of the request, should match the content type of the request
   */
  body?: any;
  /**
   * Specific client overrides for this request to override aptosConfig
   */
  overrides?: ClientConfig;
};

export type PostAptosRequestOptions = Omit<PostRequestOptions, "type">;

/**
 * Main function to do a Post request
 *
 * @param options PostRequestOptions
 * @returns
 */
export async function post<Req extends {}, Res extends {}>(
  options: PostRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  const { type, originMethod, path, body, acceptType, contentType, params, aptosConfig, overrides } = options;
  const url = aptosConfig.getRequestUrl(type);

  return aptosRequest<Req, Res>(
    {
      url,
      method: "POST",
      originMethod,
      path,
      body,
      contentType: contentType?.valueOf(),
      acceptType: acceptType?.valueOf(),
      params,
      overrides: {
        ...aptosConfig.clientConfig,
        ...overrides,
      },
    },
    aptosConfig,
  );
}

export async function postAptosFullNode<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: AptosApiType.FULLNODE });
}

export async function postAptosIndexer<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: AptosApiType.INDEXER });
}

export async function postAptosFaucet<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: AptosApiType.FAUCET });
}
