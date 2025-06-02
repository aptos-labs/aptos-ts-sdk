// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.cedralabs.com/v1/graphql",
  testnet: "https://api.testnet.cedralabs.com/v1/graphql",
  devnet: "https://testnet.cedra.dev/v1/graphql",
  local: "http://127.0.0.1:8090/v1/graphql",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.cedralabs.com/v1",
  testnet: "https://testnet.cedra.dev/v1",
  devnet: "https://testnet.cedra.dev/v1",
  local: "http://127.0.0.1:8080/v1",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToFaucetAPI: Record<string, string> = {
  devnet: "https://faucet-api.cedra.dev",
  local: "http://127.0.0.1:8081",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToPepperAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.cedralabs.com/keyless/pepper/v0",
  testnet: "https://api.testnet.cedralabs.com/keyless/pepper/v0",
  devnet: "https://testnet.cedra.dev/keyless/pepper/v0",
  // Use the devnet service for local environment
  local: "https://testnet.cedra.dev/keyless/pepper/v0",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToProverAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.cedralabs.com/keyless/prover/v0",
  testnet: "https://api.testnet.cedralabs.com/keyless/prover/v0",
  devnet: "https://testnet.cedra.dev/keyless/prover/v0",
  // Use the devnet service for local environment
  local: "https://testnet.cedra.dev/keyless/prover/v0",
};

/**
 * Different network environments for connecting to services, ranging from production to development setups.
 * @group Implementation
 * @category Network
 */
export enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  DEVNET = "devnet",
  LOCAL = "local",
  CUSTOM = "custom",
}

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToChainId: Record<string, number> = {
  mainnet: 1,
  testnet: 2,
  local: 4,
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToNetworkName: Record<string, Network> = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
  local: Network.LOCAL,
  custom: Network.CUSTOM,
};
