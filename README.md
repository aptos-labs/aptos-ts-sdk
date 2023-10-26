# Typescript SDK for Aptos

[![Discord][discord-image]][discord-url]
[![NPM Package Version][npm-image-version]][npm-url]
[![NPM Package Downloads][npm-image-downloads]][npm-url]

> **This library is experimental**. Therefore, the API is unstable and may change without warning.

The Aptos TypeScript SDK provides a convenient way to interact with the Aptos blockchain using TypeScript. It offers a
set of utility functions, classes, and types to simplify the integration process and enhance developer productivity.

This repository supports version >= 0.0.0 of the [Aptos SDK npm package](https://www.npmjs.com/package/@aptos-labs/ts-sdk).

## Installation

##### For use in Node.js or a web application

Install with your favorite package manager such as npm, yarn, or pnpm:

```bash
pnpm install @aptos-labs/ts-sdk@experimental
```

##### For use in a browser

You can add the SDK to your web application using a script tag:

```html
<script src="https://unpkg.com/@aptos-labs/ts-sdk@experimental/dist/browser/index.global.js" />
```

Then, the SDK can be accessed through `window.aptosSDK`.

## Usage

Initialize `Aptos` to access the SDK API.

```ts
// initiate the main entry point into Aptos SDK
const aptos = new Aptos();
```

If you want to pass in a custom config

```ts
// an optional config information for the SDK client instance.
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
```

### Read data from chain

---

```ts
const modules = await aptos.getAccountModules({ accountAddress: "0x123" });
```

### Keys management (default to Ed25519)

> Note: We introduce a Single Sender authentication (as introduced in [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263)). Generating an account defaults to Single Sender unified authentication with the option to use the Legacy Ed25519

---

#### Generate new keys

```ts
const account = Account.generate(); // defaults to Single Sender Ed25519
const account = Account.generate({ scheme: SingingSchemeInput.Secp256k1 }); // Single Sender Secp256k1
const account = Account.generate({ legacy: true }); // use Legacy Ed25519
```

#### Derive from private key

```ts
const aptos = new Aptos();
// This functions resolves the provided private key type and derives the public key from it
// to support key rotation and differentiation between Legacy Ed25519 and Unified authentications
// Read more https://github.com/aptos-labs/aptos-ts-sdk/blob/main/src/api/account.ts#L364
const account = await aptos.deriveAccountFromPrivateKey({ privateKey: privateKey });
```

#### Derive from path

```ts
const path = "m/44'/637'/0'/0'/1";
const mnemonic = "various float stumble...";
const account = Account.fromDerivationPath({ path, mnemonic });
```

### Submit transaction

---

#### Single Signer transaction

Using transaction submission api

```ts
const alice: Account = Account.generate();
const bobAddress = "0xb0b";
const transaction = await aptos.generateTransaction({
  sender: alice.accountAddress.toString(),
  data: {
    function: "0x1::coin::transfer",
    type_arguments: [new TypeTagStruct(StructTag.fromString("0x1::aptos_coin::AptosCoin"))],
    arguments: [AccountAddress.fromHexInput(bobAddress), new U64(100)],
  },
});

let committedTransaction = await aptos.signAndSubmitTransaction({ signer: alice, transaction });
```

Using built in `transferCoinTransaction`

```ts
const alice: Account;
const bobAddress = "0xb0b";
const transaction = await aptos.transferCoinTransaction({
  sender: alice.accountAddress.toString(),
  recipient: bob,
  amount: 100,
});

const pendingTransaction = await aptos.signAndSubmitTransaction({ signer: alice, transaction });
```

## Documentation and examples

- For in-depth examples, check out the [examples](./examples) folder with ready-made `package.json` files to get you going quickly!

### Testing

To run the SDK tests, simply run from the root of this repository:

> Note: make sure aptos local node is up and running. Take a look at the [local development network guide](https://aptos.dev/guides/local-development-network/) for more details.

```bash
pnpm test
```

## Troubleshooting

If you see import error when you do this

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
```

It could be your `tsconfig.json` is not incompatible, make sure your `moduleResolution` is set to `node` instead of `bundler`.

## Contributing

If you found a bug or would like to request a feature, please file an [issue](https://github.com/aptos-labs/aptos-ts-sdk/issues/new/choose).
If, based on the discussion on an issue you would like to offer a code change, please make a [pull request](https://github.com/aptos-labs/aptos-ts-sdk/CONTRIBUTING.md).
If neither of these describes what you would like to contribute, checkout out the [contributing guide](https://github.com/aptos-labs/aptos-ts-sdk/CONTRIBUTING.md).

[npm-image-version]: https://img.shields.io/npm/v/%40aptos-labs%2Fts-sdk.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/%40aptos-labs%2Fts-sdk.svg
[npm-url]: https://npmjs.org/package/@aptos-labs/ts-sdk
[discord-image]: https://img.shields.io/discord/945856774056083548?label=Discord&logo=discord&style=flat~~~~
[discord-url]: https://discord.gg/aptosnetwork
