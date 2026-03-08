// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @module bcs
 *
 * Binary Canonical Serialization (BCS) module.
 *
 * Provides serialization and deserialization of Move primitive types and structs
 * for use in Aptos transactions and on-chain data encoding.
 *
 * Key exports:
 * - {@link Serializer} / {@link Deserializer} — low-level byte I/O
 * - {@link Serializable} / {@link Deserializable} — base types for custom structs
 * - Move primitives: {@link Bool}, {@link U8}, {@link U16}, {@link U32}, {@link U64},
 *   {@link U128}, {@link U256}, {@link I8}, {@link I16}, {@link I32}, {@link I64},
 *   {@link I128}, {@link I256}
 * - Move structs: {@link MoveVector}, {@link MoveOption}, {@link MoveString},
 *   {@link FixedBytes}, {@link EntryFunctionBytes}, {@link Serialized}
 * - Numeric bounds constants (e.g. {@link MAX_U64_BIG_INT}, {@link MIN_I8_NUMBER})
 */
export {
  MAX_I8_NUMBER,
  MAX_I16_NUMBER,
  MAX_I32_NUMBER,
  MAX_I64_BIG_INT,
  MAX_I128_BIG_INT,
  MAX_I256_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U128_BIG_INT,
  MAX_U256_BIG_INT,
  MIN_I8_NUMBER,
  MIN_I16_NUMBER,
  MIN_I32_NUMBER,
  MIN_I64_BIG_INT,
  MIN_I128_BIG_INT,
  MIN_I256_BIG_INT,
} from "./consts.js";
export { type Deserializable, Deserializer } from "./deserializer.js";
export { Bool, I8, I16, I32, I64, I128, I256, U8, U16, U32, U64, U128, U256 } from "./move-primitives.js";
export { EntryFunctionBytes, FixedBytes, MoveOption, MoveString, MoveVector, Serialized } from "./move-structs.js";
export {
  ensureBoolean,
  outOfRangeErrorMessage,
  Serializable,
  Serializer,
  validateNumberInRange,
} from "./serializer.js";
export type {
  AnyNumber,
  EntryFunctionArgument,
  HexInput,
  Int8,
  Int16,
  Int32,
  Int64,
  Int128,
  Int256,
  ScriptFunctionArgument,
  TransactionArgument,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "./types.js";
export { ScriptTransactionArgumentVariants } from "./types.js";
