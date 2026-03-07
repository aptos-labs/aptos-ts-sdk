// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// ── Variant enums for transaction payloads ──

export enum TransactionPayloadVariants {
  Script = 0,
  // Deprecated: ModuleBundle = 1,
  EntryFunction = 2,
  Multisig = 3,
  Payload = 4,
}

export enum TransactionInnerPayloadVariants {
  V1 = 0,
}

export enum TransactionExecutableVariants {
  Script = 0,
  EntryFunction = 1,
  Empty = 2,
}

export enum TransactionExtraConfigVariants {
  V1 = 0,
}

// ── Variant enums for raw transaction with data ──

export enum TransactionVariants {
  MultiAgentTransaction = 0,
  FeePayerTransaction = 1,
}

// ── Variant enums for authenticators ──

export enum TransactionAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  MultiAgent = 2,
  FeePayer = 3,
  SingleSender = 4,
}

export enum AccountAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
  NoAccountAuthenticator = 4,
  Abstraction = 5,
}

// ── Variant enums for account abstraction ──

export enum AbstractAuthenticationDataVariant {
  V1 = 0,
  DerivableV1 = 1,
}

export enum AASigningDataVariant {
  V1 = 0,
}

// ── Type aliases used in transaction APIs ──

export type MoveModuleId = `${string}::${string}`;
export type MoveStructId = `${string}::${string}::${string}`;
export type MoveFunctionId = MoveStructId;

// ── Aggregate transaction types ──

import type { MultiAgentTransaction } from "./multi-agent-transaction.js";
import type { FeePayerRawTransaction, MultiAgentRawTransaction, RawTransaction } from "./raw-transaction.js";
import type { SimpleTransaction } from "./simple-transaction.js";

export type AnyRawTransaction = SimpleTransaction | MultiAgentTransaction;
export type AnyRawTransactionInstance = RawTransaction | MultiAgentRawTransaction | FeePayerRawTransaction;
