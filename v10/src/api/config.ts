// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { ClientConfig, FaucetConfig, FullNodeConfig, IndexerConfig } from "../client/types.js";
import { AptosApiType, DEFAULT_MAX_GAS_AMOUNT, DEFAULT_TXN_EXP_SEC_FROM_NOW } from "../core/constants.js";
import {
  Network,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToNodeAPI,
  NetworkToPepperAPI,
  NetworkToProverAPI,
} from "../core/network.js";

/**
 * Configuration options for creating an {@link AptosConfig} instance.
 * All fields are optional; sensible defaults are used when omitted.
 */
export interface AptosSettings {
  /** The Aptos network to connect to. Defaults to `Network.DEVNET`. */
  network?: Network;
  /** Custom fullnode REST API URL. Requires `network` to be specified. */
  fullnode?: string;
  /** Custom faucet API URL. Requires `network` to be specified. */
  faucet?: string;
  /** Custom pepper service URL for keyless accounts. Requires `network` to be specified. */
  pepper?: string;
  /** Custom prover service URL for keyless accounts. Requires `network` to be specified. */
  prover?: string;
  /** Custom indexer API URL. Requires `network` to be specified. */
  indexer?: string;
  /** Global client configuration applied to all API requests (headers, API key, etc.). */
  clientConfig?: ClientConfig;
  /** Client configuration overrides specific to fullnode requests. */
  fullnodeConfig?: FullNodeConfig;
  /** Client configuration overrides specific to indexer requests. */
  indexerConfig?: IndexerConfig;
  /** Client configuration overrides specific to faucet requests. */
  faucetConfig?: FaucetConfig;
  /** Default maximum gas amount for transactions. Defaults to {@link DEFAULT_MAX_GAS_AMOUNT}. */
  defaultMaxGasAmount?: number;
  /** Default transaction expiration in seconds from now. Defaults to {@link DEFAULT_TXN_EXP_SEC_FROM_NOW}. */
  defaultTxnExpSecFromNow?: number;
}

/**
 * Holds the resolved configuration for interacting with the Aptos blockchain.
 * Resolves endpoint URLs based on the chosen network and optional custom overrides.
 */
export class AptosConfig {
  /** The Aptos network this config targets. */
  readonly network: Network;
  /** Custom fullnode REST API URL, if provided. */
  readonly fullnode?: string;
  /** Custom faucet API URL, if provided. */
  readonly faucet?: string;
  /** Custom pepper service URL, if provided. */
  readonly pepper?: string;
  /** Custom prover service URL, if provided. */
  readonly prover?: string;
  /** Custom indexer API URL, if provided. */
  readonly indexer?: string;
  /** Global client configuration applied to all API requests. */
  readonly clientConfig?: ClientConfig;
  /** Client configuration overrides for fullnode requests. */
  readonly fullnodeConfig?: FullNodeConfig;
  /** Client configuration overrides for indexer requests. */
  readonly indexerConfig?: IndexerConfig;
  /** Client configuration overrides for faucet requests. */
  readonly faucetConfig?: FaucetConfig;
  /** Default maximum gas amount for transactions. */
  readonly defaultMaxGasAmount: number;
  /** Default transaction expiration in seconds from now. */
  readonly defaultTxnExpSecFromNow: number;

  /**
   * Creates a new AptosConfig instance.
   * @param settings - Optional configuration settings. If custom endpoint URLs are provided,
   *   the `network` field must also be specified.
   */
  constructor(settings?: AptosSettings) {
    if (settings?.fullnode || settings?.indexer || settings?.faucet || settings?.pepper || settings?.prover) {
      if (!settings?.network) {
        throw new Error("Custom endpoints require a network to be specified");
      }
    }

    this.network = settings?.network ?? Network.DEVNET;
    this.fullnode = settings?.fullnode;
    this.faucet = settings?.faucet;
    this.pepper = settings?.pepper;
    this.prover = settings?.prover;
    this.indexer = settings?.indexer;
    this.clientConfig = settings?.clientConfig;
    this.fullnodeConfig = settings?.fullnodeConfig;
    this.indexerConfig = settings?.indexerConfig;
    this.faucetConfig = settings?.faucetConfig;
    this.defaultMaxGasAmount = settings?.defaultMaxGasAmount ?? DEFAULT_MAX_GAS_AMOUNT;
    this.defaultTxnExpSecFromNow = settings?.defaultTxnExpSecFromNow ?? DEFAULT_TXN_EXP_SEC_FROM_NOW;
  }

