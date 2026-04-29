// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Fp2, Fp6, Fp12 } from "@noble/curves/abstract/tower.js";

const BIGINT_SIZE = 48;
const FP2_SIZE = 2 * BIGINT_SIZE;
const FP6_SIZE = 3 * FP2_SIZE;

export function bigintToLEBytes(val: bigint, numBytes: number): Uint8Array {
  const ret: number[] = [];
  let v = val;
  for (let i = 0; i < numBytes; i++) {
    ret.push(Number(BigInt.asUintN(8, v)));
    v >>= 8n;
  }
  return Uint8Array.from(ret);
}

export function bigintToLEBytesFr(val: bigint): Uint8Array {
  return bigintToLEBytes(val, 32);
}

export function bigintToLEBytesFq(val: bigint): Uint8Array {
  return bigintToLEBytes(val, 48);
}

export function leBytesToBigint(bytes: Uint8Array): bigint {
  let ret = 0n;
  for (let i = 0; i < bytes.length; i++) {
    ret += BigInt(bytes[i]) << (BigInt(i) * 8n);
  }
  return ret;
}

export function fp2ToLEBytes(val: Fp2): Uint8Array {
  const ret = new Uint8Array(FP2_SIZE);
  ret.set(bigintToLEBytesFq(val.c0));
  ret.set(bigintToLEBytesFq(val.c1), BIGINT_SIZE);
  return ret;
}

export function fp6ToLEBytes(val: Fp6): Uint8Array {
  const ret = new Uint8Array(FP6_SIZE);
  ret.set(fp2ToLEBytes(val.c0));
  ret.set(fp2ToLEBytes(val.c1), FP2_SIZE);
  ret.set(fp2ToLEBytes(val.c2), 2 * FP2_SIZE);
  return ret;
}

export function fp12ToLEBytes(val: Fp12): Uint8Array {
  const ret = new Uint8Array(2 * FP6_SIZE);
  ret.set(fp6ToLEBytes(val.c0));
  ret.set(fp6ToLEBytes(val.c1), FP6_SIZE);
  return ret;
}
