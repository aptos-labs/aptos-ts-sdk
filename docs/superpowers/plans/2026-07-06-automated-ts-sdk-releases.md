# Automated TS SDK Releases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate releasing `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset` via a deterministic prep script, a two-phase agent skill (Claude + Cursor), and a GitHub Actions workflow that publishes to NPM on GitHub Release.

**Architecture:** Three layers. (A) `scripts/prepareRelease.mjs` — a pure-function-based Node script that bumps `package.json`, stamps the changelog, and (for ts-sdk) runs `pnpm update-version`. (B) A thin skill in `.claude/skills/` + a Cursor rule in `.cursor/rules/` that orchestrate git/PR/tag around the script. (C) `.github/workflows/publish.yaml` fires on `release: published`, routes by tag prefix, and runs `pnpm publish --provenance` via OIDC trusted publishing into a protected environment.

**Tech Stack:** Node ≥ 22 (ESM), pnpm 10.30.3, Vitest (unit config, no Docker), GitHub Actions, npm OIDC trusted publishing.

## Global Constraints

- **Node:** `>= 22` (`.node-version` = `v22.12.0`); scripts run under Node ESM (`"type": "module"`).
- **Package manager:** `pnpm@10.30.3` (pinned in `package.json#packageManager`).
- **GitHub Actions pinning:** every `uses:` must pin a full commit SHA with a trailing `# pin@vX.Y.Z` comment (repo convention — see existing workflows).
- **Formatting:** run `pnpm check` / `pnpm fmt` (Biome) before committing.
- **Changelog:** tooling changes to ts-sdk go under `# Unreleased` in the root `CHANGELOG.md`.
- **Two packages, asymmetric:** `ts-sdk` (root) has `src/version.ts` + versioned `docs/` + `update-version`; `confidential-asset/` has neither — bump `package.json` + changelog only.
- **Tag scheme:** `ts-sdk-vX.Y.Z` and `confidential-asset-vX.Y.Z`. Legacy `vX.Y.Z` tags are left as-is and must never trigger a publish.
- **Unit tests:** live in `tests/unit/**/*.test.ts`, run with `vitest run --config vitest.config.unit.ts` (no Docker/localnet).

## File Structure

**New files:**

| File | Responsibility |
|------|----------------|
| `scripts/prepareRelease.mjs` | Deterministic version bump + changelog stamp; exports pure helpers + a CLI `main()`. |
| `tests/unit/prepareRelease.test.ts` | Vitest unit tests for the pure helpers. |
| `.github/workflows/publish.yaml` | Publish-to-NPM workflow (release-triggered, OIDC, protected env). |
| `.claude/skills/release-ts-sdk/SKILL.md` | Claude-facing release skill (Phase 1 + Phase 2). |
| `.cursor/rules/release-ts-sdk.mdc` | Cursor-facing rule mirroring the skill. |

**Modified files:**

| File | Change |
|------|--------|
| `CONTRIBUTING.md` | Rewrite "Releasing a new version" for the new flow + one-time setup. |
| `CHANGELOG.md` | Add an `# Unreleased` entry describing the release automation. |

---

### Task 1: `prepareRelease.mjs` pure helpers (TDD)

The mechanical core, as small pure functions so they are hermetically testable without touching the real repo files.

**Files:**
- Create: `scripts/prepareRelease.mjs`
- Test: `tests/unit/prepareRelease.test.ts`

**Interfaces:**
- Produces (all named ESM exports from `scripts/prepareRelease.mjs`):
  - `computeNextVersion(current: string, bump: "major"|"minor"|"patch"): string`
  - `isStrictlyGreater(next: string, current: string): boolean`
  - `getUnreleasedSection(changelogText: string): string`
  - `hasUnreleasedContent(changelogText: string): boolean`
  - `stampChangelog(changelogText: string, version: string, dateStr: string): string`
  - `setPackageVersion(pkgJsonText: string, version: string): string`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/prepareRelease.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  computeNextVersion,
  getUnreleasedSection,
  hasUnreleasedContent,
  isStrictlyGreater,
  setPackageVersion,
  stampChangelog,
} from "../../scripts/prepareRelease.mjs";

