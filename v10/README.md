# Aptos TypeScript SDK v10

[![NPM Package Version][npm-image-version]][npm-url]
![Node Version](https://img.shields.io/node/v/%40aptos-labs%2Fts-sdk)
[![NPM Package Downloads][npm-image-downloads]][npm-url]

A ground-up rewrite of the Aptos TypeScript SDK — **ESM-only**, **tree-shakeable**, and **function-first**.

- **Namespace-first API** — `aptos.account.getInfo(...)`, `aptos.transaction.buildSimple(...)`
- **Standalone functions** — Every API method is also a standalone function for maximum tree-shaking
- **Subpath exports** — Import only what you need: `@aptos-labs/ts-sdk/crypto`, `@aptos-labs/ts-sdk/bcs`, etc.
- **Compatibility layer** — `@aptos-labs/ts-sdk/compat` provides the v6-style flat API for gradual migration
- **Zero bundler config** — Pure ESM with `sideEffects: false`; bundlers tree-shake automatically

## Installation

```bash
npm install @aptos-labs/ts-sdk@10
# or
pnpm add @aptos-labs/ts-sdk@10
# or
yarn add @aptos-labs/ts-sdk@10
```

> **Requirements:** Node.js >= 22.1.2, ESM (`"type": "module"` in your `package.json` or `.mts` files).

## Quick Start

### ESM TypeScript

```typescript
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";

// 1. Create a client
const aptos = new Aptos({ network: Network.DEVNET });

// 2. Generate a new account
const alice = generateAccount();
const bob = generateAccount();

console.log(`Alice: ${alice.accountAddress}`);
console.log(`Bob:   ${bob.accountAddress}`);

// 3. Fund from faucet (devnet/testnet only)
await aptos.faucet.fund(alice.accountAddress, 100_000_000);
await aptos.faucet.fund(bob.accountAddress, 0);

// 4. Build a transfer transaction
const txn = await aptos.transaction.buildSimple(alice.accountAddress, {
  function: "0x1::aptos_account::transfer",
  functionArguments: [bob.accountAddress, 1_000_000],
});

// 5. Sign and submit
const pending = await aptos.transaction.signAndSubmit(alice, txn);

// 6. Wait for confirmation
const committed = await aptos.transaction.waitForTransaction(pending.hash);
console.log(`Success: ${committed.success}`);
```

### ESM JavaScript

```javascript
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";

const aptos = new Aptos({ network: Network.DEVNET });

const alice = generateAccount();
await aptos.faucet.fund(alice.accountAddress, 100_000_000);

const info = await aptos.account.getInfo(alice.accountAddress);
console.log("Sequence number:", info.sequence_number);
```

### CommonJS (via compat layer)

The main SDK is ESM-only. For CJS projects that cannot migrate to ESM, use the `/compat` subpath:

```javascript
// Node >= 22.12 — require() works directly
const { Aptos, Network, generateAccount } = require("@aptos-labs/ts-sdk/compat");

const aptos = new Aptos({ network: Network.DEVNET });
const alice = generateAccount();
```

```javascript
// Node 22.1.2–22.11 — use dynamic import
const { Aptos, Network, generateAccount } = await import("@aptos-labs/ts-sdk/compat");
```

### CJS TypeScript

```typescript
// tsconfig.json: { "module": "commonjs", "moduleResolution": "node16" }
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk/compat";

const aptos = new Aptos({ network: Network.DEVNET });
const alice = generateAccount();

const info = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
console.log(info.sequence_number);
```

> **Note:** The compat `Aptos` class exposes both the v10 namespaced API (`aptos.account.*`) and v6-style flat methods (`aptos.getAccountInfo(...)`) so you can migrate incrementally.

## Architecture

v10 is organized into layers, each available as a standalone subpath:

| Layer | Subpath | Description |
|-------|---------|-------------|
| L0 | `@aptos-labs/ts-sdk/bcs` | Binary Canonical Serialization — `Serializer`, `Deserializer`, Move types (`U64`, `MoveVector`, etc.) |
| L1 | `@aptos-labs/ts-sdk/hex` | Hex encoding — `Hex` class, `HexInput` type, `hexToAsciiString()` |
| L2 | `@aptos-labs/ts-sdk/crypto` | Cryptographic keys — Ed25519, Secp256k1, MultiKey, Keyless, HD derivation |
| L3 | `@aptos-labs/ts-sdk/core` | Core types — `AccountAddress`, `AuthenticationKey`, `Network`, `TypeTag`, error types |
| L4 | `@aptos-labs/ts-sdk/transactions` | Transaction primitives — `SimpleTransaction`, `EntryFunction`, authenticators, signing |
| L5 | `@aptos-labs/ts-sdk/account` | Account implementations — `Ed25519Account`, `SingleKeyAccount`, factory functions |
| L6 | `@aptos-labs/ts-sdk/client` | HTTP client — `aptosRequest()`, `get()`, `post()`, pagination helpers |
| L7 | `@aptos-labs/ts-sdk/api` | High-level API — `Aptos` class, `GeneralAPI`, `AccountAPI`, `TransactionAPI`, etc. |
| — | `@aptos-labs/ts-sdk` | Re-exports everything from all layers |
| — | `@aptos-labs/ts-sdk/compat` | v6-compatible flat API + CJS support |

## API Reference

### `Aptos` class

The main entry point. Accepts an `AptosSettings` object or an `AptosConfig` instance:

```typescript
import { Aptos, Network } from "@aptos-labs/ts-sdk";

// Settings shorthand (recommended)
const aptos = new Aptos({ network: Network.TESTNET });

// Or with an AptosConfig
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// Or defaults to devnet
const aptos = new Aptos();
```

#### Namespace: `aptos.general`

| Method | Description |
|--------|-------------|
| `getLedgerInfo()` | Get chain metadata (epoch, block height, chain ID) |
| `getChainId()` | Get the numeric chain ID |
| `getBlockByVersion(ledgerVersion, options?)` | Get block containing a specific version |
| `getBlockByHeight(blockHeight, options?)` | Get block at a specific height |
| `view<T>(payload, options?)` | Execute a Move view function |
| `getGasPriceEstimation()` | Get gas price estimate |

#### Namespace: `aptos.account`

| Method | Description |
|--------|-------------|
| `getInfo(accountAddress)` | Get account info (sequence number, auth key) |
| `getModules(accountAddress, options?)` | List all published modules |
| `getModule(accountAddress, moduleName, options?)` | Get a specific module |
| `getResource<T>(accountAddress, resourceType, options?)` | Get a specific resource |
| `getResources(accountAddress, options?)` | List all resources |
| `getTransactions(accountAddress, options?)` | List account transactions |

#### Namespace: `aptos.transaction`

| Method | Description |
|--------|-------------|
| `buildSimple(sender, payload, options?)` | Build an entry function transaction |
| `sign(signer, transaction)` | Sign a transaction |
| `submit(transaction, senderAuthenticator)` | Submit a signed transaction |
| `signAndSubmit(signer, transaction)` | Sign + submit in one call |
| `waitForTransaction(transactionHash, options?)` | Wait for on-chain confirmation |
| `getByHash(transactionHash)` | Get transaction by hash |
| `getByVersion(ledgerVersion)` | Get transaction by version |
| `getAll(options?)` | List recent transactions |
| `getSigningMessage(transaction)` | Get raw signing bytes |

#### Namespace: `aptos.coin`

| Method | Description |
|--------|-------------|
| `transferTransaction(sender, recipient, amount, coinType?, options?)` | Build a coin transfer transaction |

#### Namespace: `aptos.faucet`

| Method | Description |
|--------|-------------|
| `fund(accountAddress, amount, options?)` | Fund account from faucet (devnet/testnet) |

#### Namespace: `aptos.table`

| Method | Description |
|--------|-------------|
| `getItem<T>(handle, data, options?)` | Get a table item by key |

## Account Management

v10 uses standalone factory functions instead of `Account.generate()` static methods.

### Generate a new account

```typescript
import { generateAccount, SigningSchemeInput } from "@aptos-labs/ts-sdk";

// Legacy Ed25519 (default)
const account = generateAccount();

// SingleKey Ed25519
const account = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false });

// SingleKey Secp256k1
const account = generateAccount({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
```

### From a private key

```typescript
import { accountFromPrivateKey, Ed25519PrivateKey, Secp256k1PrivateKey } from "@aptos-labs/ts-sdk";

// Ed25519 (legacy, default)
const account = accountFromPrivateKey({
  privateKey: new Ed25519PrivateKey("0xYOUR_HEX_KEY"),
});

// Secp256k1 (SingleKey)
const account = accountFromPrivateKey({
  privateKey: new Secp256k1PrivateKey("0xYOUR_HEX_KEY"),
  legacy: false,
});
```

### From a mnemonic derivation path

```typescript
import { accountFromDerivationPath } from "@aptos-labs/ts-sdk";

const account = accountFromDerivationPath({
  path: "m/44'/637'/0'/0'/0'",
  mnemonic: "various float stumble ...",
});
```

## Transaction Flow

### Build → SignAndSubmit → Wait (common path)

```typescript
// Build
const txn = await aptos.transaction.buildSimple(alice.accountAddress, {
  function: "0x1::aptos_account::transfer",
  functionArguments: [bob.accountAddress, 1_000_000],
});

// Sign + Submit in one call
const pending = await aptos.transaction.signAndSubmit(alice, txn);

// Wait for confirmation
const result = await aptos.transaction.waitForTransaction(pending.hash, {
  checkSuccess: true,
});
```

### Build → Sign → Submit → Wait (granular control)

```typescript
// Build
const txn = await aptos.transaction.buildSimple(alice.accountAddress, {
  function: "0x1::aptos_account::transfer",
  functionArguments: [bob.accountAddress, 1_000_000],
});

// Sign
const auth = aptos.transaction.sign(alice, txn);

// Submit
const pending = await aptos.transaction.submit(txn, auth);

// Wait
const result = await aptos.transaction.waitForTransaction(pending.hash);
```

### Coin transfer shorthand

```typescript
const txn = await aptos.coin.transferTransaction(
  alice.accountAddress,
  bob.accountAddress,
  1_000_000,
);
const pending = await aptos.transaction.signAndSubmit(alice, txn);
await aptos.transaction.waitForTransaction(pending.hash);
```

## Examples by Module

### BCS — Serialization & deserialization

```typescript
import { Serializer, Deserializer, U64, MoveVector, MoveString, Bool } from "@aptos-labs/ts-sdk/bcs";

// Serialize Move values
const serializer = new Serializer();
new U64(42n).serialize(serializer);
new MoveString("hello").serialize(serializer);
new Bool(true).serialize(serializer);

const bytes = serializer.toUint8Array();

// Deserialize
const deserializer = new Deserializer(bytes);
const num = U64.deserialize(deserializer);
const str = MoveString.deserialize(deserializer);
const flag = Bool.deserialize(deserializer);

console.log(num.value, str.value, flag.value); // 42n, "hello", true
```

### Hex — Encoding and decoding

```typescript
import { Hex, hexToAsciiString } from "@aptos-labs/ts-sdk/hex";

// From string
const hex = Hex.fromString("0x48656c6c6f");
console.log(hex.toUint8Array()); // Uint8Array [72, 101, 108, 108, 111]

// From bytes
const hex2 = Hex.fromUint8Array(new Uint8Array([72, 101, 108, 108, 111]));
console.log(hex2.toString()); // "0x48656c6c6f"

// Decode hex-encoded ASCII
console.log(hexToAsciiString("0x48656c6c6f")); // "Hello"
```

### Crypto — Key generation and signing

```typescript
import { Ed25519PrivateKey, Ed25519PublicKey, Secp256k1PrivateKey } from "@aptos-labs/ts-sdk/crypto";

// Generate a random Ed25519 key pair
const privateKey = Ed25519PrivateKey.generate();
const publicKey = privateKey.publicKey();
console.log("Public key:", publicKey.toString());

// Sign a message
const signature = privateKey.sign(new TextEncoder().encode("hello"));
const valid = publicKey.verifySignature({ message: "hello", signature });
console.log("Valid:", valid); // true

// Secp256k1 keys work the same way
const secpKey = Secp256k1PrivateKey.generate();
```

### Core — Addresses and network configuration

```typescript
import { AccountAddress, Network } from "@aptos-labs/ts-sdk/core";

// Parse an address
const addr = AccountAddress.from("0x1");
console.log(addr.toString()); // "0x0000...0001"

// Check special addresses
console.log(AccountAddress.A.isSpecial()); // true — the 0xa address

// Network values
console.log(Network.MAINNET);   // "mainnet"
console.log(Network.TESTNET);   // "testnet"
console.log(Network.SHELBYNET); // "shelbynet"
```

### Transactions — Building payloads manually

```typescript
import { EntryFunction, SimpleTransaction } from "@aptos-labs/ts-sdk/transactions";
import { AccountAddress } from "@aptos-labs/ts-sdk/core";
import { U64 } from "@aptos-labs/ts-sdk/bcs";

// Construct an entry function payload directly
const payload = EntryFunction.build(
  "0x1::aptos_account::transfer",
  [],                                              // type args
  [AccountAddress.from("0xBOB"), new U64(1000n)],  // function args
);
```

### Account — Type guards

```typescript
import { generateAccount, isSingleKeySigner, isKeylessSigner, SigningSchemeInput } from "@aptos-labs/ts-sdk/account";

const ed25519Legacy = generateAccount();
const singleKey = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false });

console.log(isSingleKeySigner(ed25519Legacy)); // false
console.log(isSingleKeySigner(singleKey));     // true
console.log(isKeylessSigner(singleKey));       // false
```

### Client — Low-level HTTP requests

```typescript
import { get, post, aptosRequest } from "@aptos-labs/ts-sdk/client";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.MAINNET });

// Typed GET request to full node
const ledgerInfo = await get<{}, LedgerInfo>({
  url: config.getRequestUrl(AptosApiType.FULLNODE),
  path: "",
  originMethod: "getLedgerInfo",
  overrides: config.getMergedFullnodeConfig(),
});
```

### Standalone functions (for maximum tree-shaking)

Every namespace method is also a standalone function that takes `config` as the first argument:

```typescript
import { AptosConfig, Network } from "@aptos-labs/ts-sdk/api";
import { getAccountInfo } from "@aptos-labs/ts-sdk/api";
import { buildSimpleTransaction, signAndSubmitTransaction, waitForTransaction } from "@aptos-labs/ts-sdk/api";
import { generateAccount } from "@aptos-labs/ts-sdk/account";

const config = new AptosConfig({ network: Network.DEVNET });

// Standalone function calls — only the functions you import get bundled
const alice = generateAccount();
const info = await getAccountInfo(config, alice.accountAddress);
console.log(info.sequence_number);
```

```javascript
// ESM JavaScript — same standalone function pattern
import { AptosConfig } from "@aptos-labs/ts-sdk/api";
import { getLedgerInfo } from "@aptos-labs/ts-sdk/api";

const config = new AptosConfig({ network: "testnet" });
const info = await getLedgerInfo(config);
console.log("Chain ID:", info.chain_id);
```

## Compatibility Layer

The `/compat` subpath provides the **v6-style flat API** on top of the v10 SDK. Use it for:

1. **Gradual migration** — swap the import path, keep your existing code, then migrate method-by-method
2. **CJS projects** — `/compat` is the only subpath that supports `require()`

### ESM TypeScript (compat)

```typescript
import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk/compat";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// v6-style flat calls (single-object args)
const info = await aptos.getAccountInfo({ accountAddress: "0x1" });

// v6-style transaction.build.simple
const txn = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 1_000_000],
  },
});

// v6-style sign and submit
const pending = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

### CJS JavaScript (compat)

```javascript
// Node >= 22.12
const { Aptos, Network, generateAccount } = require("@aptos-labs/ts-sdk/compat");

async function main() {
  const aptos = new Aptos({ network: Network.DEVNET });
  const alice = generateAccount();

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  const info = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
  console.log("Sequence:", info.sequence_number);
}

main();
```

### CJS TypeScript (compat)

```typescript
// tsconfig.json: { "module": "commonjs", "moduleResolution": "node16" }
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk/compat";

async function main() {
  const aptos = new Aptos({ network: Network.DEVNET });
  const alice = generateAccount();

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

  // Both styles work on the compat Aptos class:
  const v6Style = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
  const v10Style = await aptos.account.getInfo(alice.accountAddress);

  console.log(v6Style.sequence_number === v10Style.sequence_number); // true
}

main();
```

## Bun Compatibility

Bun's HTTP/2 support is not fully mature. Disable it when using Bun:

```typescript
import { Aptos, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos({
  network: Network.TESTNET,
  clientConfig: { http2: false },
});
```

## Custom HTTP Client

You can replace the default HTTP transport by providing a custom `Client` implementation. This is useful for adding custom auth, proxies, logging, or using an alternative HTTP library.

```typescript
import { Aptos, Network } from "@aptos-labs/ts-sdk";
import type { Client, ClientRequest, ClientResponse } from "@aptos-labs/ts-sdk/client";

const myClient: Client = {
  async sendRequest<Res>(request: ClientRequest): Promise<ClientResponse<Res>> {
    console.log(`${request.method} ${request.url}`);
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });
    return {
      status: response.status,
      statusText: response.statusText,
      data: (await response.json()) as Res,
      headers: response.headers,
    };
  },
};

const aptos = new Aptos({ network: Network.DEVNET, client: myClient });
const info = await aptos.general.getLedgerInfo();
```

When no custom client is provided, the SDK uses `@aptos-labs/aptos-client` (HTTP/2 in Node.js via `got`, native `fetch` in browsers).

## Contributing

If you found a bug or would like to request a feature, please file an [issue](https://github.com/aptos-labs/aptos-ts-sdk/issues/new/choose).
If, based on the discussion on an issue, you would like to offer a code change, please make a [pull request](https://github.com/aptos-labs/aptos-ts-sdk/pulls).

[npm-image-version]: https://img.shields.io/npm/v/%40aptos-labs%2Fts-sdk.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/%40aptos-labs%2Fts-sdk.svg
[npm-url]: https://npmjs.org/package/@aptos-labs/ts-sdk
