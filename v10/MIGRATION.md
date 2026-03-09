# Migration Guide: v6.x → v10

This guide helps you upgrade from `@aptos-labs/ts-sdk` v6.x to v10. Two paths are available:

1. **Quick migration** — Use the `/compat` subpath for a near-drop-in replacement
2. **Full migration** — Adopt the v10 namespaced API for maximum tree-shaking and ergonomics

## Table of Contents

- [Quick Migration (Compat Layer)](#quick-migration-compat-layer)
- [Requirements](#requirements)
- [Breaking Changes](#breaking-changes)
  1. [Module Format: CJS → ESM](#1-module-format-cjs--esm)
  2. [Aptos Constructor](#2-aptos-constructor)
  3. [API Style: Flat → Namespaced](#3-api-style-flat--namespaced)
  4. [Account Factory Functions](#4-account-factory-functions)
  5. [Transaction API](#5-transaction-api)
  6. [waitForTransaction Arguments](#6-waitfortransaction-arguments)
  7. [AptosConfig Changes](#7-aptosconfig-changes)
  8. [AptosApiError Fields](#8-aptosapierror-fields)
  9. [Noble v2 Import Paths](#9-noble-v2-import-paths)
- [Removed APIs](#removed-apis)
- [Method Mapping: v6 → v10](#method-mapping-v6--v10)

---

## Quick Migration (Compat Layer)

The fastest path: change your import to `/compat` and keep your existing code.

**Before (v6):**

```typescript
import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
```

**After (v10, compat):**

```typescript
import { Aptos, AptosConfig, Network, generateAccount } from "@aptos-labs/ts-sdk/compat";
```

The compat `Aptos` class extends the v10 `Aptos` class with all the v6-style flat methods, so existing code like `aptos.getAccountInfo(...)`, `aptos.fundAccount(...)`, and `aptos.transaction.build.simple(...)` continues to work.

You can then migrate to v10's namespaced API incrementally — both styles work on the same object:

```typescript
// Both work on the compat Aptos class:
const v6Result = await aptos.getAccountInfo({ accountAddress: "0x1" });
const v10Result = await aptos.account.getInfo("0x1");
```

### CJS Projects

The `/compat` subpath is the only entry point that supports `require()`:

```javascript
// Node >= 22.12
const { Aptos, Network } = require("@aptos-labs/ts-sdk/compat");

// Node 22.1.2–22.11
const { Aptos, Network } = await import("@aptos-labs/ts-sdk/compat");
```

### CJS TypeScript Projects

```typescript
// tsconfig.json needs: "module": "commonjs", "moduleResolution": "node16"
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk/compat";
```

---

## Requirements

| | v6 | v10 |
|---|---|---|
| **Node.js** | >= 16 | >= 22.1.2 |
| **Module format** | CJS + ESM | ESM-only (CJS via `/compat`) |
| **package.json** | Any | `"type": "module"` (or use `.mts` files) |
| **TypeScript** | >= 4.7 | >= 5.0 |

---

## Breaking Changes

### 1. Module Format: CJS → ESM

v10 is ESM-only. If your project uses CommonJS, you have three options:

#### Option A: Migrate to ESM (recommended)

Add `"type": "module"` to your `package.json`:

```json
{
  "type": "module"
}
```

Then use standard ESM imports:

```typescript
import { Aptos, Network } from "@aptos-labs/ts-sdk";
```

#### Option B: Use the compat layer

```typescript
import { Aptos, Network } from "@aptos-labs/ts-sdk/compat";
```

#### Option C: Dynamic import

```javascript
const { Aptos, Network } = await import("@aptos-labs/ts-sdk");
```

### 2. Aptos Constructor

The `Aptos` constructor now accepts settings directly — no need to create an `AptosConfig` first.

**Before (v6):**

```typescript
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);
```

**After (v10):**

```typescript
// Settings shorthand (recommended)
const aptos = new Aptos({ network: Network.TESTNET });

// AptosConfig still works too
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
```

### 3. API Style: Flat → Namespaced

v6 used flat mixin-based methods. v10 organizes them into namespaces with positional arguments.

**Before (v6):**

```typescript
// Single-object args, flat methods
const info = await aptos.getAccountInfo({ accountAddress: "0x1" });
const modules = await aptos.getAccountModules({ accountAddress: "0x1" });
const resource = await aptos.getAccountResource({
  accountAddress: "0x1",
  resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
});
const ledger = await aptos.getLedgerInfo();
const gas = await aptos.getGasPriceEstimation();
```

**After (v10):**

```typescript
// Positional args, namespaced methods
const info = await aptos.account.getInfo("0x1");
const modules = await aptos.account.getModules("0x1");
const resource = await aptos.account.getResource(
  "0x1",
  "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
);
const ledger = await aptos.general.getLedgerInfo();
const gas = await aptos.general.getGasPriceEstimation();
```

### 4. Account Factory Functions

Static methods on `Account` are now standalone functions.

**Before (v6):**

```typescript
import { Account, SigningSchemeInput, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

// Generate
const account = Account.generate();
const secp = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });

// From private key
const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey("0x...") });

// From derivation path
const account = Account.fromDerivationPath({
  path: "m/44'/637'/0'/0'/0'",
  mnemonic: "various float stumble ...",
});
```

**After (v10):**

```typescript
import {
  generateAccount,
  accountFromPrivateKey,
  accountFromDerivationPath,
  SigningSchemeInput,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";

// Generate
const account = generateAccount();
const secp = generateAccount({ scheme: SigningSchemeInput.Secp256k1Ecdsa });

// From private key
const account = accountFromPrivateKey({ privateKey: new Ed25519PrivateKey("0x...") });

// From derivation path
const account = accountFromDerivationPath({
  path: "m/44'/637'/0'/0'/0'",
  mnemonic: "various float stumble ...",
});
```

**ESM JavaScript equivalent:**

```javascript
import { generateAccount, accountFromPrivateKey } from "@aptos-labs/ts-sdk";

const account = generateAccount();
```

**CJS JavaScript equivalent (via compat):**

```javascript
const { generateAccount, accountFromPrivateKey } = require("@aptos-labs/ts-sdk/compat");

const account = generateAccount();
```

### 5. Transaction API

The build → sign → submit flow has changed from nested sub-objects to flat namespace methods with positional arguments.

**Before (v6):**

```typescript
// Build
const txn = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
});

// Sign
const auth = aptos.transaction.sign({ signer: alice, transaction: txn });

// Submit
const pending = await aptos.transaction.submit.simple({
  transaction: txn,
  senderAuthenticator: auth,
});

// Or sign+submit
const pending = await aptos.signAndSubmitTransaction({
  signer: alice,
  transaction: txn,
});
```

**After (v10):**

```typescript
// Build
const txn = await aptos.transaction.buildSimple(alice.accountAddress, {
  function: "0x1::aptos_account::transfer",
  functionArguments: [bob.accountAddress, 100],
});

// Sign
const auth = aptos.transaction.sign(alice, txn);

// Submit
const pending = await aptos.transaction.submit(txn, auth);

// Or sign+submit (recommended)
const pending = await aptos.transaction.signAndSubmit(alice, txn);
```

**ESM JavaScript equivalent:**

```javascript
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";

const aptos = new Aptos({ network: Network.DEVNET });
const alice = generateAccount();

const txn = await aptos.transaction.buildSimple(alice.accountAddress, {
  function: "0x1::aptos_account::transfer",
  functionArguments: [bob.accountAddress, 100],
});

const pending = await aptos.transaction.signAndSubmit(alice, txn);
```

**CJS TypeScript equivalent (via compat, v6 style):**

```typescript
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk/compat";

const aptos = new Aptos({ network: Network.DEVNET });
const alice = generateAccount();

// v6-style still works in compat
const txn = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
});

const pending = await aptos.signAndSubmitTransaction({
  signer: alice,
  transaction: txn,
});
```

### 6. waitForTransaction Arguments

**Before (v6):**

```typescript
const result = await aptos.waitForTransaction({
  transactionHash: pending.hash,
});
```

**After (v10):**

```typescript
const result = await aptos.transaction.waitForTransaction(pending.hash, {
  checkSuccess: true,
});
```

### 7. AptosConfig Changes

| v6 | v10 | Notes |
|----|-----|-------|
| `config.client` | `config.client` | New `Client` interface with `sendRequest()` method |
| `TransactionGenerationConfig` | *(removed)* | Pass options directly to `buildSimple()` |
| `options.accountSequenceNumber` | `options.sequenceNumber` | Renamed in `BuildSimpleTransactionOptions` |

The `client` property is back but with a redesigned interface. In v6, `client` accepted a provider-style object. In v10, it uses a `Client` interface with a single `sendRequest()` method.

**Before (v6):**

```typescript
const config = new AptosConfig({
  network: Network.TESTNET,
  client: { provider: myHttpClient },
});
```

**After (v10):**

```typescript
import type { Client, ClientRequest, ClientResponse } from "@aptos-labs/ts-sdk/client";

const myClient: Client = {
  async sendRequest<Res>(request: ClientRequest): Promise<ClientResponse<Res>> {
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

const aptos = new Aptos({
  network: Network.TESTNET,
  client: myClient,
});
```

For header/auth customization without replacing the entire transport, use `clientConfig`:

```typescript
const aptos = new Aptos({
  network: Network.TESTNET,
  clientConfig: { http2: true, HEADERS: { "X-Custom": "value" } },
});
```

### 8. AptosApiError Fields

The `AptosApiError` class has been restructured. If you catch and inspect API errors:

**Before (v6):**

```typescript
try {
  await aptos.getAccountInfo({ accountAddress: "0xINVALID" });
} catch (e) {
  if (e instanceof AptosApiError) {
    console.log(e.status, e.message, e.data);
  }
}
```

**After (v10):**

```typescript
import { AptosApiError } from "@aptos-labs/ts-sdk";

try {
  await aptos.account.getInfo("0xINVALID");
} catch (e) {
  if (e instanceof AptosApiError) {
    console.log(e.status, e.message, e.data);
  }
}
```

The import path and field names are the same, but internal field structure of `data` may differ.

### 9. Noble v2 Import Paths

If you import directly from `@noble/curves` or `@noble/hashes`, v2 has breaking changes:

**Before (v6 / Noble v1):**

```typescript
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { sha3_256 } from "@noble/hashes/sha3";
```

**After (v10 / Noble v2):**

```typescript
// Same import paths, but internal APIs changed.
// The SDK abstracts over this — you only need to worry if you import Noble directly.
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";       // sha256 moved to sha2
import { sha3_256 } from "@noble/hashes/sha3";
```

---

## Removed APIs

| v6 API | v10 Status | Alternative |
|--------|-----------|-------------|
| `Account.generate()` | Removed | `generateAccount()` |
| `Account.fromPrivateKey()` | Removed | `accountFromPrivateKey()` |
| `Account.fromDerivationPath()` | Removed | `accountFromDerivationPath()` |
| `AptosConfig.client` (v6 shape) | Redesigned | New `Client` interface with `sendRequest()` |
| `TransactionGenerationConfig` | Removed | Pass options to `buildSimple()` |
| `aptos.transaction.build.simple()` | Removed | `aptos.transaction.buildSimple()` |
| `aptos.transaction.submit.simple()` | Removed | `aptos.transaction.submit()` |
| `aptos.signAndSubmitTransaction()` | Removed | `aptos.transaction.signAndSubmit()` |
| `aptos.waitForTransaction()` | Removed | `aptos.transaction.waitForTransaction()` |
| `aptos.ans.*` | Not yet ported | Use v6 SDK or `/compat` |
| `aptos.digitalAsset.*` | Not yet ported | Use v6 SDK or `/compat` |
| `aptos.fungibleAsset.*` | Not yet ported | Use v6 SDK or `/compat` |
| `aptos.staking.*` | Not yet ported | Use v6 SDK or `/compat` |
| `dist/browser/index.global.js` | Removed | Use a bundler with ESM |
| `dist/cjs/` | Removed | Use ESM or `/compat` for CJS |

---

## Method Mapping: v6 → v10

### Account

| v6 (flat, single-object args) | v10 (namespaced, positional args) |
|-------------------------------|-----------------------------------|
| `aptos.getAccountInfo({ accountAddress })` | `aptos.account.getInfo(accountAddress)` |
| `aptos.getAccountModules({ accountAddress, options? })` | `aptos.account.getModules(accountAddress, options?)` |
| `aptos.getAccountModule({ accountAddress, moduleName, options? })` | `aptos.account.getModule(accountAddress, moduleName, options?)` |
| `aptos.getAccountResource({ accountAddress, resourceType, options? })` | `aptos.account.getResource(accountAddress, resourceType, options?)` |
| `aptos.getAccountResources({ accountAddress, options? })` | `aptos.account.getResources(accountAddress, options?)` |
| `aptos.getAccountTransactions({ accountAddress, options? })` | `aptos.account.getTransactions(accountAddress, options?)` |

### General

| v6 | v10 |
|----|-----|
| `aptos.getLedgerInfo()` | `aptos.general.getLedgerInfo()` |
| `aptos.getChainId()` | `aptos.general.getChainId()` |
| `aptos.getBlockByVersion({ ledgerVersion, options? })` | `aptos.general.getBlockByVersion(ledgerVersion, options?)` |
| `aptos.getBlockByHeight({ blockHeight, options? })` | `aptos.general.getBlockByHeight(blockHeight, options?)` |
| `aptos.view({ payload, options? })` | `aptos.general.view(payload, options?)` |
| `aptos.getGasPriceEstimation()` | `aptos.general.getGasPriceEstimation()` |

### Transactions

| v6 | v10 |
|----|-----|
| `aptos.transaction.build.simple({ sender, data, options? })` | `aptos.transaction.buildSimple(sender, payload, options?)` |
| `aptos.transaction.sign({ signer, transaction })` | `aptos.transaction.sign(signer, transaction)` |
| `aptos.transaction.submit.simple({ transaction, senderAuthenticator })` | `aptos.transaction.submit(transaction, senderAuthenticator)` |
| `aptos.signAndSubmitTransaction({ signer, transaction })` | `aptos.transaction.signAndSubmit(signer, transaction)` |
| `aptos.waitForTransaction({ transactionHash, options? })` | `aptos.transaction.waitForTransaction(transactionHash, options?)` |
| `aptos.getTransactionByHash({ transactionHash })` | `aptos.transaction.getByHash(transactionHash)` |
| `aptos.getTransactionByVersion({ ledgerVersion })` | `aptos.transaction.getByVersion(ledgerVersion)` |
| `aptos.getTransactions({ options? })` | `aptos.transaction.getAll(options?)` |

### Coin & Faucet

| v6 | v10 |
|----|-----|
| `aptos.transferCoinTransaction({ sender, recipient, amount, coinType?, options? })` | `aptos.coin.transferTransaction(sender, recipient, amount, coinType?, options?)` |
| `aptos.fundAccount({ accountAddress, amount, options? })` | `aptos.faucet.fund(accountAddress, amount, options?)` |

### Table

| v6 | v10 |
|----|-----|
| `aptos.getTableItem({ handle, data, options? })` | `aptos.table.getItem(handle, data, options?)` |

### Standalone Functions

Every namespace method is also available as a standalone function that takes `config: AptosConfig` as the first argument. This enables maximum tree-shaking:

```typescript
// v10 standalone functions (from @aptos-labs/ts-sdk or @aptos-labs/ts-sdk/api)
import { AptosConfig } from "@aptos-labs/ts-sdk";
import { getAccountInfo, buildSimpleTransaction, waitForTransaction } from "@aptos-labs/ts-sdk/api";

const config = new AptosConfig({ network: Network.DEVNET });
const info = await getAccountInfo(config, "0x1");
```
