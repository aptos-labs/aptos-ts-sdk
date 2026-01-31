// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Maximum number of entries to keep in the cache to prevent unbounded memory growth.
 * When this limit is exceeded, the oldest entries are evicted.
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Interval in milliseconds for periodic cleanup of expired cache entries.
 */
const CLEANUP_INTERVAL_MS = 60000; // 1 minute

/**
 * Cache entry structure with value, timestamp, and last access time for LRU eviction.
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  lastAccess: number;
  ttlMs?: number;
}

/**
 * The global cache Map shared across all functions with LRU eviction support.
 * Must keep care to ensure that the cache keys are unique across all functions.
 * @group Implementation
 * @category Utils
 */
const cache = new Map<string, CacheEntry<any>>();

/**
 * Track whether cleanup interval is set up.
 */
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Sets up periodic cleanup of expired cache entries if not already running.
 * This prevents memory leaks from accumulating expired entries.
 */
function ensureCleanupInterval(): void {
  if (cleanupIntervalId === null) {
    cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      cache.forEach((entry, key) => {
        // Remove entries that have expired
        if (entry.ttlMs !== undefined && now - entry.timestamp > entry.ttlMs) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => cache.delete(key));

      // If cache is empty, stop the cleanup interval to avoid unnecessary overhead
      if (cache.size === 0 && cleanupIntervalId !== null) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
      }
    }, CLEANUP_INTERVAL_MS);

    // Ensure the interval doesn't prevent Node.js from exiting
    if (typeof cleanupIntervalId === "object" && "unref" in cleanupIntervalId) {
      cleanupIntervalId.unref();
    }
  }
}

/**
 * Evicts the least recently used entries when cache exceeds maximum size.
 */
function evictIfNeeded(): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Find and remove the least recently accessed entries (remove ~10% of cache)
    const entriesToRemove = Math.ceil(MAX_CACHE_SIZE * 0.1);
    const entries = Array.from(cache.entries()).sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    for (let i = 0; i < entriesToRemove && i < entries.length; i += 1) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * A memoize higher-order function to cache the response of an async function.
 * This function helps to improve performance by avoiding repeated calls to the same async function with the same arguments
 * within a specified time-to-live (TTL).
 *
 * Features:
 * - LRU eviction when cache exceeds MAX_CACHE_SIZE entries
 * - Periodic cleanup of expired entries to prevent memory leaks
 *
 * @param func The async function to cache the result of.
 * @param key The cache key used to store the result.
 * @param ttlMs The time-to-live in milliseconds for cached data.
 * @returns The cached or latest result.
 * @group Implementation
 * @category Utils
 */
export function memoizeAsync<T>(
  func: (...args: any[]) => Promise<T>,
  key: string,
  ttlMs?: number,
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    const now = Date.now();

    // Check if the cached result exists and is within TTL
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (ttlMs === undefined || now - entry.timestamp <= ttlMs) {
        // Update last access time for LRU
        entry.lastAccess = now;
        return entry.value;
      }
      // Entry expired, remove it
      cache.delete(key);
    }

    // If not cached or TTL expired, compute the result
    const result = await func(...args);

    // Evict old entries if needed before adding new one
    evictIfNeeded();

    // Cache the result with a timestamp
    cache.set(key, { value: result, timestamp: now, lastAccess: now, ttlMs });

    // Ensure cleanup is running
    ensureCleanupInterval();

    return result;
  };
}

/**
 * Caches the result of a function call to improve performance on subsequent calls with the same arguments.
 *
 * Features:
 * - LRU eviction when cache exceeds MAX_CACHE_SIZE entries
 * - Periodic cleanup of expired entries to prevent memory leaks
 *
 * @param key - The key to cache on, all accesses by this key will return the cached value.
 * @param func - The function whose result will be cached.
 * @param ttlMs - The time-to-live in milliseconds for cached data.
 * @returns A memoized version of the provided function that returns the cached result if available and within TTL.
 * @group Implementation
 * @category Utils
 */
export function memoize<T>(func: (...args: any[]) => T, key: string, ttlMs?: number): (...args: any[]) => T {
  return (...args: any[]) => {
    const now = Date.now();

    // Check if the cached result exists and is within TTL
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (ttlMs === undefined || now - entry.timestamp <= ttlMs) {
        // Update last access time for LRU
        entry.lastAccess = now;
        return entry.value;
      }
      // Entry expired, remove it
      cache.delete(key);
    }

    // If not cached or TTL expired, compute the result
    const result = func(...args);

    // Evict old entries if needed before adding new one
    evictIfNeeded();

    // Cache the result with a timestamp
    cache.set(key, { value: result, timestamp: now, lastAccess: now, ttlMs });

    // Ensure cleanup is running
    ensureCleanupInterval();

    return result;
  };
}

/**
 * Clears all entries from the memoization cache.
 * Useful for testing or when you need to force fresh data.
 * @group Implementation
 * @category Utils
 */
export function clearMemoizeCache(): void {
  cache.clear();
}

/**
 * Returns the current size of the memoization cache.
 * Useful for monitoring and debugging.
 * @group Implementation
 * @category Utils
 */
export function getMemoizeCacheSize(): number {
  return cache.size;
}
