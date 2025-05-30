import { CedraConfig } from "../api/cedraConfig";
import { cedraRequest } from "./core";
import { CedraResponse, AnyNumber, ClientConfig, MimeType } from "../types";
import { CedraApiType } from "../utils/const";

/**
 * Options for making a GET request, including configuration for the API client.
 * @group Implementation
 * @category Client
 */
export type GetRequestOptions = {
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
   * Specific client overrides for this request to override cedraConfig
   * @group Implementation
   * @category Client
   */
  overrides?: ClientConfig;
};

/**
 * Options for making a request to the Cedra API, excluding the "type" field.
 * @group Implementation
 * @category Client
 */
export type GetCedraRequestOptions = Omit<GetRequestOptions, "type">;

/**
 * Executes a GET request to retrieve data based on the provided options.
 *
 * @param options - The options for the GET request.
 * @param options.cedraConfig - The configuration object for Cedra requests.
 * @param options.overrides - Optional overrides for the request configuration.
 * @param options.params - Query parameters to include in the request.
 * @param options.contentType - The content type of the request.
 * @param options.acceptType - The accepted response type.
 * @param options.path - The specific path for the request.
 * @param options.originMethod - The original method of the request.
 * @param options.type - The type of request being made.
 * @returns The response from the GET request.
 * @group Implementation
 * @category Client
 */
export async function get<Req extends {}, Res extends {}>(
  options: GetRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { cedraConfig, overrides, params, contentType, acceptType, path, originMethod, type } = options;
  const url = cedraConfig.getRequestUrl(type);

  return cedraRequest<Req, Res>(
    {
      url,
      method: "GET",
      originMethod,
      path,
      contentType,
      acceptType,
      params,
      overrides: {
        ...cedraConfig.clientConfig,
        ...overrides,
      },
    },
    cedraConfig,
    options.type,
  );
}

/**
 * Retrieves data from the Cedra full node using the provided options.
 *
 * @param options - The options for the request to the Cedra full node.
 * @param options.cedraConfig - Configuration settings specific to the Cedra client and full node.
 * @param options.cedraConfig.clientConfig - The client configuration settings.
 * @param options.cedraConfig.fullnodeConfig - The full node configuration settings.
 * @param options.overrides - Additional overrides for the request.
 * @param options.type - The type of API request being made.
 *
 * @returns A promise that resolves with the response from the Cedra full node.
 * @group Implementation
 * @category Client
 */
export async function getCedraFullNode<Req extends {}, Res extends {}>(
  options: GetCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  const { cedraConfig } = options;

  return get<Req, Res>({
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
 * Makes a GET request to the Cedra Pepper service to retrieve data.
 *
 * @param options - The options for the request.
 * @param options.param1 - Description of param1.
 * @param options.param2 - Description of param2.
 * @returns CedraResponse - The response from the Cedra Pepper service.
 * @group Implementation
 * @category Client
 */
export async function getCedraPepperService<Req extends {}, Res extends {}>(
  options: GetCedraRequestOptions,
): Promise<CedraResponse<Req, Res>> {
  return get<Req, Res>({ ...options, type: CedraApiType.PEPPER });
}

/**
 * This function is a helper for paginating using a function wrapping an API
 * @group Implementation
 * @category Client
 */
export async function paginateWithCursor<Req extends Record<string, any>, Res extends Array<{}>>(
  options: GetCedraRequestOptions,
): Promise<Res> {
  const out: Res = new Array(0) as Res;
  let cursor: string | undefined;
  const requestParams = options.params as { start?: string; limit?: number };
  do {
    // eslint-disable-next-line no-await-in-loop
    const response = await get<Req, Res>({
      type: CedraApiType.FULLNODE,
      cedraConfig: options.cedraConfig,
      originMethod: options.originMethod,
      path: options.path,
      params: requestParams,
      overrides: options.overrides,
    });
    /**
     * the cursor is a "state key" from the API perspective. Client
     * should not need to "care" what it represents but just use it
     * to query the next chunk of data.
     * @group Implementation
     * @category Client
     */
    cursor = response.headers["x-cedra-cursor"];
    // Now that we have the cursor (if any), we remove the headers before
    // adding these to the output of this function.
    delete response.headers;
    out.push(...response.data);
    requestParams.start = cursor;
  } while (cursor !== null && cursor !== undefined);
  return out;
}

/// This function is a helper for paginating using a function wrapping an API using offset instead of start
export async function paginateWithObfuscatedCursor<Req extends Record<string, any>, Res extends Array<{}>>(
  options: GetCedraRequestOptions,
): Promise<Res> {
  const out: Res = new Array(0) as Res;
  let cursor: string | undefined;
  const requestParams = options.params as { start?: string; limit?: number };
  const totalLimit = requestParams.limit;
  do {
    // eslint-disable-next-line no-await-in-loop
    const { response, cursor: newCursor } = await getPageWithObfuscatedCursor<Req, Res>({ ...options });

    /**
     * the cursor is a "state key" from the API perspective. Client
     * should not need to "care" what it represents but just use it
     * to query the next chunk of data.
     */
    cursor = newCursor;
    out.push(...response.data);
    if (options?.params) {
      options.params.start = cursor;
    }

    // Re-evaluate length
    if (totalLimit !== undefined) {
      const newLimit = totalLimit - out.length;
      if (newLimit <= 0) {
        break;
      }
      requestParams.limit = newLimit;
    }
  } while (cursor !== null && cursor !== undefined);
  return out;
}

export async function getPageWithObfuscatedCursor<Req extends Record<string, any>, Res extends Array<{}>>(
  options: GetCedraRequestOptions,
): Promise<{ response: CedraResponse<Req, Res>; cursor: string | undefined }> {
  let cursor: string | undefined;
  let requestParams: { start?: string; limit?: number } = {};

  // Drop any other values
  // TODO: Throw error if cursor is not a string
  if (typeof options.params?.cursor === "string") {
    requestParams.start = options.params.cursor;
  }
  if (typeof options.params?.limit === "number") {
    requestParams.limit = options.params.limit;
  }

  // eslint-disable-next-line no-await-in-loop
  const response = await get<Req, Res>({
    type: CedraApiType.FULLNODE,
    cedraConfig: options.cedraConfig,
    originMethod: options.originMethod,
    path: options.path,
    params: requestParams,
    overrides: options.overrides,
  });

  /**
   * the cursor is a "state key" from the API perspective. Client
   * should not need to "care" what it represents but just use it
   * to query the next chunk of data.
   */
  cursor = response.headers["x-cedra-cursor"];
  return { response, cursor };
}