describe("computeNextVersion", () => {
  it("bumps patch", () => expect(computeNextVersion("7.2.0", "patch")).toBe("7.2.1"));
  it("bumps minor and zeroes patch", () => expect(computeNextVersion("7.2.3", "minor")).toBe("7.3.0"));
  it("bumps major and zeroes minor+patch", () => expect(computeNextVersion("7.2.3", "major")).toBe("8.0.0"));
  it("rejects non-plain-semver current", () =>
    expect(() => computeNextVersion("7.2.0-beta.1", "patch")).toThrow());
  it("rejects unknown bump", () =>
    // @ts-expect-error deliberately invalid bump
    expect(() => computeNextVersion("7.2.0", "nope")).toThrow());
});

describe("isStrictlyGreater", () => {
  it("true when greater", () => expect(isStrictlyGreater("7.3.0", "7.2.9")).toBe(true));
  it("false when equal", () => expect(isStrictlyGreater("7.2.0", "7.2.0")).toBe(false));
  it("false when lower", () => expect(isStrictlyGreater("7.1.0", "7.2.0")).toBe(false));
});

const CHANGELOG_EMPTY = `# Changelog

Intro paragraph.

# Unreleased

# 7.2.0 (2026-07-06)

## Added

- something old
`;

const CHANGELOG_FULL = `# Changelog

Intro paragraph.

# Unreleased

## Added

- a brand new feature

## Fixed

- a bug

# 2.0.0 (2026-01-01)

## Added

- older
`;

describe("getUnreleasedSection / hasUnreleasedContent", () => {
  it("empty Unreleased has no content", () => {
    expect(hasUnreleasedContent(CHANGELOG_EMPTY)).toBe(false);
  });
  it("populated Unreleased has content", () => {
    expect(hasUnreleasedContent(CHANGELOG_FULL)).toBe(true);
  });
  it("section stops at next top-level heading", () => {
    const section = getUnreleasedSection(CHANGELOG_FULL);
    expect(section).toContain("a brand new feature");
    expect(section).not.toContain("older");
  });
  it("throws when no Unreleased heading", () => {
    expect(() => getUnreleasedSection("# Changelog\n\n# 1.0.0\n")).toThrow();
  });
});

describe("stampChangelog", () => {
  it("renames Unreleased and inserts a fresh empty Unreleased on top", () => {
    const out = stampChangelog(CHANGELOG_FULL, "2.1.0", "2026-07-06");
    // fresh empty Unreleased still present
    expect(out).toContain("# Unreleased\n\n# 2.1.0 (2026-07-06)");
    // the previous entries now sit under the stamped version
    const stampedIdx = out.indexOf("# 2.1.0 (2026-07-06)");
    const featureIdx = out.indexOf("a brand new feature");
    const olderIdx = out.indexOf("# 2.0.0 (2026-01-01)");
    expect(stampedIdx).toBeLessThan(featureIdx);
    expect(featureIdx).toBeLessThan(olderIdx);
  });
  it("throws when no Unreleased heading", () => {
    expect(() => stampChangelog("# Changelog\n", "1.0.0", "2026-07-06")).toThrow();
  });
});

