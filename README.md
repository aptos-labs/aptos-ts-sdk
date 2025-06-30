# TypeScript SDK for Cedra

![License][github-license]
[![Discord][discord-image]][discord-url]
[![NPM Package Version][npm-image-version]][npm-url]
![Node Version](https://img.shields.io/node/v/%40cedra-labs%2Fts-sdk)
![NPM bundle size](https://img.shields.io/bundlephobia/min/%40cedra-labs/ts-sdk)
[![NPM Package Downloads][npm-image-downloads]][npm-url]

The [TypeScript SDK](https://www.npmjs.com/package/@cedra-labs/ts-sdk) allows you to connect, explore, and interact with the Cedra blockchain. You can use it to request data, send transactions, set up test environments, and more!

## Learn How To Use The TypeScript SDK
### [Quickstart](https://cedra.dev/en/build/sdks/ts-sdk/quickstart)
### [Tutorials](https://cedra.dev/en/build/sdks/ts-sdk)
### [Examples](./examples/README.md)
### [Reference Docs (For looking up specific functions)](https://cedra-labs.github.io/cedra-ts-sdk/)

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

## Usage

Create an `Cedra` client in order to access the SDK's functionality.

```ts
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk"

// You can use CedraConfig to choose which network to connect to
const config = new CedraConfig({ network: Network.TESTNET });
// Cedra is the main entrypoint for all functions
const cedra = new Cedra(config);
```

### Reading Data From Onchain ([Guide](https://cedra.dev/en/build/sdks/ts-sdk/fetch-data-via-sdk))

---

```ts
const fund = await cedra.getAccountInfo({ accountAddress: "0x123" });
const modules = await cedra.getAccountModules({ accountAddress: "0x123" });
const tokens = await cedra.getAccountOwnedTokens({ accountAddress: "0x123" });
```

### Account management (default to Ed25519)

> Note: We introduce a Single Sender authentication (as introduced in [AIP-55](https://github.com/cedra-foundation/AIPs/pull/263)). Generating an account defaults to Legacy Ed25519 authentication with the option to use the Single Sender unified authentication.

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
const account = await Account.fromPrivateKey({ privateKey });

// Also, can use this function that resolves the provided private key type and derives the public key from it
// to support key rotation and differentiation between Legacy Ed25519 and Unified authentications
const cedra = new Cedra();
const account = await cedra.deriveAccountFromPrivateKey({ privateKey });
```

#### Derive from private key and address

```ts
// Create a private key instance for Ed25519 scheme
const privateKey = new Ed25519PrivateKey("myEd25519privatekeystring");
// Or for Secp256k1 scheme
const privateKey = new Secp256k1PrivateKey("mySecp256k1privatekeystring");

// Derive an account from private key and address

// create an AccountAddress instance from the account address string
const address = AccountAddress.from("myaccountaddressstring");
// Derive an account from private key and address
const account = await Account.fromPrivateKeyAndAddress({ privateKey, address });
```

#### Derive from path

```ts
const path = "m/44'/637'/0'/0'/1";
const mnemonic = "various float stumble...";
const account = Account.fromDerivationPath({ path, mnemonic });
```

### Submit transaction ([Tutorial](https://cedra.dev/en/build/sdks/ts-sdk/building-transactions))

---

```ts
/**
 * This example shows how to use the Cedra SDK to send a transaction.
 * Don't forget to install @cedra-labs/ts-sdk before running this example!
 */
 
import {
    Account,
    Cedra,
    CedraConfig,
    Network,
} from "@cedra-labs/ts-sdk";
 
async function example() {
    console.log("This example will create two accounts (Alice and Bob) and send a transaction transferring CEDRA to Bob's account.");
 
    // 0. Setup the client and test accounts
    const config = new CedraConfig({ network: Network.TESTNET });
    const cedra = new Cedra(config);
 
    let alice = Account.generate();
    let bob = Account.generate();
 
    console.log("=== Addresses ===\n");
    console.log(`Alice's address is: ${alice.accountAddress}`);
    console.log(`Bob's address is: ${bob.accountAddress}`);
 
    console.log("\n=== Funding accounts ===\n");
    await cedra.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 100_000_000,
    });  
    await cedra.fundAccount({
        accountAddress: bob.accountAddress,
        amount: 100,
    });
    console.log("Funded Alice and Bob's accounts!")
 
    // 1. Build
    console.log("\n=== 1. Building the transaction ===\n");
    const transaction = await cedra.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
        // All transactions on Cedra are implemented via smart contracts.
        function: "0x1::cedra_account::transfer",
        functionArguments: [bob.accountAddress, 100],
        },
    });
    console.log("Built the transaction!")
 
    // 2. Simulate (Optional)
    console.log("\n === 2. Simulating Response (Optional) === \n")
    const [userTransactionResponse] = await cedra.transaction.simulate.simple({
        signerPublicKey: alice.publicKey,
        transaction,
    });
    console.log(userTransactionResponse)
 
    // 3. Sign
    console.log("\n=== 3. Signing transaction ===\n");
    const senderAuthenticator = cedra.transaction.sign({
        signer: alice,
        transaction,
    });
    console.log("Signed the transaction!")
 
    // 4. Submit
    console.log("\n=== 4. Submitting transaction ===\n");
    const submittedTransaction = await cedra.transaction.submit.simple({
        transaction,
        senderAuthenticator,
    });
 
    console.log(`Submitted transaction hash: ${submittedTransaction.hash}`);
 
    // 5. Wait for results
    console.log("\n=== 5. Waiting for result of transaction ===\n");
    const executedTransaction = await cedra.waitForTransaction({ transactionHash: submittedTransaction.hash });
    console.log(executedTransaction)
};
 
example();
```

## Troubleshooting

If you see an import error when you do this:

```typescript
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
```

It could be that your `tsconfig.json` is not using `node`. Make sure your `moduleResolution` in the `tsconfig.json` is set to `node` instead of `bundler`.

## Contributing

If you found a bug or would like to request a feature, please file an [issue](https://github.com/cedra-labs/cedra-ts-sdk/issues/new/choose).
If, based on the discussion on an issue, you would like to offer a code change, please make a [pull request](https://github.com/cedra-labs/cedra-ts-sdk/pulls).
If neither of these describes what you would like to contribute, check out the [contributing guide](https://github.com/cedra-labs/cedra-ts-sdk/blob/main/CONTRIBUTING.md).

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
