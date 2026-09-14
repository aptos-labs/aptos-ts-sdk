// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// NOTE: Standalone functions are NOT re-exported from the barrel to avoid
// circular dependency issues and to keep the main entry tree-shakeable. Import
// them from their per-namespace sub-path exports instead — e.g.
// `@aptos-labs/ts-sdk/general`, `@aptos-labs/ts-sdk/account`,
// `@aptos-labs/ts-sdk/keyless` (see `package.json#exports` for the full list).

// ---- Configuration ----
export * from "./api/aptosConfig.js";

// ---- Aptos class (convenience, not tree-shakeable — see sub-path imports) ----
export { Aptos } from "./api/aptos.js";

// ---- Account classes (without keyless — import keyless from sub-paths) ----
export * from "./account/index.js";

// ---- Core primitives (without keyless/poseidon/hdKey) ----
export * from "./core/index.js";

// ---- BCS serialization ----
export * from "./bcs/index.js";

// ---- HTTP client ----
export * from "./client/index.js";

// ---- Errors ----
export * from "./errors/index.js";

// ---- Transactions ----
export * from "./transactions/index.js";
export * from "./transactions/management/index.js";

// ---- Types ----
export * from "./types/index.js";

// ---- Utils ----
export * from "./utils/index.js";
