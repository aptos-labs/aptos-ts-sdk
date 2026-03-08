// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Hex } from "../hex/hex.js";
import type { Serializer } from "./serializer.js";

// ── Numeric type aliases ──

/** An unsigned 8-bit integer (0 to 255). Represented as a JavaScript `number`. */
export type Uint8 = number;
/** An unsigned 16-bit integer (0 to 65535). Represented as a JavaScript `number`. */
export type Uint16 = number;
/** An unsigned 32-bit integer (0 to 4,294,967,295). Represented as a JavaScript `number`. */
export type Uint32 = number;
/** An unsigned 64-bit integer. Represented as a JavaScript `bigint` due to its size. */
export type Uint64 = bigint;
/** An unsigned 128-bit integer. Represented as a JavaScript `bigint`. */
export type Uint128 = bigint;
/** An unsigned 256-bit integer. Represented as a JavaScript `bigint`. */
export type Uint256 = bigint;

/** A signed 8-bit integer (-128 to 127). Represented as a JavaScript `number`. */
export type Int8 = number;
/** A signed 16-bit integer (-32768 to 32767). Represented as a JavaScript `number`. */
export type Int16 = number;
/** A signed 32-bit integer (-2,147,483,648 to 2,147,483,647). Represented as a JavaScript `number`. */
export type Int32 = number;
/** A signed 64-bit integer. Represented as a JavaScript `bigint` due to its size. */
export type Int64 = bigint;
/** A signed 128-bit integer. Represented as a JavaScript `bigint`. */
export type Int128 = bigint;
/** A signed 256-bit integer. Represented as a JavaScript `bigint`. */
export type Int256 = bigint;

/** A value that can be either a JavaScript `number` or `bigint`. Used for numeric BCS serialization methods that accept both. */
export type AnyNumber = number | bigint;

/** Hex string or raw bytes. Re-exported from hex module for convenience. */
export type { HexInput } from "../hex/hex.js";

// ── Transaction argument interfaces ──
// These define how BCS values are serialized in different transaction contexts.

/**
 * A value that can be used as an argument in both entry functions and script functions.
 * Combines {@link EntryFunctionArgument} and {@link ScriptFunctionArgument}.
 */
export interface TransactionArgument extends EntryFunctionArgument, ScriptFunctionArgument {}

/**
 * A value that can be serialized as an argument to an entry function transaction.
 * Entry function arguments are BCS-encoded and length-prefixed.
 */
export interface EntryFunctionArgument {
  /** Serializes the value using standard BCS encoding. */
  serialize(serializer: Serializer): void;
  /**
   * Serializes the value in the format required for entry function arguments,
   * which wraps the BCS bytes with a ULEB128-encoded length prefix.
   * @param serializer - The serializer to write to.
   */
  serializeForEntryFunction(serializer: Serializer): void;
  /** Returns the BCS-encoded bytes for this value. */
  bcsToBytes(): Uint8Array;
  /** Returns the BCS-encoded bytes as a {@link Hex} object. */
  bcsToHex(): Hex;
}

/**
 * A value that can be serialized as an argument to a script function transaction.
 * Script function arguments are BCS-encoded and tagged with a variant enum.
 */
export interface ScriptFunctionArgument {
  /** Serializes the value using standard BCS encoding. */
  serialize(serializer: Serializer): void;
  /**
   * Serializes the value in the format required for script function arguments,
   * which prepends a ULEB128-encoded variant tag from {@link ScriptTransactionArgumentVariants}.
   * @param serializer - The serializer to write to.
   */
  serializeForScriptFunction(serializer: Serializer): void;
  /** Returns the BCS-encoded bytes for this value. */
  bcsToBytes(): Uint8Array;
  /** Returns the BCS-encoded bytes as a {@link Hex} object. */
  bcsToHex(): Hex;
}

// ── Variant enums for script transaction arguments ──

/**
 * Variant discriminants used when encoding Move values as script transaction arguments.
 * Each value is prepended as a ULEB128 tag to identify the type of the following argument.
 */
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
