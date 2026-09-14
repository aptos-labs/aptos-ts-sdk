// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Parity tests for aptos-core/crates/aptos-batch-encryption/src/tests/typescript/curve_serialization.rs
 * (test_fp12_serialization) and general field-serialization correctness.
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import {
  bigintToLEBytesInternal,
  bigintToLEBytesFq,
  bigintToLEBytesFr,
  fp2ToLEBytes,
  fp6ToLEBytes,
  fp12ToLEBytes,
  leBytesToBigint,
  leBytesToFp2,
  leBytesToFp6,
  leBytesToFp12,
} from "../../../../../src/core/crypto/encryption/fieldSerialization";

// ---------------------------------------------------------------------------
// test_fp12_serialization
// ---------------------------------------------------------------------------
describe("Fp12 serialization (aptos-core test_fp12_serialization parity)", () => {
  function randomFp12() {
    // A pairing result is a canonical Fp12 element.
    const exp = leBytesToBigint(crypto.getRandomValues(new Uint8Array(32)));
    const g1 = bls12_381.G1.Point.BASE.multiply(bls12_381.fields.Fr.create(exp));
    return bls12_381.pairing(g1, bls12_381.G2.Point.BASE);
  }

  test("fp12ToLEBytes produces 576 bytes", () => {
    const f = randomFp12();
    expect(fp12ToLEBytes(f).length).toBe(576);
  });

  test("leBytesToFp12(fp12ToLEBytes(f)) round-trips: re-serializing gives the same bytes", () => {
    const f = randomFp12();
    const bytes = fp12ToLEBytes(f);
    const f2 = leBytesToFp12(bytes);
    expect(fp12ToLEBytes(f2)).toEqual(bytes);
  });

  test("f + f via noble Fp12 matches round-tripping through bytes then adding (matches Rust test logic)", () => {
    const f = randomFp12();
    const bytes = fp12ToLEBytes(f);
    const fFromBytes = leBytesToFp12(bytes);

    const rustEquivalent = bls12_381.fields.Fp12.add(f, f);
    const tsEquivalent = bls12_381.fields.Fp12.add(fFromBytes, fFromBytes);

    expect(fp12ToLEBytes(tsEquivalent)).toEqual(fp12ToLEBytes(rustEquivalent));
  });

  test("leBytesToFp12 rejects wrong-length input", () => {
    expect(() => leBytesToFp12(new Uint8Array(575))).toThrow();
    expect(() => leBytesToFp12(new Uint8Array(577))).toThrow();
  });

  test("distinct Fp12 elements produce distinct byte encodings", () => {
    const f1 = bls12_381.pairing(bls12_381.G1.Point.BASE, bls12_381.G2.Point.BASE);
    const f2 = bls12_381.fields.Fp12.add(f1, f1);
    expect(fp12ToLEBytes(f1)).not.toEqual(fp12ToLEBytes(f2));
  });
});

// ---------------------------------------------------------------------------
// leBytesToBigint / bigintToLEBytesFr / bigintToLEBytesFq / bigintToLEBytesInternal
// ---------------------------------------------------------------------------
describe("leBytesToBigint / bigintToLEBytesFr (field element round-trip)", () => {
  test("bigintToLEBytesFr produces 32 bytes", () => {
    expect(bigintToLEBytesFr(bls12_381.fields.Fr.ORDER - 1n).length).toBe(32);
  });

  test("leBytesToBigint(bigintToLEBytesFr(x)) == x for Fr elements", () => {
    for (const val of [0n, 1n, 255n, bls12_381.fields.Fr.ORDER - 1n]) {
      expect(leBytesToBigint(bigintToLEBytesFr(val))).toBe(val);
    }
  });
});

describe("bigintToLEBytesFq (aptos-core bigintToLEBytesFq parity)", () => {
  test("produces 48 bytes", () => {
    expect(bigintToLEBytesFq(bls12_381.fields.Fp.ORDER - 1n).length).toBe(48);
  });

  test("leBytesToBigint(bigintToLEBytesFq(x)) == x for Fq elements", () => {
    for (const val of [0n, 1n, 255n, bls12_381.fields.Fp.ORDER - 1n]) {
      expect(leBytesToBigint(bigintToLEBytesFq(val))).toBe(val);
    }
  });
});

describe("bigintToLEBytesInternal (aptos-core bigintToLEBytesInternal parity)", () => {
  test("produces the requested number of bytes", () => {
    for (const n of [1, 16, 32, 48, 64]) {
      expect(bigintToLEBytesInternal(0n, n).length).toBe(n);
    }
  });

  test("round-trips via leBytesToBigint", () => {
    const val = 0xdeadbeefcafebaben;
    expect(leBytesToBigint(bigintToLEBytesInternal(val, 32))).toBe(val);
  });
});

// ---------------------------------------------------------------------------
// Fp2 / Fp6 serialization (aptos-core parity for exported helpers)
// ---------------------------------------------------------------------------
describe("fp2ToLEBytes / leBytesToFp2 (aptos-core parity)", () => {
  function randomFp2() {
    const r = () => bls12_381.fields.Fp.create(leBytesToBigint(crypto.getRandomValues(new Uint8Array(48))));
    return { c0: r(), c1: r() };
  }

  test("fp2ToLEBytes produces 96 bytes", () => {
    expect(fp2ToLEBytes(randomFp2()).length).toBe(96);
  });

  test("leBytesToFp2(fp2ToLEBytes(f)) roundtrips", () => {
    const f = randomFp2();
    const bytes = fp2ToLEBytes(f);
    const f2 = leBytesToFp2(bytes);
    expect(fp2ToLEBytes(f2)).toEqual(bytes);
  });
});

describe("fp6ToLEBytes / leBytesToFp6 (aptos-core parity)", () => {
  function randomFp2() {
    const r = () => bls12_381.fields.Fp.create(leBytesToBigint(crypto.getRandomValues(new Uint8Array(48))));
    return { c0: r(), c1: r() };
  }
  function randomFp6() {
    return { c0: randomFp2(), c1: randomFp2(), c2: randomFp2() };
  }

  test("fp6ToLEBytes produces 288 bytes", () => {
    expect(fp6ToLEBytes(randomFp6()).length).toBe(288);
  });

  test("leBytesToFp6(fp6ToLEBytes(f)) roundtrips", () => {
    const f = randomFp6();
    const bytes = fp6ToLEBytes(f);
    const f2 = leBytesToFp6(bytes);
    expect(fp6ToLEBytes(f2)).toEqual(bytes);
  });
});
