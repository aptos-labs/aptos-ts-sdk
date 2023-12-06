// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import aptosClient from "@aptos-labs/aptos-client";
import { ILogObj, Logger } from "tslog";
import { AptosSettings, Client, ClientConfig, LogLevel } from "../types";
import { Network, NetworkToFaucetAPI, NetworkToIndexerAPI, NetworkToNodeAPI } from "../utils/apiEndpoints";
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
   * The optional hardcoded fullnode URL to send requests to instead of using the network
   */
  readonly fullnode?: string;

  /**
   * The optional hardcoded faucet URL to send requests to instead of using the network
   */
  readonly faucet?: string;

  /**
   * The optional hardcoded indexer URL to send requests to instead of using the network
   */
  readonly indexer?: string;

  readonly clientConfig?: ClientConfig;

  readonly logger: Logger<ILogObj>;

  constructor(settings?: AptosSettings) {
    this.network = settings?.network ?? DEFAULT_NETWORK;
    this.fullnode = settings?.fullnode;
    this.faucet = settings?.faucet;
    this.indexer = settings?.indexer;
    this.client = settings?.client ?? { provider: aptosClient };
    this.clientConfig = settings?.clientConfig ?? {};

    // Default to have logs disabled
    let logFormat: "json" | "hidden" | "pretty" = "hidden";

    // If logs are enabled, default to JSON output
    if (settings?.logConfig?.logEnabled) {
      logFormat = settings?.logConfig?.logFormat ?? "json";
    }

    // Default to info level logs
    const logLevel = settings?.logConfig?.logLevel ?? LogLevel.info;
    this.logger = new Logger({
      name: `Aptos-${this.network}`,
      minLevel: logLevel,
      type: logFormat,
    });
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
      case AptosApiType.FULLNODE:
        if (this.fullnode !== undefined) return this.fullnode;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom full node url");
        return NetworkToNodeAPI[this.network];
      case AptosApiType.FAUCET:
        if (this.faucet !== undefined) return this.faucet;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom faucet url");
        return NetworkToFaucetAPI[this.network];
      case AptosApiType.INDEXER:
        if (this.indexer !== undefined) return this.indexer;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom indexer url");
        return NetworkToIndexerAPI[this.network];
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
    return NetworkToIndexerAPI[this.network] === url;
  }
}
