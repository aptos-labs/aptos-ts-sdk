# Upgrade Guide: v7.x → v8.0.0

## Overview

v8.0.0 makes the SDK tree-shakeable and modernizes the build output. The SDK now uses plain `tsc` (no bundler), `nodenext` module resolution, and provides three tiers of usage for different bundle-size needs.

## Breaking Changes

### 1. ESM-only, Node.js 22+ required

CommonJS `require()` is no longer supported. All imports must use ESM `import` syntax.

**Before:**
```javascript
const { Aptos } = require("@aptos-labs/ts-sdk");
```

**After:**
```typescript
import { Aptos } from "@aptos-labs/ts-sdk";
```

### 2. Keyless imports moved

`KeylessAccount`, `FederatedKeylessAccount`, `EphemeralKeyPair`, `AbstractKeylessAccount`, and all poseidon/keyless crypto utilities are **no longer exported from the main entry point** (to keep poseidon-lite out of the main bundle).

**Before:**
```typescript
import { KeylessAccount, EphemeralKeyPair, poseidonHash } from "@aptos-labs/ts-sdk";
```

**After:**
```typescript
// Keyless functions from the keyless sub-path
import { deriveKeylessAccount } from "@aptos-labs/ts-sdk/keyless";

// Keyless account classes directly
import { KeylessAccount } from "@aptos-labs/ts-sdk/dist/account/KeylessAccount.js";
import { EphemeralKeyPair } from "@aptos-labs/ts-sdk/dist/account/EphemeralKeyPair.js";

// Poseidon utilities directly
import { poseidonHash } from "@aptos-labs/ts-sdk/dist/core/crypto/poseidon.js";
```

### 3. HD Key imports moved

`isValidBIP44Path`, `isValidHardenedPath`, and other HD key utilities are no longer in the crypto barrel.

**After:**
```typescript
import { isValidBIP44Path } from "@aptos-labs/ts-sdk/dist/core/crypto/hdKey.js";
```

### 4. `generateSignedTransactionForSimulation` is now async

Callers must `await` it.

### 5. Standalone functions not in barrel

Standalone functions (e.g., `getLedgerInfo`, `transferCoinTransaction`) are **not** exported from the main `@aptos-labs/ts-sdk` entry point. Import them from sub-paths:

```typescript
import { getLedgerInfo } from "@aptos-labs/ts-sdk/general";
import { transferCoinTransaction } from "@aptos-labs/ts-sdk/coin";
```

## New Features

### Three tiers of usage

**Tier 1: `Aptos` class (convenience, not tree-shakeable)**
```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
await aptos.getLedgerInfo();
await aptos.account.getAccountInfo({ accountAddress: "0x1" });
```

**Tier 2: Namespace classes from sub-paths (tree-shakeable + autocomplete)**
```typescript
import { General, AptosConfig } from "@aptos-labs/ts-sdk/general";
import { Account } from "@aptos-labs/ts-sdk/account";

const config = new AptosConfig({ network: Network.TESTNET });
const general = new General(config);
const account = new Account(config);

await general.getLedgerInfo();
await account.getAccountInfo({ accountAddress: "0x1" });
```

**Tier 3: Standalone functions (maximum tree-shaking)**
```typescript
import { getLedgerInfo } from "@aptos-labs/ts-sdk/general";
import { getAccountInfo } from "@aptos-labs/ts-sdk/account";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
await getLedgerInfo({ aptosConfig: config });
await getAccountInfo({ aptosConfig: config, accountAddress: "0x1" });
```

### Sub-path exports

Each sub-path exports both standalone functions and the namespace class:

| Sub-path | Namespace Class | Functions |
|----------|----------------|-----------|
| `@aptos-labs/ts-sdk/account` | `Account` | `getAccountInfo`, `getBalance`, ... |
| `@aptos-labs/ts-sdk/coin` | `Coin` | `transferCoinTransaction` |
| `@aptos-labs/ts-sdk/general` | `General` | `getLedgerInfo`, `getChainId`, ... |
| `@aptos-labs/ts-sdk/transaction` | `Transaction` | `generateTransaction`, `submitTransaction`, ... |
| `@aptos-labs/ts-sdk/faucet` | `Faucet` | `fundAccount` |
| `@aptos-labs/ts-sdk/keyless` | `Keyless` | `deriveKeylessAccount`, `getPepper`, ... |
| `@aptos-labs/ts-sdk/digitalAsset` | `DigitalAsset` | `createCollectionTransaction`, ... |
| `@aptos-labs/ts-sdk/fungibleAsset` | `FungibleAsset` | `transferFungibleAsset`, ... |
| `@aptos-labs/ts-sdk/staking` | `Staking` | `getDelegatedStakingActivities`, ... |
| `@aptos-labs/ts-sdk/ans` | `ANS` | `getName`, `registerName`, ... |
| `@aptos-labs/ts-sdk/table` | `Table` | `getTableItem`, ... |
| `@aptos-labs/ts-sdk/object` | `AptosObject` | `getObjectData`, ... |
| `@aptos-labs/ts-sdk/view` | *(none)* | `view`, `viewJson` |
| `@aptos-labs/ts-sdk/bcs` | *(core types)* | BCS serialization primitives |
| `@aptos-labs/ts-sdk/crypto` | *(core types)* | Crypto primitives |

All sub-paths also export `AptosConfig` for convenience.

### `sideEffects: false`

The package declares `"sideEffects": false`, enabling bundlers to tree-shake unused exports.
