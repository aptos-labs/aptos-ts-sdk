// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import cedraClient from "@cedra-labs/cedra-client";
import { CedraSettings, ClientConfig, Client, FullNodeConfig, IndexerConfig, FaucetConfig } from "../types";
import {
  NetworkToNodeAPI,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  Network,
  NetworkToPepperAPI,
  NetworkToProverAPI,
} from "../utils/apiEndpoints";
import { CedraApiType } from "../utils/const";

/**
 * Represents the configuration settings for an Cedra SDK client instance.
 * This class allows customization of various endpoints and client settings.
 *
 * @example
 * ```typescript
 * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
 *
 * async function runExample() {
 *     // Create a configuration for connecting to the Cedra testnet
 *     const config = new CedraConfig({ network: Network.TESTNET });
 *
 *     // Initialize the Cedra client with the configuration
 *     const cedra = new Cedra(config);
 *
 *     console.log("Cedra client initialized:", cedra);
 * }
 * runExample().catch(console.error);
 * ```
 * @group Client
 */
export class CedraConfig {
  /**
   * The Network that this SDK is associated with. Defaults to DEVNET
   * @group Client
   */
  readonly network: Network;

  /**
   * The client instance the SDK uses. Defaults to `@cedra-labs/cedra-client
   * @group Client
   */
  readonly client: Client;

  /**
   * The optional hardcoded fullnode URL to send requests to instead of using the network
   * @group Client
   */
  readonly fullnode?: string;

  /**
   * The optional hardcoded faucet URL to send requests to instead of using the network
   * @group Client
   */
  readonly faucet?: string;

  /**
   * The optional hardcoded pepper service URL to send requests to instead of using the network
   * @group Client
   */
  readonly pepper?: string;

  /**
   * The optional hardcoded prover service URL to send requests to instead of using the network
   * @group Client
   */
  readonly prover?: string;

  /**
   * The optional hardcoded indexer URL to send requests to instead of using the network
   * @group Client
   */
  readonly indexer?: string;

  /**
   * Optional client configurations
   * @group Client
   */
  readonly clientConfig?: ClientConfig;

  /**
   * Optional specific Fullnode configurations
   * @group Client
   */
  readonly fullnodeConfig?: FullNodeConfig;

  /**
   * Optional specific Indexer configurations
   * @group Client
   */
  readonly indexerConfig?: IndexerConfig;

  /**
   * Optional specific Faucet configurations
   * @group Client
   */
  readonly faucetConfig?: FaucetConfig;

  /**
   * Initializes an instance of the Cedra client with the specified settings.
   * This allows users to configure various aspects of the client, such as network and endpoints.
   *
   * @param settings - Optional configuration settings for the Cedra client.
   * @param settings.network - The network to connect to, defaults to `Network.DEVNET`.
   * @param settings.fullnode - The fullnode endpoint to use for requests.
   * @param settings.faucet - The faucet endpoint for obtaining test tokens.
   * @param settings.pepper - The pepper used for transaction signing.
   * @param settings.prover - The prover endpoint for transaction verification.
   * @param settings.indexer - The indexer endpoint for querying blockchain data.
   * @param settings.client - Custom client settings, defaults to a standard Cedra client.
   * @param settings.clientConfig - Additional configuration for the client.
   * @param settings.fullnodeConfig - Additional configuration for the fullnode.
   * @param settings.indexerConfig - Additional configuration for the indexer.
   * @param settings.faucetConfig - Additional configuration for the faucet.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Cedra client with default settings
   *     const config = new CedraConfig({ network: Network.TESTNET }); // Specify the network
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Client
   */
  constructor(settings?: CedraSettings) {
    // If there are any endpoint overrides, they are custom networks, keep that in mind
    if (settings?.fullnode || settings?.indexer || settings?.faucet || settings?.pepper || settings?.prover) {
      if (settings?.network === Network.CUSTOM) {
        console.info("Note: using CUSTOM network will require queries to lookup ChainId");
      } else if (!settings?.network) {
        throw new Error("Custom endpoints require a network to be specified");
      }
    }

    this.network = settings?.network ?? Network.DEVNET;
    this.fullnode = settings?.fullnode;
    this.faucet = settings?.faucet;
    this.pepper = settings?.pepper;
    this.prover = settings?.prover;
    this.indexer = settings?.indexer;
    this.client = settings?.client ?? { provider: cedraClient };
    this.clientConfig = settings?.clientConfig ?? {};
    this.fullnodeConfig = settings?.fullnodeConfig ?? {};
    this.indexerConfig = settings?.indexerConfig ?? {};
    this.faucetConfig = settings?.faucetConfig ?? {};
  }

  /**
   * Returns the URL endpoint to send the request to based on the specified API type.
   * If a custom URL was provided in the configuration, that URL is returned. Otherwise, the URL endpoint is derived from the network.
   *
   * @param apiType - The type of Cedra API to get the URL for. This can be one of the following: FULLNODE, FAUCET, INDEXER, PEPPER, PROVER.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network, CedraApiType } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Getting the request URL for the FULLNODE API
   *   const url = config.getRequestUrl(CedraApiType.FULLNODE);
   *   console.log("Request URL for FULLNODE:", url);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Client
   */
  getRequestUrl(apiType: CedraApiType): string {
    switch (apiType) {
      case CedraApiType.FULLNODE:
        if (this.fullnode !== undefined) return this.fullnode;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom full node url");
        return NetworkToNodeAPI[this.network];
      case CedraApiType.FAUCET:
        if (this.faucet !== undefined) return this.faucet;
        if (this.network === Network.MAINNET) {
          throw new Error("There is no mainnet faucet");
        }
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom faucet url");
        return NetworkToFaucetAPI[this.network];
      case CedraApiType.INDEXER:
        if (this.indexer !== undefined) return this.indexer;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom indexer url");
        return NetworkToIndexerAPI[this.network];
      case CedraApiType.PEPPER:
        if (this.pepper !== undefined) return this.pepper;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom pepper service url");
        return NetworkToPepperAPI[this.network];
      case CedraApiType.PROVER:
        if (this.prover !== undefined) return this.prover;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom prover service url");
        return NetworkToProverAPI[this.network];
      default:
        throw Error(`apiType ${apiType} is not supported`);
    }
  }

  /**
   * Checks if the provided URL is a known pepper service endpoint.
   *
   * @param url - The URL to check against the known pepper service endpoints.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *     const url = "https://example.pepper.service"; // replace with a real pepper service URL
   *
   *     // Check if the URL is a known pepper service endpoint
   *     const isPepperService = config.isPepperServiceRequest(url);
   *
   *     console.log(`Is the URL a known pepper service? ${isPepperService}`);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Client
   */
  isPepperServiceRequest(url: string): boolean {
    return NetworkToPepperAPI[this.network] === url;
  }

  /**
   * Checks if the provided URL is a known prover service endpoint.
   *
   * @param url - The URL to check against known prover service endpoints.
   * @returns A boolean indicating whether the URL is a known prover service endpoint.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * // Check if the URL is a known prover service endpoint
   * const url = "https://prover.testnet.cedra.dev"; // replace with a real URL if needed
   * const isProver = config.isProverServiceRequest(url);
   *
   * console.log(`Is the URL a known prover service? ${isProver}`);
   * ```
   * @group Client
   */
  isProverServiceRequest(url: string): boolean {
    return NetworkToProverAPI[this.network] === url;
  }
}
