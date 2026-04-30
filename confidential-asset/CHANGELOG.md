# Aptos Confidential Asset SDK Changelog

All notable changes to `@aptos-labs/confidential-asset` will be captured in this file. This changelog is written by hand for now. It adheres to the format set out by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

For changes to the main Aptos TypeScript SDK (`@aptos-labs/ts-sdk`), see the [root CHANGELOG.md](../CHANGELOG.md).

# Unreleased

## Fixed

- Fix package build to be ESM-only and align with the main SDK:
  - Add `"type": "module"` so `tsc` (with `module: nodenext`) emits ESM instead of falling back to CJS.
  - Fix `exports`/`main`/`module` paths: previously pointed to nonexistent `dist/common/index.js` and `dist/esm/index.mjs`; now a single `dist/index.js` (ESM) with `dist/index.d.ts` types.
  - Set `rootDir: "./src"` in `tsconfig.build.json` so output lands at `dist/...` instead of `dist/src/...`.
  - Bump `engines.node` from `>=20.0.0` to `>=22.0.0` to match the main SDK.
  - Add `lint`, `check`, `fmt`, `_fmt`, `format`, and `prepublishOnly` scripts (Biome-driven, sharing the repo's `biome.json`).
  - Add `repository` field to `package.json` (with `directory: "confidential-asset"`).
  - Drop unused dev dependencies: `@swc/cli`, `@swc/core`, `tslib`, `tsc-alias`, `tsx`. Add `@biomejs/biome`.
  - Remove orphaned `postbuild.cjs` (referenced nonexistent `dist/cjs` / `dist/esm` / `dist/types` paths and was not invoked by any script).
  - Remove stale compiled `vitest.config.js` / `vitest.config.js.map` artifacts from the package root.
  - Add explicit `.js` extensions to relative imports under `src/indexer/` (and regenerated `src/indexer/generated/`) so `nodenext` ESM resolution accepts them.
  - Fix `tsconfig.json` `include` to reference `vitest.config.ts` (the file that exists) rather than `vitest.config.mts`.
