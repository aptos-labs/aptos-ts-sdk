// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1/graphql",
  testnet: "https://api.testnet.aptoslabs.com/v1/graphql",
  devnet: "https://api.devnet.aptoslabs.com/v1/graphql",
  shelbynet: "https://api.shelbynet.shelby.xyz/v1/graphql",
  netna: "https://api.netna.staging.aptoslabs.com/v1/graphql",
  local: "http://127.0.0.1:8090/v1/graphql",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1",
  testnet: "https://api.testnet.aptoslabs.com/v1",
  devnet: "https://api.devnet.aptoslabs.com/v1",
  shelbynet: "https://api.shelbynet.shelby.xyz/v1",
  netna: "https://api.netna.staging.aptoslabs.com/v1",
  local: "http://127.0.0.1:8080/v1",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToFaucetAPI: Record<string, string> = {
  devnet: "https://faucet.devnet.aptoslabs.com",
  shelbynet: "https://faucet.shelbynet.shelby.xyz",
  netna: "https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app",
  local: "http://127.0.0.1:8081",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToPepperAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/pepper/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/pepper/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
  shelbynet: "https://api.shelbynet.aptoslabs.com/keyless/pepper/v0",
  netna: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
  // Use the devnet service for local environment
  local: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
};

/**
 * @group Implementation
 * @category Network
 */
export const NetworkToProverAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/prover/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/prover/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
  shelbynet: "https://api.shelbynet.aptoslabs.com/keyless/prover/v0",
  netna: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
  // Use the devnet service for local environment
  local: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
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
  SHELBYNET = "shelbynet",
  NETNA = "netna",
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
  shelbynet: Network.SHELBYNET,
  netna: Network.NETNA,
  local: Network.LOCAL,
  custom: Network.CUSTOM,
};
