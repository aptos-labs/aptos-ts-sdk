// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Public API surface for the Aptos transactions module.
 *
 * Re-exports all transaction-related types, classes, and functions used to build, sign,
 * and submit transactions to the Aptos blockchain:
 *
 * - **Authenticators** – {@link AccountAuthenticator} and {@link TransactionAuthenticator}
 *   subclasses that prove authorization.
 * - **Chain ID** – {@link ChainId} wrapper used inside raw transactions.
 * - **Module ID** – {@link ModuleId} used inside entry function descriptors.
 * - **Transaction wrappers** – {@link SimpleTransaction} and {@link MultiAgentTransaction}.
 * - **Raw transactions** – {@link RawTransaction}, {@link MultiAgentRawTransaction}, and
 *   {@link FeePayerRawTransaction}.
 * - **Signed transaction** – {@link SignedTransaction} combining raw transaction and authenticator.
 * - **Signing message utilities** – {@link generateSigningMessageForTransaction} and helpers.
 * - **Transaction payloads** – {@link EntryFunction}, {@link Script}, {@link MultiSig}, and
 *   all payload wrapper types.
 * - **Type aliases and enums** – {@link MoveModuleId}, {@link MoveStructId},
 *   {@link MoveFunctionId}, {@link AnyRawTransaction}, and all variant enums.
 */
export * from "./authenticator.js";
export * from "./chain-id.js";
export * from "./module-id.js";
export * from "./multi-agent-transaction.js";
export * from "./raw-transaction.js";
export * from "./signed-transaction.js";
export * from "./signing-message.js";
export * from "./simple-transaction.js";
export * from "./transaction-payload.js";
export * from "./types.js";
