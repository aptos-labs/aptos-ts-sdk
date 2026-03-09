# Changelog

All notable changes to the Aptos TypeScript SDK are documented in this file.

## 10.0.0

A ground-up rewrite of the Aptos TypeScript SDK. See [MIGRATION.md](./MIGRATION.md) for upgrade instructions.

### Breaking Changes

- **ESM-only module format.** The SDK is now a pure ES module (`"type": "module"`). CJS consumers must use the `/compat` subpath or dynamic `import()`. Browser bundles (`dist/browser/`) are no longer shipped — modern bundlers handle ESM natively.

- **Node.js >= 22.1.2 required.** The minimum Node.js version is now 22.1.2 (for native ESM support and `require(esm)` compatibility in the compat layer).

- **Noble/Scure v2 cryptography.** Upgraded to `@noble/curves@^2.0.1`, `@noble/hashes@^2.0.1`, `@scure/bip32@^2.0.1`, and `@scure/bip39@^2.0.1`. These are breaking if you import from Noble/Scure directly (changed import paths and API surface).

- **Account factory functions replace static methods.** `Account.generate()`, `Account.fromPrivateKey()`, and `Account.fromDerivationPath()` are now standalone functions: `generateAccount()`, `accountFromPrivateKey()`, `accountFromDerivationPath()`.

- **Namespace-first API.** The `Aptos` class no longer exposes flat methods via mixins. Instead, methods are organized under namespace objects:
  - `aptos.getAccountInfo(...)` → `aptos.account.getInfo(...)`
  - `aptos.transaction.build.simple(...)` → `aptos.transaction.buildSimple(...)`
  - `aptos.transaction.sign(...)` → `aptos.transaction.sign(...)` (unchanged)
  - `aptos.transaction.submit.simple(...)` → `aptos.transaction.submit(...)`
  - `aptos.fundAccount(...)` → `aptos.faucet.fund(...)`
  - `aptos.waitForTransaction(...)` → `aptos.transaction.waitForTransaction(...)`
  - `aptos.view(...)` → `aptos.general.view(...)`

- **Positional arguments.** Namespace methods and standalone functions use positional arguments instead of a single `{ ... }` options object. For example:
  - v6: `aptos.getAccountInfo({ accountAddress: "0x1" })`
  - v10: `aptos.account.getInfo("0x1")`

- **`AptosConfig` constructor accepts settings directly.** The `Aptos` constructor now accepts an `AptosSettings` object directly (no need to wrap in `new AptosConfig()`):
  - v6: `new Aptos(new AptosConfig({ network: Network.TESTNET }))`
  - v10: `new Aptos({ network: Network.TESTNET })`

- **`AptosApiError` restructured.** Error fields have been reorganized. The `data` field structure may differ from v6.

- **`AptosConfig.client` redesigned.** The v6 `client` property (which accepted a provider object) has been replaced with a new `Client` interface. The new interface has a single `sendRequest()` method. See the "Custom HTTP Client" section in the README.

- **`TransactionGenerationConfig` removed.** Transaction options are now passed directly to `buildSimple()` via the `options` parameter.

- **`InputGenerateTransactionOptions.accountSequenceNumber` → `sequenceNumber`.** The field was renamed in v10's `BuildSimpleTransactionOptions`.

### Added

- **Subpath exports.** 10 subpath exports for tree-shakeable, targeted imports: `./bcs`, `./hex`, `./crypto`, `./core`, `./transactions`, `./account`, `./client`, `./api`, `./compat`.

- **`AptosSettings` shorthand.** Pass a plain settings object directly to the `Aptos` constructor instead of wrapping in `AptosConfig`.

- **`signAndSubmitTransaction()`.** Combined sign + submit in a single function call — both as a namespace method (`aptos.transaction.signAndSubmit()`) and standalone function.

- **Long-poll `waitForTransaction()`.** Uses server-side long polling for faster confirmation detection.

- **`paginateWithObfuscatedCursor()`.** Pagination helper for APIs that use opaque cursor tokens instead of numeric offsets.

- **Signed integer BCS types.** `I8`, `I16`, `I32`, `I64`, `I128`, `I256` with bounds checking and proper two's complement serialization.

- **`AccountAddress.isSpecial()` and `AccountAddress.A`.** Check if an address is a special short address; `.A` is a constant for the `0xa` address.

- **`Network.SHELBYNET` and `Network.NETNA`.** New network enum values with preconfigured endpoint URLs.

- **`APTOS_FA` constant.** The fungible asset metadata address for the native APT token (`0xa`).

- **`SingleKeyAccount.fromEd25519Account()`.** Convert a legacy Ed25519 account to SingleKey format.

- **Type guard functions.** `isSingleKeySigner()`, `isKeylessSigner()`, `isPendingTransactionResponse()`, `isUserTransactionResponse()`.

