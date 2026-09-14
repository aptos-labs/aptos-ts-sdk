# Key Rotation Between Key Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outdated key-rotation example with a repeatable, self-verifying Ed25519 → MultiEd25519 → fixed Ed25519 flow.

**Architecture:** Keep the workflow in the existing standalone TypeScript example. Five deterministic private keys create one initial signer, one 2-of-3 MultiEd25519 signer, and one final signer at a stable account address; a preflight identifies and resets state from a previous or interrupted run before a shared helper submits and verifies the two requested rotations.

**Tech Stack:** TypeScript 7, `@aptos-labs/ts-sdk`, pnpm, Aptos localnet.

## Global Constraints

- All embedded private keys are public example-only material and must never hold real funds.
- Never print private-key material.
- Use one deterministic account address so verified target keys are not reused across originating accounts.
- Recover preflight state only when the on-chain key matches the initial, MultiEd25519, or final signer; reject unknown keys.
- Keep `packages/ts-sdk/src/` runtime-neutral; this feature requires no SDK source changes.
- Update `packages/ts-sdk/CHANGELOG.md`.
- Run `pnpm check`, `pnpm fmt`, and `pnpm check` before the implementation commit.

---

### Task 1: Implement and register the repeatable rotation example

**Files:**
- Modify: `examples/typescript/rotate_key.ts`
- Modify: `examples/typescript/package.json`
- Modify: `packages/ts-sdk/CHANGELOG.md`

**Interfaces:**
- Consumes: `Aptos.rotateAuthKey`, `Aptos.signAndSubmitTransaction`, `Aptos.waitForTransaction`, `Aptos.getAccountInfo`, `MultiEd25519Account`, and `MultiEd25519PublicKey`.
- Produces: `pnpm --dir examples/typescript rotate_key`, which restores a known deterministic signer when necessary and then rotates one account Ed25519 → 2-of-3 MultiEd25519 → fixed Ed25519.

- [ ] **Step 1: Add an acceptance assertion that catches the current missing submission**

Temporarily replace `examples/typescript/rotate_key.ts` with:

```typescript
/* eslint-disable no-console */

import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

// These keys are public example-only material. Never use them to hold real funds.
const finalPrivateKey = new Ed25519PrivateKey(
  "0x505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f",
);

const example = async () => {
  const initialAccount = Account.generate();
  const finalAccount = Account.fromPrivateKey({
    privateKey: finalPrivateKey,
    address: initialAccount.accountAddress,
  });

  await aptos.fundAccount({ accountAddress: initialAccount.accountAddress, amount: 1_000_000_000 });

  // This only builds the rotation and intentionally reproduces the current example's bug.
  await aptos.rotateAuthKey({ fromAccount: initialAccount, toAccount: finalAccount });

  const accountInfo = await aptos.getAccountInfo({ accountAddress: initialAccount.accountAddress });
  const expectedAuthenticationKey = finalAccount.publicKey.authKey().toString();
  if (accountInfo.authentication_key !== expectedAuthenticationKey) {
    throw new Error(
      `Authentication key mismatch: expected ${expectedAuthenticationKey}, received ${accountInfo.authentication_key}`,
    );
  }
};

example();
```

- [ ] **Step 2: Run the current example and verify the assertion fails**

Run:

```bash
pnpm turbo run build --filter=@aptos-labs/ts-sdk
pnpm --dir examples/typescript exec tsx rotate_key.ts
```

Expected: FAIL with `Authentication key mismatch`. The current example builds a rotation transaction but never signs or submits it.

- [ ] **Step 3: Replace the example with the complete implementation**

Replace `examples/typescript/rotate_key.ts` with:

