// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// NOTE: Standalone functions are NOT re-exported from the barrel to avoid circular
// dependency issues. Import from '@aptos-labs/ts-sdk/functions' or sub-path exports.

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
