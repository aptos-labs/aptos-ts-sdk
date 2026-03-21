// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";

import {
  AptosConfig,
  Network,
  generateModuleAbiJSON,
  generateEntryFunctionAbiJSON,
  generateViewFunctionAbiJSON,
} from "@aptos-labs/ts-sdk";

const USAGE = `
Usage: generate-abi-json [options]

Fetches on-chain Move module ABIs and outputs JSON-serializable entry/view
function ABI definitions that can be embedded in application source code.

Options:
  --network <network>   Network to connect to: mainnet, testnet, devnet, local
                        (default: mainnet)
  --node-url <url>      Custom fullnode URL (overrides --network; include /v1)
  --address <address>   Account address of the module (required)
  --module <name>       Module name (required)
  --function <name>     Specific function name (omit to output all functions)
  --output <file>       Write JSON to a file instead of stdout
  --pretty              Pretty-print JSON with 2-space indentation
  --help                Show this help message

Examples:
  # All entry/view ABIs for the coin module on mainnet
  npx @aptos-labs/generate-abi-json --address 0x1 --module coin --pretty

  # Single entry function, written to a file
  npx @aptos-labs/generate-abi-json --address 0x1 --module coin --function transfer --output coin_transfer.json

  # Use a custom node URL
  npx @aptos-labs/generate-abi-json --node-url http://localhost:8080/v1 --address 0x1 --module coin
`.trim();

const NETWORK_MAP: Record<string, Network> = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
  local: Network.LOCAL,
};

async function main() {
  const { values } = parseArgs({
    options: {
      network: { type: "string", default: "mainnet" },
      "node-url": { type: "string" },
      address: { type: "string" },
      module: { type: "string" },
      function: { type: "string" },
      output: { type: "string" },
      pretty: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }

  if (!values.address) {
    console.error("Error: --address is required\n");
    console.error(USAGE);
    process.exit(1);
  }
  if (!values.module) {
    console.error("Error: --module is required\n");
    console.error(USAGE);
    process.exit(1);
  }

  const networkKey = values.network!.toLowerCase();
  const network = NETWORK_MAP[networkKey];
  if (!network && !values["node-url"]) {
    console.error(
      `Error: unknown network '${values.network}'. Use one of: mainnet, testnet, devnet, local\n`,
    );
    console.error("Or provide --node-url for a custom endpoint.");
    process.exit(1);
  }

  const aptosConfig = values["node-url"]
    ? new AptosConfig({ fullnode: values["node-url"], network: Network.CUSTOM })
    : new AptosConfig({ network });

  try {
    let result: unknown;

    if (values.function) {
      try {
        result = await generateEntryFunctionAbiJSON({
          aptosConfig,
          accountAddress: values.address,
          moduleName: values.module,
          functionName: values.function,
        });
      } catch {
        result = await generateViewFunctionAbiJSON({
          aptosConfig,
          accountAddress: values.address,
          moduleName: values.module,
          functionName: values.function,
        });
      }
    } else {
      result = await generateModuleAbiJSON({
        aptosConfig,
        accountAddress: values.address,
        moduleName: values.module,
      });
    }

    const jsonStr = values.pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);

    if (values.output) {
      writeFileSync(values.output, `${jsonStr}\n`, "utf-8");
      console.error(`Wrote ABI JSON to ${values.output}`);
    } else {
      console.log(jsonStr);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