```typescript
/* eslint-disable no-console */

import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const FUND_AMOUNT = 1_000_000_000;

// These keys are public and deterministic for this example. Never use them to hold real funds.
const INITIAL_ED25519_PRIVATE_KEY = new Ed25519PrivateKey(
  "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
);
const MULTI_ED25519_PRIVATE_KEYS = [
  new Ed25519PrivateKey("0x101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f"),
  new Ed25519PrivateKey("0x202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f"),
  new Ed25519PrivateKey("0x303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f"),
];
const FINAL_ED25519_PRIVATE_KEY = new Ed25519PrivateKey(
  "0x505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f",
);

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const initialEd25519Account = Account.fromPrivateKey({ privateKey: INITIAL_ED25519_PRIVATE_KEY });
const multiEd25519Account = new MultiEd25519Account({
  publicKey: new MultiEd25519PublicKey({
    publicKeys: MULTI_ED25519_PRIVATE_KEYS.map((privateKey) => privateKey.publicKey()),
    threshold: 2,
  }),
  signers: MULTI_ED25519_PRIVATE_KEYS.slice(0, 2),
  address: initialEd25519Account.accountAddress,
});
const finalEd25519Account = Account.fromPrivateKey({
  privateKey: FINAL_ED25519_PRIVATE_KEY,
  address: initialEd25519Account.accountAddress,
});

type NamedSigner = {
  account: Ed25519Account | MultiEd25519Account;
  name: string;
};

const knownSigners: NamedSigner[] = [
  { account: initialEd25519Account, name: "initial Ed25519" },
  { account: multiEd25519Account, name: "2-of-3 MultiEd25519" },
  { account: finalEd25519Account, name: "final Ed25519" },
];

async function getCurrentSigner(): Promise<NamedSigner> {
  const accountInfo = await aptos.getAccountInfo({ accountAddress: initialEd25519Account.accountAddress });
  const currentSigner = knownSigners.find(
    ({ account }) => account.publicKey.authKey().toString() === accountInfo.authentication_key,
  );
  if (!currentSigner) {
    throw new Error(
      `The account uses authentication key ${accountInfo.authentication_key}, which is not part of this example.`,
    );
  }
  return currentSigner;
}

async function rotateAndVerify(
  fromAccount: Account,
  toAccount: Ed25519Account | MultiEd25519Account,
  description: string,
): Promise<void> {
  const transaction = await aptos.rotateAuthKey({ fromAccount, toAccount });
  const pendingTransaction = await aptos.signAndSubmitTransaction({ signer: fromAccount, transaction });
  const committedTransaction = await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });

  const accountInfo = await aptos.getAccountInfo({ accountAddress: fromAccount.accountAddress });
  const expectedAuthenticationKey = toAccount.publicKey.authKey().toString();
  if (accountInfo.authentication_key !== expectedAuthenticationKey) {
    throw new Error(
      `Authentication key mismatch after ${description}: expected ${expectedAuthenticationKey}, received ${accountInfo.authentication_key}`,
    );
  }

  console.log(`${description} transaction: ${committedTransaction.hash}`);
  console.log(`Authentication key: ${expectedAuthenticationKey}`);
}

const example = async () => {
  await aptos.fundAccount({ accountAddress: initialEd25519Account.accountAddress, amount: FUND_AMOUNT });
  console.log(`Account address: ${initialEd25519Account.accountAddress}`);

  const currentSigner = await getCurrentSigner();
  if (currentSigner.account !== initialEd25519Account) {
    console.log(`Resetting ${currentSigner.name} to the initial Ed25519 signer...`);
    await rotateAndVerify(currentSigner.account, initialEd25519Account, "Preflight reset");
  }

  console.log("\nRotating to a 2-of-3 MultiEd25519 signer...");
  await rotateAndVerify(initialEd25519Account, multiEd25519Account, "Ed25519 to MultiEd25519 rotation");

  console.log("\nRotating to the fixed Ed25519 signer...");
  await rotateAndVerify(multiEd25519Account, finalEd25519Account, "MultiEd25519 to Ed25519 rotation");

  console.log("\nKey rotation example completed successfully.");
};

example();
```

- [ ] **Step 4: Add the package command**

Add this entry to `examples/typescript/package.json` next to the other account examples:

```json
"rotate_key": "tsx rotate_key.ts",
```

Do not add it to the aggregate `test` command. The dedicated two-run localnet acceptance check below covers this stateful example without making the full example suite more faucet-dependent.

- [ ] **Step 5: Add the changelog entry**

Under `# Unreleased` → `## Changed` in `packages/ts-sdk/CHANGELOG.md`, add:

```markdown
- Expand the TypeScript key-rotation example into a repeatable, self-verifying Ed25519 → MultiEd25519 → fixed Ed25519 flow.
```

- [ ] **Step 6: Run static validation**

Run:

```bash
pnpm --dir examples/typescript build
pnpm exec biome check examples/typescript/rotate_key.ts examples/typescript/package.json packages/ts-sdk/CHANGELOG.md
pnpm check
pnpm fmt
pnpm check
git diff --check
```

Expected: all commands exit 0; `git diff --check` prints nothing.

- [ ] **Step 7: Commit and push the pre-network-test revision**

```bash
git add examples/typescript/rotate_key.ts examples/typescript/package.json packages/ts-sdk/CHANGELOG.md
git commit -m "feat(examples): demonstrate repeatable cross-scheme key rotation"
git push -u origin greg/key-rotation-example-b7f7
```

- [ ] **Step 8: Run the example twice against one localnet**

In a persistent terminal, start localnet and wait until `http://127.0.0.1:8070/` reports ready:

```bash
TMPDIR=/tmp ENABLE_KEYLESS_DEFAULT=1 npx --yes --package=@aptos-labs/aptos-cli aptos node run-localnet --force-restart --assume-yes --with-indexer-api
```

In another terminal, run:

```bash
APTOS_NETWORK=local pnpm --dir examples/typescript rotate_key
APTOS_NETWORK=local pnpm --dir examples/typescript rotate_key
```

Expected:

- First run: two requested rotations commit and both authentication-key assertions pass.
- Second run: the preflight resets final Ed25519 to initial Ed25519, then both requested rotations commit and all three authentication-key assertions pass.
- Both runs exit 0 with `Key rotation example completed successfully.`

- [ ] **Step 9: Stop localnet and review the branch**

Stop the localnet process, then run:

```bash
git status --short --branch
git diff origin/main...HEAD -- examples/typescript/rotate_key.ts examples/typescript/package.json packages/ts-sdk/CHANGELOG.md
```

Expected: the worktree is clean and the diff contains only the approved example, package script, changelog, design, and plan changes.

- [ ] **Step 10: Update the pull request**

Update the pull-request description with the deterministic preflight behavior, implementation summary, exact validation commands, and the aptos-core issue link. Mark it ready for review only after both localnet runs and every static check pass.

