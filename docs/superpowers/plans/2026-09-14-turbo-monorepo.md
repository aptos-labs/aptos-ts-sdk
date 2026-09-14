# Turbo Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the repository to a pnpm/Turbo monorepo containing the existing TypeScript and confidential-asset SDKs under `packages/`, ready for a future `packages/payments-sdk`.

**Architecture:** The repository root becomes a private orchestration package with one pnpm lockfile and a Turbo task graph. Each publishable SDK owns its source, tests, metadata, changelog, and package configuration under `packages/`; root scripts, CI, examples, generated docs, and release automation select packages through workspace filters.

**Tech Stack:** Node.js 22, pnpm 11, Turbo, TypeScript, Vitest, Biome, GitHub Actions

## Global Constraints

- Preserve `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset` package names, versions, exports, runtime behavior, and release tag formats.
- Keep SDK source compatible with browsers, React Native, Node.js 22+, Bun, and Deno.
- Use a single root `pnpm-lock.yaml` and a `packages/*` workspace glob.
- Keep examples and projects outside the root workspace.
- Do not create a payments SDK package.
- Keep localnet-backed tests uncached and serialized to avoid port `8070` conflicts.
- Use the latest available Turbo version.

---

### Task 1: Add the monorepo layout contract

**Files:**
- Create: `scripts/tests/monorepo-layout.test.mjs`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Repository files through Node.js `fs/promises`.
- Produces: `node --test scripts/tests/monorepo-layout.test.mjs`, a structural regression test for the workspace.

- [ ] **Step 1: Add the failing structural test**

Create `scripts/tests/monorepo-layout.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

async function readJson(path) {
  return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
}

async function assertMissing(path) {
  await assert.rejects(access(join(repoRoot, path)));
}

test("root config defines the private Turbo workspace", async () => {
  const packageJson = await readJson("package.json");
  const turbo = await readJson("turbo.json");
  const workspace = await readFile(join(repoRoot, "pnpm-workspace.yaml"), "utf8");

  assert.equal(packageJson.name, "@aptos-labs/aptos-ts-sdk-monorepo");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts.build, "turbo run build");
  assert.equal(packageJson.scripts.test, "pnpm test:repo && turbo run test --concurrency=1");
  assert.ok(packageJson.devDependencies.turbo);
  assert.match(workspace, /packages:\s*\n\s+- "packages\/\*"/);
  assert.deepEqual(turbo.tasks.build.dependsOn, ["^build"]);
  assert.deepEqual(turbo.tasks.build.outputs, ["dist/**"]);
  assert.equal(turbo.tasks.test.cache, false);
});

test("publishable SDKs live under packages", async () => {
  const tsSdk = await readJson("packages/ts-sdk/package.json");
  const confidentialAsset = await readJson("packages/confidential-asset/package.json");

  assert.equal(tsSdk.name, "@aptos-labs/ts-sdk");
  assert.equal(confidentialAsset.name, "@aptos-labs/confidential-asset");
  assert.equal(confidentialAsset.devDependencies["@aptos-labs/ts-sdk"], "workspace:^7.3.0");
  await assertMissing("src");
  await assertMissing("tests");
  await assertMissing("confidential-asset");
  await assertMissing("packages/confidential-asset/pnpm-lock.yaml");
  await assertMissing("packages/confidential-asset/pnpm-workspace.yaml");
});

test("standalone examples link to the relocated TypeScript SDK", async () => {
  const linkedExamples = ["typescript", "javascript", "web-test"];
  const fileExamples = ["bun-test", "deno-test"];

  for (const example of linkedExamples) {
    const packageJson = await readJson(`examples/${example}/package.json`);
    assert.equal(packageJson.dependencies["@aptos-labs/ts-sdk"], "link:../../packages/ts-sdk");
  }
  for (const example of fileExamples) {
    const packageJson = await readJson(`examples/${example}/package.json`);
    assert.equal(packageJson.dependencies["@aptos-labs/ts-sdk"], "file:../../packages/ts-sdk");
  }
});
```

- [ ] **Step 2: Record the implementation in the changelog**

Replace the design-only Unreleased bullet with:

```markdown
- Convert the repository to a pnpm/Turbo monorepo, relocating `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset` under `packages/`, centralizing dependency installation and task orchestration, and reserving the `packages/payments-sdk` convention for a future payments SDK.
```

- [ ] **Step 3: Format, commit, and push the failing contract**

Run:

```bash
pnpm fmt
pnpm check
git add scripts/tests/monorepo-layout.test.mjs CHANGELOG.md
git commit -m "test: define Turbo monorepo layout"
git push -u origin greg/turbo-monorepo-b8b2
```

