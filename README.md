# TypeScript SDK for Aptos

[![NPM Package Version][npm-image-version]][npm-url]
![Node Version](https://img.shields.io/node/v/%40aptos-labs%2Fts-sdk)
[![NPM Package Downloads][npm-image-downloads]][npm-url]

The [TypeScript SDK](https://www.npmjs.com/package/@aptos-labs/ts-sdk) allows you to connect, explore, and interact with the Aptos blockchain. You can use it to request data, send transactions, set up test environments, and more!

## Learn More

For comprehensive guides, tutorials, and API reference, visit [aptos.dev](https://aptos.dev):

- **[Quickstart Guide](https://aptos.dev/en/build/sdks/ts-sdk/quickstart)** - Get up and running quickly
- **[SDK Tutorials](https://aptos.dev/en/build/sdks/ts-sdk)** - Step-by-step tutorials
- **[API Reference](https://aptos-labs.github.io/aptos-ts-sdk/)** - Complete API documentation
- **[Examples](./examples/README.md)** - Code examples and sample applications

## Installation

### For use in Node.js or a web application

Install with your favorite package manager such as npm, yarn, or pnpm:

```bash
pnpm install @aptos-labs/ts-sdk
```

### For use with Bun

The SDK is compatible with the [Bun](https://bun.sh/) runtime. Install the SDK using Bun's package manager:

```bash
bun add @aptos-labs/ts-sdk
```

### For use in a browser

The SDK is ESM-only and works with any modern bundler (Vite, webpack, etc.):

```ts
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
```

## Usage

### Option 1: `Aptos` class (all-in-one)

The simplest way to get started. Not tree-shakeable — pulls in all sub-modules.

```ts
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);
```

### Option 2: Namespace classes from sub-paths (tree-shakeable)

Import only the namespaces you need for smaller bundles with full autocomplete:

```ts
import { General, AptosConfig } from "@aptos-labs/ts-sdk/general";
import { Faucet } from "@aptos-labs/ts-sdk/faucet";

const config = new AptosConfig({ network: Network.TESTNET });
const general = new General(config);
const faucet = new Faucet(config);
```

### Option 3: Standalone functions (maximum tree-shaking)

For the smallest possible bundles (e.g., wallet adapters):

```ts
import { getLedgerInfo } from "@aptos-labs/ts-sdk/general";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const ledger = await getLedgerInfo({ aptosConfig: config });
```

#### For Bun users

Bun's HTTP/2 support is not fully mature yet. Disable HTTP/2:

```ts
const config = new AptosConfig({ network: Network.TESTNET, clientConfig: { http2: false } });
```

### Reading Data From Onchain ([Guide](https://aptos.dev/en/build/sdks/ts-sdk/fetch-data-via-sdk))

---

```ts
const accountInfo = await aptos.account.getAccountInfo({ accountAddress: "0x123" });
const modules = await aptos.account.getAccountModules({ accountAddress: "0x123" });
const tokens = await aptos.account.getAccountOwnedTokens({ accountAddress: "0x123" });
```

### Account management (default to Ed25519)

> Note: We introduce a Single Sender authentication (as introduced in [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263)). Generating an account defaults to Legacy Ed25519 authentication with the option to use the Single Sender unified authentication.

---

#### Generate new keys

```ts
const account = Account.generate(); // defaults to Legacy Ed25519
const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa }); // Single Sender Secp256k1
const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false }); // Single Sender Ed25519
```

#### Derive from private key

```ts
// Create a private key instance for Ed25519 scheme
const privateKey = new Ed25519PrivateKey("myEd25519privatekeystring");
// Or for Secp256k1 scheme
const privateKey = new Secp256k1PrivateKey("mySecp256k1privatekeystring");

// Derive an account from private key

// This is used as a local calculation and therefore is used to instantiate an `Account`
// that has not had its authentication key rotated
const account = Account.fromPrivateKey({ privateKey });

// Also, can use this function that resolves the provided private key type and derives the public key from it
// to support key rotation and differentiation between Legacy Ed25519 and Unified authentications
const aptos = new Aptos();
const account = await aptos.deriveAccountFromPrivateKey({ privateKey });
```

#### Derive from private key and address

```ts
// Create a private key instance for Ed25519 scheme
const privateKey = new Ed25519PrivateKey("myEd25519privatekeystring");
// Or for Secp256k1 scheme
const privateKey = new Secp256k1PrivateKey("mySecp256k1privatekeystring");

// Derive an account from private key and address

// Create an AccountAddress instance from the account address string.
const address = AccountAddress.from("myaccountaddressstring");
// Derive an account from private key and address
const account = Account.fromPrivateKeyAndAddress({ privateKey, address });
```

#### Derive from path

```ts
const path = "m/44'/637'/0'/0'/1";
const mnemonic = "various float stumble...";
const account = Account.fromDerivationPath({ path, mnemonic });
```

### Submit transaction ([Tutorial](https://aptos.dev/en/build/sdks/ts-sdk/building-transactions))

---

```ts
/**
 * This example shows how to use the Aptos SDK to send a transaction.
 * Don't forget to install @aptos-labs/ts-sdk before running this example!
 */
 
import {
    Account,
    Aptos,
    AptosConfig,
    Network,
} from "@aptos-labs/ts-sdk";
 
async function example() {
    console.log("This example will create two accounts (Alice and Bob) and send a transaction transferring APT to Bob's account.");
 
    // 0. Setup the client and test accounts
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
 
    let alice = Account.generate();
    let bob = Account.generate();
 
    console.log("=== Addresses ===\n");
    console.log(`Alice's address is: ${alice.accountAddress}`);
    console.log(`Bob's address is: ${bob.accountAddress}`);
 
    console.log("\n=== Funding accounts ===\n");
    await aptos.faucet.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 100_000_000,
    });  
    await aptos.faucet.fundAccount({
        accountAddress: bob.accountAddress,
        amount: 100,
    });
    console.log("Funded Alice and Bob's accounts!")
 
    // 1. Build
    console.log("\n=== 1. Building the transaction ===\n");
    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
        // All transactions on Aptos are implemented via smart contracts.
        function: "0x1::aptos_account::transfer",
        functionArguments: [bob.accountAddress, 100],
        },
    });
    console.log("Built the transaction!")
 
    // 2. Simulate (Optional)
    console.log("\n === 2. Simulating Response (Optional) === \n")
    const [userTransactionResponse] = await aptos.transaction.simulate.simple({
        signerPublicKey: alice.publicKey,
        transaction,
    });
    console.log(userTransactionResponse)
 
    // 3. Sign
    console.log("\n=== 3. Signing transaction ===\n");
    const senderAuthenticator = aptos.transaction.sign({
        signer: alice,
        transaction,
    });
    console.log("Signed the transaction!")
 
    // 4. Submit
    console.log("\n=== 4. Submitting transaction ===\n");
    const submittedTransaction = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator,
    });
 
    console.log(`Submitted transaction hash: ${submittedTransaction.hash}`);
 
    // 5. Wait for results
    console.log("\n=== 5. Waiting for result of transaction ===\n");
    const executedTransaction = await aptos.transaction.waitForTransaction({ transactionHash: submittedTransaction.hash });
    console.log(executedTransaction)
};
 
example();
```

## Troubleshooting

If you see an import error when you do this:

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
```

Make sure your `tsconfig.json` uses a compatible `moduleResolution` setting. The SDK is ESM-only and works with `"nodenext"`, `"node16"`, or `"bundler"` module resolution.

## Contributing

If you found a bug or would like to request a feature, please file an [issue](https://github.com/aptos-labs/aptos-ts-sdk/issues/new/choose).
If, based on the discussion on an issue, you would like to offer a code change, please make a [pull request](https://github.com/aptos-labs/aptos-ts-sdk/pulls).
If neither of these describes what you would like to contribute, check out the [contributing guide](https://github.com/aptos-labs/aptos-ts-sdk/blob/main/CONTRIBUTING.md).

## Running unit tests

```
pnpm test                        # Run all tests (unit + e2e)
vitest run tests/unit            # Run unit tests only
vitest run keyless.test.ts       # Run a specific test file
```

[npm-image-version]: https://img.shields.io/npm/v/%40aptos-labs%2Fts-sdk.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/%40aptos-labs%2Fts-sdk.svg
[npm-url]: https://npmjs.org/package/@aptos-labs/ts-sdk