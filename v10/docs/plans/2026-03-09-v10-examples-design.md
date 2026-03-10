# v10 SDK Examples — Design

Three standalone examples demonstrating v10 SDK usage patterns, each with unit tests (mocked HTTP) and optional e2e tests (devnet).

## 1. `examples/simple-transfer/` — Lightweight Submit & Receive

Single `main.ts` script: generate accounts, fund via faucet, transfer APT, wait for confirmation, check balances. Uses v10 native namespaced API.

**Structure:**
```
examples/simple-transfer/
├── package.json
├── tsconfig.json
├── src/main.ts
└── tests/
    ├── transfer.unit.test.ts
    └── transfer.e2e.test.ts
```

**Flow:** `generateAccount()` → `aptos.faucet.fund()` → `aptos.transaction.buildSimple()` → `aptos.transaction.signAndSubmit()` → `aptos.transaction.waitForTransaction()` → balance check via `aptos.account.getResource()`

## 2. `examples/sponsored-txn-server/` — Hono Sponsor/Relayer

Hono server accepting transaction intents, building/signing/submitting with a server-side key. Demonstrates the gas station / relayer pattern.

**Structure:**
```
examples/sponsored-txn-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts          # Hono app (exported for testing)
│   └── main.ts            # starts server
└── tests/
    ├── server.unit.test.ts
    └── server.e2e.test.ts
```

**Endpoints:**
- `POST /sponsor` — `{ sender, function, functionArguments, typeArguments? }` → builds, signs, submits, returns `{ hash, version, success }`
- `GET /health` — server status + chain info

## 3. `examples/dapp-with-wallet/` — React dApp + Wallet Adapter

Minimal React/Vite dApp using `@aptos-labs/wallet-adapter-react` with v10 compat layer. Connect wallet, read account info, submit transfer.

**Structure:**
```
examples/dapp-with-wallet/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── WalletConnect.tsx
│   └── TransferForm.tsx
└── tests/
    ├── app.unit.test.ts
    └── app.e2e.test.ts
```

Uses `@aptos-labs/ts-sdk/compat` so wallet-adapter v6 types are satisfied.

## Test Strategy

- **Unit:** Vitest, mocked `@aptos-labs/aptos-client` (jsonRequest/bcsRequest). Fast, no network.
- **E2E:** Behind `APTOS_E2E=1` env flag. Hits devnet. dApp uses Playwright.
- Each example has its own `vitest.config.ts`.

## Decisions

- Hono over Express (lightweight, runs on Node/Bun/Deno)
- Server is a relayer (sender = server key), not fee payer (v10 doesn't have fee payer build yet)
- dApp uses compat layer for wallet-adapter compatibility
- Simple transfer is a plain script (no CLI framework)
