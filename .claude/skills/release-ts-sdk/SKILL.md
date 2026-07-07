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
3. Determine the new version without mutating anything yet: read `version` from the package's
   `package.json` (`.` for ts-sdk, `confidential-asset/` for confidential-asset) and apply the bump.
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
