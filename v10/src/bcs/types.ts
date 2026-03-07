// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Hex } from "../hex/hex.js";
import type { Serializer } from "./serializer.js";

// ── Numeric type aliases ──

export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint64 = bigint;
export type Uint128 = bigint;
export type Uint256 = bigint;

export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type Int64 = bigint;
export type Int128 = bigint;
export type Int256 = bigint;

export type AnyNumber = number | bigint;

/** Hex string or raw bytes. Re-exported from hex module for convenience. */
export type { HexInput } from "../hex/hex.js";

// ── Transaction argument interfaces ──
// These define how BCS values are serialized in different transaction contexts.

export interface TransactionArgument extends EntryFunctionArgument, ScriptFunctionArgument {}

export interface EntryFunctionArgument {
  serialize(serializer: Serializer): void;
  serializeForEntryFunction(serializer: Serializer): void;
  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}

export interface ScriptFunctionArgument {
  serialize(serializer: Serializer): void;
  serializeForScriptFunction(serializer: Serializer): void;
  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}

// ── Variant enums for script transaction arguments ──

export enum ScriptTransactionArgumentVariants {
  U8 = 0,
  U64 = 1,
  U128 = 2,
  Address = 3,
  U8Vector = 4,
  Bool = 5,
  U16 = 6,
  U32 = 7,
  U256 = 8,
  Serialized = 9,
  I8 = 10,
  I16 = 11,
  I32 = 12,
  I64 = 13,
  I128 = 14,
  I256 = 15,
}
