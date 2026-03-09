// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type {
  Int8,
  Int16,
  Int32,
  Int64,
  Int128,
  Int256,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "./types.js";

// Unsigned integer upper bounds (2^N - 1)
export const MAX_U8_NUMBER: Uint8 = 255;
export const MAX_U16_NUMBER: Uint16 = 65535;
export const MAX_U32_NUMBER: Uint32 = 4294967295;
export const MAX_U64_BIG_INT: Uint64 = 18446744073709551615n;
export const MAX_U128_BIG_INT: Uint128 = 340282366920938463463374607431768211455n;
export const MAX_U256_BIG_INT: Uint256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

// Signed integer bounds
export const MIN_I8_NUMBER: Int8 = -128;
export const MAX_I8_NUMBER: Int8 = 127;
export const MIN_I16_NUMBER: Int16 = -32768;
export const MAX_I16_NUMBER: Int16 = 32767;
export const MIN_I32_NUMBER: Int32 = -2147483648;
export const MAX_I32_NUMBER: Int32 = 2147483647;
export const MIN_I64_BIG_INT: Int64 = -9223372036854775808n;
export const MAX_I64_BIG_INT: Int64 = 9223372036854775807n;
export const MIN_I128_BIG_INT: Int128 = -170141183460469231731687303715884105728n;
export const MAX_I128_BIG_INT: Int128 = 170141183460469231731687303715884105727n;
export const MIN_I256_BIG_INT: Int256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
export const MAX_I256_BIG_INT: Int256 = 57896044618658097711785492504343953926634992332820282019728792003956564819967n;

// Cached BigInt constants for hot serialization/deserialization paths
export const BIGINT_0 = 0n;
export const BIGINT_1 = 1n;
export const BIGINT_32 = 32n;
export const BIGINT_63 = 63n;
export const BIGINT_64 = 64n;
export const BIGINT_127 = 127n;
export const BIGINT_128 = 128n;
export const BIGINT_255 = 255n;
export const BIGINT_256 = 256n;
export const BIGINT_MAX_U32 = BigInt(MAX_U32_NUMBER);
