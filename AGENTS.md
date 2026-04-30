# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

This is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`), a comprehensive SDK for interacting with the Aptos blockchain. It provides account management, transaction building/submission, data querying, digital assets, keyless authentication, and more.

## Runtime Compatibility

This SDK must work in **all** of the following runtimes:

- **Browsers** (Chrome, Firefox, Safari — via bundlers like Vite/webpack)
- **React Native**
- **Node.js** (>= 22)
- **Bun**
- **Deno**

**Do not use Node-only APIs in `src/`.** This means:
- No `Buffer` — use `Uint8Array`, `atob`/`btoa`, or `TextEncoder`/`TextDecoder`
- No `node:` protocol imports (e.g., `node:events`, `node:crypto`, `node:fs`)
- No `process.env` without guards
- `src/cli/` is the only exception (Node-only by design)

Runtime-specific tests exist in `examples/web-test/` (Playwright), `examples/bun-test/`, and `examples/deno-test/`, with corresponding CI workflows in `.github/workflows/`. React Native is supported but not CI-tested — browser tests cover the same API surface (requires RN 0.74+ for Hermes `TextEncoder`/`crypto.getRandomValues` support).

## Requirements

- **Node**: use the version in `.node-version` (currently `v22.12.0`). `package.json` requires `node >= 22`.
- **pnpm**: repo uses `pnpm` (see `.tool-versions`, `package.json#packageManager`).

## Repo Layout

- **SDK source**: `src/`
- **SDK tests**: `tests/`
  - Vitest uses `tests/preTest.ts` (globalSetup with setup/teardown) to start/stop a local Aptos node.
- **Examples**: `examples/`
  - `examples/typescript`, `examples/javascript` use a **linked** SDK (`link:../..`).
- **Confidential asset SDK**: `confidential-asset/` (separate package + tests, with its own [`CHANGELOG.md`](./confidential-asset/CHANGELOG.md))
- **Docs output**: `docs/` (large; includes versioned typedoc output)
- **Utility scripts**: `scripts/` (`checkVersion.sh`, `updateVersion.sh`, `generateDocs.sh`)

## Common Commands

```bash
pnpm install              # Install dependencies (CI uses --frozen-lockfile)
pnpm build                # Build ESM output to dist/
pnpm fmt                  # Format code with Biome
pnpm _fmt                 # Check formatting without writing (what CI runs)
pnpm lint                 # Run Biome linter
pnpm check                # Run Biome check (lint + format)
pnpm test                 # Run all tests (unit + e2e)
vitest run <file>         # Run a specific test file (e.g., vitest run keyless.test.ts)
pnpm doc                  # Generate TypeDoc documentation
pnpm check-version        # Verify version consistency across files
pnpm update-version       # Bump version everywhere + regenerate docs
pnpm indexer-codegen      # Generate GraphQL types from indexer schema
```

## Commit Guidelines

Before every commit:

1. **Check code**: Run `pnpm check` to run Biome (lint + format)
2. **Format code**: Run `pnpm fmt` to auto-format with Biome
3. **Update the appropriate CHANGELOG**: Add a descriptive entry under the appropriate section (Added, Changed, Fixed, etc.).
   - Changes to `@aptos-labs/ts-sdk` (everything under `src/`, `tests/`, root configs, examples, docs tooling, etc.) → root [`CHANGELOG.md`](./CHANGELOG.md).
   - Changes to `@aptos-labs/confidential-asset` (everything under `confidential-asset/`) → [`confidential-asset/CHANGELOG.md`](./confidential-asset/CHANGELOG.md).
   - If a single commit touches both packages, add an entry to **each** changelog rather than mixing concerns.
4. **Write descriptive commit messages**: Commits should clearly explain what changed and why. For confidential-asset–only commits, prefix the subject with `[confidential-asset]` to match existing history.

## Testing

Run all SDK tests (unit + e2e):

```bash
pnpm test
```

Run a specific Vitest test file:

```bash
vitest run keyless.test.ts
```

### Local Testnet Behavior

Vitest `globalSetup` starts a **local Aptos node** via the SDK's `LocalNode` helper (see `src/cli/localNode.ts`), which runs:

- `npx aptos node run-localnet --force-restart --assume-yes --with-indexer-api`
- Readiness endpoint: `http://127.0.0.1:8070/`

**Important notes:**

- **Docker is required** (the Aptos CLI localnet pulls and runs containers, including Postgres).
- In environments without Docker, `pnpm test` will fail during Vitest `globalSetup` before any tests run.
- Failures often come from **port conflicts** or the node not becoming ready in time.
- If tests hang or fail early, check whether something else is using port `8070`.
- If Docker mount errors occur, try setting `TMPDIR` to a normal filesystem path.

### Running Examples

Examples require a built local SDK first:

