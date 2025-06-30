// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { CedraConfig } from "../api/cedraConfig";
import { cedraRequest } from "./core";
import { CedraResponse, AnyNumber, ClientConfig, MimeType } from "../types";
import { CedraApiType } from "../utils/const";

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
  cedraConfig: CedraConfig;
  /**
   * The type of API endpoint to call e.g. fullnode, indexer, etc
   * @group Implementation
   * @category Client
   */
  type: CedraApiType;
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
   * Specific client overrides for this request to override cedraConfig
   * @group Implementation
   * @category Client
   */
  overrides?: ClientConfig;
};

/**
 * Options for posting a request to Cedra, excluding the type field.
 * @group Implementation
 * @category Client
 */
export type PostCedraRequestOptions = Omit<PostRequestOptions, "type">;

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
 * @param options.cedraConfig - Configuration settings for the Cedra request.
 * @param options.overrides - Any overrides for the default request behavior.
 * @returns The response from the POST request.
 * @group Implementation
 * @category Client
 */
export async function post<Req extends {}, Res extends {}>(
  options: PostRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { type, originMethod, path, body, acceptType, contentType, params, cedraConfig, overrides } = options;
  const url = cedraConfig.getRequestUrl(type);

  return cedraRequest<Req, Res>(
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
    cedraConfig,
    options.type,
  );
}

/**
 * Sends a request to the Cedra full node using the specified options.
 * This function allows you to interact with the Cedra blockchain by sending requests to the full node.
 *
 * @param options - The options for the request.
 * @param options.cedraConfig - Configuration settings for the Cedra client.
 * @param options.cedraConfig.clientConfig - Client-specific configuration settings.
 * @param options.cedraConfig.fullnodeConfig - Full node-specific configuration settings.
 * @param options.overrides - Additional overrides for the request.
 * @group Implementation
 * @category Client
 */
export async function postCedraFullNode<Req extends {}, Res extends {}>(
  options: PostCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { cedraConfig } = options;

  return post<Req, Res>({
    ...options,
    type: CedraApiType.FULLNODE,
    overrides: {
      ...cedraConfig.clientConfig,
      ...cedraConfig.fullnodeConfig,
      ...options.overrides,
      HEADERS: { ...cedraConfig.clientConfig?.HEADERS, ...cedraConfig.fullnodeConfig?.HEADERS },
    },
  });
}

/**
 * Sends a request to the Cedra indexer with the specified options.
 * This function allows you to interact with the Cedra indexer and customize the request using various configurations.
 *
 * @param options - The options for the request to the Cedra indexer.
 * @param options.cedraConfig - Configuration settings specific to the Cedra client and indexer.
 * @param options.cedraConfig.clientConfig - The client configuration settings.
 * @param options.cedraConfig.indexerConfig - The indexer configuration settings.
 * @param options.overrides - Additional overrides for the request.
 * @param options.overrides.HEADERS - Custom headers to include in the request.
 * @group Implementation
 * @category Client
 */
export async function postCedraIndexer<Req extends {}, Res extends {}>(
  options: PostCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { cedraConfig } = options;

  return post<Req, Res>({
    ...options,
    type: CedraApiType.INDEXER,
    overrides: {
      ...cedraConfig.clientConfig,
      ...cedraConfig.indexerConfig,
      ...options.overrides,
      HEADERS: { ...cedraConfig.clientConfig?.HEADERS, ...cedraConfig.indexerConfig?.HEADERS },
    },
  });
}

/**
 * Sends a request to the Cedra faucet to obtain test tokens.
 * This function modifies the provided configuration to ensure that the API_KEY is not included in the request.
 *
 * Note that only devnet has a publicly accessible faucet. For testnet, you must use
 * the minting page at https://faucet-api.cedra.dev.
 *
 * @param options - The options for the request.
 * @param options.cedraConfig - The configuration settings for the Cedra client.
 * @param options.cedraConfig.clientConfig - The client-specific configuration settings.
 * @param options.cedraConfig.clientConfig.HEADERS - Optional headers to include in the request.
 * @param options.cedraConfig.faucetConfig - The configuration settings specific to the faucet.
 * @param options.overrides - Additional overrides for the request configuration.
 * @group Implementation
 * @category Client
 */
export async function postCedraFaucet<Req extends {}, Res extends {}>(
  options: PostCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { cedraConfig } = options;
  // Faucet does not support API_KEY
  // Create a new object with the desired modification
  const modifiedCedraConfig = {
    ...cedraConfig,
    clientConfig: { ...cedraConfig.clientConfig },
  };
  // Delete API_KEY config
  delete modifiedCedraConfig?.clientConfig?.API_KEY;

  return post<Req, Res>({
    ...options,
    type: CedraApiType.FAUCET,
    overrides: {
      ...modifiedCedraConfig.clientConfig,
      ...modifiedCedraConfig.faucetConfig,
      ...options.overrides,
      HEADERS: { ...modifiedCedraConfig.clientConfig?.HEADERS, ...modifiedCedraConfig.faucetConfig?.HEADERS },
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
export async function postCedraPepperService<Req extends {}, Res extends {}>(
  options: PostCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: CedraApiType.PEPPER });
}

/**
 * Sends a request to the Cedra proving service with the specified options.
 *
 * @param options - The options for the request to the Cedra proving service.
 * @param options.type - The type of the request, which should be set to CedraApiType.PROVER.
 * @param options.data - The data to be included in the request.
 * @group Implementation
 * @category Client
 */
export async function postCedraProvingService<Req extends {}, Res extends {}>(
  options: PostCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  return post<Req, Res>({ ...options, type: CedraApiType.PROVER });
}
