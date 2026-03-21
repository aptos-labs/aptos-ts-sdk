# @aptos-labs/generate-abi-json

CLI tool to generate JSON-serializable entry/view function ABIs from on-chain Aptos Move modules. The generated JSON can be embedded in application source code and used with the Aptos TypeScript SDK to skip remote ABI fetching at runtime.

## Usage

```bash
npx @aptos-labs/generate-abi-json --address 0x1 --module coin --pretty
```

### Options

| Flag | Description |
|------|-------------|
| `--network <network>` | Network to connect to: `mainnet`, `testnet`, `devnet`, `local` (default: `mainnet`) |
| `--node-url <url>` | Custom fullnode URL (overrides `--network`; include `/v1`) |
| `--address <address>` | Account address of the module (required) |
| `--module <name>` | Module name (required) |
| `--function <name>` | Specific function name (omit to output all functions) |
| `--output <file>` | Write JSON to a file instead of stdout |
| `--pretty` | Pretty-print JSON with 2-space indentation |
| `--help` | Show help message |

### Examples

```bash
# All entry/view ABIs for the coin module on mainnet
npx @aptos-labs/generate-abi-json --address 0x1 --module coin --pretty

# Single entry function, written to a file
npx @aptos-labs/generate-abi-json --address 0x1 --module coin --function transfer --output coin_transfer.json

# Use testnet
npx @aptos-labs/generate-abi-json --network testnet --address 0x1 --module coin

# Use a custom node URL
npx @aptos-labs/generate-abi-json --node-url http://localhost:8080/v1 --address 0x1 --module coin
```

## Using the output with the SDK

```typescript
import { parseEntryFunctionAbiJSON } from "@aptos-labs/ts-sdk";
import coinAbi from "./coin-abi.json";

// Parse the JSON back into an SDK-native EntryFunctionABI
const transferAbi = parseEntryFunctionAbiJSON(coinAbi.entryFunctions.transfer);

// Use it to build transactions without remote ABI fetching
const txn = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::coin::transfer",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [bob.accountAddress, 100],
    abi: transferAbi,
  },
});
```
