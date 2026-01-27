# Upgrade Guide: Aptos TypeScript SDK 6.0.0

This guide will help you migrate your code from SDK version 5.x to 6.0.0. Version 6.0.0 introduces several breaking changes to the ANS (Aptos Name Service) API.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
  - [Transaction Return Types](#transaction-return-types)
  - [Query Return Types](#query-return-types)
  - [Sender Parameter Type](#sender-parameter-type)
  - [Expiration Status Function](#expiration-status-function)
- [Migration Examples](#migration-examples)
- [New Features](#new-features)

## Overview

Version 6.0.0 focuses on improving the ANS API with better type safety, wallet adapter compatibility, and more granular expiration status handling. The main changes are:

1. Transaction-generating functions now return both transaction and data
2. Query functions return structured objects instead of arrays
3. Sender parameter accepts more flexible input types
4. New expiration status enum replaces boolean function

## Breaking Changes

### Transaction Return Types

**Before (5.x):**

```typescript
const transaction = await aptos.setTargetAddress({
  sender: alice,
  name: "test.aptos",
  address: bob.accountAddress,
});
```

**After (6.0.0):**

```typescript
const { transaction, data } = await aptos.setTargetAddress({
  sender: alice.accountAddress, // or alice, or "0x1..."
  name: "test.aptos",
  address: bob.accountAddress,
});
```

**Affected Functions:**

- `setTargetAddress()`
- `clearTargetAddress()`
- `setPrimaryName()`
- `registerName()`
- `renewDomain()`

### Query Return Types

**Before (5.x):**

```typescript
const names: GetANSNameResponse = await aptos.getAccountNames({
  accountAddress: "0x1",
});
// names is an array of AnsName
```

**After (6.0.0):**

```typescript
const { names, total } = await aptos.getAccountNames({
  accountAddress: "0x1",
});
// names is AnsName[]
// total is number
```

**Affected Functions:**

- `getAccountNames()` - now returns `{ names: AnsName[]; total: number }`
- `getAccountDomains()` - now returns `{ names: AnsName[]; total: number }`
- `getAccountSubdomains()` - now returns `{ names: AnsName[]; total: number }`
- `getDomainSubdomains()` - now returns `{ names: AnsName[]; total: number }`
- `getName()` - now returns `AnsName | undefined` instead of `GetANSNameResponse[0] | undefined`

### Sender Parameter Type

**Before (5.x):**

```typescript
const transaction = await aptos.setTargetAddress({
  sender: alice, // Required Account type
  name: "test.aptos",
  address: bob.accountAddress,
});
```

**After (6.0.0):**

```typescript
// All of these are now valid:
const { transaction } = await aptos.setTargetAddress({
  sender: alice, // Account still works
  name: "test.aptos",
  address: bob.accountAddress,
});

// Or use AccountAddress
const { transaction } = await aptos.setTargetAddress({
  sender: alice.accountAddress,
  name: "test.aptos",
  address: bob.accountAddress,
});

// Or use string
const { transaction } = await aptos.setTargetAddress({
  sender: "0x1...",
  name: "test.aptos",
  address: bob.accountAddress,
});
```

**Affected Functions:**

- `setTargetAddress()`
- `clearTargetAddress()`
- `setPrimaryName()`
- `registerName()`
- `renewDomain()`

### Expiration Status Function

**Before (5.x):**

```typescript
import { isActiveANSName } from "@aptos-labs/ts-sdk/internal/ans";

const isActive = isActiveANSName(name);
// Returns: boolean
```

**After (6.0.0):**

```typescript
import { getANSExpirationStatus } from "@aptos-labs/ts-sdk/internal/ans";
import { ExpirationStatus } from "@aptos-labs/ts-sdk";

const status = getANSExpirationStatus({
  aptosConfig,
  name: rawName,
  gracePeriod: 30 * 24 * 60 * 60, // 30 days in seconds
});
// Returns: ExpirationStatus.Active | ExpirationStatus.InGracePeriod | ExpirationStatus.Expired
```

## Migration Examples

### Example 1: Setting Target Address

**Before:**

```typescript
const transaction = await aptos.setTargetAddress({
  sender: alice,
  name: "test.aptos",
  address: bob.accountAddress,
});

await aptos.signAndSubmitTransaction({
  transaction,
  signer: alice,
});
```

**After:**

```typescript
const { transaction, data } = await aptos.setTargetAddress({
  sender: alice.accountAddress, // or alice
  name: "test.aptos",
  address: bob.accountAddress,
});

// Use with wallet adapter
await walletAdapter.signAndSubmitTransaction(data);

// Or use with SDK
await aptos.signAndSubmitTransaction({
  transaction,
  signer: alice,
});
```

### Example 2: Registering a Name

**Before:**

```typescript
const transaction = await aptos.registerName({
  sender: alice,
  name: "test.aptos",
  expiration: { policy: "domain" },
});

await aptos.signAndSubmitTransaction({
  transaction,
  signer: alice,
});
```

**After:**

```typescript
const { transaction, data } = await aptos.registerName({
  sender: alice.accountAddress,
  name: "test.aptos",
  expiration: { policy: "domain" },
});

await aptos.signAndSubmitTransaction({
  transaction,
  signer: alice,
});
```

### Example 3: Querying Account Names

**Before:**

```typescript
const names: GetANSNameResponse = await aptos.getAccountNames({
  accountAddress: "0x1",
});

console.log(`Found ${names.length} names`);
names.forEach((name) => {
  console.log(name.domain);
});
```

**After:**

```typescript
const { names, total } = await aptos.getAccountNames({
  accountAddress: "0x1",
});

console.log(`Found ${total} names (showing ${names.length})`);
names.forEach((name) => {
  console.log(name.domain);
});
```

### Example 4: Checking Expiration Status

**Before:**

```typescript
import { isActiveANSName } from "@aptos-labs/ts-sdk/internal/ans";

const name = await aptos.getName({ name: "test.aptos" });
if (name && isActiveANSName(name)) {
  console.log("Name is active");
} else {
  console.log("Name is expired");
}
```

**After:**

```typescript
import { getANSExpirationStatus } from "@aptos-labs/ts-sdk/internal/ans";
import { ExpirationStatus } from "@aptos-labs/ts-sdk";

const name = await aptos.getName({ name: "test.aptos" });
if (name) {
  const gracePeriod = await aptos.ans.getANSGracePeriod({ aptosConfig });
  const status = getANSExpirationStatus({
    aptosConfig,
    name: name as any, // RawANSName type
    gracePeriod,
  });

  switch (status) {
    case ExpirationStatus.Active:
      console.log("Name is active");
      break;
    case ExpirationStatus.InGracePeriod:
      console.log("Name is in grace period");
      break;
    case ExpirationStatus.Expired:
      console.log("Name is expired");
      break;
  }
}
```

**Note:** The `AnsName` type returned by `getName()` already includes `expiration_status`, so you can also use:

```typescript
const name = await aptos.getName({ name: "test.aptos" });
if (name) {
  switch (name.expiration_status) {
    case ExpirationStatus.Active:
      console.log("Name is active");
      break;
    // ... etc
  }
}
```

## New Features

### clearTargetAddress() Public API

The `clearTargetAddress()` method is now available in the public ANS API:

```typescript
const { transaction, data } = await aptos.clearTargetAddress({
  sender: alice.accountAddress,
  name: "test.aptos",
});
```

### Enhanced AnsName Type

The `AnsName` type now includes additional fields:

```typescript
interface AnsName {
  // ... existing fields
  expiration_status: ExpirationStatus;
  isInRenewablePeriod: boolean;
}
```

### ExpirationStatus Enum

```typescript
enum ExpirationStatus {
  Active = "Active",
  InGracePeriod = "InGracePeriod",
  Expired = "Expired",
}
```

## Additional Notes

- All transaction-generating functions now return the `data` field which can be used directly with wallet adapters
- The `sender` parameter is more flexible and accepts `Account`, `AccountAddress`, or `string`
- Query functions provide better type safety with structured return objects
- The new expiration status system provides more granular information about name expiration
