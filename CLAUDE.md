# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`), a comprehensive SDK for interacting with the Aptos blockchain. It provides account management, transaction building/submission, data querying, digital assets, keyless authentication, and more.

## Monorepo Structure

This repository uses **Turborepo** with **pnpm workspaces**. The main SDK lives at the root; additional packages go in `packages/` and apps in `apps/`.

## Common Commands

### SDK-specific (root package)

```bash
pnpm install              # Install all workspace dependencies
pnpm build                # Build the SDK (CJS + ESM output to dist/)
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

## Testing Notes

- **Docker required**: Tests start a local Aptos node via `aptos node run-localnet` which requires Docker
- **Port 8070**: Local testnet uses this port; check for conflicts if tests fail
- Vitest globalSetup (`tests/preTest.ts`) starts the node, its teardown stops it
- If Docker mount errors occur, try setting `TMPDIR` to a normal filesystem path

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

## Related Packages

- `packages/` - Shared libraries and internal packages (add new packages here)
- `apps/` - Applications (add new apps here)
- `confidential-assets/` - Confidential assets SDK (workspace member)
- `examples/` - TypeScript/JS examples using linked SDK (`link:../..`)
- `projects/` - Demo projects (gas station)

## Version Management

Versions must match across `package.json`, `src/version.ts`, and `docs/`. Use `pnpm update-version` rather than manual edits. CI runs `pnpm check-version` to enforce consistency.

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
