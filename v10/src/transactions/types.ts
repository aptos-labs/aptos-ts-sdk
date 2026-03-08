// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// ── Variant enums for transaction payloads ──

/**
 * Discriminant values used to identify the variant of a serialized {@link TransactionPayload}.
 *
 * These numeric constants are written as ULEB128-encoded prefix bytes during BCS serialization
 * and are read back during deserialization to select the correct concrete payload type.
 */
export enum TransactionPayloadVariants {
  Script = 0,
  // Deprecated: ModuleBundle = 1,
  EntryFunction = 2,
  Multisig = 3,
  Payload = 4,
}

/**
 * Discriminant values for versioned inner payload types used in orderless transactions.
 *
 * Currently only `V1` is defined.
 */
export enum TransactionInnerPayloadVariants {
  V1 = 0,
}

/**
 * Discriminant values for the executable portion of an orderless transaction payload.
 *
 * Identifies whether the payload executes a {@link Script}, an {@link EntryFunction},
 * or carries no executable content (`Empty`).
 */
export enum TransactionExecutableVariants {
  Script = 0,
  EntryFunction = 1,
  Empty = 2,
}

/**
 * Discriminant values for the extra configuration attached to an orderless transaction payload.
 *
 * Currently only `V1` is defined.
 */
export enum TransactionExtraConfigVariants {
  V1 = 0,
}

// ── Variant enums for raw transaction with data ──

/**
 * Discriminant values used to identify whether a raw transaction carries additional signer data.
 *
 * - `MultiAgentTransaction` – the transaction has one or more secondary signers.
 * - `FeePayerTransaction` – the transaction has a designated fee payer account.
 */
export enum TransactionVariants {
  MultiAgentTransaction = 0,
  FeePayerTransaction = 1,
}

// ── Variant enums for authenticators ──

/**
 * Discriminant values for the top-level transaction authenticator variants.
 *
 * Written as a ULEB128 prefix during BCS serialization of a {@link TransactionAuthenticator}
 * subclass.
 */
export enum TransactionAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  MultiAgent = 2,
  FeePayer = 3,
  SingleSender = 4,
}

/**
 * Discriminant values for the per-account authenticator variants.
 *
 * Written as a ULEB128 prefix during BCS serialization of an {@link AccountAuthenticator}
 * subclass.
 */
export enum AccountAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
  NoAccountAuthenticator = 4,
  Abstraction = 5,
}

// ── Variant enums for account abstraction ──

/**
 * Discriminant values for the abstract authentication data format.
 *
 * - `V1` – standard abstraction where the authenticating function is fully specified.
 * - `DerivableV1` – derivable abstraction that additionally carries an account identity payload.
 */
export enum AbstractAuthenticationDataVariant {
  V1 = 0,
  DerivableV1 = 1,
}

/**
 * Discriminant values for the account-abstraction signing data wrapper.
 *
 * Currently only `V1` is defined.
 */
export enum AASigningDataVariant {
  V1 = 0,
}

// ── Type aliases used in transaction APIs ──

/**
 * A fully-qualified Move module identifier in the form `<address>::<module>`.
 *
 * @example
 * ```typescript
 * const moduleId: MoveModuleId = "0x1::coin";
 * ```
 */
export type MoveModuleId = `${string}::${string}`;

/**
 * A fully-qualified Move struct identifier in the form `<address>::<module>::<struct>`.
 *
 * @example
 * ```typescript
 * const structId: MoveStructId = "0x1::coin::CoinStore";
 * ```
 */
export type MoveStructId = `${string}::${string}::${string}`;

/**
 * A fully-qualified Move function identifier in the form `<address>::<module>::<function>`.
 *
 * This is a type alias for {@link MoveStructId} because Move function identifiers share the
 * same three-part `address::module::name` structure.
 *
 * @example
 * ```typescript
 * const functionId: MoveFunctionId = "0x1::coin::transfer";
 * ```
 */
export type MoveFunctionId = MoveStructId;

// ── Aggregate transaction types ──

import type { MultiAgentTransaction } from "./multi-agent-transaction.js";
import type { FeePayerRawTransaction, MultiAgentRawTransaction, RawTransaction } from "./raw-transaction.js";
import type { SimpleTransaction } from "./simple-transaction.js";

/**
 * Union of the two high-level transaction wrappers that the SDK works with.
 *
 * - {@link SimpleTransaction} – single-sender transaction, optionally with a fee payer.
 * - {@link MultiAgentTransaction} – transaction with one or more secondary signers.
 */
export type AnyRawTransaction = SimpleTransaction | MultiAgentTransaction;

/**
 * Union of the low-level BCS-serializable raw transaction types.
 *
 * - {@link RawTransaction} – plain single-sender transaction bytes.
 * - {@link MultiAgentRawTransaction} – bytes with secondary signer addresses appended.
 * - {@link FeePayerRawTransaction} – bytes with secondary signer addresses and fee payer address appended.
 */
export type AnyRawTransactionInstance = RawTransaction | MultiAgentRawTransaction | FeePayerRawTransaction;
