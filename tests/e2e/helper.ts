import { Cedra, CedraConfig, Network, NetworkToNetworkName } from "../../src";

/**
 * Use this function whenever you want an Cedra client.
 *
 * By default it uses Network.TESTNET. You can change this in one of two ways:
 *
 * 1. If you set the CEDRA_NETWORK env var, it will use that Network. For example,
 *    export CEDRA_NETWORK=devnet.
 * 2. For more control, you can set the CEDRA_NODE_API_URL, CEDRA_INDEXER_API_URL, and
 *    CEDRA_FAUCET_API_URL env vars.
 *
 * The CEDRA_NETWORK env var is applied first, followed by the others. So if you set
 * CEDRA_NETWORK=devnet and CEDRA_NODE_API_URL=http://localhost:8080, it will use the
 * given URL for the node API and the default URLs for devnet for the other APIs.
 */
export function getCedraClient(additionalConfig?: Partial<CedraConfig>): { cedra: Cedra; config: CedraConfig } {
  const networkRaw = process.env.CEDRA_NETWORK;
  const network = networkRaw ? NetworkToNetworkName[networkRaw] : Network.TESTNET;
  if (!network) {
    throw new Error(`Unknown network, confirm CEDRA_NETWORK env var is valid: ${networkRaw}`);
  }
  const config = new CedraConfig({
    network,
    fullnode: "https://testnet.cedra.dev/v1",
    indexer: "https://graphql.cedra.dev/v1/graphql",
    faucet: "https://faucet-api.cedra.dev",
    ...additionalConfig,
  });
  const cedra = new Cedra(config);
  return { cedra, config };
}
