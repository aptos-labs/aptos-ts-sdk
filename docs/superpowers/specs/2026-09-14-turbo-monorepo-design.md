# Turbo Monorepo Design

## Status

Approved on 2026-09-14.

## Goal

Convert the repository into a conventional pnpm and Turbo monorepo without changing the published APIs, versions, or release tags of `@aptos-labs/ts-sdk` and `@aptos-labs/confidential-asset`. The structure must allow a future payments SDK to be added at `packages/payments-sdk` without another repository-wide tooling migration.

## Non-goals

- Do not create a payments SDK package in this change.
- Do not change either existing SDK's public API, runtime behavior, package name, version, or release tag.
- Do not combine the independently versioned SDK releases.
- Do not bring examples or projects into the root pnpm workspace.

## Repository Layout

The repository root becomes a private orchestration package:

```text
.
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── packages/
│   ├── ts-sdk/
│   │   ├── package.json
│   │   ├── src/
│   │   ├── tests/
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   └── package-specific build and test configuration
│   └── confidential-asset/
│       ├── package.json
│       ├── src/
│       ├── tests/
│       ├── README.md
│       ├── CHANGELOG.md
│       └── package-specific build and test configuration
├── docs/
├── examples/
├── projects/
├── scripts/
└── .github/
```

The current root SDK source, tests, package metadata, TypeScript/Vitest/Cucumber/TypeDoc configuration, README, changelog, and license move to `packages/ts-sdk`. The current `confidential-asset` directory moves intact to `packages/confidential-asset`. Repository-wide documentation, generated API docs, release automation, GitHub Actions, examples, projects, and shared formatting configuration remain at the root.

The root README becomes a short monorepo overview that links to each package and documents `packages/payments-sdk` as the reserved location for a future payments package.

## Workspace and Dependencies

`pnpm-workspace.yaml` declares:

```yaml
packages:
  - "packages/*"
```

It also remains the single source for pnpm security settings, dependency overrides, allowed build scripts, and minimum package age. Existing root and confidential-asset settings are merged without dropping an override. Package-local workspace files and lockfiles are removed, leaving one root `pnpm-lock.yaml`.

`@aptos-labs/confidential-asset` keeps its published peer range for `@aptos-labs/ts-sdk` and uses the pnpm `workspace:` protocol for its development dependency. This gives Turbo an explicit local package edge while preserving the published semver contract. A future payments package can use the same pattern when it depends on the core SDK.

Examples and projects remain independent installs with their own lockfiles. Examples that consume the local SDK update their `link:` or `file:` dependency from the old repository root to `../../packages/ts-sdk`.

## Root Commands and Turbo Task Graph

The root `package.json` is marked `private`, pins the existing Node and pnpm versions, and installs Turbo as a development dependency. Its developer-facing scripts delegate package work to Turbo so the established root commands remain available.

The Turbo task graph has these properties:

- `build` depends on dependency-package builds through `^build` and caches `dist/**`.
- Read-only formatting, linting, and check tasks run independently across packages.
- Write-formatting and localnet-backed test tasks are not cached.
- Package tests that start a local Aptos node run serially from the root command, preventing collisions on port `8070`.
- Browser tests and specialized SDK test commands remain package-specific and can be selected with `pnpm --filter`.
- Publishing is never a Turbo task. Release automation continues publishing one selected package at a time.

Package-level script names remain stable where practical. Developers can run all package tasks from the root or select one package:

```bash
pnpm build
pnpm check
pnpm test
pnpm --filter @aptos-labs/ts-sdk test
pnpm --filter @aptos-labs/confidential-asset test:browser
```

Task failures propagate a nonzero root exit code. Turbo only runs a dependent task after its prerequisite succeeds.

## Tooling and Path Migration

All path-sensitive tooling is updated as part of the same migration:

- GitHub composite actions install once at the root and run filtered workspace tasks.
- The publish workflow maps existing tags to `packages/ts-sdk` or `packages/confidential-asset`.
- Release preparation maps package metadata and changelogs to their new package directories.
- TS SDK version checks and updates read `packages/ts-sdk/src/version.ts`.
- TypeDoc continues writing generated output to the root `docs/` tree.
- License checks target both package directories.
- Codecov package paths, contributor documentation, repository agent guidance, and release guidance use the new paths.
- Example, Bun, Deno, browser, and JavaScript local package references point to `packages/ts-sdk`.

Existing tag formats remain `ts-sdk-vX.Y.Z` and `confidential-asset-vX.Y.Z`. Existing npm package names, exports, and package contents remain unchanged.

## Future Payments SDK

No placeholder package is created. The root workspace glob and Turbo conventions make `packages/payments-sdk` automatically discoverable when it is added. Its future package should:

1. Use its own package metadata, source, tests, README, changelog, and license.
2. Expose the standard `build`, `check`, `lint`, `_fmt`, `fmt`, and `test` scripts that apply to it.
3. Declare local SDK relationships with the `workspace:` protocol.
4. Add package-specific release routing only when it becomes publishable.

This avoids speculative APIs while establishing the directory and task contracts the package will use.

## Verification

The migration is complete when all of the following hold:

1. `pnpm install --frozen-lockfile` succeeds from the repository root.
2. `pnpm check` and the non-writing format check pass for both packages.
3. `pnpm build` builds packages in dependency order and a second build demonstrates Turbo cache reuse.
4. TS SDK and confidential-asset unit/localnet test suites pass without port conflicts.
5. Confidential-asset browser tests pass.
6. Linked TypeScript/JavaScript and runtime compatibility examples resolve the relocated TS SDK.
7. `pnpm pack --dry-run` from each package contains its expected README, license, source, declarations, and JavaScript output.
8. Version checks and release-preparation tests pass with the relocated files.
9. The old package paths and package-local lockfiles/workspace files no longer remain.
