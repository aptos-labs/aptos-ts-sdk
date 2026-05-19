// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { u64ToNumberSafe } from "../../src/utils/helpers.js";

describe("u64ToNumberSafe", () => {
  it("returns the numeric value for safe inputs", () => {
    expect(u64ToNumberSafe(0n, "field")).toBe(0);
    expect(u64ToNumberSafe(1n, "field")).toBe(1);
    expect(u64ToNumberSafe(BigInt(Date.now()) / 1000n, "field")).toBeGreaterThan(1_000_000_000);
  });

  it("returns the exact value at the safe boundary", () => {
    expect(u64ToNumberSafe(BigInt(Number.MAX_SAFE_INTEGER), "field")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("throws above Number.MAX_SAFE_INTEGER", () => {
    expect(() => u64ToNumberSafe(BigInt(Number.MAX_SAFE_INTEGER) + 1n, "field")).toThrow(RangeError);
    expect(() => u64ToNumberSafe(BigInt(Number.MAX_SAFE_INTEGER) + 1n, "field")).toThrow(
      /exceeds Number\.MAX_SAFE_INTEGER/,
    );
  });

  it("includes the field name in the thrown message for diagnosability", () => {
    expect(() => u64ToNumberSafe(BigInt(Number.MAX_SAFE_INTEGER) + 1n, "MyField.x")).toThrow(/MyField\.x/);
  });

  it("throws on negative values (u64 should be unsigned)", () => {
    expect(() => u64ToNumberSafe(-1n, "field")).toThrow(/negative/);
  });

  it("throws at the maximum u64 value", () => {
    const MAX_U64 = (1n << 64n) - 1n;
    expect(() => u64ToNumberSafe(MAX_U64, "field")).toThrow(RangeError);
  });
});
