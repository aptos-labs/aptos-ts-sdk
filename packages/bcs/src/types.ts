// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Variants of script transaction arguments used in Rust, encompassing various data types for transaction processing.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/transaction_argument.rs#L11}
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
}

/**
 * Type definitions for unsigned integers
 */
export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint64 = bigint;
export type Uint128 = bigint;
export type Uint256 = bigint;

/**
 * Any number type that can be used in BCS serialization
 */
export type AnyNumber = number | bigint;





