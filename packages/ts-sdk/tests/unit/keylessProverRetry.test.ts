// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  createJwtCursor,
  isProverRateLimitError,
  jwtCursorStartOffset,
  withJwtRateLimitRetry,
} from "../e2e/api/keylessProverRetry.js";

describe("keyless prover JWT retry helper", () => {
  it("hashes a salt into a stable offset within the pool", () => {
    const offset = jwtCursorStartOffset("run-123", 20);
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(20);
    expect(jwtCursorStartOffset("run-123", 20)).toBe(offset);
    expect(jwtCursorStartOffset("run-456", 20)).not.toBe(offset);
  });

  it("walks the JWT pool from the given offset and wraps", () => {
    const cursor = createJwtCursor(["a", "b", "c"], 1);
    expect(cursor.next()).toBe("b");
    expect(cursor.next()).toBe("c");
    expect(cursor.next()).toBe("a");
  });

  it("retries a 429 with the next JWT and returns the first success", async () => {
    const cursor = createJwtCursor(["jwt-0", "jwt-1", "jwt-2"]);
    const seen: string[] = [];

    const result = await withJwtRateLimitRetry(cursor, 3, async (jwt) => {
      seen.push(jwt);
      if (jwt !== "jwt-1") {
        throw { status: 429, message: "Too Many Requests" };
      }
      return jwt;
    });

    expect(result).toBe("jwt-1");
    expect(seen).toEqual(["jwt-0", "jwt-1"]);
  });

  it("rethrows non-rate-limit errors immediately", async () => {
    const cursor = createJwtCursor(["jwt-0", "jwt-1"]);
    await expect(
      withJwtRateLimitRetry(cursor, 2, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("identifies HTTP 429 as a prover rate-limit error", () => {
    expect(isProverRateLimitError({ status: 429 })).toBe(true);
    expect(isProverRateLimitError({ status: 500 })).toBe(false);
    expect(isProverRateLimitError(new Error("nope"))).toBe(false);
  });

  it("detects wrapped AptosApiError 429s and rate-limit messages", () => {
    expect(isProverRateLimitError({ innerError: { status: 429 } })).toBe(true);
    expect(
      isProverRateLimitError(
        new Error("Request to [Prover]: POST prove failed with status: Too Many Requests(code:429)"),
      ),
    ).toBe(true);
    expect(isProverRateLimitError(new Error("Rate limit exceeded. Too many requests in a short period."))).toBe(true);
  });

  it("throws the last 429 after exhausting the JWT pool", async () => {
    const cursor = createJwtCursor(["jwt-0", "jwt-1"]);
    await expect(
      withJwtRateLimitRetry(cursor, 2, async () => {
        throw { status: 429, message: "Too Many Requests" };
      }),
    ).rejects.toMatchObject({ status: 429 });
  });
});
