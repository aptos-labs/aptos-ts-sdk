// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Fp2 } from "@noble/curves/abstract/tower.js";
import type { WeierstrassPoint, WeierstrassPointCons } from "@noble/curves/abstract/weierstrass.js";
import { bls12_381 } from "@noble/curves/bls12-381.js";

export const G1_SIZE = 48;
export const G2_SIZE = 96;

/** Evaluates the short Weierstrass curve equation `x³ + a·x + b` at `x` over the field of `p`. */
export function weierstrassEquation<T>(x: T, p: WeierstrassPointCons<T>): T {
  const x2 = p.Fp.sqr(x);
  const x3 = p.Fp.mul(x2, x);
  return p.Fp.add(p.Fp.add(x3, p.Fp.mul(x, p.CURVE().a)), p.CURVE().b);
}

export function g1ToBytes(p: WeierstrassPoint<bigint>): Uint8Array {
  return p.toBytes(true);
}

/**
 * Compressed-G1 deserializer with prime-order subgroup check, matching aptos-core `ts-batch-encrypt`.
 */
export function bytesToG1(bytes: Uint8Array): WeierstrassPoint<bigint> {
  const p = bls12_381.G1.Point.fromBytes(bytes);
  if (!p.isTorsionFree()) {
    throw new Error("Tried to deserialize invalid group element: not torsion free");
  }
  return p;
}

export function g2ToBytes(p: WeierstrassPoint<Fp2>): Uint8Array {
  return p.toBytes(true);
}

/**
 * Compressed-G2 deserializer with prime-order subgroup check, matching aptos-core `ts-batch-encrypt`.
 */
export function bytesToG2(bytes: Uint8Array): WeierstrassPoint<Fp2> {
  const p = bls12_381.G2.Point.fromBytes(bytes);
  if (!p.isTorsionFree()) {
    throw new Error("Tried to deserialize invalid group element: not torsion free");
  }
  return p;
}
