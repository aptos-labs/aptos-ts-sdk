/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to get whitelist Registry.
 *
 */
import { Cedra, CedraConfig, Network, NetworkToNetworkName } from "@cedra-labs/ts-sdk";

const CEDRA_NETWORK: Network = NetworkToNetworkName[Network.DEVNET];

const example = async () => {
  const cedraConfig = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(cedraConfig);

  const result = await cedra.get_whitelist({});
  console.log("Whitelist registry: ", result);
};

example();
