# Aptos TypeScript SDK Monorepo

This pnpm and Turbo workspace contains the TypeScript packages for interacting with the Aptos blockchain.

## Packages

- [`@aptos-labs/ts-sdk`](./packages/ts-sdk/README.md) — the Aptos TypeScript SDK.
- [`@aptos-labs/confidential-asset`](./packages/confidential-asset/README.md) — confidential asset support for Aptos.

The `packages/payments-sdk` path is reserved for a future payments SDK.

## Development

Install workspace dependencies from the repository root:

```bash
pnpm install
```

Run tasks across the workspace with Turbo:

```bash
pnpm turbo run build
pnpm turbo run check
pnpm turbo run test --concurrency=1
```

Target one package with a filter:

```bash
pnpm turbo run build --filter=@aptos-labs/ts-sdk
pnpm turbo run test --filter=@aptos-labs/confidential-asset
```

The projects under [`examples/`](./examples/README.md) remain standalone workspaces with their own lockfiles.