Expected: formatting and checks pass; the commit and push succeed.

- [ ] **Step 4: Run the contract and verify the expected failure**

Run:

```bash
node --test scripts/tests/monorepo-layout.test.mjs
```

Expected: FAIL because `turbo.json` and `packages/ts-sdk/package.json` do not exist yet.

---

### Task 2: Create the unified workspace and relocate both SDKs

**Files:**
- Create: `turbo.json`
- Create: `packages/ts-sdk/**` from the current root SDK files
- Create: `packages/confidential-asset/**` from `confidential-asset/**`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `packages/ts-sdk/package.json`
- Modify: `packages/confidential-asset/package.json`
- Modify: `packages/confidential-asset/vitest.config.ts`
- Modify: `examples/{typescript,javascript,web-test,bun-test,deno-test}/package.json`
- Delete: `confidential-asset/pnpm-lock.yaml`
- Delete: `confidential-asset/pnpm-workspace.yaml`

**Interfaces:**
- Consumes: Existing package scripts and `@aptos-labs/confidential-asset`'s development dependency on `@aptos-labs/ts-sdk`.
- Produces: Root Turbo commands and workspace packages discoverable as `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset`.

- [ ] **Step 1: Relocate package-owned files**

Run:

```bash
mkdir -p packages/ts-sdk
git mv src tests package.json tsconfig.json tsconfig.build.json typedoc.json cucumber.js \
  vitest.config.ts vitest.config.unit.ts vitest.config.e2e-devnet.ts CHANGELOG.md README.md .npmignore \
  packages/ts-sdk/
cp LICENSE packages/ts-sdk/LICENSE
git mv confidential-asset packages/confidential-asset
rm packages/confidential-asset/pnpm-lock.yaml packages/confidential-asset/pnpm-workspace.yaml
```

Expected: source, tests, package metadata, package documentation, and package configuration now live under `packages/`.

- [ ] **Step 2: Create the private root package**

Write the root `package.json` with the existing Node/pnpm pins and these scripts:

```json
{
  "name": "@aptos-labs/aptos-ts-sdk-monorepo",
  "private": true,
  "packageManager": "pnpm@11.26.0",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "_fmt": "turbo run _fmt",
    "fmt": "turbo run fmt",
    "format": "pnpm fmt",
    "lint": "turbo run lint",
    "check": "turbo run check",
    "test:repo": "node --test scripts/tests/monorepo-layout.test.mjs",
    "test": "pnpm test:repo && turbo run test --concurrency=1",
    "test:tree-shaking": "turbo run test:tree-shaking --filter=@aptos-labs/ts-sdk",
    "test:coverage": "turbo run test:coverage --filter=@aptos-labs/ts-sdk",
    "unit-test": "turbo run unit-test --filter=@aptos-labs/ts-sdk",
    "test:coverage:unit": "turbo run test:coverage:unit --filter=@aptos-labs/ts-sdk",
    "e2e-test": "turbo run e2e-test --concurrency=1",
    "e2e-encrypted": "turbo run e2e-encrypted --filter=@aptos-labs/ts-sdk",
    "indexer-codegen": "turbo run indexer-codegen --filter=@aptos-labs/ts-sdk",
    "doc": "turbo run doc --filter=@aptos-labs/ts-sdk",
    "check-version": "turbo run check-version --filter=@aptos-labs/ts-sdk",
    "check-license": "turbo run check-license",
    "update-version": "turbo run update-version --filter=@aptos-labs/ts-sdk",
    "spec": "turbo run spec --filter=@aptos-labs/ts-sdk"
  },
  "devDependencies": {
    "turbo": "^2.10.12"
  }
}
```

Install Turbo with:

```bash
pnpm add -Dw turbo@latest
```

Expected: pnpm writes the current Turbo version into `devDependencies`.

- [ ] **Step 3: Define the Turbo task graph**

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "_fmt": {},
    "fmt": {
      "cache": false
    },
    "lint": {},
    "check": {},
    "test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "test:tree-shaking": {
      "dependsOn": ["build"],
      "cache": false
    },
    "test:coverage": {
      "cache": false
    },
    "unit-test": {
      "cache": false
    },
    "test:coverage:unit": {
      "cache": false
    },
    "e2e-test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "e2e-encrypted": {
      "cache": false
    },
    "test:browser": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "indexer-codegen": {
      "cache": false
    },
    "doc": {
      "dependsOn": ["build"],
      "cache": false
    },
    "check-version": {},
    "check-license": {},
    "update-version": {
      "cache": false
    },
    "spec": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Unify pnpm workspace configuration**

