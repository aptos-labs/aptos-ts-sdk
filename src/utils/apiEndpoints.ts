// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1/graphql",
  testnet: "https://api.testnet.aptoslabs.com/v1/graphql",
  devnet: "https://api.devnet.aptoslabs.com/v1/graphql",
  local: "http://127.0.0.1:8090/v1/graphql",
};

export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1",
  testnet: "https://api.testnet.aptoslabs.com/v1",
  devnet: "https://api.devnet.aptoslabs.com/v1",
  local: "http://127.0.0.1:8080/v1",
};

export const NetworkToFaucetAPI: Record<string, string> = {
  mainnet: "https://faucet.mainnet.aptoslabs.com",
  testnet: "https://faucet.testnet.aptoslabs.com",
  devnet: "https://faucet.devnet.aptoslabs.com",
  local: "http://127.0.0.1:8081",
};

export const NetworkToPepperAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/pepper/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/pepper/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
  // Use the devnet service for local environment
  local: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
};

export const NetworkToProverAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/prover/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/prover/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
  // Use the devnet service for local environment
  local: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
};

/**
 * Different network environments for connecting to services, ranging from production to development setups.
 */
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
  local: 4,
};

export const NetworkToNetworkName: Record<string, Network> = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
  local: Network.LOCAL,
  custom: Network.CUSTOM,
};
