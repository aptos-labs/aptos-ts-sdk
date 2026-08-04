# Automated TS SDK Releases — Design

**Date:** 2026-07-06
**Status:** Approved (pending spec review)
**Author:** Greg Nazario (with Claude)

## Goal

Automate releasing the Aptos TypeScript SDK packages so that a maintainer (human, Claude, or
Cursor) can cut a release with minimal manual, error-prone steps. Replace the current
manual `npm publish`-from-a-laptop flow with a repeatable script + agent skill + CI workflow
that publishes to NPM via a GitHub Action.

Covers **two packages**, versioned independently:

- `@aptos-labs/ts-sdk` (repo root)
- `@aptos-labs/confidential-asset` (`confidential-asset/`)

## Current process (baseline)

From `CONTRIBUTING.md` and `scripts/`:

1. Branch off `main`; manually bump `version` in `package.json`; manually edit `CHANGELOG.md`
   (move `# Unreleased` content under a new `# X.Y.Z (date)` heading).
2. `pnpm update-version` → `scripts/updateVersion.sh` syncs `src/version.ts` and `pnpm doc`
   regenerates TypeDoc into `docs/@aptos-labs/ts-sdk-X.Y.Z`, inserts a line into `docs/index.md`,
   and updates the `-latest` redirect.
3. Push branch → PR → approve → merge → pull `main`.
4. **Manually** run `npm publish` from a laptop (runs `prepublishOnly`: build + check-license).
   No git tag, no GitHub Release, no CI publish today.

Asymmetry between the packages:

- **`ts-sdk`**: has `src/version.ts`, versioned `docs/`, `update-version` + `check-version` scripts.
- **`confidential-asset`**: **no** `src/version.ts`, **no** `docs/`, **no** `update-version`/`check-version`.
  Its bump = edit `confidential-asset/package.json` version + stamp `confidential-asset/CHANGELOG.md` only.

Both changelogs use the same shape: a `# Unreleased` heading with `## Added` / `## Changed` /
`## Fixed` / `## Breaking` subsections.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| NPM auth | **Trusted Publishing (OIDC)** + `--provenance`, no long-lived token |
| Publish trigger | **GitHub Release `published`** |
| Scope | **Both packages** (independent versioning) |
| Publish gate | **Protected `npm-publish` environment** with required reviewers |
| Tag scheme | **`ts-sdk-vX.Y.Z`** and **`confidential-asset-vX.Y.Z`** (explicit prefix on both) |
| Phase 2 (tag + release) | **Separate skill invocation** after the PR merges |

## Architecture — three layers

### Layer A — deterministic script: `scripts/prepareRelease.mjs`

Single source of truth for the mechanical bump so a human, Claude, and Cursor all produce
byte-identical results. Node ESM script (repo is Node ≥ 22, `"type": "module"`).

**Invocation:**

```bash
node scripts/prepareRelease.mjs --package <ts-sdk|confidential-asset> --bump <major|minor|patch>
# or an explicit version:
node scripts/prepareRelease.mjs --package ts-sdk --version 7.3.0
```

**Behavior (common):**

1. Resolve the target `package.json` (root or `confidential-asset/`).
2. Compute the new semver from `--bump` (or accept explicit `--version`); reject a version
   that is not strictly greater than current.
3. **Guard:** verify the target changelog's `# Unreleased` section is **non-empty** (has at least
   one bullet under a subsection). Abort with a clear error if empty — no silent empty releases.
4. Write the new `version` into the target `package.json`.
5. Stamp the changelog: rename `# Unreleased` → `# X.Y.Z (YYYY-MM-DD)` and insert a fresh empty
   `# Unreleased` heading above it. Date is the current UTC date.
6. Print the new version, the tag name that Phase 2 will use, and the list of touched files.

**Behavior (package-specific):**

- `ts-sdk`: after bumping `package.json`, run `pnpm update-version` (syncs `src/version.ts`,
  regenerates docs, updates `docs/index.md` + `-latest` redirect). Note: `update-version` reads
  `$npm_package_version`, so it is invoked such that the freshly written version is in effect
  (e.g. via `pnpm update-version` after the package.json write, which re-reads package.json).
