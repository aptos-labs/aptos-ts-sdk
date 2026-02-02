# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

This is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`), a comprehensive SDK for interacting with the Aptos blockchain. It provides account management, transaction building/submission, data querying, digital assets, keyless authentication, and more.

## Requirements

- **Node**: use the version in `.node-version` (currently `v22.12.0`). `package.json` requires `node >= 20`.
- **pnpm**: repo uses `pnpm` (see `.tool-versions`, `package.json#packageManager`).

## Repo Layout

- **SDK source**: `src/`
- **SDK tests**: `tests/`
  - Jest uses `tests/preTest.cjs` + `tests/postTest.cjs` to start/stop a local Aptos node.
- **Examples**: `examples/`
  - `examples/typescript`, `examples/typescript-esm`, `examples/javascript` use a **linked** SDK (`link:../..`).
- **Confidential assets SDK**: `confidential-assets/` (separate package + tests)
- **Docs output**: `docs/` (large; includes versioned typedoc output)
- **Utility scripts**: `scripts/` (`checkVersion.sh`, `updateVersion.sh`, `generateDocs.sh`)

## Common Commands

```bash
pnpm install              # Install dependencies (CI uses --frozen-lockfile)
pnpm build                # Build CJS + ESM output to dist/
pnpm fmt                  # Format code with Prettier
pnpm _fmt --check         # Check formatting (what CI runs)
pnpm lint                 # Run ESLint
pnpm test                 # Run all tests (unit + e2e)
pnpm jest <file>          # Run a specific test file (e.g., pnpm jest keyless.test.ts)
pnpm doc                  # Generate TypeDoc documentation
pnpm check-version        # Verify version consistency across files
pnpm update-version       # Bump version everywhere + regenerate docs
pnpm indexer-codegen      # Generate GraphQL types from indexer schema
```

## Commit Guidelines

Before every commit:

1. **Format code**: Run `pnpm fmt` to format with Prettier
2. **Lint code**: Run `pnpm lint` to check for ESLint errors
3. **Update CHANGELOG.md**: Add a descriptive entry for the change under the appropriate section (Added, Changed, Fixed, etc.)
4. **Write descriptive commit messages**: Commits should clearly explain what changed and why

## Testing

Run all SDK tests (unit + e2e):

```bash
pnpm test
```

Run a specific Jest test file:

```bash
pnpm jest keyless.test.ts
```

### Local Testnet Behavior

Jest `globalSetup` starts a **local Aptos node** via the SDK's `LocalNode` helper (see `src/cli/localNode.ts`), which runs:

- `npx aptos node run-localnet --force-restart --assume-yes --with-indexer-api`
- Readiness endpoint: `http://127.0.0.1:8070/`

**Important notes:**

- **Docker is required** (the Aptos CLI localnet pulls and runs containers, including Postgres).
- In environments without Docker, `pnpm test` will fail during Jest `globalSetup` before any tests run.
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

```bash
pnpm install --frozen-lockfile
cd confidential-assets && pnpm install --frozen-lockfile
cd confidential-assets && pnpm test
```

When changing shared infra (jest config, root tooling), ensure confidential-assets still works.

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

- **Prefer the repo scripts** (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm fmt`) over ad-hoc commands.
- **Avoid massive diffs in `docs/`** unless the change is intentionally about docs generation/version bumps.
- Keep changes tight and CI-aligned; if you touch build/lint/test infra, run the corresponding commands locally.
