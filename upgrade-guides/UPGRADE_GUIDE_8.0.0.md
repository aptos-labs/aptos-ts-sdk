# Upgrade Guide: v7.x → v8.0.0

## Overview

v8.0.0 makes the SDK tree-shakeable, dramatically reducing bundle sizes for web and serverless consumers. The main bundle drops from ~228KB to ~44KB, and poseidon-lite (used only by Keyless) is fully isolated.

## Breaking Changes

### 1. Flat mixin API removed on `Aptos` class

The `Aptos` class no longer copies sub-module methods onto its prototype. Use the namespaced API instead.

**Before:**
```typescript
const aptos = new Aptos(config);
await aptos.getAccountInfo({ accountAddress: "0x1" });
await aptos.fundAccount({ accountAddress: "0x1", amount: 100 });
```

**After:**
```typescript
const aptos = new Aptos(config);
await aptos.account.getAccountInfo({ accountAddress: "0x1" });
await aptos.faucet.fundAccount({ accountAddress: "0x1", amount: 100 });
```

### 2. `Aptos` class is deprecated

The `Aptos` class still works but logs a deprecation warning on first use. Sub-modules are now lazily instantiated on first property access.

**Recommended migration — use standalone functions:**
```typescript
import { AptosConfig, getAccountInfo, fundAccount } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const info = await getAccountInfo({ aptosConfig: config, accountAddress: "0x1" });
```

### 3. Keyless imports moved

`KeylessAccount`, `FederatedKeylessAccount`, `EphemeralKeyPair`, `AbstractKeylessAccount`, and all poseidon/keyless crypto utilities are **no longer exported from the main entry point**.

**Before:**
```typescript
import { KeylessAccount, EphemeralKeyPair, poseidonHash } from "@aptos-labs/ts-sdk";
```

**After:**
```typescript
// Import keyless functions from the keyless sub-path
import { deriveKeylessAccount } from "@aptos-labs/ts-sdk/keyless";

// Import keyless account classes directly
import { KeylessAccount } from "@aptos-labs/ts-sdk/dist/account/KeylessAccount";
import { EphemeralKeyPair } from "@aptos-labs/ts-sdk/dist/account/EphemeralKeyPair";

// Import poseidon utilities directly
import { poseidonHash } from "@aptos-labs/ts-sdk/dist/core/crypto/poseidon";
```

### 4. HD Key imports moved

`isValidBIP44Path`, `isValidHardenedPath`, and other HD key utilities are no longer in the crypto barrel.

**After:**
```typescript
import { isValidBIP44Path } from "@aptos-labs/ts-sdk/dist/core/crypto/hdKey";
```

### 5. `deserializePublicKey` / `deserializeSignature` moved

These are no longer in the crypto barrel because they depend on keyless types.

**After:**
```typescript
import { deserializePublicKey } from "@aptos-labs/ts-sdk/dist/core/crypto/deserializationUtils";
```

## New Features

### Standalone Functions

All SDK operations are now available as standalone functions that accept `{ aptosConfig, ...args }`:

```typescript
import { AptosConfig, getLedgerInfo, getBalance, transferCoinTransaction } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });

// Read-only queries
const ledger = await getLedgerInfo({ aptosConfig: config });
const balance = await getBalance({ aptosConfig: config, accountAddress: "0x1", asset: "0x1::aptos_coin::AptosCoin" });

// Transaction building
const txn = await transferCoinTransaction({
  aptosConfig: config,
  sender: "0x1",
  recipient: "0x2",
  amount: 100,
});
```

### Sub-path Imports

Import only what you need for minimal bundle sizes:

```typescript
// Tiny import — only account query functions
import { getAccountInfo, getBalance } from "@aptos-labs/ts-sdk/account";

// Only transaction functions
import { generateTransaction, submitTransaction } from "@aptos-labs/ts-sdk/transaction";

// Only keyless (includes poseidon)
import { deriveKeylessAccount } from "@aptos-labs/ts-sdk/keyless";
```

### `sideEffects: false`

The package now declares `"sideEffects": false`, enabling bundlers to tree-shake unused exports.
