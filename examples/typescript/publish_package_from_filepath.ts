/**
 * This example demonstrate how we can use `aptos.publishPackageTransaction()` method to publish a move package
 * read from a local path.
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Aptos CLI, see https://aptos.dev/cli-tools/aptos-cli/use-cli/install-aptos-cli
 * 2. cd `~/aptos-ts-sdk/examples/typescript`
 * 3. Run `pnpm run publish_package_from_filepath` and follow the prompt
 */
/* eslint-disable no-console */
/* eslint-disable max-len */

import assert from "assert";
import fs from "fs";
import path from "path";
import { Account, Aptos, AptosConfig, Hex, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { compilePackage } from "./utils";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;

/** run our demo! */
async function main() {
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  const alice = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress}`);

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

  // Please ensure you have the aptos CLI installed
  console.log("\n=== Compiling the package locally ===");
  compilePackage("facoin", "facoin/facoin.json", [{ name: "FACoin", address: alice.accountAddress }]);

  // current working directory - the root folder of this repo
  const cwd = process.cwd();
  // target directory - current working directory + facoin/facoin.json (facoin.json is generated with the prevoius cli command)
  const modulePath = path.join(cwd, "facoin/facoin.json");

  const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

  const metadataBytes = jsonData.args[0].value;
  const byteCode = jsonData.args[1].value;

  console.log("\n===Publishing FAcoin package===");
  const transaction = await aptos.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const response = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });
  console.log(`Transaction hash: ${response.hash}`);
  await aptos.waitForTransaction({
    transactionHash: response.hash,
  });

  console.log("\n===Checking modules onchain===");
  const accountModules = await aptos.getAccountModules({
    accountAddress: alice.accountAddress,
  });
  // published 2 modules
  assert(accountModules.length === 2);
  // first account's module bytecode equals the published bytecode
  assert(accountModules[0].bytecode === `${Hex.fromHexInput(byteCode[0]).toString()}`);
  // second account's module bytecode equals the published bytecode
  assert(accountModules[1].bytecode === `${Hex.fromHexInput(byteCode[1]).toString()}`);
  console.log("Modules onchain check passed");
}

if (require.main === module) {
  main();
}
