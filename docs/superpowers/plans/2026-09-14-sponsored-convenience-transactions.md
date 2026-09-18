# Sponsored Convenience Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing `withFeePayer?: boolean` generation flag on every TS SDK convenience transaction builder.

**Architecture:** Keep `withFeePayer` as a sibling of `options`, matching `transaction.build.simple`. Public class methods forward it to exported internal builders, and every internal builder forwards it to `generateTransaction`, which retains ownership of the zero-address fee-payer marker.

**Tech Stack:** TypeScript, Vitest, pnpm, Biome, Turbo

## Global Constraints

- Preserve browser, React Native, Node.js 22+, Bun, and Deno compatibility.
- Do not add dependencies or Node-only APIs.
- Keep current transaction payloads, sender types, return types, and default behavior unchanged.
- `withFeePayer` is optional and must remain separate from `InputGenerateTransactionOptions`.
- Follow test-first development and update `packages/ts-sdk/CHANGELOG.md`.

---

### Task 1: Digital-asset and fungible-asset builders

**Files:**
- Modify: `packages/ts-sdk/tests/unit/internal/digitalAsset-transactions.test.ts`
- Modify: `packages/ts-sdk/tests/unit/internal/fungibleAsset.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/digitalAsset-wrappers.test.ts`
- Modify: `packages/ts-sdk/src/internal/digitalAsset.ts`
- Modify: `packages/ts-sdk/src/internal/fungibleAsset.ts`
- Modify: `packages/ts-sdk/src/api/digitalAsset.ts`
- Modify: `packages/ts-sdk/src/api/fungibleAsset.ts`

**Interfaces:**
- Consumes: `generateTransaction(args: InputGenerateTransactionData): Promise<AnyRawTransaction>`
- Produces: Existing digital-asset and fungible-asset builder signatures plus `withFeePayer?: boolean`

- [ ] **Step 1: Write failing forwarding tests**

Add `withFeePayer: true` to calls covering all 15 digital-asset builders and both fungible-asset builders, then assert the downstream call includes the flag:

```ts
expect(mockedGenerateTransaction).toHaveBeenLastCalledWith(
  expect.objectContaining({ withFeePayer: true }),
);
```

For the public digital-asset wrapper, assert the internal function receives the same property:

```ts
expect(transferDigitalAssetTransaction).toHaveBeenCalledWith(
  expect.objectContaining({ aptosConfig: config, withFeePayer: true }),
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run \
  tests/unit/internal/digitalAsset-transactions.test.ts \
  tests/unit/internal/fungibleAsset.test.ts \
  tests/unit/api/digitalAsset-wrappers.test.ts
```

Expected: FAIL because `withFeePayer` is absent from the internal `generateTransaction` calls.

- [ ] **Step 3: Add the flag to every digital/fungible builder**

Apply this exact signature and forwarding shape to every builder named in the design:

```ts
args: {
  // existing fields stay unchanged
  withFeePayer?: boolean;
  options?: InputGenerateTransactionOptions;
}

const { /* existing fields */, withFeePayer, options } = args;
return generateTransaction({
  aptosConfig,
  sender,
  data,
  withFeePayer,
  options,
});
```

Public methods retain their spread forwarding:

```ts
return transferDigitalAssetTransaction({ aptosConfig: this.config, ...args });
```

Document each new public and standalone field with:

```ts
* @param args.withFeePayer - Whether to build a fee-payer transaction.
```

- [ ] **Step 4: Run tests to verify they pass**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ts-sdk/src/{api,internal}/{digitalAsset,fungibleAsset}.ts \
  packages/ts-sdk/tests/unit/internal/{digitalAsset-transactions,fungibleAsset}.test.ts \
  packages/ts-sdk/tests/unit/api/digitalAsset-wrappers.test.ts
