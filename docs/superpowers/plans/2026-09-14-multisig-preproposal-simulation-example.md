# Multisig Pre-Proposal Simulation Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the multisig v2 example complete on devnet and clearly document how to simulate a multisig payload before proposing it.

**Architecture:** Keep the SDK behavior unchanged. Lower the example client's default maximum gas amount so a faucet-funded account passes fullnode fee validation, then document the existing no-account-authenticator simulation flow at both the example and public API surfaces.

**Tech Stack:** TypeScript 7, Aptos TypeScript SDK, pnpm, Turbo, Biome, TypeDoc

## Global Constraints

- Keep `packages/ts-sdk/src/` compatible with browsers, React Native, Node.js 22+, Bun, and Deno.
- Do not hand-edit generated files under `docs/`.
- Use the existing `AptosConfig`, transaction builder, and simulation APIs; add no dependencies or runtime behavior.
- Update `packages/ts-sdk/CHANGELOG.md`.

---

### Task 1: Fix and document the multisig simulation example

**Files:**
- Modify: `examples/typescript/multisig_v2.ts:38-42,152-169`
- Modify: `packages/ts-sdk/src/api/transactionSubmission/simulate.ts:47-56`
- Modify: `packages/ts-sdk/src/transactions/types.ts:496-524`
- Modify: `packages/ts-sdk/CHANGELOG.md:5-12`

**Interfaces:**
- Consumes: `new AptosConfig({ transactionGenerationConfig: { defaultMaxGasAmount } })`, `aptos.transaction.build.simple`, and `aptos.transaction.simulate.simple`.
- Produces: a runnable devnet example and TypeDoc source comments for the existing `Simulate.simple` API. No public type or runtime signature changes.

- [ ] **Step 1: Preserve the failing end-to-end reproduction**

Run:

```bash
pnpm turbo run build --filter=@aptos-labs/ts-sdk
pnpm --dir examples/typescript multisig_v2
```

Expected before the fix: the fullnode rejects `create_with_owners` with
`INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE` because the faucet supplies 100,000,000 octas while the default maximum
fee is 200,000,000 octas at a gas-unit price of 100.

- [ ] **Step 2: Use a faucet-compatible maximum gas amount**

Replace the example client configuration with:

```typescript
const config = new AptosConfig({
  network: APTOS_NETWORK,
  transactionGenerationConfig: { defaultMaxGasAmount: 100_000 },
});
```

This permits a maximum fee of 10,000,000 octas at the current devnet gas-unit price and leaves enough balance for the
example's submitted transactions.

- [ ] **Step 3: Clarify the pre-proposal simulation flow**

Update the comments around `transactionToSimulate` to state:

```typescript
// Before creating an on-chain proposal, build the proposed entry function directly with the multisig account as sender.
// `withFeePayer` leaves the fee payer as 0x0 so no real account needs to pay for this simulation.
```

Update the simulation comment to state:

```typescript
// Omitting both public keys uses NoAccountAuthenticator for the sender and fee payer, skipping authentication-key
// validation during simulation. No multisig proposal needs to exist on-chain.
```

- [ ] **Step 4: Make the behavior discoverable in API documentation**

Add this behavior to the `Simulate.simple` JSDoc:

```typescript
/**
 * Simulates a transaction based on the provided parameters and returns the result.
 * This function helps you understand the outcome of a transaction before executing it on the blockchain.
 *
 * To pre-check a multisig proposal, build its entry function directly with the multisig address as sender and
 * `withFeePayer: true`, then omit `signerPublicKey` and `feePayerPublicKey`. The simulation uses no-account
 * authenticators to skip authentication-key validation, so the proposal does not need to exist on-chain.
 */
```

In `InputSimulateTransactionData`, place descriptive text before TypeDoc tags and document that omitting
`signerPublicKey` or `feePayerPublicKey` skips the corresponding authentication-key check:

```typescript
/**
 * The public key for a single-signer transaction. Omit it to skip the sender's public/authentication-key check during
 * simulation.
 * @group Implementation
 * @category Transactions
 */
signerPublicKey?: PublicKey;
```

```typescript
/**
 * The public key for the fee payer in a sponsored transaction. Omit it to skip the fee payer's
 * public/authentication-key check during simulation.
 * @group Implementation
 * @category Transactions
 */
feePayerPublicKey?: PublicKey;
```

- [ ] **Step 5: Record the correction**

Add under `# Unreleased` → `## Changed`:

```markdown
- Fix the `multisig_v2` example's devnet fee validation and document how to simulate a would-be multisig proposal
  without creating it on-chain first.
```

- [ ] **Step 6: Format and statically verify before committing**

Run:

```bash
pnpm fmt
pnpm check
pnpm turbo run build --filter=@aptos-labs/ts-sdk
git diff --check
```

Expected: every command exits with status 0.

- [ ] **Step 7: Commit and push the implementation**

```bash
git add examples/typescript/multisig_v2.ts \
  packages/ts-sdk/src/api/transactionSubmission/simulate.ts \
  packages/ts-sdk/src/transactions/types.ts \
  packages/ts-sdk/CHANGELOG.md
git commit -m "fix: make multisig v2 example runnable"
git push -u origin greg/fix-multisig-example-6c3c
```

- [ ] **Step 8: Verify the complete example**

Run:

```bash
pnpm --dir examples/typescript multisig_v2
```

Expected: the pre-proposal simulation reports `success: true`, and the process reaches
`Multisig setup and transactions complete.` with exit status 0.
