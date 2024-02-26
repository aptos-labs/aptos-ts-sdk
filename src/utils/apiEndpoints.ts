// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "https://indexer.mainnet.aptoslabs.com/v1/graphql",
  testnet: "https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql",
  devnet: "https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql",
  local: "http://127.0.0.1:8090/v1/graphql",
};

export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "https://fullnode.mainnet.aptoslabs.com/v1",
  testnet: "https://fullnode.testnet.aptoslabs.com/v1",
  devnet: "https://fullnode.devnet.aptoslabs.com/v1",
  local: "http://127.0.0.1:8080/v1",
};

export const NetworkToFaucetAPI: Record<string, string> = {
  mainnet: "https://faucet.mainnet.aptoslabs.com",
  testnet: "https://faucet.testnet.aptoslabs.com",
  devnet: "https://faucet.devnet.aptoslabs.com",
  local: "http://127.0.0.1:8081",
};

export const NetworkToPepperAPI: Record<string, string> = {
  mainnet: "https://aptos-zkid-pepper-service-6vgsvc5oma-uc.a.run.app",
  testnet: "https://aptos-zkid-pepper-service-6vgsvc5oma-uc.a.run.app",
  devnet: "http://127.0.0.1:8000",
  local: "http://127.0.0.1:8000",
};

export const NetworkToProverAPI: Record<string, string> = {
  mainnet: "TODO",
  testnet: "https://prover-service-image-c6wgp6n6ia-uc.a.run.app",
  devnet: "https://prover-service-image-c6wgp6n6ia-uc.a.run.app",
  local: "http://35.236.15.8:8080",
};

export enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  DEVNET = "devnet",
  LOCAL = "local",
  CUSTOM = "custom",
}

export const NetworkToChainId: Record<string, number> = {
  mainnet: 1,
  testnet: 2,
};

export const NetworkToNetworkName: Record<string, Network> = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
  local: Network.LOCAL,
  custom: Network.CUSTOM,
};
