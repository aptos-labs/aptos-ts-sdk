// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMemoizeCache, getMemoizeCacheSize, memoize, memoizeAsync } from "../../src/utils/memoize.js";

describe("memoize: cache management", () => {
  beforeEach(() => {
    clearMemoizeCache();
  });

  afterEach(() => {
    clearMemoizeCache();
    vi.useRealTimers();
  });

  describe("clearMemoizeCache / getMemoizeCacheSize", () => {
    it("returns 0 on a fresh cache", () => {
      expect(getMemoizeCacheSize()).toBe(0);
    });

    it("grows by one for each distinct populated key", () => {
      memoize(() => 1, "size-test-aa")();
      memoize(() => 2, "size-test-bb")();
      expect(getMemoizeCacheSize()).toBe(2);
    });

    it("clears every populated entry", () => {
      memoize(() => 1, "size-test-aa")();
      memoize(() => 2, "size-test-bb")();
      clearMemoizeCache();
      expect(getMemoizeCacheSize()).toBe(0);
    });
  });

  describe("validateCacheKey", () => {
    it("rejects an empty key on construction", () => {
      expect(() => memoize(() => 0, "")).toThrow(/non-empty string/);
    });

    it("rejects a key shorter than MIN_KEY_LENGTH (10)", () => {
      // 9 chars — below the minimum, should be rejected eagerly.
      expect(() => memoize(() => 0, "short-key")).toThrow(/too short/);
    });

    it("rejects an empty key for memoizeAsync as well", () => {
      expect(() => memoizeAsync(async () => 0, "")).toThrow(/non-empty string/);
    });
  });

  describe("LRU eviction (sync)", () => {
    it("evicts least-recently-accessed entries when MAX_CACHE_SIZE is exceeded", () => {
      // Populate the cache up to its maximum, then add one more — the
      // implementation evicts ~10% of the cache as a batch. We can't read
      // MAX_CACHE_SIZE directly, but the post-condition is observable: cache
      // size must drop below 1000 after exceeding it.
      const MAX = 1000;
      for (let i = 0; i < MAX; i += 1) {
        memoize(() => i, `lru-key-${String(i).padStart(6, "0")}`)();
      }
      expect(getMemoizeCacheSize()).toBe(MAX);

      // Adding one more should trigger eviction of ~10% (100 entries),
      // then insert the new one.
      memoize(() => -1, `lru-key-${"X".padStart(6, "0")}`)();
      expect(getMemoizeCacheSize()).toBeLessThan(MAX);
      expect(getMemoizeCacheSize()).toBeGreaterThan(MAX * 0.85);
    });
  });

  describe("memoize: TTL eviction path", () => {
    it("removes the stale entry and re-runs the function when the TTL is exceeded", () => {
      vi.useFakeTimers();
      const spy = vi.fn(() => "result");
      const memoized = memoize(spy, "ttl-test-key-aa", 100);

      expect(memoized()).toBe("result");
      expect(spy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);

      expect(memoized()).toBe("result");
      // The second call missed the cache (TTL expired), so the underlying
      // function ran again.
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("memoizeAsync: TTL eviction path", () => {
    it("re-runs the async function after the TTL expires", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const spy = vi.fn(async () => "async-result");
      const memoized = memoizeAsync(spy, "ttl-async-key-aa", 100);

      expect(await memoized()).toBe("async-result");
      expect(spy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);

      expect(await memoized()).toBe("async-result");
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
