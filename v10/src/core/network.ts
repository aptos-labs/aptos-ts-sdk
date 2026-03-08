/** The available Aptos network environments. Used to configure SDK clients. */
export enum Network {
  /** The production Aptos mainnet. */
  MAINNET = "mainnet",
  /** The long-lived Aptos testnet for integration testing. */
  TESTNET = "testnet",
  /** The Aptos devnet for development (resets frequently). */
  DEVNET = "devnet",
  /** The Shelby experimental network. */
  SHELBYNET = "shelbynet",
  /** The Netna staging network. */
  NETNA = "netna",
  /** A locally running Aptos node (e.g., via `aptos node run-localnet`). */
  LOCAL = "local",
  /** A custom network with user-specified endpoints. */
  CUSTOM = "custom",
}

/** Maps network names to their GraphQL indexer API endpoints. */
export const NetworkToIndexerAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1/graphql",
  testnet: "https://api.testnet.aptoslabs.com/v1/graphql",
  devnet: "https://api.devnet.aptoslabs.com/v1/graphql",
  shelbynet: "https://api.shelbynet.shelby.xyz/v1/graphql",
  netna: "https://api.netna.staging.aptoslabs.com/v1/graphql",
  local: "http://127.0.0.1:8090/v1/graphql",
};

/** Maps network names to their full node REST API endpoints. */
export const NetworkToNodeAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/v1",
  testnet: "https://api.testnet.aptoslabs.com/v1",
  devnet: "https://api.devnet.aptoslabs.com/v1",
  shelbynet: "https://api.shelbynet.shelby.xyz/v1",
  netna: "https://api.netna.staging.aptoslabs.com/v1",
  local: "http://127.0.0.1:8080/v1",
};

/** Maps network names to their faucet API endpoints (not all networks have faucets). */
export const NetworkToFaucetAPI: Record<string, string> = {
  devnet: "https://faucet.devnet.aptoslabs.com",
  shelbynet: "https://faucet.shelbynet.shelby.xyz",
  netna: "https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app",
  local: "http://127.0.0.1:8081",
};

/** Maps network names to their Keyless pepper service API endpoints. */
export const NetworkToPepperAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/pepper/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/pepper/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
  shelbynet: "https://api.shelbynet.aptoslabs.com/keyless/pepper/v0",
  netna: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
  local: "https://api.devnet.aptoslabs.com/keyless/pepper/v0",
};

/** Maps network names to their Keyless prover service API endpoints. */
export const NetworkToProverAPI: Record<string, string> = {
  mainnet: "https://api.mainnet.aptoslabs.com/keyless/prover/v0",
  testnet: "https://api.testnet.aptoslabs.com/keyless/prover/v0",
  devnet: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
  shelbynet: "https://api.shelbynet.aptoslabs.com/keyless/prover/v0",
  netna: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
  local: "https://api.devnet.aptoslabs.com/keyless/prover/v0",
};

/** Maps network names to their known chain IDs (only networks with stable chain IDs are included). */
export const NetworkToChainId: Record<string, number> = {
  mainnet: 1,
  testnet: 2,
  local: 4,
};

/** Maps network name strings to their corresponding {@link Network} enum values. */
export const NetworkToNetworkName: Record<string, Network> = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
  shelbynet: Network.SHELBYNET,
  netna: Network.NETNA,
  local: Network.LOCAL,
  custom: Network.CUSTOM,
};
