/**
 * This example demonstrate how we can use `aptos.publishPackageTransaction()` method to publish a move package
 * read from a local path.
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Aptos CLI, see https://aptos.dev/cli-tools/aptos-cli/use-cli/install-aptos-cli
 * 2. cd `~/aptos-ts-sdk/examples/typescript`
 * 3. Run `pnpm run publish_package_from_filepath` and follow the prompt
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { Account, Aptos, Hex } from "aptos";

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

/** run our demo! */
async function main() {
  const aptos = new Aptos();

  const alice = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);

  await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: 100_000_000 });

  await new Promise<void>((resolve) => {
    readline.question(
      `Open a new terminal anduUse this address to compile move package
      "aptos move build-publish-payload --json-output-file facoin/facoin.json --package-dir facoin --named-addresses FACoin=aliceAddress"
      Compile and press Enter`,
      () => {
        resolve();
        readline.close();
      },
    );
  });

  // current working directory - the root folder of this repo
  const cwd = process.cwd();
  // target directory - current working directory + facoin/facoin.json (facoin.json is generated with the prevoius cli command)
  const modulePath = path.join(cwd, "facoin/facoin.json");

  const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

  const metadataBytes = jsonData.args[0].value;
  const byteCode = jsonData.args[1].value;

  console.log("Publishing FAcoin package.");
  const transaction = await aptos.publishPackageTransaction({
    account: alice.accountAddress.toString(),
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const response = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });
  console.log(response.hash);
  await aptos.waitForTransaction({
    transactionHash: response.hash,
  });
  const accountModules = await aptos.getAccountModules({
    accountAddress: alice.accountAddress.toString(),
  });
  // published 2 modules
  assert(accountModules.length == 2);
  // first account's module bytecode equals the published bytecode
  assert(accountModules[0].bytecode === `${Hex.fromHexInput(byteCode[0]).toString()}`);
  // second account's module bytecode equals the published bytecode
  assert(accountModules[1].bytecode === `${Hex.fromHexInput(byteCode[1]).toString()}`);
}

if (require.main === module) {
  main();
}