- `confidential-asset`: no `src/version.ts`, no docs — steps 4–5 only, scoped to
  `confidential-asset/package.json` and `confidential-asset/CHANGELOG.md`.

The script does **not** commit, branch, push, tag, or publish. It only mutates files and prints a
summary. Git/PR/tag orchestration is the skill's job; this keeps the script pure and testable.

Date injection: the script reads the date from the environment/Node at run time. (Agents running
the skill pass no date; the script owns "today".)

### Layer B — agent skill (two phases, thin wrapper around Layer A)

Content source of truth is Layer A + `CONTRIBUTING.md`. The skill only orchestrates.

**Phase 1 — prepare release PR:**

1. Ask which package (`ts-sdk` | `confidential-asset`) if not obvious from context.
2. Ask the bump type (`major` | `minor` | `patch`), explaining semver implications. For a `major`
   bump, remind the maintainer to author an upgrade guide (`upgrade-guides/UPGRADE_GUIDE_X.Y.Z.md`,
   per CLAUDE.md) and reference it in the changelog.
3. Confirm the `# Unreleased` changelog section is populated; if not, stop and ask the maintainer
   to fill it in first.
4. Create a release branch (e.g. `release/ts-sdk-vX.Y.Z`).
5. Run `node scripts/prepareRelease.mjs --package <pkg> --bump <type>`.
6. Run `pnpm check` + `pnpm check-version` (for `ts-sdk`) to validate consistency.
7. Show the diff; commit with a `chore: release <pkg> vX.Y.Z` message.
8. Push and open a PR via `gh pr create` with a summary of the changelog delta.
9. Tell the maintainer: review + merge, then re-invoke the skill for Phase 2.

**Phase 2 — tag + GitHub Release (after PR merges):**

1. Verify: on `main`, up to date with `origin/main`, working tree clean, and the release commit
   is present (`package.json` version matches the intended release).
2. Compute the tag: `<pkg>-vX.Y.Z`.
3. Create the annotated tag and push it.
4. Create the GitHub Release via `gh release create <tag>` with notes extracted from that version's
   changelog section. This fires `publish.yaml`.
5. Report the Actions run URL and note that the publish waits on the `npm-publish` environment
   approval.

**Skill safety rails:** refuse Phase 2 if the tree is dirty, not on `main`, or the version/tag
already exists; never publish directly from the skill (CI owns publishing).

### Layer C — CI workflow: `.github/workflows/publish.yaml`

```yaml
name: Publish to NPM
on:
  release:
    types: [published]
permissions:
  id-token: write   # OIDC for trusted publishing + provenance
  contents: read
jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm-publish        # required-reviewer gate
    steps:
      - uses: actions/checkout@<pinned>
      - uses: ./.github/actions/setup-node-pnpm
      - name: Route by tag + guard version
        # Parse github.event.release.tag_name:
        #   ts-sdk-vX.Y.Z             -> dir = .                (package @aptos-labs/ts-sdk)
        #   confidential-asset-vX.Y.Z -> dir = confidential-asset
        # Assert the X.Y.Z in the tag === version in that dir's package.json; fail on mismatch.
        # Any other tag prefix (e.g. legacy `vX.Y.Z`) -> exit 0 without publishing.
      - run: pnpm install --frozen-lockfile
      - name: Publish
        run: pnpm publish --provenance --no-git-checks   # in the routed dir
```

**Routing:** a single job inspects `github.event.release.tag_name`. Prefix `confidential-asset-v`
→ publish from `confidential-asset/`; prefix `ts-sdk-v` → publish from repo root. Any other tag
prefix (including the **legacy `vX.Y.Z` tags**) → the job no-ops (not a package release). Because
the workflow triggers only on `release: published` (never on tag push) and routes solely on these
two prefixes, the existing `v7.0.0`-style tags cannot trigger a publish.

