## AI Agent Guide (AGENTS.md)

This repository is the **Aptos TypeScript SDK** (`@aptos-labs/ts-sdk`) plus related packages (examples, confidential assets, and project demos).

Use this document as the **single place** for an agent to understand repo layout, common commands, and CI expectations.

## Requirements

- **Node**: use the version in `.node-version` (currently `v22.12.0`). `package.json` requires `node >= 20`.
- **pnpm**: repo uses `pnpm` (see `.tool-versions`, `package.json#packageManager`).

## Repo layout (high level)

- **SDK source**: `src/`
- **SDK tests**: `tests/`
  - Jest uses `tests/preTest.cjs` + `tests/postTest.cjs` to start/stop a local Aptos node.
- **Examples**: `examples/`
  - `examples/typescript`, `examples/typescript-esm`, `examples/javascript` use a **linked** SDK (`link:../..`).
- **Confidential assets SDK**: `confidential-assets/` (separate package + tests)
- **Docs output**: `docs/` (large; includes versioned typedoc output)
- **Utility scripts**: `scripts/` (`checkVersion.sh`, `updateVersion.sh`, `generateDocs.sh`)

## Install

At repo root:

```bash
pnpm install
```

CI uses:

```bash
pnpm install --frozen-lockfile
```

If you change dependencies, ensure the corresponding `pnpm-lock.yaml` updates are included.

## Build / format / lint (CI-aligned)

From repo root:

```bash
pnpm build
pnpm fmt
pnpm lint
```

Formatting check (what CI runs):

```bash
pnpm _fmt --check
```

## Tests

Run all SDK tests (unit + e2e):

```bash
pnpm test
```

Run a specific Jest test file (example from `README.md`):

```bash
pnpm jest keyless.test.ts
```

### Local testnet behavior (important)

Jest `globalSetup` starts a **local Aptos node** via the SDK’s `LocalNode` helper (see `src/cli/localNode.ts`), which runs:

- `npx aptos node run-localnet --force-restart --assume-yes --with-indexer-api`
- Readiness endpoint: `http://127.0.0.1:8070/`

Implications for agents:

- **Docker is required** (the Aptos CLI localnet pulls and runs containers, including Postgres).
- In environments without Docker (common in restricted CI/sandboxes), **`pnpm test` will fail during Jest `globalSetup`** before any tests run.
- Failures often come from **port conflicts** or the node not becoming ready in time.
- If tests hang or fail early, check whether something else is using port `8070`.

CI sets `TMPDIR` to a mount-friendly path during retries; if you see weird Docker mount errors locally, try setting `TMPDIR` to a normal filesystem path.

## Running examples

Examples require a built local SDK first:

```bash
pnpm build
```

Then, for example:

```bash
cd examples/typescript
pnpm install
pnpm build
pnpm test
```

CI runs examples by starting a local testnet in the background and then running each examples package’s `test` script.

## Confidential assets package

CI runs confidential-assets tests like this:

```bash
pnpm install --frozen-lockfile
cd confidential-assets && pnpm install --frozen-lockfile
cd confidential-assets && pnpm test
```

When changing shared infra (jest config, root tooling), ensure confidential-assets still works.

## Versioning and docs (do not guess; follow the scripts)

- **Generate docs**:

```bash
pnpm doc
```

- **Check versions match** (CI check):

```bash
pnpm check-version
```

What `check-version` enforces:

- `package.json` version matches `src/version.ts`
- `docs/index.md` contains the current version entry
- `docs/@aptos-labs/ts-sdk-<version>/` exists

If you bump versions, prefer:

```bash
pnpm update-version
```

That script updates `src/version.ts` and regenerates/updates docs. Avoid manually editing versioned docs output unless you’re explicitly updating generated docs.

## Codegen

Indexer GraphQL codegen is wired as:

```bash
pnpm indexer-codegen
```

This writes into `src/types/generated/**` (eslint ignores this path). Treat generated output as derived from schema/config—avoid hand-editing it.

## Guardrails for agents

- **Prefer the repo scripts** (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm fmt`) over ad-hoc commands.
- **Avoid massive diffs in `docs/`** unless the change is intentionally about docs generation/version bumps.
- Keep changes tight and CI-aligned; if you touch build/lint/test infra, run the corresponding commands locally.