```bash
pnpm build
cd examples/typescript
pnpm install
pnpm build
pnpm test
```

### Confidential Asset Package

```bash
pnpm install --frozen-lockfile
cd confidential-asset && pnpm install --frozen-lockfile
cd confidential-asset && pnpm test
```

When changing shared infra (vitest config, root tooling), ensure confidential-asset still works.

## Architecture

### Main Entry Point

The `Aptos` class (`src/api/aptos.ts`) is the primary user-facing interface. It aggregates domain-specific functionality through composition:

```typescript
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
// Access namespaced methods: aptos.account.*, aptos.transaction.*, aptos.coin.*, etc.
```

### Source Structure

| Directory | Purpose |
|-----------|---------|
| `src/api/` | High-level API surface - account, transaction, coin, digital assets, fungible assets, keyless, staking, ANS |
| `src/account/` | Account implementations - Ed25519, Secp256k1, MultiKey, Keyless, Abstracted accounts |
| `src/core/` | Cryptographic primitives - key types, signatures, authentication keys |
| `src/transactions/` | Transaction building, authenticators, type tags |
| `src/bcs/` | Binary Canonical Serialization (serializer/deserializer) |
| `src/types/` | TypeScript types and generated GraphQL indexer types |
| `src/client/` | HTTP client implementations |
| `src/internal/` | Internal query implementations (queries directory is generated) |

### Key Patterns

- **Account factory methods**: `Account.generate()`, `Account.fromPrivateKey()`, `Account.fromDerivationPath()`
- **Transaction flow**: Build → Sign → Submit → Wait (`aptos.transaction.build.simple()`, etc.)
- **Configuration**: `AptosConfig` accepts network, custom endpoints, client options

## Generated Code (Do Not Hand-Edit)

- `src/types/generated/` - GraphQL types from `pnpm indexer-codegen`
- `src/internal/queries/` - Generated query implementations
- `docs/` - Versioned TypeDoc output from `pnpm doc`

## Version Management

Versions must match across `package.json`, `src/version.ts`, and `docs/`. Use `pnpm update-version` rather than manual edits. CI runs `pnpm check-version` to enforce consistency.

What `check-version` enforces:

- `package.json` version matches `src/version.ts`
- `docs/index.md` contains the current version entry
- `docs/@aptos-labs/ts-sdk-<version>/` exists

### Breaking Changes

When releasing a new version with breaking changes:

1. Create an upgrade guide at `upgrade-guides/UPGRADE_GUIDE_X.Y.Z.md`
2. Document all breaking changes with before/after code examples
3. Reference the upgrade guide in the appropriate changelog under the version heading — root [`CHANGELOG.md`](./CHANGELOG.md) for `@aptos-labs/ts-sdk` releases, [`confidential-asset/CHANGELOG.md`](./confidential-asset/CHANGELOG.md) for `@aptos-labs/confidential-asset` releases.

## Guardrails

- **Prefer the repo scripts** (`pnpm build`, `pnpm test`, `pnpm check`, `pnpm fmt`) over ad-hoc commands.
- **Avoid massive diffs in `docs/`** unless the change is intentionally about docs generation/version bumps.
- Keep changes tight and CI-aligned; if you touch build/lint/test infra, run the corresponding commands locally.

## Cursor Cloud specific instructions

### Docker

Docker is pre-installed and the daemon is running. The Docker socket at `/var/run/docker.sock` has open permissions (`chmod 666`), so no `sudo` is needed for `docker` commands.

### Running Tests

- Set `TMPDIR=/tmp` before running tests to avoid Docker mount errors in the nested container environment.
- `pnpm test` / `pnpm unit-test` / `pnpm e2e-test` all trigger Vitest `globalSetup`, which starts a local Aptos testnet via Docker. The first run downloads the Aptos CLI binary (~30s) and pulls Docker images (~30s). Subsequent runs reuse them.
- The localnet takes ~10-15s to become fully ready (all processors + indexer API). Vitest `globalSetup` handles the wait automatically.
- After tests complete, `globalTeardown` stops the localnet. If you need it running for manual testing afterwards, start it separately: `TMPDIR=/tmp ENABLE_KEYLESS_DEFAULT=1 npx aptos node run-localnet --force-restart --assume-yes --with-indexer-api &`
- The readiness endpoint is `http://127.0.0.1:8070/` — poll it to confirm all services are up (returns JSON with `ready` and `not_ready` arrays).

### Build Before Testing Examples

Examples under `examples/` link to the root SDK via `link:../..`. Always run `pnpm build` in the repo root before working with examples.

### Known Flaky Test

`tests/e2e/api/account.test.ts` — the "it doesn't return default account if it is rotated" test can fail intermittently due to timing on the local testnet. This is a pre-existing issue, not an environment problem.
