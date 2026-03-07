// Aptos TypeScript SDK v10
// ESM-only, tree-shakeable, function-first

// Layer 0: Primitives
export * from "./bcs/index.js";
export * from "./hex/index.js";
export { VERSION } from "./version.js";

// Layer 1: Crypto
export * from "./crypto/index.js";

// Layer 2: Core
export * from "./core/index.js";

// Layer 3: Transactions
export * from "./transactions/index.js";

// Layer 4: Account
export * from "./account/index.js";

// Layer 5: Client
export * from "./client/index.js";

// Layer 6: API
export * from "./api/index.js";
