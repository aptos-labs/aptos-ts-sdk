# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`), a comprehensive SDK for interacting with the Aptos blockchain. It provides account management, transaction building/submission, data querying, digital assets, keyless authentication, and more.

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

## Testing Notes

- **Docker required**: Tests start a local Aptos node via `aptos node run-localnet` which requires Docker
- **Port 8070**: Local testnet uses this port; check for conflicts if tests fail
- Jest globalSetup (`tests/preTest.cjs`) starts the node, globalTeardown (`tests/postTest.cjs`) stops it
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

- `examples/` - TypeScript/JS examples using linked SDK (`link:../..`)
- `confidential-assets/` - Separate confidential assets SDK package
- `projects/` - Demo projects (gas station)

## Version Management

Versions must match across `package.json`, `src/version.ts`, and `docs/`. Use `pnpm update-version` rather than manual edits. CI runs `pnpm check-version` to enforce consistency.

## Bun Compatibility

When using with Bun, disable HTTP/2:
```typescript
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET, clientConfig: { http2: false } }));
```
