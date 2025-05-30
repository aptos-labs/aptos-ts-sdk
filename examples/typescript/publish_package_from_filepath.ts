/**
 * This example demonstrates how we can use `cedra.publishPackageTransaction()` method to publish a move package
 * read from a local path.
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Cedra CLI, see https://cedra.dev/cli-tools/cedra-cli/use-cli/install-cedra-cli
 * 2. cd `~/cedra-ts-sdk/examples/typescript`
 * 3. Run `pnpm run publish_package_from_filepath` and follow the prompt
 */
/* eslint-disable no-console */
/* eslint-disable max-len */
import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import { Account, Cedra, CedraConfig, Hex, Network, NetworkToNetworkName } from "@cedra-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK ?? Network.DEVNET];

/** run our demo! */
async function main() {
  const config = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(config);

  const alice = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress}`);

  await cedra.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

  // Please ensure you have the cedra CLI installed
  console.log("\n=== Compiling the package locally ===");
  compilePackage("move/facoin", "move/facoin/facoin.json", [{ name: "FACoin", address: alice.accountAddress }]);

  const { metadataBytes, byteCode } = getPackageBytesToPublish("move/facoin/facoin.json");

  console.log("\n===Publishing FAcoin package===");
  const transaction = await cedra.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const response = await cedra.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });
  console.log(`Transaction hash: ${response.hash}`);
  await cedra.waitForTransaction({
    transactionHash: response.hash,
  });

  console.log("\n===Checking modules onchain===");
  const accountModules = await cedra.getAccountModules({
    accountAddress: alice.accountAddress,
  });
  // published 4 modules
  assert(accountModules.length === 4);
  // first account's module bytecode equals the published bytecode
  assert(accountModules[0].bytecode === `${Hex.fromHexInput(byteCode[0]).toString()}`);
  // second account's module bytecode equals the published bytecode
  assert(accountModules[1].bytecode === `${Hex.fromHexInput(byteCode[1]).toString()}`);
  console.log("Modules onchain check passed");
}

if (require.main === module) {
  main();
}
