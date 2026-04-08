# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

This is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`), a comprehensive SDK for interacting with the Aptos blockchain. It provides account management, transaction building/submission, data querying, digital assets, keyless authentication, and more.

## Requirements

- **Node**: use the version in `.node-version` (currently `v22.12.0`). `package.json` requires `node >= 20`.
- **pnpm**: repo uses `pnpm` (see `.tool-versions`, `package.json#packageManager`).

## Repo Layout (Turborepo Monorepo)

This repository uses **Turborepo** for monorepo orchestration with **pnpm workspaces**.

- **Root package** (`@aptos-labs/ts-sdk`): The main SDK lives at the repository root
  - `src/` — SDK source
  - `tests/` — SDK tests (Vitest uses `tests/preTest.ts` globalSetup to start/stop a local Aptos node)
  - `scripts/` — Utility scripts (`checkVersion.sh`, `updateVersion.sh`, `generateDocs.sh`)
- **`packages/`** — Shared libraries and internal packages (add new packages here)
- **`apps/`** — Applications (add new apps here)
- **`confidential-assets/`** — Confidential assets SDK (workspace member)
- **`examples/`** — Example projects (workspace members, use `workspace:*` for SDK dependency)
- **`projects/`** — Demo projects like gas-station (workspace members)
- **`docs/`** — Versioned TypeDoc output (large; generated)
- **`turbo.json`** — Turborepo task pipeline configuration
- **`pnpm-workspace.yaml`** — pnpm workspace package definitions

## Common Commands

### SDK-specific (root package)

```bash
pnpm install              # Install all workspace dependencies
pnpm build                # Build the SDK (CJS + ESM output to dist/)
pnpm fmt                  # Format SDK code with Biome
pnpm _fmt                 # Check formatting without writing (what CI runs)
pnpm lint                 # Run Biome linter on SDK
pnpm check                # Run Biome check (lint + format) on SDK
pnpm test                 # Run all SDK tests (unit + e2e)
vitest run <file>         # Run a specific test file (e.g., vitest run keyless.test.ts)
pnpm doc                  # Generate TypeDoc documentation
pnpm check-version        # Verify version consistency across files
pnpm update-version       # Bump version everywhere + regenerate docs
pnpm indexer-codegen      # Generate GraphQL types from indexer schema
```

### Turborepo workspace-wide commands

```bash
pnpm build:all            # Build all workspace packages via Turborepo
pnpm test:all             # Test all workspace packages via Turborepo
pnpm lint:all             # Lint all workspace packages via Turborepo
pnpm check:all            # Check all workspace packages via Turborepo
pnpm fmt:all              # Format all workspace packages via Turborepo
```

## Commit Guidelines

Before every commit:

1. **Check code**: Run `pnpm check` to run Biome (lint + format)
2. **Format code**: Run `pnpm fmt` to auto-format with Biome
3. **Update CHANGELOG.md**: Add a descriptive entry for the change under the appropriate section (Added, Changed, Fixed, etc.)
4. **Write descriptive commit messages**: Commits should clearly explain what changed and why

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

### Confidential Assets Package

The confidential-assets package is a pnpm workspace member. Its dependencies are installed with the root `pnpm install` — no separate install step is needed.

```bash
pnpm install              # Installs deps for all workspace members
cd confidential-assets && pnpm test
```

Or build/test everything via Turborepo:

```bash
pnpm build:all            # Builds SDK first, then confidential-assets
pnpm test:all             # Tests all workspace packages
```

When changing shared infra (vitest config, root tooling), ensure confidential-assets still works.

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
3. Reference the upgrade guide in CHANGELOG.md under the version heading

## Bun Compatibility

When using with Bun, disable HTTP/2:

```typescript
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET, clientConfig: { http2: false } }));
```

## Guardrails

- **Prefer the repo scripts** (`pnpm build`, `pnpm test`, `pnpm check`, `pnpm fmt`) over ad-hoc commands.
- **Use turbo scripts** (`pnpm build:all`, `pnpm test:all`) when changes span multiple workspace packages.
- **Avoid massive diffs in `docs/`** unless the change is intentionally about docs generation/version bumps.
- Keep changes tight and CI-aligned; if you touch build/lint/test infra, run the corresponding commands locally.
- **Adding new packages**: Create a new directory under `packages/` (for libraries) or `apps/` (for applications) with its own `package.json`. It will automatically be picked up by pnpm workspaces and Turborepo.

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

Examples under `examples/` are workspace members using `workspace:*` for the SDK dependency. Always run `pnpm build` in the repo root before working with examples.

### Known Flaky Test

`tests/e2e/api/account.test.ts` — the "it doesn't return default account if it is rotated" test can fail intermittently due to timing on the local testnet. This is a pre-existing issue, not an environment problem.
