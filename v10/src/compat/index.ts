// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// v6-compatible barrel export
// Import from "@aptos-labs/ts-sdk/compat" to use v6-style API.
//
// Usage:
//   import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk/compat";
//   const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
//   const info = await aptos.getAccountInfo({ accountAddress: "0x1" });

// ── Compat Aptos class (v6-style flat methods) ──
export { Aptos } from "./aptos.js";

// ── v6 parameter types ──
export type * from "./types.js";

// ── Re-export everything from v10 ──

export * from "../account/index.js";
export {
  getAccountInfo,
  getAccountModule,
  getAccountModules,
  getAccountResource,
  getAccountResources,
  getAccountTransactions,
} from "../api/account.js";
export { transferCoinTransaction } from "../api/coin.js";
// Config
export { AptosConfig, type AptosSettings, createConfig } from "../api/config.js";
export { fundAccount } from "../api/faucet.js";
// Standalone API functions (for users who used them directly)
export {
  getBlockByHeight,
  getBlockByVersion,
  getChainId,
  getGasPriceEstimation,
  getLedgerInfo,
  view,
} from "../api/general.js";
export { getTableItem } from "../api/table.js";
export type { BuildSimpleTransactionOptions } from "../api/transaction.js";
export {
  buildSimpleTransaction,
  getSigningMessage,
  getTransactionByHash,
  getTransactionByVersion,
  getTransactions,
  signAndSubmitTransaction,
  signTransaction,
  submitTransaction,
  waitForTransaction,
} from "../api/transaction.js";

// API types
export * from "../api/types.js";
// Layers 0-5: All primitives, crypto, core, transactions, account, client
export * from "../bcs/index.js";
export * from "../client/index.js";
export * from "../core/index.js";
export * from "../crypto/index.js";
export * from "../hex/index.js";
export * from "../transactions/index.js";
export { VERSION } from "../version.js";