**Publish tooling:** the publish uses **pnpm** (`pnpm publish --provenance --no-git-checks`) to
match the rest of the repo's tooling. This requires a pnpm version that supports OIDC trusted
publishing (pnpm ≥ 10.13; repo pins `pnpm@10.30.3`, which satisfies this — the implementation must
verify OIDC trusted publishing actually works with the pinned pnpm; if it does not, first try
pinning a newer pnpm in the workflow, and only if pnpm still cannot do OIDC trusted publishing fall
back to the **npm CLI** (`npm install -g npm@latest && npm publish --provenance --access public`)
for the publish step alone — install/build stay on pnpm).
`--no-git-checks` is needed because the tag checkout is a detached HEAD. Install and build use pnpm
via the existing `setup-node-pnpm` action. `prepublishOnly` (build + check-license) runs
automatically on `pnpm publish`.

**Version guard:** the workflow refuses to publish if the tag version does not match the target
`package.json` version — prevents publishing a mismatched or stale tree.

## Cross-tool skill packaging (Claude + Cursor)

All real logic is in `scripts/prepareRelease.mjs` and the expanded `CONTRIBUTING.md` "Releasing"
section (the human runbook). Two **thin** wrappers reference them so there is no forked logic to
drift:

- `.claude/skills/release-ts-sdk/SKILL.md` — Claude Code auto-discovers project skills under
  `.claude/skills/`. Frontmatter `name` + `description`; body = the Phase 1 / Phase 2 steps above,
  delegating mechanics to the script.
- `.cursor/rules/release-ts-sdk.mdc` — Cursor rule (frontmatter `description`, `alwaysApply: false`)
  that `@`-references `SKILL.md` and `scripts/prepareRelease.mjs` and restates the same phased steps.

Rejected alternative: a single fully self-contained skill duplicated in both locations → high drift
risk. Script-as-source-of-truth keeps both wrappers minimal.

## One-time manual setup (documented in CONTRIBUTING.md)

These cannot be done in code and must be done once by a repo admin:

1. **npmjs.com → Trusted Publisher** for each package (`@aptos-labs/ts-sdk` and
   `@aptos-labs/confidential-asset`): provider GitHub Actions, repo `aptos-labs/aptos-ts-sdk`,
   workflow `publish.yaml`, environment `npm-publish`.
2. **GitHub repo settings → Environments → `npm-publish`**: add required reviewers so publishing
   pauses for a one-click approval.

## Testing / validation

- **Script unit tests** (`scripts/__tests__/prepareRelease.test.ts` or a Vitest file): given
  fixture `package.json` + `CHANGELOG.md`, assert version math (major/minor/patch), changelog
  stamping (heading rename + fresh `# Unreleased`), the empty-Unreleased guard, and the
  reject-non-increasing-version guard. Package-specific branches (ts-sdk vs confidential-asset)
  covered by not requiring `src/version.ts` for the latter.
- **Workflow lint:** `publish.yaml` passes `actionlint` (already wired in `.github/actionlint.yaml`)
  and follows the repo's action-pinning convention (pinned SHAs with `# pin@vX` comments).
- **Dry-run rehearsal:** first real run can be validated by publishing a prerelease / using
  `npm publish --dry-run` locally against the built tree before trusting CI end-to-end.
- **check-version CI** continues to guard `ts-sdk` version consistency on PRs.

## Out of scope

- Auto-generating changelog entries from commits (changelogs remain hand-written, per repo policy).
- Automating the npmjs.com trusted-publisher and GitHub environment setup (manual, one-time).
- Changing the confidential-asset `zeta` prerelease flow (`publish-zeta`) — left as-is.
- Canary/nightly publishing.

## Files touched

**New:**

- `scripts/prepareRelease.mjs`
- `scripts/__tests__/prepareRelease.test.ts` (or colocated Vitest file)
- `.github/workflows/publish.yaml`
- `.claude/skills/release-ts-sdk/SKILL.md`
- `.cursor/rules/release-ts-sdk.mdc`

**Modified:**

- `CONTRIBUTING.md` — rewrite the "Releasing a new version" section for the new flow + one-time setup.
- `CHANGELOG.md` — add an entry under `# Unreleased` describing the release automation.
```