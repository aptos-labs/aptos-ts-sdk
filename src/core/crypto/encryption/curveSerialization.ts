// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Fp2 } from "@noble/curves/abstract/tower";
import type { WeierstrassPoint } from "@noble/curves/abstract/weierstrass";
import { bls12_381 } from "@noble/curves/bls12-381";

export const G1_SIZE = 48;
export const G2_SIZE = 96;

export function g2ToBytes(p: WeierstrassPoint<Fp2>): Uint8Array {
  return p.toBytes(true);
}

/**
 * Deserialize a G2 point from compressed encoding. Matches aptos-core
 * `ts-batch-encrypt`: reject points not in the prime-order subgroup.
 */
export function bytesToG2(bytes: Uint8Array): WeierstrassPoint<Fp2> {
  const p = bls12_381.G2.Point.fromBytes(bytes);
  if (!p.isTorsionFree()) {
    throw new Error("Tried to deserialize invalid group element: not torsion free");
  }
  return p;
}

export function g1ToBytes(p: WeierstrassPoint<bigint>): Uint8Array {
  return p.toBytes(true);
}

/**
 * Deserialize a G1 point from compressed encoding; subgroup check matches aptos-core `ts-batch-encrypt`.
 */
export function bytesToG1(bytes: Uint8Array): WeierstrassPoint<bigint> {
  const p = bls12_381.G1.Point.fromBytes(bytes);
  if (!p.isTorsionFree()) {
    throw new Error("Tried to deserialize invalid group element: not torsion free");
  }
  return p;
}
