// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import { g2ToBytes } from "../../../../../src/core/crypto/encryption/curveSerialization";
import { hashG2Element, ID_HASH_DST } from "../../../../../src/core/crypto/encryption/symmetric";

/**
 * Guards alignment with aptos-core:
 * - crates/aptos-batch-encryption/src/shared/ids.rs (ID_HASH_DST)
 * - crates/aptos-batch-encryption/src/shared/symmetric.rs (HASH_G2_ELEMENT_DST)
 */
describe("batch encryption constants (aptos-core sync)", () => {
  test("ID_HASH_DST matches Rust ID_HASH_DST", () => {
    expect(ID_HASH_DST).toEqual(new TextEncoder().encode("APTOS_BATCH_ENCRYPTION_HASH_ID"));
  });

  test("G2 hash-to-curve DST matches Rust", () => {
    const dst = "APTOS_BATCH_ENCRYPTION_HASH_G2_ELEMENT";
    const g2 = bls12_381.G2.Point.BASE;
    const h1 = hashG2Element(g2);
    const h2 = bls12_381.G1.hashToCurve(g2ToBytes(g2), { DST: dst });
    expect(h1.equals(h2)).toBe(true);
  });
});
