// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Fp2, Fp6, Fp12 } from "@noble/curves/abstract/tower.js";

const BIGINT_SIZE = 48;
const FP2_SIZE = 2 * BIGINT_SIZE;
const FP6_SIZE = 3 * FP2_SIZE;
const FP12_SIZE = 2 * FP6_SIZE;

export function bigintToLEBytesInternal(val: bigint, numBytes: number): Uint8Array {
  const ret: number[] = [];
  let v = val;
  for (let i = 0; i < numBytes; i++) {
    ret.push(Number(BigInt.asUintN(8, v)));
    v >>= 8n;
  }
  return Uint8Array.from(ret);
}

export function bigintToLEBytesFr(val: bigint): Uint8Array {
  return bigintToLEBytesInternal(val, 32);
}

export function bigintToLEBytesFq(val: bigint): Uint8Array {
  return bigintToLEBytesInternal(val, 48);
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
  const ret = new Uint8Array(FP12_SIZE);
  ret.set(fp6ToLEBytes(val.c0));
  ret.set(fp6ToLEBytes(val.c1), FP6_SIZE);
  return ret;
}

export function leBytesToFp2(bytes: Uint8Array): Fp2 {
  return {
    c0: leBytesToBigint(bytes.slice(0, BIGINT_SIZE)),
    c1: leBytesToBigint(bytes.slice(BIGINT_SIZE, FP2_SIZE)),
  };
}

export function leBytesToFp6(bytes: Uint8Array): Fp6 {
  return {
    c0: leBytesToFp2(bytes.slice(0, FP2_SIZE)),
    c1: leBytesToFp2(bytes.slice(FP2_SIZE, 2 * FP2_SIZE)),
    c2: leBytesToFp2(bytes.slice(2 * FP2_SIZE, FP6_SIZE)),
  };
}

export function leBytesToFp12(bytes: Uint8Array): Fp12 {
  if (bytes.length !== FP12_SIZE) {
    throw new Error(`Expected ${FP12_SIZE} bytes for Fp12, got ${bytes.length}`);
  }
  return {
    c0: leBytesToFp6(bytes.slice(0, FP6_SIZE)),
    c1: leBytesToFp6(bytes.slice(FP6_SIZE, FP12_SIZE)),
  };
}
