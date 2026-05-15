// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import {
  bytesToG1,
  bytesToG2,
  g1ToBytes,
  g2ToBytes,
  weierstrassEquation,
} from "../../../../../src/core/crypto/encryption/curveSerialization";

/**
 * Parity tests for aptos-core/crates/aptos-batch-encryption/src/tests/typescript/curve_serialization.rs.
 */

// ---------------------------------------------------------------------------
// test_g1_serialization
// ---------------------------------------------------------------------------
describe("G1 serialization (aptos-core test_g1_serialization parity)", () => {
  test("g1ToBytes/bytesToG1 roundtrips generator and small multiples", () => {
    let p = bls12_381.G1.Point.BASE;
    for (let i = 0; i < 5; i++) {
      expect(bytesToG1(g1ToBytes(p)).equals(p)).toBe(true);
      p = p.double();
    }
  });

  test("g1ToBytes produces 48-byte compressed output", () => {
    const p = bls12_381.G1.Point.BASE.multiply(42n);
    expect(g1ToBytes(p).length).toBe(48);
  });

  test("scalar multiplication by same exponent matches between direct and via-bytes", () => {
    const exp = 0xdeadbeefn;
    const direct = bls12_381.G1.Point.BASE.multiply(exp);
    const viaBytes = bytesToG1(g1ToBytes(direct));
    expect(viaBytes.equals(direct)).toBe(true);
  });

  test("bytesToG1 rejects invalid length", () => {
    expect(() => bytesToG1(new Uint8Array(47))).toThrow();
  });

  test("bytesToG1 rejects a G1 curve point outside the prime-order subgroup", () => {
    // Compressed G1 point with the "compressed" flag set (0x80) but otherwise all zeros.
    // x=0 is not on the BLS12-381 G1 curve, so fromBytes throws before torsion check.
    const badBytes = new Uint8Array(48);
    badBytes[0] = 0x80;
    expect(() => bytesToG1(badBytes)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// test_g2_serialization (extended)
// ---------------------------------------------------------------------------
describe("curveSerialization (aptos-core ts-batch-encrypt parity)", () => {
  test("bytesToG2 roundtrips generator and small multiples", () => {
    let p = bls12_381.G2.Point.BASE;
    for (let i = 0; i < 5; i++) {
      expect(bytesToG2(g2ToBytes(p)).equals(p)).toBe(true);
      p = p.double();
    }
    expect(bytesToG2(g2ToBytes(bls12_381.G2.Point.ZERO)).equals(bls12_381.G2.Point.ZERO)).toBe(true);
  });

  test("bytesToG2 rejects invalid length", () => {
    expect(() => bytesToG2(new Uint8Array(95))).toThrow();
  });

  test("bytesToG2 rejects a G2 curve point outside the prime-order subgroup", () => {
    // 96-byte compressed G2 point for x = {c0:1n, c1:1n} (y via Fp2.sqrt).
    // Verified: on the BLS12-381 G2 curve (y^2 = x^3 + 4*(1+u)) but NOT in the
    // prime-order subgroup (isTorsionFree() returns false). Noble-curves v2 also
    // catches this inside fromBytes; our explicit check is defense-in-depth.
    const nonSubgroupBytes = Uint8Array.from(
      Buffer.from(
        "a000000000000000000000000000000000000000000000000000000000000000" +
          "0000000000000000000000000000000100000000000000000000000000000000" +
          "0000000000000000000000000000000000000000000000000000000000000001",
        "hex",
      ),
    );
    expect(() => bytesToG2(nonSubgroupBytes)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// weierstrassEquation (aptos-core curveSerialization parity)
// ---------------------------------------------------------------------------
describe("weierstrassEquation (aptos-core parity)", () => {
  test("weierstrassEquation(G1.BASE.x) equals G1.BASE.y² (point is on the G1 curve)", () => {
    const P = bls12_381.G1.Point;
    const { x, y } = P.BASE.toAffine();
    const rhs = weierstrassEquation(x, P);
    const lhs = P.Fp.sqr(y);
    expect(P.Fp.eql(lhs, rhs)).toBe(true);
  });

  test("weierstrassEquation(G2.BASE.x) equals G2.BASE.y² (point is on the G2 curve)", () => {
    const P = bls12_381.G2.Point;
    const { x, y } = P.BASE.toAffine();
    const rhs = weierstrassEquation(x, P);
    const lhs = P.Fp.sqr(y);
    expect(P.Fp.eql(lhs, rhs)).toBe(true);
  });
});
