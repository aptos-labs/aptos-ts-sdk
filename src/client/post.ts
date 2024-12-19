// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { aptosRequest } from "./core";
import { AptosResponse, AnyNumber, ClientConfig, MimeType } from "../types";
import { AptosApiType } from "../utils/const";

/**
 * Options for making a POST request, including the API client configuration.
 * @group Implementation
 * @category Client
 */
export type PostRequestOptions = {
  /**
   * The config for the API client
   * @group Implementation
   * @category Client
   */
  aptosConfig: AptosConfig;
  /**
   * The type of API endpoint to call e.g. fullnode, indexer, etc
   * @group Implementation
   * @category Client
   */
  type: AptosApiType;
  /**
   * The name of the API method
   * @group Implementation
   * @category Client
   */
  originMethod: string;
  /**
   * The URL path to the API method
   * @group Implementation
   * @category Client
   */
  path: string;
  /**
   * The content type of the request body
   * @group Implementation
   * @category Client
   */
  contentType?: MimeType;
  /**
   * The accepted content type of the response of the API
   * @group Implementation
   * @category Client
   */
  acceptType?: MimeType;
  /**
   * The query parameters for the request
   * @group Implementation
   * @category Client
   */
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  /**
   * The body of the request, should match the content type of the request
   * @group Implementation
   * @category Client
   */
  body?: any;
  /**
   * Specific client overrides for this request to override aptosConfig
   * @group Implementation
   * @category Client
   */
  overrides?: ClientConfig;
};

/**
 * Options for posting a request to Aptos, excluding the type field.
 * @group Implementation
 * @category Client
 */
export type PostAptosRequestOptions = Omit<PostRequestOptions, "type">;

/**
 * Executes a POST request to the specified URL with the provided options.
 *
 * @param options - The options for the POST request.
 * @param options.type - The type of the request.
 * @param options.originMethod - The original method that initiated the request.
 * @param options.path - The path for the request.
 * @param options.body - The body content to be sent with the request.
 * @param options.acceptType - The type of response expected from the server.
 * @param options.contentType - The content type of the request body.
 * @param options.params - Additional parameters to include in the request.
 * @param options.aptosConfig - Configuration settings for the Aptos request.
 * @param options.overrides - Any overrides for the default request behavior.
 * @returns The response from the POST request.
 * @group Implementation
 * @category Client
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
      contentType,
      acceptType,
      params,
      overrides,
    },
    aptosConfig,
    options.type,
  );
}

/**
 * Sends a request to the Aptos full node using the specified options.
 * This function allows you to interact with the Aptos blockchain by sending requests to the full node.
 *
 * @param options - The options for the request.
 * @param options.aptosConfig - Configuration settings for the Aptos client.
 * @param options.aptosConfig.clientConfig - Client-specific configuration settings.
 * @param options.aptosConfig.fullnodeConfig - Full node-specific configuration settings.
 * @param options.overrides - Additional overrides for the request.
 * @group Implementation
 * @category Client
 */
export async function postAptosFullNode<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  const { aptosConfig } = options;

  return post<Req, Res>({
    ...options,
    type: AptosApiType.FULLNODE,
    overrides: {
      ...aptosConfig.clientConfig,
      ...aptosConfig.fullnodeConfig,
      ...options.overrides,
      HEADERS: { ...aptosConfig.clientConfig?.HEADERS, ...aptosConfig.fullnodeConfig?.HEADERS },
    },
  });
}

/**
 * Sends a request to the Aptos indexer with the specified options.
 * This function allows you to interact with the Aptos indexer and customize the request using various configurations.
 *
 * @param options - The options for the request to the Aptos indexer.
 * @param options.aptosConfig - Configuration settings specific to the Aptos client and indexer.
 * @param options.aptosConfig.clientConfig - The client configuration settings.
 * @param options.aptosConfig.indexerConfig - The indexer configuration settings.
 * @param options.overrides - Additional overrides for the request.
 * @param options.overrides.HEADERS - Custom headers to include in the request.
 * @group Implementation
 * @category Client
 */
export async function postAptosIndexer<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  const { aptosConfig } = options;

  return post<Req, Res>({
    ...options,
    type: AptosApiType.INDEXER,
    overrides: {
      ...aptosConfig.clientConfig,
      ...aptosConfig.indexerConfig,
      ...options.overrides,
      HEADERS: { ...aptosConfig.clientConfig?.HEADERS, ...aptosConfig.indexerConfig?.HEADERS },
    },
  });
}

/**
 * Sends a request to the Aptos faucet to obtain test tokens.
 * This function modifies the provided configuration to ensure that the API_KEY is not included in the request.
 *
 * Note that only devnet has a publicly accessible faucet. For testnet, you must use
 * the minting page at https://aptos.dev/network/faucet.
 *
 * @param options - The options for the request.
 * @param options.aptosConfig - The configuration settings for the Aptos client.
 * @param options.aptosConfig.clientConfig - The client-specific configuration settings.
 * @param options.aptosConfig.clientConfig.HEADERS - Optional headers to include in the request.
 * @param options.aptosConfig.faucetConfig - The configuration settings specific to the faucet.
 * @param options.overrides - Additional overrides for the request configuration.
 * @group Implementation
 * @category Client
 */
export async function postAptosFaucet<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  const { aptosConfig } = options;
  // Faucet does not support API_KEY
  // Create a new object with the desired modification
  const modifiedAptosConfig = {
    ...aptosConfig,
    clientConfig: { ...aptosConfig.clientConfig },
  };
  // Delete API_KEY config
  delete modifiedAptosConfig?.clientConfig?.API_KEY;

  return post<Req, Res>({
    ...options,
    type: AptosApiType.FAUCET,
    overrides: {
      ...modifiedAptosConfig.clientConfig,
      ...modifiedAptosConfig.faucetConfig,
      ...options.overrides,
      HEADERS: { ...modifiedAptosConfig.clientConfig?.HEADERS, ...modifiedAptosConfig.faucetConfig?.HEADERS },
    },
  });
}

/**
 * Makes a post request to the pepper service.
 *
 * @param options - The options for the request.
 * @param options.url - The URL to which the request is sent.
 * @param options.headers - The headers to include in the request.
 * @param options.body - The body of the request.
 * @returns A promise that resolves to the response from the pepper service.
 * @group Implementation
 * @category Client
 */
export async function postAptosPepperService<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: AptosApiType.PEPPER });
}

/**
 * Sends a request to the Aptos proving service with the specified options.
 *
 * @param options - The options for the request to the Aptos proving service.
 * @param options.type - The type of the request, which should be set to AptosApiType.PROVER.
 * @param options.data - The data to be included in the request.
 * @group Implementation
 * @category Client
 */
export async function postAptosProvingService<Req extends {}, Res extends {}>(
  options: PostAptosRequestOptions,
): Promise<AptosResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: AptosApiType.PROVER });
}
