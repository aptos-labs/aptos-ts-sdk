# TypeScript SDK for Cedra

![License][github-license]
[![Discord][discord-image]][discord-url]
[![NPM Package Version][npm-image-version]][npm-url]
![Node Version](https://img.shields.io/node/v/%40cedra-labs%2Fts-sdk)
![NPM bundle size](https://img.shields.io/bundlephobia/min/%40cedra-labs/ts-sdk)
[![NPM Package Downloads][npm-image-downloads]][npm-url]

The [TypeScript SDK](https://www.npmjs.com/package/@cedra-labs/ts-sdk) allows you to connect, explore, and interact with the Cedra blockchain. You can use it to request data, send transactions, set up test environments, and more!

## Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm/yarn/pnpm**: A package manager for installing dependencies
- **TypeScript** (optional): For TypeScript projects, ensure your `tsconfig.json` uses `"moduleResolution": "node"`

## Essential Links

- **[Cedra Documentation](https://docs.cedra.network/)** - Official Cedra blockchain documentation
- **[Examples](./examples/README.md)** - Code examples for common tasks
- **[NPM Package](https://www.npmjs.com/package/@cedra-labs/ts-sdk)** - Latest SDK version and stats
- **[GitHub Repository](https://github.com/cedra-labs/cedra-ts-sdk)** - Source code and issues
- **[Discord Community](https://discord.gg/cedranetwork)** - Get help and connect with developers

## Network Information

| Network | RPC Endpoint | Chain ID | Faucet |
|---------|-------------|----------|--------|
| Testnet | `https://testnet.cedra.dev/v1` | TBD | Available via CLI |
| Mainnet | Coming Soon | TBD | N/A |
| Devnet | Contact team for access | TBD | Available via CLI |

## Installation

### For use in Node.js or a web application

Install with your favorite package manager such as npm, yarn, or pnpm:

```bash
pnpm install @cedra-labs/ts-sdk
```

### For use in a browser (<= version 1.9.1 only)

You can add the SDK to your web application using a script tag:

```html
<script src="https://unpkg.com/@cedra-labs/ts-sdk/dist/browser/index.global.js"></script>
```

Then, the SDK can be accessed through `window.cedraSDK`.

## Quick Start for Newcomers

Follow these steps to connect to Cedra blockchain and make your first transaction:

### Step 1: Install the SDK

```bash
npm install @cedra-labs/ts-sdk
# or
yarn add @cedra-labs/ts-sdk
# or
pnpm install @cedra-labs/ts-sdk
```

### Step 2: Connect to the Network

Create an `Cedra` client to connect to the blockchain:

```ts
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk"

// You can use CedraConfig to choose which network to connect to
const config = new CedraConfig({ network: Network.TESTNET });
// Cedra is the main entrypoint for all functions
const cedra = new Cedra(config);

// Verify connection
const ledgerInfo = await cedra.getLedgerInfo();
console.log("Connected to Cedra blockchain!");
console.log("Chain ID:", ledgerInfo.chain_id);
console.log("Latest block:", ledgerInfo.block_height);
```

### Step 3: Create Your First Account

```ts
import { Account } from "@cedra-labs/ts-sdk";

// Generate a new account
const account = Account.generate();
console.log("New account address:", account.accountAddress);

// Fund it with test tokens
await cedra.fundAccount({
  accountAddress: account.accountAddress,
  amount: 100_000_000, // 1 CEDRA
});
```

### Step 4: Send Your First Transaction

See the complete example in the [Submit transaction](#submit-transaction-tutorial) section below.

### Reading Data From Onchain

---

```ts
// Check account balance
const accountInfo = await cedra.getAccountInfo({ accountAddress: "0x123" });
console.log("Account balance:", accountInfo.coin.value);

// Get account modules
const modules = await cedra.getAccountModules({ accountAddress: "0x123" });

// Get owned tokens
const tokens = await cedra.getAccountOwnedTokens({ accountAddress: "0x123" });

// Get recent transactions
const transactions = await cedra.getAccountTransactions({ accountAddress: "0x123" });
```

### Next Steps

**Learn more from the official Cedra documentation:**

- **[Your First Transaction](https://docs.cedra.network/build/guides/first-transaction)** - Step-by-step guide to sending your first CEDRA tokens
- **[Build Your First Cedra App](https://docs.cedra.network/build/guides/build-e2e-dapp/index)** - Complete tutorial for building a full dApp on Cedra
- **[Smart Contract Development](https://docs.cedra.network/move/move-on-cedra)** - Learn Move language for writing Cedra smart contracts
- **[CLI Installation & Usage](https://docs.cedra.network/tools/cedra-cli/use-cli)** - Set up the Cedra CLI for advanced development




## Troubleshooting

### TypeScript Import Errors

If you see import errors, ensure your `tsconfig.json` uses:

```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

### Connection Issues

- **Timeout errors**: Increase timeout in CedraConfig or check network connectivity
- **Rate limiting**: Implement exponential backoff for retries
- **Invalid endpoint**: Verify you're using the correct network endpoint

### Common Errors

- `INSUFFICIENT_BALANCE`: Account needs more tokens. Use the faucet on testnet.
- `SEQUENCE_NUMBER_MISMATCH`: Transaction ordering issue. Fetch latest account state.
- `MODULE_NOT_FOUND`: Smart contract not deployed at specified address.

## Contributing

We welcome contributions! Please:

1. Check existing [issues](https://github.com/cedra-labs/cedra-ts-sdk/issues) or create a new one to discuss your idea
2. Fork the repository and create a pull request
3. Follow our [contributing guidelines](https://github.com/cedra-labs/cedra-ts-sdk/blob/main/CONTRIBUTING.md)

For questions or support, join our [Discord community](https://discord.gg/cedranetwork).

## Running unit tests

To run a unit test in this repo, for example, the keyless end-to-end unit test in `tests/e2e/api/keyless.test.ts`:
```
pnpm jest keyless.test.ts
```

[npm-image-version]: https://img.shields.io/npm/v/%40cedra-labs%2Fts-sdk.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/%40cedra-labs%2Fts-sdk.svg
[npm-url]: https://npmjs.org/package/@cedra-labs/ts-sdk
[experimental-url]: https://www.npmjs.com/package/@cedra-labs/ts-sdk/v/experimental
[discord-image]: https://img.shields.io/discord/945856774056083548?label=Discord&logo=discord&style=flat
[discord-url]: https://discord.gg/cedranetwork
[github-license]: https://img.shields.io/github/license/cedra-labs/cedra-ts-sdk
