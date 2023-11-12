// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Upper bound values for u8, u16, u32, u64, u128, and u256
export const MAX_U8_NUMBER: number = 2 ** 8 - 1;
export const MAX_U16_NUMBER: number = 2 ** 16 - 1;
export const MAX_U32_NUMBER: number = 2 ** 32 - 1;
export const MAX_U64_BIG_INT: bigint = BigInt(2) ** BigInt(64) - BigInt(1);
export const MAX_U128_BIG_INT: bigint = BigInt(2) ** BigInt(128) - BigInt(1);
export const MAX_U256_BIG_INT: bigint = BigInt(2) ** BigInt(256) - BigInt(1);