- **`KeylessError` taxonomy.** Structured error categories for Keyless authentication failures via `KeylessErrorCategory`.

- **`ProcessorType` enum.** Indexer processor type constants for filtering processor status.

- **`Serializer` pool.** Internal pooling for `Serializer` instances to reduce allocations in hot paths.

- **Compatibility layer (`/compat`).** Full v6-style flat API on top of v10, with CJS support via `require()`. Enables gradual migration.

- **Custom HTTP client (`Client` interface).** `AptosConfig` now accepts a `client` option to replace the default `@aptos-labs/aptos-client` transport. Implement `Client.sendRequest()` to add custom auth, proxies, logging, or use an alternative HTTP library.

- **`http2` client config.** Explicit `http2: boolean` option in `ClientConfig` (defaults to `true` in Node.js). Uses `@aptos-labs/aptos-client` for HTTP/2 transport.

- **`createConfig()` factory.** Functional alternative to `new AptosConfig()`.

### Security

- **TypeTag deserialization depth limit.** Added a recursion depth limit (128) to `TypeTag.deserialize()` to prevent stack overflow DoS from deeply nested `vector<vector<...>>` payloads. `StructTag.deserialize` correctly increments depth for type arguments and caps count at 32.

- **MultiKeySignature bitmap validation.** `MultiKeySignature.deserialize()` now validates the bitmap is exactly 4 bytes before constructing the object.

- **WebAuthnSignature field size limits.** `WebAuthnSignature.deserialize()` now enforces size limits on all fields: `signature` (128 bytes), `authenticatorData` (2 KB), and `clientDataJSON` (4 KB).

- **MultiSigTransactionPayload variant validation.** `MultiSigTransactionPayload.deserialize()` now validates the variant index instead of silently discarding it.

- **Secondary signer vector bounds.** Multi-agent and fee-payer transaction deserializers cap secondary signer vectors at 255 elements (matching on-chain limits).

- **bytesToBigIntLE lookup table.** Pre-computed 256-element byte-to-bigint lookup table avoids per-byte BigInt allocations in the Poseidon hash path.

### Performance

- **Serializer single BigInt conversion.** `serializeU64`, `serializeU128`, and `serializeU256` now call `BigInt(value)` once instead of 2–4 times per invocation.

- **Deserializer DataView singleton.** `Deserializer` now creates a single `DataView` at construction time instead of allocating a new one per `deserializeU16/U32/I8/I16/I32` call.

- **TypeTag and StructTag singletons.** `TypeTagVector.u8()`, `aptosCoinStructTag()`, and `stringStructTag()` return cached singleton instances instead of allocating new objects per call.

- **AccountAddress.toStringWithoutPrefix fast path.** Special addresses (`0x0`–`0xf`) skip the full 32-byte hex encoding and return immediately.

### Changed

- **Composition over mixins.** The `Aptos` class uses composition with namespace objects (`GeneralAPI`, `AccountAPI`, `TransactionAPI`, `CoinAPI`, `FaucetAPI`, `TableAPI`) instead of mixin-based class hierarchies.

- **Crypto, Hex, and BCS promoted to top-level subpaths.** These were internal modules in v6 — now they are first-class subpath exports importable independently.

- **Internal queries inlined.** The `src/internal/` directory and generated query layer are removed; API functions call HTTP endpoints directly.

- **Biome replaces ESLint + Prettier.** Linting and formatting are handled by Biome (`pnpm check`, `pnpm fmt`).

- **Vitest replaces Jest.** Test runner migrated to Vitest with faster execution and native ESM support.

- **Plain `tsc` build.** No bundler — TypeScript compiles directly to `dist/esm/` and `dist/types/`.

### Removed

- **CJS output.** No `dist/cjs/` directory. The only CJS entry point is `/compat` via a thin wrapper.

- **Browser bundle.** No `dist/browser/index.global.js`. Use a bundler (Vite, esbuild, webpack) with the ESM output.

- **`Account.generate()`, `Account.fromPrivateKey()`, `Account.fromDerivationPath()` static methods.** Replaced by `generateAccount()`, `accountFromPrivateKey()`, `accountFromDerivationPath()`.

- **`AptosConfig.client` (v6 shape).** The v6 `client` property is replaced by a new `Client` interface with a `sendRequest()` method.

- **`TransactionGenerationConfig` type.** Options are passed directly to transaction building functions.

- **`src/internal/` directory.** Internal query abstractions removed; API functions are self-contained.

- **ANS, Digital Asset, Fungible Asset, Staking namespaces.** These domain-specific APIs are not yet ported to v10. Use the v6 SDK or `/compat` for these features in the interim.

- **`transaction.build.simple()` / `transaction.submit.simple()` sub-objects.** Replaced by `transaction.buildSimple()` and `transaction.submit()` directly. The compat layer still provides the v6 `transaction.build.simple()` shape.