Add `packages: ["packages/*"]` to the root `pnpm-workspace.yaml`. Merge every override and allow-build entry from the former confidential-asset workspace into the root configuration, preserving the root minimum-release-age settings.

Update `packages/confidential-asset/package.json`:

```json
"devDependencies": {
  "@aptos-labs/ts-sdk": "workspace:^7.3.0"
}
```

Keep the published peer dependency as `"@aptos-labs/ts-sdk": "^7.3.0"`. Remove package-level `packageManager` fields because the root owns the pnpm pin.

- [ ] **Step 5: Repair package-relative configuration**

Update `packages/confidential-asset/vitest.config.ts` so shared setup resolves from the relocated SDK:

```ts
setupFiles: [path.resolve(__dirname, "../ts-sdk/tests/setupDotenv.ts")],
globalSetup: process.env.SKIP_SETUP ? [] : [path.resolve(__dirname, "../ts-sdk/tests/preTest.ts")],
```

Update the TS SDK release test import to:

```ts
} from "../../../../scripts/prepareRelease.mjs";
```

Update package scripts so TS SDK docs/version/license helpers and confidential-asset license checks invoke `../../scripts/...`.

Set the TypeScript, JavaScript, and web-test SDK dependency to `link:../../packages/ts-sdk`. Set the Bun and Deno SDK dependency to `file:../../packages/ts-sdk`. Their standalone lockfiles are regenerated in Task 3.

- [ ] **Step 6: Regenerate the root lockfile**

Run:

```bash
pnpm install
```

Expected: the root lockfile contains importers for `.`, `packages/ts-sdk`, and `packages/confidential-asset`, and the workspace dependency resolves locally.

- [ ] **Step 7: Verify the contract turns green**

Run:

```bash
node --test scripts/tests/monorepo-layout.test.mjs
```

Expected: all three tests pass.

- [ ] **Step 8: Format, check, commit, and push**

Run:

```bash
pnpm fmt
pnpm check
git add package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json packages scripts/tests CHANGELOG.md examples/*/package.json
git commit -m "chore: create Turbo workspace packages"
git push -u origin greg/turbo-monorepo-b8b2
```

Expected: the workspace migration commit is pushed.

---

### Task 3: Migrate repository integrations to package paths

**Files:**
- Modify: `scripts/checkVersion.sh`
- Modify: `scripts/updateVersion.sh`
- Modify: `scripts/generateDocs.sh`
- Modify: `scripts/prepareRelease.mjs`
- Modify: `.github/workflows/publish.yaml`
- Modify: `.github/actions/**/*.yaml`
- Modify: `examples/{typescript,javascript,web-test,bun-test,deno-test}/pnpm-lock.yaml`
- Modify: `codecov.yml`
- Modify: `README.md`
- Modify: `packages/ts-sdk/README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/release-ts-sdk/SKILL.md`
- Modify: `.cursor/rules/release-ts-sdk.mdc`

**Interfaces:**
- Consumes: New workspace package paths and existing release tags.
- Produces: CI, docs, examples, release preparation, and publishing that operate on the relocated packages.

- [ ] **Step 1: Update release and documentation scripts**

Change the release package map to:

```js
"ts-sdk": {
  tagPrefix: "ts-sdk",
  pkgJsonPath: join(REPO_ROOT, "packages", "ts-sdk", "package.json"),
  changelogPath: join(REPO_ROOT, "packages", "ts-sdk", "CHANGELOG.md"),
  runsUpdateVersion: true,
},
"confidential-asset": {
  tagPrefix: "confidential-asset",
  pkgJsonPath: join(REPO_ROOT, "packages", "confidential-asset", "package.json"),
  changelogPath: join(REPO_ROOT, "packages", "confidential-asset", "CHANGELOG.md"),
  runsUpdateVersion: false,
},
```

Make version scripts derive the repository and package directories from each script's location. They must read `packages/ts-sdk/src/version.ts`, write generated TypeDoc output under root `docs/`, and invoke the TS SDK workspace command when release preparation synchronizes a version.

- [ ] **Step 2: Update CI and publishing**

Make each composite action install once at the repository root. Use Turbo filters for package tasks:

```bash
pnpm turbo run build --filter=@aptos-labs/ts-sdk
pnpm turbo run test --filter=@aptos-labs/ts-sdk
pnpm turbo run test --filter=@aptos-labs/confidential-asset
pnpm turbo run test:browser --filter=@aptos-labs/confidential-asset
```

Use `pnpm --filter @aptos-labs/confidential-asset exec playwright` for browser installation and `pnpm --filter @aptos-labs/ts-sdk exec aptos` when CI starts a localnet. Update publish routing:

```bash
if [[ "$TAG" == ts-sdk-v* ]]; then
  dir="packages/ts-sdk"
elif [[ "$TAG" == confidential-asset-v* ]]; then
  dir="packages/confidential-asset"
fi
```

- [ ] **Step 3: Regenerate standalone consumer lockfiles**

Verify TypeScript, JavaScript, and web-test dependencies are:

```json
"@aptos-labs/ts-sdk": "link:../../packages/ts-sdk"
```

Verify Bun and Deno dependencies are:

```json
"@aptos-labs/ts-sdk": "file:../../packages/ts-sdk"
```

Regenerate each lockfile:

```bash
for example in typescript javascript web-test bun-test deno-test; do
  pnpm --dir "examples/$example" install --lockfile-only
done
```

Expected: every standalone lockfile resolves the new relative package path.

- [ ] **Step 4: Update repository documentation and coverage paths**

Create a root README that identifies the workspace packages, provides root Turbo commands, links to package READMEs, and reserves `packages/payments-sdk` for future use. Fix the TS SDK README's examples link.

Replace old source, test, dist, and confidential-asset paths in `codecov.yml` with `packages/ts-sdk/**` and `packages/confidential-asset/**`. Update contributor instructions, agent guidance, and release skills so changelog, source, package, test, version, and release paths point to their package directories.

- [ ] **Step 5: Prove no active tooling still uses old package paths**

Run:

```bash
rg 'cd confidential-asset|dir="confidential-asset"|link:\.\./\.\.|file:\.\./\.\.|src/version\.ts|repo root\).*ts-sdk|`confidential-asset/`' \
  .github scripts examples CONTRIBUTING.md AGENTS.md CLAUDE.md .claude .cursor codecov.yml
```

Expected: no matches that refer to the old package locations.

- [ ] **Step 6: Format, check, run focused tests, commit, and push**

Run:

```bash
pnpm fmt
pnpm check
node --test scripts/tests/monorepo-layout.test.mjs
pnpm --filter @aptos-labs/ts-sdk unit-test -- tests/unit/prepareRelease.test.ts
git add .
git commit -m "chore: migrate monorepo tooling paths"
git push -u origin greg/turbo-monorepo-b8b2
```

Expected: structural and release tests pass and integration changes are pushed.

---

### Task 4: Verify builds, tests, packages, and cache behavior

**Files:**
- Modify only files required to correct verification failures within the approved migration scope.

**Interfaces:**
- Consumes: Completed Turbo monorepo.
- Produces: Evidence that builds, tests, examples, release checks, and npm package contents remain valid.

- [ ] **Step 1: Verify a reproducible installation**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: installation succeeds with no lockfile changes.

- [ ] **Step 2: Verify static checks and Turbo builds**

Run:

```bash
pnpm fmt
pnpm check
pnpm build
pnpm build
```

Expected: checks pass, both packages build, and the second build reports cached package tasks.

- [ ] **Step 3: Verify focused and browser test suites**

Run:

```bash
TMPDIR=/tmp pnpm --filter @aptos-labs/ts-sdk unit-test
TMPDIR=/tmp pnpm --filter @aptos-labs/confidential-asset test
pnpm --filter @aptos-labs/confidential-asset test:browser
```

Expected: all selected suites pass.

- [ ] **Step 4: Verify root serialization of localnet tests**

Run:

```bash
TMPDIR=/tmp pnpm test
```

Expected: repository contract and both package test tasks pass without port `8070` conflicts.

- [ ] **Step 5: Verify package contents**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk pack --dry-run
pnpm --filter @aptos-labs/confidential-asset pack --dry-run
```

Expected: both packages include README, LICENSE, source, JavaScript output, and declarations; neither includes another workspace package or repository-only files.

- [ ] **Step 6: Verify linked examples and runtime builds**

Run:

```bash
pnpm --dir examples/typescript build
pnpm --dir examples/web-test exec vite build
pnpm --dir examples/bun-test exec tsc --noEmit
pnpm --dir examples/deno-test test
```

Expected: standalone projects resolve `packages/ts-sdk`; build or test commands succeed in their target runtimes.

- [ ] **Step 7: Verify version and release tooling**

Run:

```bash
pnpm check-version
pnpm --filter @aptos-labs/ts-sdk unit-test -- tests/unit/prepareRelease.test.ts
```

Expected: package/source/docs versions match and release helper tests pass.

- [ ] **Step 8: Commit any verification fixes and push**

If verification required changes, run:

```bash
pnpm fmt
pnpm check
git add .
git commit -m "fix: complete Turbo monorepo verification"
git push -u origin greg/turbo-monorepo-b8b2
```

Expected: all fixes are pushed. If no files changed, do not create an empty commit.