git commit -m "feat: support sponsored asset transactions"
```

### Task 2: Coin and ANS builders

**Files:**
- Modify: `packages/ts-sdk/tests/unit/internal/coin.test.ts`
- Modify: `packages/ts-sdk/tests/unit/internal/ans-transactions.test.ts`
- Modify: `packages/ts-sdk/tests/unit/internal/ans.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/wrappers.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/ans.test.ts`
- Modify: `packages/ts-sdk/src/internal/coin.ts`
- Modify: `packages/ts-sdk/src/internal/ans.ts`
- Modify: `packages/ts-sdk/src/api/coin.ts`
- Modify: `packages/ts-sdk/src/api/ans.ts`

**Interfaces:**
- Consumes: The standard optional `withFeePayer` generation flag.
- Produces: Sponsored `transferCoinTransaction`, `setTargetAddress`, `clearTargetAddress`, `setPrimaryName`, `registerName`, and `renewDomain`.

- [ ] **Step 1: Write failing tests for every path**

Pass `withFeePayer: true` in coin and ANS tests and assert:

```ts
expect(mockedGenerateTransaction.mock.calls[0][0].withFeePayer).toBe(true);
```

Exercise both `setPrimaryName` branches and the domain/subdomain registration branches so each `generateTransaction` call is checked.

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run \
  tests/unit/internal/coin.test.ts \
  tests/unit/internal/ans-transactions.test.ts \
  tests/unit/internal/ans.test.ts \
  tests/unit/api/wrappers.test.ts \
  tests/unit/api/ans.test.ts
```

Expected: FAIL because the internal builders drop `withFeePayer`.

- [ ] **Step 3: Implement explicit forwarding**

Add this field to the public and internal argument types:

```ts
withFeePayer?: boolean;
```

Destructure and pass it to every ANS branch and the coin builder:

```ts
const { aptosConfig, sender, withFeePayer, options } = args;
const transaction = await generateTransaction({
  aptosConfig,
  sender,
  data,
  withFeePayer,
  options,
});
```

Add the `@param args.withFeePayer` JSDoc line to all six public and standalone functions.

- [ ] **Step 4: Run tests to verify they pass**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ts-sdk/src/{api,internal}/{coin,ans}.ts \
  packages/ts-sdk/tests/unit/internal/{coin,ans-transactions,ans}.test.ts \
  packages/ts-sdk/tests/unit/api/{wrappers,ans}.test.ts
git commit -m "feat: support sponsored coin and ANS transactions"
```

### Task 3: Keyless, package publication, and key rotation

**Files:**
- Modify: `packages/ts-sdk/tests/unit/internal/keyless-federated-success.test.ts`
- Modify: `packages/ts-sdk/tests/unit/internal/publicPackageTransaction.test.ts`
- Modify: `packages/ts-sdk/tests/unit/internal/account-rotate.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/keyless-wrappers.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/transaction-wrappers.test.ts`
- Modify: `packages/ts-sdk/src/internal/keyless.ts`
- Modify: `packages/ts-sdk/src/internal/transactionSubmission.ts`
- Modify: `packages/ts-sdk/src/internal/account.ts`
- Modify: `packages/ts-sdk/src/api/keyless.ts`
- Modify: `packages/ts-sdk/src/api/transaction.ts`

**Interfaces:**
- Produces: Sponsored `updateFederatedKeylessJwkSetTransaction`, `publicPackageTransaction`, `publishPackageTransaction`, `rotateAuthKey`, and `rotateAuthKeyUnverified`.

- [ ] **Step 1: Write failing unit and integration assertions**

For keyless and both rotation forms, assert mocked calls include:

```ts
expect.objectContaining({ withFeePayer: true })
```

Change the non-mocked package-publication test to build with `withFeePayer: true` and assert:

```ts
expect(txn.feePayerAddress?.equals(AccountAddress.ZERO)).toBe(true);
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run \
  tests/unit/internal/keyless-federated-success.test.ts \
  tests/unit/internal/publicPackageTransaction.test.ts \
  tests/unit/internal/account-rotate.test.ts \
  tests/unit/api/keyless-wrappers.test.ts \
  tests/unit/api/transaction-wrappers.test.ts
```

Expected: compile/assertion failures because the convenience signatures and forwarding lack the flag.

- [ ] **Step 3: Implement forwarding through every layer**

Add the optional property to public and internal types:

```ts
withFeePayer?: boolean;
```

Forward it into direct generation calls and through `rotateAuthKeyWithChallenge`:

```ts
return rotateAuthKeyWithChallenge({
  aptosConfig,
  fromAccount,
  toNewPrivateKey: args.toNewPrivateKey,
  withFeePayer,
  options,
});
```

Every final call uses:

```ts
return generateTransaction({
  aptosConfig,
  sender,
  data,
  withFeePayer,
  options,
});
```

Add JSDoc for each affected function.

- [ ] **Step 4: Run tests to verify they pass**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ts-sdk/src/api/{keyless,transaction}.ts \
  packages/ts-sdk/src/internal/{keyless,transactionSubmission,account}.ts \
  packages/ts-sdk/tests/unit/internal/{keyless-federated-success,publicPackageTransaction,account-rotate}.test.ts \
  packages/ts-sdk/tests/unit/api/{keyless-wrappers,transaction-wrappers}.test.ts
git commit -m "feat: support sponsored account transactions"
```

