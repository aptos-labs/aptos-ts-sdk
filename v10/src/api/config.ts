// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosApiType, DEFAULT_MAX_GAS_AMOUNT, DEFAULT_TXN_EXP_SEC_FROM_NOW } from "../core/constants.js";
import {
  Network,
  NetworkToNodeAPI,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToPepperAPI,
  NetworkToProverAPI,
} from "../core/network.js";
import type { ClientConfig, FullNodeConfig, IndexerConfig, FaucetConfig } from "../client/types.js";

export interface AptosSettings {
  network?: Network;
  fullnode?: string;
  faucet?: string;
  pepper?: string;
  prover?: string;
  indexer?: string;
  clientConfig?: ClientConfig;
  fullnodeConfig?: FullNodeConfig;
  indexerConfig?: IndexerConfig;
  faucetConfig?: FaucetConfig;
  defaultMaxGasAmount?: number;
  defaultTxnExpSecFromNow?: number;
}

export class AptosConfig {
  readonly network: Network;
  readonly fullnode?: string;
  readonly faucet?: string;
  readonly pepper?: string;
  readonly prover?: string;
  readonly indexer?: string;
  readonly clientConfig?: ClientConfig;
  readonly fullnodeConfig?: FullNodeConfig;
  readonly indexerConfig?: IndexerConfig;
  readonly faucetConfig?: FaucetConfig;
  readonly defaultMaxGasAmount: number;
  readonly defaultTxnExpSecFromNow: number;

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

  getMergedFullnodeConfig(overrides?: ClientConfig): ClientConfig {
    return {
      ...this.clientConfig,
      ...this.fullnodeConfig,
      ...overrides,
      HEADERS: { ...this.clientConfig?.HEADERS, ...this.fullnodeConfig?.HEADERS, ...overrides?.HEADERS },
    };
  }

  getMergedIndexerConfig(overrides?: ClientConfig): ClientConfig {
    return {
      ...this.clientConfig,
      ...this.indexerConfig,
      ...overrides,
      HEADERS: { ...this.clientConfig?.HEADERS, ...this.indexerConfig?.HEADERS, ...overrides?.HEADERS },
    };
  }

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

export function createConfig(settings?: AptosSettings): AptosConfig {
  return new AptosConfig(settings);
}
