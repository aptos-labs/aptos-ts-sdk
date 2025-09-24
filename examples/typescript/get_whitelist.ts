/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to get whitelist Registry.
 *
 */
import "dotenv";
import {
  Account,
  AccountAddress,
  Cedra,
  CedraConfig,
  Ed25519PrivateKey,
  InputViewFunctionData,
  Network,
  NetworkToNetworkName,
} from "@cedra-labs/ts-sdk";
import { createInterface } from "readline";
// Default to devnet, but allow for overriding
const CEDRA_NETWORK: Network = NetworkToNetworkName[Network.DEVNET];

const example = async () => {
  const cedraConfig = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(cedraConfig);

  const result = await cedra.get_whitelist({});
  console.log("Whitelist registry: ", result);
};

example();