### Task 4: Account-abstraction builders

**Files:**
- Modify: `packages/ts-sdk/tests/unit/internal/abstraction.test.ts`
- Modify: `packages/ts-sdk/tests/unit/api/account-abstraction.test.ts`
- Modify: `packages/ts-sdk/src/internal/abstraction.ts`
- Modify: `packages/ts-sdk/src/api/account/abstraction.ts`

**Interfaces:**
- Produces: Sponsored add/remove authentication-function operations, authenticator removal, and enable/disable aliases.

- [ ] **Step 1: Write failing tests**

Pass `withFeePayer: true` to all three internal functions and assert their generated input contains it. In API tests, verify add/enable and both disable branches forward:

```ts
expect(mockedRemove).toHaveBeenCalledWith(
  expect.objectContaining({ withFeePayer: true }),
);
expect(mockedRemoveDispatchable).toHaveBeenCalledWith(
  expect.objectContaining({ withFeePayer: true }),
);
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run \
  tests/unit/internal/abstraction.test.ts \
  tests/unit/api/account-abstraction.test.ts
```

Expected: FAIL because manually reconstructed API/internal argument objects omit the flag.

- [ ] **Step 3: Implement all abstraction paths**

Add `withFeePayer?: boolean` to all three base methods and `disableAccountAbstractionTransaction`.
The enable alias inherits the add-method type. Forward the field explicitly:

```ts
const { accountAddress, authenticationFunction, withFeePayer, options } = args;
return removeAuthenticationFunctionTransaction({
  aptosConfig: this.config,
  sender: accountAddress,
  authenticationFunction,
  withFeePayer,
  options,
});
```

Add matching JSDoc to the base methods and aliases.

- [ ] **Step 4: Run tests to verify they pass**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ts-sdk/src/{api/account,internal}/abstraction.ts \
  packages/ts-sdk/tests/unit/{api/account-abstraction,internal/abstraction}.test.ts
git commit -m "feat: support sponsored abstraction transactions"
```

### Task 5: Cross-cutting verification and documentation

**Files:**
- Modify: `packages/ts-sdk/CHANGELOG.md` (already added with the design)
- Verify: all source and test files from Tasks 1–4

**Interfaces:**
- Produces: A fully checked SDK-wide additive API change.

- [ ] **Step 1: Search for missed convenience builders**

```bash
rg -n "generateTransaction\\(" packages/ts-sdk/src/internal
rg -n "withFeePayer" packages/ts-sdk/src/{api,internal}
```

Expected: every convenience-builder call identified in the design forwards `withFeePayer`; core transaction-submission calls remain unchanged.

- [ ] **Step 2: Format and run the focused test suite**

```bash
pnpm fmt
TMPDIR=/tmp pnpm --filter @aptos-labs/ts-sdk exec vitest run \
  tests/unit/internal/digitalAsset-transactions.test.ts \
  tests/unit/internal/fungibleAsset.test.ts \
  tests/unit/internal/coin.test.ts \
  tests/unit/internal/ans-transactions.test.ts \
  tests/unit/internal/ans.test.ts \
  tests/unit/internal/keyless-federated-success.test.ts \
  tests/unit/internal/publicPackageTransaction.test.ts \
  tests/unit/internal/account-rotate.test.ts \
  tests/unit/internal/abstraction.test.ts \
  tests/unit/api/digitalAsset-wrappers.test.ts \
  tests/unit/api/wrappers.test.ts \
  tests/unit/api/ans.test.ts \
  tests/unit/api/keyless-wrappers.test.ts \
  tests/unit/api/transaction-wrappers.test.ts \
  tests/unit/api/account-abstraction.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run repository checks and build**

```bash
pnpm check
pnpm build
```

Expected: all tasks succeed with no TypeScript or Biome errors.

- [ ] **Step 4: Commit any formatting-only corrections**

```bash
git add packages/ts-sdk docs/superpowers
git commit -m "chore: finalize sponsored transaction support"
```

Skip this commit when formatting produces no changes.
