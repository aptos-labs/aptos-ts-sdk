// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../types";

// Upper bound values for uint8, uint16, uint64 and uint128
export const MAX_U8_NUMBER: Uint8 = 255;
export const MAX_U16_NUMBER: Uint16 = 65535;
export const MAX_U32_NUMBER: Uint32 = 4294967295;
export const MAX_U64_BIG_INT: Uint64 = BigInt("18446744073709551615");
export const MAX_U128_BIG_INT: Uint128 = BigInt("340282366920938463463374607431768211455");
export const MAX_U256_BIG_INT: Uint256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);
