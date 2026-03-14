# Upgrade Guide: Aptos TypeScript SDK 7.0.0

This guide will help you migrate your code from SDK version 6.x to 7.0.0.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
  - [Node.js Version Requirement](#nodejs-version-requirement)
  - [Dependency Upgrades](#dependency-upgrades)
  - [Build Target Changes](#build-target-changes)
- [Migration Steps](#migration-steps)

## Overview

Version 7.0.0 modernizes the SDK's runtime and build targets. The primary changes are:

1. **Node.js 22+** is now required (Node 20 reaches EOL in April 2026)
2. Major dependency upgrades to `@aptos-labs/aptos-cli` v2 and `@aptos-labs/aptos-client` v3
3. Build and TypeScript compilation targets raised from ES2020 to ES2022

## Breaking Changes

### Node.js Version Requirement

The minimum Node.js version has been raised from `>=20.0.0` to `>=22.0.0`.

**Action required:** Ensure your environment runs Node.js 22 or later.

```bash
node --version
# Must be v22.0.0 or higher
```

### Dependency Upgrades

The following Aptos dependencies have been upgraded to new major versions:

| Package | Previous | New |
|---------|----------|-----|
| `@aptos-labs/aptos-cli` | ^1.1.1 | ^2.0.0 |
| `@aptos-labs/aptos-client` | ^2.1.0 | ^3.0.1 |

These upgrades include improved tree shaking and configuration. If you directly depend on these packages, update them accordingly.

### Build Target Changes

The SDK now compiles to **ES2022** (previously ES2020). This means the output may use newer JavaScript features such as:

- Top-level `await`
- `Object.hasOwn()`
- `Array.prototype.at()`
- `Error.cause`

If you target older environments, ensure your bundler transpiles the SDK output as needed.

### TypeScript Module Resolution

The TypeScript `moduleResolution` has changed from `node` to `bundler`. This should not affect most consumers, but if you import from the SDK using deep paths, ensure your TypeScript configuration supports bundler-style resolution.

## Migration Steps

1. **Update Node.js** to v22 or later
2. **Update the SDK**: `npm install @aptos-labs/ts-sdk@7.0.0` (or pnpm/yarn equivalent)
3. **Check your bundler** supports ES2022 output, or configure it to transpile as needed
4. **Update direct dependencies** on `@aptos-labs/aptos-cli` or `@aptos-labs/aptos-client` if applicable
