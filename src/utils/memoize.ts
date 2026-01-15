// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Maximum number of entries allowed in the cache before triggering cleanup.
 * @group Implementation
 * @category Utils
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Interval in milliseconds between automatic cache cleanups (5 minutes).
 * @group Implementation
 * @category Utils
 */
const CACHE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * The global cache Map shared across all functions.  Must keep care to ensure that the
 * cache keys are unique across all functions.
 * @group Implementation
 * @category Utils
 */
const cache = new Map<string, { value: unknown; timestamp: number; ttlMs?: number }>();

/**
 * Map to track in-flight async requests to prevent duplicate fetches (cache stampede prevention).
 * @group Implementation
 * @category Utils
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Timestamp of the last cache cleanup.
 * @group Implementation
 * @category Utils
 */
let lastCleanupTime = Date.now();

/**
 * Removes expired entries from the cache.
 * This function iterates through all cache entries and removes those that have exceeded their TTL.
 * @group Implementation
 * @category Utils
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.ttlMs !== undefined && now - entry.timestamp > entry.ttlMs) {
      cache.delete(key);
    }
  }
  lastCleanupTime = now;
}

/**
 * Performs cache maintenance by cleaning up expired entries if needed.
 * Cleanup is triggered either when the cache exceeds MAX_CACHE_SIZE or when
 * CACHE_CLEANUP_INTERVAL_MS has passed since the last cleanup.
 * @group Implementation
 * @category Utils
 */
function performCacheMaintenanceIfNeeded(): void {
  const now = Date.now();
  if (cache.size > MAX_CACHE_SIZE || now - lastCleanupTime > CACHE_CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries();
  }
}

/**
 * Clears all entries from the memoization cache.
 * This can be useful for testing or when you need to force fresh data fetches.
 * @group Implementation
 * @category Utils
 */
export function clearMemoizeCache(): void {
  cache.clear();
  pendingRequests.clear();
  lastCleanupTime = Date.now();
}

/**
 * A memoize higher-order function to cache the response of an async function.
 * This function helps to improve performance by avoiding repeated calls to the same async function with the same arguments
 * within a specified time-to-live (TTL).
 *
 * This implementation prevents cache stampede by tracking in-flight requests - if multiple calls are made
 * with the same key while a request is pending, they will all await the same promise rather than
 * triggering duplicate fetches.
 *
 * @param func The async function to cache the result of.
 * @param key The cache key used to store the result.
 * @param ttlMs The time-to-live in milliseconds for cached data.
 * @returns The cached or latest result.
 * @group Implementation
 * @category Utils
 */
export function memoizeAsync<T>(
  func: (...args: unknown[]) => Promise<T>,
  key: string,
  ttlMs?: number,
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]) => {
    // Perform periodic cache maintenance
    performCacheMaintenanceIfNeeded();

    // Check if the cached result exists and is within TTL
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key)!;
      if (ttlMs === undefined || Date.now() - timestamp <= ttlMs) {
        return value as T;
      }
    }

    // Check if there's already a pending request for this key to prevent cache stampede
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest !== undefined) {
      return pendingRequest as Promise<T>;
    }

    // Create the promise and track it
    const promise = func(...args)
      .then((result) => {
        // Cache the result with a timestamp and TTL for cleanup tracking
        cache.set(key, { value: result, timestamp: Date.now(), ttlMs });
        return result;
      })
      .finally(() => {
        // Always clean up the pending request, whether it succeeded or failed
        pendingRequests.delete(key);
      });

    pendingRequests.set(key, promise);

    return promise;
  };
}

/**
 * Caches the result of a function call to improve performance on subsequent calls with the same arguments.
 *
 * @param key - The key to cache on, all accesses by this key will return the cached value.
 * @param func - The function whose result will be cached.
 * @param ttlMs - The time-to-live in milliseconds for cached data.
 * @returns A memoized version of the provided function that returns the cached result if available and within TTL.
 * @group Implementation
 * @category Utils
 */
export function memoize<T>(func: (...args: unknown[]) => T, key: string, ttlMs?: number): (...args: unknown[]) => T {
  return (...args: unknown[]) => {
    // Perform periodic cache maintenance
    performCacheMaintenanceIfNeeded();

    // Check if the cached result exists and is within TTL
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key)!;
      if (ttlMs === undefined || Date.now() - timestamp <= ttlMs) {
        return value as T;
      }
    }

    // If not cached or TTL expired, compute the result
    const result = func(...args);

    // Cache the result with a timestamp and TTL for cleanup tracking
    cache.set(key, { value: result, timestamp: Date.now(), ttlMs });

    return result;
  };
}