describe("setPackageVersion", () => {
  it("replaces only the top-level version, preserving formatting", () => {
    const pkg = `{\n  "name": "@aptos-labs/ts-sdk",\n  "dependencies": {\n    "x": "1.2.3"\n  },\n  "version": "7.2.0"\n}\n`;
    const out = setPackageVersion(pkg, "7.3.0");
    expect(out).toContain(`"version": "7.3.0"`);
    expect(out).toContain(`"x": "1.2.3"`); // dependency version untouched
  });
  it("throws when no version field", () => {
    expect(() => setPackageVersion(`{\n  "name": "x"\n}\n`, "1.0.0")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run --config vitest.config.unit.ts prepareRelease`
Expected: FAIL — cannot resolve `../../scripts/prepareRelease.mjs` (module does not exist).

- [ ] **Step 3: Write the minimal implementation**

Create `scripts/prepareRelease.mjs` (helpers only for now — CLI added in Task 2):

```js
// Prepare a release: bump package.json version + stamp the changelog.
// Pure helpers are exported for unit testing; the CLI entry point is at the bottom.

/**
 * Compute the next semver from a plain `X.Y.Z` current version.
 * @param {string} current
 * @param {"major"|"minor"|"patch"} bump
 * @returns {string}
 */
export function computeNextVersion(current, bump) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!m) throw new Error(`current version is not plain semver X.Y.Z: ${current}`);
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`unknown bump type: ${bump} (expected major|minor|patch)`);
  }
}

/**
 * True iff `next` is strictly greater than `current` (both plain `X.Y.Z`).
 * @param {string} next
 * @param {string} current
 * @returns {boolean}
 */
export function isStrictlyGreater(next, current) {
  const a = next.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

/**
 * Return the text between the `# Unreleased` heading and the next top-level
 * `# ` heading (exclusive). Throws if there is no `# Unreleased` heading.
 * @param {string} changelogText
 * @returns {string}
 */
export function getUnreleasedSection(changelogText) {
  const lines = changelogText.split("\n");
  const start = lines.findIndex((l) => /^# Unreleased\s*$/.test(l));
  if (start === -1) throw new Error("no `# Unreleased` heading found in changelog");
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^# /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

/**
 * True iff the `# Unreleased` section contains at least one changelog bullet.
 * @param {string} changelogText
 * @returns {boolean}
 */
export function hasUnreleasedContent(changelogText) {
  return /^\s*-\s+\S/m.test(getUnreleasedSection(changelogText));
}

/**
 * Rename `# Unreleased` to `# <version> (<dateStr>)`, leaving a fresh empty
 * `# Unreleased` heading above it. Throws if there is no `# Unreleased` heading.
 * @param {string} changelogText
 * @param {string} version
 * @param {string} dateStr  ISO `YYYY-MM-DD`
 * @returns {string}
 */
export function stampChangelog(changelogText, version, dateStr) {
  if (!/^# Unreleased[ \t]*$/m.test(changelogText)) {
    throw new Error("no `# Unreleased` heading found in changelog");
  }
  return changelogText.replace(
    /^# Unreleased[ \t]*$/m,
    `# Unreleased\n\n# ${version} (${dateStr})`,
  );
}

/**
 * Replace the top-level `"version"` string in a package.json's raw text,
 * preserving all other formatting. Throws if no version field is present.
 * @param {string} pkgJsonText
 * @param {string} version
 * @returns {string}
 */
export function setPackageVersion(pkgJsonText, version) {
  const re = /("version":\s*")[^"]*(")/;
  if (!re.test(pkgJsonText)) throw new Error("no `version` field found in package.json");
  return pkgJsonText.replace(re, `$1${version}$2`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run --config vitest.config.unit.ts prepareRelease`
Expected: PASS (all cases green).

- [ ] **Step 5: Format + commit**

```bash
pnpm fmt
git add scripts/prepareRelease.mjs tests/unit/prepareRelease.test.ts
git commit -m "feat(release): add prepareRelease version/changelog helpers"
```

---

### Task 2: `prepareRelease.mjs` CLI entry point

Wire the pure helpers into a CLI that mutates the real files and (for ts-sdk) runs `pnpm update-version`.

**Files:**
- Modify: `scripts/prepareRelease.mjs` (append CLI: `PACKAGES`, `parseArgs`, `main`)

**Interfaces:**
- Consumes: all helpers from Task 1.
- Produces: CLI usage `node scripts/prepareRelease.mjs --package <ts-sdk|confidential-asset> --bump <major|minor|patch>` (or `--version X.Y.Z`). Prints the new version and the tag name `<pkg>-v<version>`.

- [ ] **Step 1: Add the CLI to `scripts/prepareRelease.mjs`**

Append below the helpers:

```js
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Per-package release configuration.
 * `runsUpdateVersion` is true only for ts-sdk (it owns src/version.ts + docs).
 */
const PACKAGES = {
  "ts-sdk": {
    tagPrefix: "ts-sdk",
    pkgJsonPath: join(REPO_ROOT, "package.json"),
    changelogPath: join(REPO_ROOT, "CHANGELOG.md"),
    runsUpdateVersion: true,
  },
  "confidential-asset": {
    tagPrefix: "confidential-asset",
    pkgJsonPath: join(REPO_ROOT, "confidential-asset", "package.json"),
    changelogPath: join(REPO_ROOT, "confidential-asset", "CHANGELOG.md"),
    runsUpdateVersion: false,
  },
};

/**
 * Parse `--package`, and exactly one of `--bump` / `--version`.
 * @param {string[]} argv
 * @returns {{ pkg: string, bump?: string, version?: string }}
 */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--package") out.pkg = argv[(i += 1)];
    else if (arg === "--bump") out.bump = argv[(i += 1)];
    else if (arg === "--version") out.version = argv[(i += 1)];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!out.pkg || !PACKAGES[out.pkg]) {
    throw new Error("--package must be one of: ts-sdk, confidential-asset");
  }
  if (!!out.bump === !!out.version) {
    throw new Error("provide exactly one of --bump or --version");
  }
  return out;
}

function main() {
  const { pkg, bump, version } = parseArgs(process.argv.slice(2));
  const cfg = PACKAGES[pkg];

  const pkgJsonText = readFileSync(cfg.pkgJsonPath, "utf8");
  const current = JSON.parse(pkgJsonText).version;
  const next = version ?? computeNextVersion(current, bump);

  if (!isStrictlyGreater(next, current)) {
    throw new Error(`new version ${next} is not greater than current ${current}`);
  }

  const changelogText = readFileSync(cfg.changelogPath, "utf8");
  if (!hasUnreleasedContent(changelogText)) {
    throw new Error(
      `\`# Unreleased\` section of ${cfg.changelogPath} is empty; ` +
        "add changelog entries before preparing a release",
    );
  }

  // UTC date so releases are reproducible regardless of the runner's timezone.
  const dateStr = new Date().toISOString().slice(0, 10);

  writeFileSync(cfg.pkgJsonPath, setPackageVersion(pkgJsonText, next));
  writeFileSync(cfg.changelogPath, stampChangelog(changelogText, next, dateStr));

  if (cfg.runsUpdateVersion) {
    // `pnpm update-version` re-reads package.json, so $npm_package_version is
    // the version we just wrote; it syncs src/version.ts and regenerates docs.
    execSync("pnpm update-version", { cwd: REPO_ROOT, stdio: "inherit" });
  }

  const tag = `${cfg.tagPrefix}-v${next}`;
  console.log(`\nPrepared ${pkg} release: ${current} -> ${next}`);
  console.log(`Changelog stamped with date ${dateStr}`);
  console.log(`Phase 2 tag will be: ${tag}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`prepareRelease failed: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Add a `parseArgs` test and run the existing suite**

Append to `tests/unit/prepareRelease.test.ts`:

```ts
import { parseArgs } from "../../scripts/prepareRelease.mjs";

describe("parseArgs", () => {
  it("parses package + bump", () => {
    expect(parseArgs(["--package", "ts-sdk", "--bump", "minor"])).toEqual({
      pkg: "ts-sdk",
      bump: "minor",
    });
  });
  it("parses package + explicit version", () => {
    expect(parseArgs(["--package", "confidential-asset", "--version", "2.1.0"])).toEqual({
      pkg: "confidential-asset",
      version: "2.1.0",
    });
  });
  it("rejects unknown package", () =>
    expect(() => parseArgs(["--package", "nope", "--bump", "patch"])).toThrow());
  it("rejects both bump and version", () =>
    expect(() => parseArgs(["--package", "ts-sdk", "--bump", "patch", "--version", "1.0.0"])).toThrow());
  it("rejects neither bump nor version", () =>
    expect(() => parseArgs(["--package", "ts-sdk"])).toThrow());
});
```

Run: `pnpm exec vitest run --config vitest.config.unit.ts prepareRelease`
Expected: PASS (Task 1 cases + the new `parseArgs` cases).

- [ ] **Step 3: Live smoke test against confidential-asset, then revert**

`confidential-asset` has a populated `# Unreleased` section, so this exercises the changelog stamp + package.json bump without the ts-sdk docs regeneration:

```bash
node scripts/prepareRelease.mjs --package confidential-asset --bump minor
git --no-pager diff -- confidential-asset/package.json confidential-asset/CHANGELOG.md
```

Expected: `confidential-asset/package.json` version `2.0.0 -> 2.1.0`; `confidential-asset/CHANGELOG.md` shows a fresh empty `# Unreleased` above a new `# 2.1.0 (<today>)` heading that now holds the previously-unreleased entries. Then revert the smoke test:

```bash
git checkout -- confidential-asset/package.json confidential-asset/CHANGELOG.md
```

- [ ] **Step 4: Guard test — empty Unreleased is refused**

The root `CHANGELOG.md` currently has an empty `# Unreleased`, so this must fail cleanly and mutate nothing:

```bash
node scripts/prepareRelease.mjs --package ts-sdk --bump patch; echo "exit=$?"
git status --porcelain
```

Expected: prints `prepareRelease failed: \`# Unreleased\` section of .../CHANGELOG.md is empty; ...`, `exit=1`, and `git status --porcelain` shows **no** changes. (If Task 5's changelog entry is already committed, this guard will instead succeed — run this step before Task 5, or temporarily clear the entry to verify.)

- [ ] **Step 5: Format + commit**

```bash
pnpm fmt
git add scripts/prepareRelease.mjs tests/unit/prepareRelease.test.ts
git commit -m "feat(release): add prepareRelease CLI entry point"
```

---

### Task 3: NPM publish workflow

**Files:**
- Create: `.github/workflows/publish.yaml`

**Interfaces:**
- Consumes: `github.event.release.tag_name` (`ts-sdk-vX.Y.Z` or `confidential-asset-vX.Y.Z`); the `setup-node-pnpm` composite action; a repo Environment named `npm-publish`.
- Produces: an `@aptos-labs/*` package published to NPM with provenance.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/publish.yaml`:

```yaml
name: "Publish to NPM"
on:
  release:
    types: [published]

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm-publish
    permissions:
      id-token: write # OIDC trusted publishing + provenance
      contents: read
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # pin@v7.0.0
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup-node-pnpm
      - name: Resolve package and verify version matches tag
        id: resolve
        shell: bash
        env:
          TAG: ${{ github.event.release.tag_name }}
        run: |
          set -euo pipefail
          if [[ "$TAG" == ts-sdk-v* ]]; then
            dir="."
            version="${TAG#ts-sdk-v}"
          elif [[ "$TAG" == confidential-asset-v* ]]; then
            dir="confidential-asset"
            version="${TAG#confidential-asset-v}"
          else
            echo "Tag '$TAG' is not a package release tag; skipping publish."
            echo "publish=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          pkg_version="$(node -p "require('./${dir}/package.json').version")"
          if [[ "$version" != "$pkg_version" ]]; then
            echo "Tag version ($version) != ${dir}/package.json version ($pkg_version)" >&2
            exit 1
          fi
          echo "dir=$dir" >> "$GITHUB_OUTPUT"
          echo "publish=true" >> "$GITHUB_OUTPUT"
      - name: Install dependencies
        if: steps.resolve.outputs.publish == 'true'
        run: pnpm install --frozen-lockfile
      - name: Publish to NPM (OIDC trusted publishing + provenance)
        if: steps.resolve.outputs.publish == 'true'
        working-directory: ${{ steps.resolve.outputs.dir }}
        run: pnpm publish --provenance --no-git-checks
```

- [ ] **Step 2: Lint the workflow**

Run: `pnpm exec actionlint .github/workflows/publish.yaml` (or, if `actionlint` is not installed locally, `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color .github/workflows/publish.yaml`).
Expected: no errors.

- [ ] **Step 3: Verify OIDC trusted-publishing readiness (manual check, document risk)**

The `setup-node-pnpm` composite runs `actions/setup-node` with `registry-url`, which writes an `.npmrc` line referencing `NODE_AUTH_TOKEN`. With no token set, confirm this does **not** shadow OIDC trusted publishing. Verify by reading npm/pnpm trusted-publishing docs for the pinned pnpm (`10.30.3`). If the empty-token `.npmrc` line interferes, the fix (applied in this step) is to add, before the publish step, a shell step that strips the token line:

```yaml
      - name: Remove token line so OIDC trusted publishing is used
        if: steps.resolve.outputs.publish == 'true'
        run: |
          npmrc="${HOME}/.npmrc"
          [ -f "$npmrc" ] && sed -i '/_authToken/d' "$npmrc" || true
```

Only add this step if verification shows it is needed. Record the outcome in the commit message.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/publish.yaml
git commit -m "ci(release): add NPM publish workflow (OIDC, protected env)"
```

---

### Task 4: Release skill (Claude) + Cursor rule

**Files:**
- Create: `.claude/skills/release-ts-sdk/SKILL.md`
- Create: `.cursor/rules/release-ts-sdk.mdc`

**Interfaces:**
- Consumes: `scripts/prepareRelease.mjs`, `gh` CLI, the tag scheme, `publish.yaml`.
- Produces: a documented two-phase agent procedure usable from Claude Code and Cursor.

- [ ] **Step 1: Create the Claude skill**

Create `.claude/skills/release-ts-sdk/SKILL.md`:

```markdown
---
name: release-ts-sdk
description: Use when cutting a release of @aptos-labs/ts-sdk or @aptos-labs/confidential-asset. Phase 1 bumps the version, stamps the changelog, and opens the release PR. Phase 2 (after the PR merges to main) cuts the tag and GitHub Release that triggers the NPM publish workflow.
---

# Releasing the Aptos TypeScript SDK

Two packages release independently:

- `@aptos-labs/ts-sdk` (repo root) — tag prefix `ts-sdk-v`
- `@aptos-labs/confidential-asset` (`confidential-asset/`) — tag prefix `confidential-asset-v`

All mechanical work is done by `scripts/prepareRelease.mjs`. Publishing to NPM is done by
`.github/workflows/publish.yaml` when a GitHub Release is published — never publish by hand.

## Preconditions

- Working tree clean, on an up-to-date `main`.
- The target package's `# Unreleased` changelog section already lists the changes being released.
  If it is empty, stop and ask the maintainer to fill it in first (the script will refuse otherwise).

## Phase 1 — prepare the release PR

1. Ask which package (`ts-sdk` or `confidential-asset`) unless it is obvious from context.
2. Ask the bump type: `major`, `minor`, or `patch`. For a **major** bump, remind the maintainer to
   write an upgrade guide at `upgrade-guides/UPGRADE_GUIDE_X.Y.Z.md` and reference it in the changelog.
3. Determine the new version without mutating anything yet:
   - Current version: read `version` from the package's `package.json`.
4. Create a release branch: `git checkout -b release/<pkg>-v<newVersion>`.
5. Run the prep script:
   - `node scripts/prepareRelease.mjs --package <pkg> --bump <type>`
6. Validate:
   - `pnpm check`
   - For `ts-sdk` only: `pnpm check-version`
7. Review the diff with `git --no-pager diff`. Confirm: `package.json` version bumped, changelog
   stamped with today's date, and (ts-sdk) `src/version.ts` + `docs/` updated.
8. Commit: `git commit -am "chore: release <pkg> v<newVersion>"`.
9. Push and open a PR:
   - `git push -u origin release/<pkg>-v<newVersion>`
   - `gh pr create --fill --title "chore: release <pkg> v<newVersion>"`
10. Tell the maintainer to review + merge, then re-invoke this skill for **Phase 2**.

## Phase 2 — tag + GitHub Release (after the PR merges)

1. `git checkout main && git pull --ff-only`.
2. Verify the working tree is clean and the merged version is present:
   `node -p "require('./<pkgPath>/package.json').version"` matches the released version
   (`<pkgPath>` is `.` for ts-sdk, `confidential-asset` for confidential-asset).
3. Compute the tag: `<pkg>-v<version>`.
4. Refuse if the tag already exists: `git tag --list <tag>` must be empty.
5. Create + push the tag:
   - `git tag -a <tag> -m "<pkg> v<version>"`
   - `git push origin <tag>`
6. Create the GitHub Release (this triggers publishing):
   - Extract that version's changelog section for the notes.
   - `gh release create <tag> --title "<pkg> v<version>" --notes-file <notes>`
7. Report the Actions run URL. Note that publishing waits for approval on the `npm-publish`
   environment before it pushes to NPM.

## Never do

- Never run `npm publish` / `pnpm publish` locally — CI owns publishing.
- Never tag from a dirty tree or a branch other than `main`.
- Never release with an empty `# Unreleased` section.
```

- [ ] **Step 2: Create the Cursor rule**

Create `.cursor/rules/release-ts-sdk.mdc`:

```markdown
---
description: Release @aptos-labs/ts-sdk or @aptos-labs/confidential-asset — version bump, changelog stamp, release PR, then tag + GitHub Release that triggers NPM publish.
alwaysApply: false
---

# Releasing the Aptos TypeScript SDK

Follow the same procedure as the Claude skill in @.claude/skills/release-ts-sdk/SKILL.md.
All mechanical work is delegated to @scripts/prepareRelease.mjs; publishing is done by CI
(@.github/workflows/publish.yaml) on GitHub Release — never publish by hand.

Packages (independent versions):
- `@aptos-labs/ts-sdk` (root) — tag prefix `ts-sdk-v`
- `@aptos-labs/confidential-asset` (`confidential-asset/`) — tag prefix `confidential-asset-v`

## Phase 1 — release PR
1. Confirm package + bump type (`major`/`minor`/`patch`) with the maintainer.
2. Ensure the target `# Unreleased` changelog section is populated (the script refuses if empty).
3. `git checkout -b release/<pkg>-v<newVersion>`
4. `node scripts/prepareRelease.mjs --package <pkg> --bump <type>`
5. `pnpm check` (and `pnpm check-version` for ts-sdk); review `git diff`.
6. `git commit -am "chore: release <pkg> v<newVersion>"`, push, `gh pr create --fill`.
7. Ask the maintainer to review + merge, then re-run for Phase 2.

## Phase 2 — tag + release (after merge)
1. `git checkout main && git pull --ff-only`; confirm clean tree + version present.
2. `git tag -a <pkg>-v<version> -m "<pkg> v<version>"` (refuse if it already exists).
3. `git push origin <pkg>-v<version>`
4. `gh release create <pkg>-v<version> --title "<pkg> v<version>" --notes-file <notes>`
   using that version's changelog section as the notes.
5. Report the Actions run URL; publishing waits on the `npm-publish` environment approval.

Never run `npm publish` / `pnpm publish` locally. Never tag a dirty tree or non-`main` branch.
```

- [ ] **Step 3: Sanity-check the skill loads (Claude)**

Confirm the skill is discoverable: the file exists at `.claude/skills/release-ts-sdk/SKILL.md` with valid frontmatter (`name`, `description`). (Discovery is automatic for project skills; no command needed.)

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/release-ts-sdk/SKILL.md .cursor/rules/release-ts-sdk.mdc
git commit -m "docs(release): add release skill (Claude) and Cursor rule"
```

---

### Task 5: Docs — CONTRIBUTING + CHANGELOG

**Files:**
- Modify: `CONTRIBUTING.md` (replace the "Releasing a new version" section)
- Modify: `CHANGELOG.md` (add an `# Unreleased` entry)

- [ ] **Step 1: Rewrite the CONTRIBUTING release section**

Replace the current "## Releasing a new version" section (through the end of the "Publish to NPM"
subsection) in `CONTRIBUTING.md` with:

````markdown
## Releasing a new version

Releases are automated. The mechanical work is done by `scripts/prepareRelease.mjs`, and publishing
to NPM is done by `.github/workflows/publish.yaml` when a GitHub Release is published. **Do not run
`npm publish` by hand.**

Agents can drive the whole flow via the release skill (`.claude/skills/release-ts-sdk/SKILL.md`, or
the Cursor rule `.cursor/rules/release-ts-sdk.mdc`). To do it manually:

Two packages release independently, each with its own version, changelog, and tag prefix:

- `@aptos-labs/ts-sdk` (repo root) — tags `ts-sdk-vX.Y.Z`
- `@aptos-labs/confidential-asset` (`confidential-asset/`) — tags `confidential-asset-vX.Y.Z`

### 1. Prepare the release PR

First make sure the target changelog's `# Unreleased` section lists the changes being released
(the prep script refuses an empty section). Then:

```bash
git checkout -b release/ts-sdk-v7.3.0
# Bumps package.json, stamps the changelog with today's date, and (ts-sdk only)
# syncs src/version.ts + regenerates docs:
node scripts/prepareRelease.mjs --package ts-sdk --bump minor   # or --bump major|patch
pnpm check
pnpm check-version    # ts-sdk only
git commit -am "chore: release ts-sdk v7.3.0"
git push -u origin release/ts-sdk-v7.3.0
gh pr create --fill
```

For a **major** release, also add an upgrade guide (`upgrade-guides/UPGRADE_GUIDE_X.Y.Z.md`) and
reference it in the changelog. Get the PR approved and merge it into `main`.

### 2. Tag and release

After the PR is on `main` and you have pulled latest:

```bash
git checkout main && git pull --ff-only
git tag -a ts-sdk-v7.3.0 -m "ts-sdk v7.3.0"
git push origin ts-sdk-v7.3.0
gh release create ts-sdk-v7.3.0 --title "ts-sdk v7.3.0" --notes "<changelog section>"
```

Publishing the GitHub Release triggers `publish.yaml`, which verifies the tag version matches
`package.json`, then publishes to NPM with provenance. The publish waits for a one-click approval on
the protected `npm-publish` environment.

### One-time setup (repo admin)

Before the first automated release, an admin must configure:

1. **npmjs.com → each package → Settings → Trusted Publisher:** provider GitHub Actions, repository
   `aptos-labs/aptos-ts-sdk`, workflow `publish.yaml`, environment `npm-publish`. Do this for both
   `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset`.
2. **GitHub → repo Settings → Environments → `npm-publish`:** add required reviewers so publishing
   pauses for approval.
````

- [ ] **Step 2: Add the CHANGELOG entry**

In `CHANGELOG.md`, under `# Unreleased`, add:

```markdown
# Unreleased

## Added

- Automated release tooling: `scripts/prepareRelease.mjs` bumps a package's version and stamps its changelog, a two-phase release skill/Cursor rule (`.claude/skills/release-ts-sdk/`, `.cursor/rules/release-ts-sdk.mdc`) drives the version-bump PR and the tag + GitHub Release, and `.github/workflows/publish.yaml` publishes `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset` to NPM with provenance via OIDC trusted publishing when a GitHub Release is published. See `CONTRIBUTING.md` and `docs/superpowers/specs/2026-07-06-automated-ts-sdk-releases-design.md`.
```

- [ ] **Step 3: Format + validate + commit**

```bash
pnpm fmt
pnpm check
git add CONTRIBUTING.md CHANGELOG.md
git commit -m "docs(release): document automated release flow and one-time setup"
```

---

## Self-Review

**Spec coverage:**
- Layer A (script) → Tasks 1–2. Layer B (skill/Cursor) → Task 4. Layer C (workflow) → Task 3.
- Both packages + asymmetry (ts-sdk docs vs confidential-asset) → `PACKAGES` map (Task 2) + skill/CONTRIBUTING notes.
- OIDC + provenance + protected env → Task 3 workflow. pnpm publish w/ npm fallback → Task 3 Step 3 note.
- Tag scheme + legacy tags don't trigger → Task 3 routing (release-triggered, prefix match, else no-op).
- Empty-Unreleased guard + non-increasing-version guard → Task 1/2 + Task 2 Step 4.
- Cross-tool packaging → Task 4 (both wrappers reference the script). One-time setup → Task 5.
- Testing/validation → Task 1/2 unit tests + smoke tests, Task 3 actionlint.

**Placeholder scan:** No TBD/TODO; all steps carry concrete code or commands. `<pkg>`/`<version>`
in the skill are runtime template values, not plan gaps.

**Type consistency:** Helper names (`computeNextVersion`, `isStrictlyGreater`, `getUnreleasedSection`,
`hasUnreleasedContent`, `stampChangelog`, `setPackageVersion`, `parseArgs`) are used identically in
the implementation and the tests. `PACKAGES` keys (`ts-sdk`, `confidential-asset`) match the CLI
`--package` values, the skill, and the workflow tag prefixes.

**Note / known risk:** Task 3 Step 3 — OIDC trusted publishing vs the `.npmrc` token line written by
`setup-node-pnpm` — is the one item that cannot be fully verified without a real (or dry-run) publish;
the step documents the check and the conditional fix.
```