  /**
   * Resolves the base URL for a given API type, using custom overrides or network defaults.
   * @param apiType - The type of API endpoint to resolve (fullnode, faucet, indexer, etc.).
   * @returns The resolved base URL string.
   * @throws Error if a custom URL is required but not provided.
   */
  getRequestUrl(apiType: AptosApiType): string {
    switch (apiType) {
      case AptosApiType.FULLNODE:
        if (this.fullnode !== undefined) return this.fullnode;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom full node url");
        return NetworkToNodeAPI[this.network];
      case AptosApiType.FAUCET:
        if (this.faucet !== undefined) return this.faucet;
        if (this.network === Network.TESTNET) {
          throw new Error(
            "There is no way to programmatically mint testnet APT, you must use the minting site at https://aptos.dev/network/faucet",
          );
        }
        if (this.network === Network.MAINNET) throw new Error("There is no mainnet faucet");
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom faucet url");
        return NetworkToFaucetAPI[this.network];
      case AptosApiType.INDEXER:
        if (this.indexer !== undefined) return this.indexer;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom indexer url");
        return NetworkToIndexerAPI[this.network];
      case AptosApiType.PEPPER:
        if (this.pepper !== undefined) return this.pepper;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom pepper service url");
        return NetworkToPepperAPI[this.network];
      case AptosApiType.PROVER:
        if (this.prover !== undefined) return this.prover;
        if (this.network === Network.CUSTOM) throw new Error("Please provide a custom prover service url");
        return NetworkToProverAPI[this.network];
      default:
        throw new Error(`apiType ${apiType as string} is not supported`);
    }
  }

  /**
   * Returns the merged client configuration for fullnode requests, combining global, fullnode-specific, and per-call overrides.
   * @param overrides - Optional per-call client configuration overrides.
   * @returns The merged client configuration.
   */
  getMergedFullnodeConfig(overrides?: ClientConfig): ClientConfig {
    return {
      ...this.clientConfig,
      ...this.fullnodeConfig,
      ...overrides,
      HEADERS: { ...this.clientConfig?.HEADERS, ...this.fullnodeConfig?.HEADERS, ...overrides?.HEADERS },
    };
  }

  /**
   * Returns the merged client configuration for indexer requests, combining global, indexer-specific, and per-call overrides.
   * @param overrides - Optional per-call client configuration overrides.
   * @returns The merged client configuration.
   */
  getMergedIndexerConfig(overrides?: ClientConfig): ClientConfig {
    return {
      ...this.clientConfig,
      ...this.indexerConfig,
      ...overrides,
      HEADERS: { ...this.clientConfig?.HEADERS, ...this.indexerConfig?.HEADERS, ...overrides?.HEADERS },
    };
  }

  /**
   * Returns the merged client configuration for faucet requests, combining global and faucet-specific overrides.
   * Note: the `API_KEY` field is excluded for faucet requests.
   * @param overrides - Optional per-call client configuration overrides.
   * @returns The merged client configuration.
   */
  getMergedFaucetConfig(overrides?: ClientConfig): ClientConfig {
    // Faucet does not support API_KEY
    const { API_KEY: _, ...clientConfig } = this.clientConfig ?? {};
    return {
      ...clientConfig,
      ...this.faucetConfig,
      ...overrides,
      HEADERS: { ...clientConfig?.HEADERS, ...this.faucetConfig?.HEADERS, ...overrides?.HEADERS },
    };
  }
}

/**
 * Factory function that creates a new {@link AptosConfig} instance.
 * @param settings - Optional configuration settings.
 * @returns A new AptosConfig instance.
 */
export function createConfig(settings?: AptosSettings): AptosConfig {
  return new AptosConfig(settings);
}
