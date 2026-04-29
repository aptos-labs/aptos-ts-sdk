// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import {
  bytesToG1,
  bytesToG2,
  g1ToBytes,
  g2ToBytes,
} from "../../../../../src/core/crypto/encryption/curveSerialization";

describe("curveSerialization (aptos-core ts-batch-encrypt parity)", () => {
  test("bytesToG2 roundtrips generator and small multiples", () => {
    let p = bls12_381.G2.Point.BASE;
    for (let i = 0; i < 5; i++) {
      expect(bytesToG2(g2ToBytes(p)).equals(p)).toBe(true);
      p = p.double();
    }
    expect(bytesToG2(g2ToBytes(bls12_381.G2.Point.ZERO)).equals(bls12_381.G2.Point.ZERO)).toBe(true);
  });

  test("bytesToG1 roundtrips generator and small multiples", () => {
    let p = bls12_381.G1.Point.BASE;
    for (let i = 0; i < 5; i++) {
      expect(bytesToG1(g1ToBytes(p)).equals(p)).toBe(true);
      p = p.double();
    }
    expect(bytesToG1(g1ToBytes(bls12_381.G1.Point.ZERO)).equals(bls12_381.G1.Point.ZERO)).toBe(true);
  });

  test("bytesToG2 rejects invalid length", () => {
    expect(() => bytesToG2(new Uint8Array(95))).toThrow();
  });
});
