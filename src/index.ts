// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// NOTE: Standalone functions are NOT re-exported from the barrel to avoid circular
// dependency issues. Import from '@aptos-labs/ts-sdk/functions' or sub-path exports.

// ---- Configuration ----
export * from "./api/aptosConfig";

// ---- Deprecated Aptos class (compat layer) ----
export { Aptos } from "./api/aptos";

// ---- Account classes (without keyless — import keyless from sub-paths) ----
export * from "./account";

// ---- Core primitives (without keyless/poseidon/hdKey) ----
export * from "./core";

// ---- BCS serialization ----
export * from "./bcs";

// ---- HTTP client ----
export * from "./client";

// ---- Errors ----
export * from "./errors";

// ---- Transactions ----
export * from "./transactions";
export * from "./transactions/management";

// ---- Types ----
export * from "./types";

// ---- Utils ----
export * from "./utils";
