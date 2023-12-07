// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import aptosClient from "@aptos-labs/aptos-client";
import { AptosSettings, ClientConfig, Client } from "../types";
import { NetworkToNodeV1API, NetworkToFaucetAPI, NetworkToIndexerV1API, Network } from "../utils/apiEndpoints";
import { AptosApiType, DEFAULT_NETWORK } from "../utils/const";

/**
 * This class holds the config information for the SDK client instance.
 */
export class AptosConfig {
  /** The Network that this SDK is associated with. Defaults to DEVNET */
  readonly network: Network;

  /**
   * The client instance the SDK uses. Defaults to `@aptos-labs/aptos-client
   */
  readonly client: Client;

  /**
   * The optional hardcoded fullnode URL to send requests to instead of using the network.
   *
   * This should be of the form:
   * - `http(s)://<host>:<port>`
   *
   * @example
   * ```typescript
   *   const localFullnode = "http://localhost:8080";
   *   const customFullnode = "https://my-fullnode.com";
   * ```
   */
  readonly fullnode?: string;

  /**
   * The optional hardcoded faucet URL to send requests to instead of using the network
   *
   * This should be of the form:
   * - `http(s)://<host>:<port>`
   *
   *  @example
   *    * ```typescript
   *    *   const localFullnode = "http://localhost:8081";
   *    *   const customFullnode = "https://my-faucet.com";
   *    * ```
   */
  readonly faucet?: string;

  /**
   * The optional hardcoded indexer URL to send requests to instead of using the network
   *
   * This should be of the form:
   * - `http(s)://<host>:<port>`
   *
   *  @example
   *    * ```typescript
   *    *   const localFullnode = "http://localhost:8081";
   *    *   const customFullnode = "https://my-indexer.com";
   *    * ```
   */
  readonly indexer?: string;

  readonly clientConfig?: ClientConfig;

  constructor(settings?: AptosSettings) {
    this.network = settings?.network ?? DEFAULT_NETWORK;
    this.fullnode = settings?.fullnode;
    this.faucet = settings?.faucet;
    this.indexer = settings?.indexer;
    this.client = settings?.client ?? { provider: aptosClient };
    this.clientConfig = settings?.clientConfig ?? {};
  }

  /**
   * Returns the URL endpoint to send the request to.
   * If a custom URL was provided in the config, that URL is returned.
   * If a custom URL was provided but not URL endpoints, an error is thrown.
   * Otherwise, the URL endpoint is derived from the network.
   *
   * @param apiType - The type of Aptos API to get the URL for.
   *
   * @internal
   */
  getRequestUrl(apiType: AptosApiType): string {
    switch (apiType) {
      case AptosApiType.FULLNODE_V1:
        if (this.fullnode !== undefined) {
          // For V1 REST API, ensure it ends with a /v1
          const fullnodeUrl = this.fullnode;
          if (fullnodeUrl.endsWith("/v1")) return fullnodeUrl;
          return `${fullnodeUrl}/v1`;
        }
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom full node url");
        return NetworkToNodeV1API[this.network];
      case AptosApiType.FAUCET:
        if (this.faucet !== undefined) return this.faucet;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom faucet url");
        return NetworkToFaucetAPI[this.network];
      case AptosApiType.INDEXER_V1:
        if (this.indexer !== undefined) {
          // For V1 indexer API, ensure it ends with a /v1/graphql
          const indexerUrl = this.indexer;
          if (indexerUrl.endsWith("/v1/graphql")) return indexerUrl;
          return `${indexerUrl}/v1/graphql`;
        }
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom indexer url");
        return NetworkToIndexerV1API[this.network];
      default:
        throw Error(`apiType ${apiType} is not supported`);
    }
  }

  /**
   * Checks if the URL is a known indexer endpoint
   *
   * @internal
   * */
  isIndexerRequest(url: string): boolean {
    return NetworkToIndexerV1API[this.network] === url;
  }
}
