// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput, Network } from "@aptos-labs/ts-sdk";

/**
 * The global cache Map shared across all functions.  Must keep care to ensure that the
 * cache keys are unique across all functions.
 * @group Implementation
 * @category Utils
 */
const cache = new Map<string, { value: any; timestamp: number }>();

/**
 * A memoize higher-order function to cache the response of an async function.
 * This function helps to improve performance by avoiding repeated calls to the same async function with the same arguments
 * within a specified time-to-live (TTL).
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
  useCachedValue: boolean = true,
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    // Check if the cached result exists and is within TTL
    const cachedValue = getCache<T>(key, ttlMs);
    if (cachedValue !== undefined && useCachedValue) {
      return cachedValue;
    }

    // If not cached or TTL expired, compute the result
    const result = await func(...args);

    // Cache the result with a timestamp
    cache.set(key, { value: result, timestamp: Date.now() });

    return result;
  };
}

export function clearCache(key: string) {
  cache.delete(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, { value, timestamp: Date.now() });
}

export function getCache<T>(key: string, ttlMs?: number): T | undefined {
  if (cache.has(key)) {
    const { value, timestamp } = cache.get(key)!;
    if (ttlMs === undefined || Date.now() - timestamp <= ttlMs) {
      return value;
    }
  }
  return undefined;
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
export function memoize<T>(func: (...args: any[]) => T, key: string, ttlMs?: number): (...args: any[]) => T {
  return (...args: any[]) => {
    // Check if the cached result exists and is within TTL
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key)!;
      if (ttlMs === undefined || Date.now() - timestamp <= ttlMs) {
        return value;
      }
    }

    // If not cached or TTL expired, compute the result
    const result = func(...args);

    // Cache the result with a timestamp
    cache.set(key, { value: result, timestamp: Date.now() });

    return result;
  };
}

export function clearBalanceCache(address: AccountAddressInput, tokenAddress: AccountAddressInput, network: Network) {
  const pendingBalanceCacheKey = getPendingBalanceCacheKey(address, tokenAddress, network);
  clearCache(pendingBalanceCacheKey);
  const availableBalanceCacheKey = getAvailableBalanceCacheKey(address, tokenAddress, network);
  clearCache(availableBalanceCacheKey);
}

export function clearEncryptionKeyCache(
  address: AccountAddressInput,
  tokenAddress: AccountAddressInput,
  network: Network,
) {
  const encryptionKeyCacheKey = getEncryptionKeyCacheKey(address, tokenAddress, network);
  clearCache(encryptionKeyCacheKey);
}

export function getPendingBalanceCacheKey(
  address: AccountAddressInput,
  tokenAddress: AccountAddressInput,
  network: Network,
) {
  return `${address}-pending-encrypted-balance-for-${tokenAddress}-${network}`;
}

export function getAvailableBalanceCacheKey(
  address: AccountAddressInput,
  tokenAddress: AccountAddressInput,
  network: Network,
) {
  return `${address}-available-encrypted-balance-for-${tokenAddress}-${network}`;
}

export function getEncryptionKeyCacheKey(
  address: AccountAddressInput,
  tokenAddress: AccountAddressInput,
  network: Network,
) {
  return `${address}-encryption-key-for-${tokenAddress}-${network}`;
}
