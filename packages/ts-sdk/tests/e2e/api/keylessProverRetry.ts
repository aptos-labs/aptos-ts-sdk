// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * The keyless prover rate-limits prove requests per OIDC token
 * (10 / 300s). CI jobs share a small hardcoded JWT pool and all start at
 * index 0, so concurrent runs exhaust the first tokens. These helpers pick a
 * salted start offset and rotate to the next JWT when a 429 is returned.
 */

export function isProverRateLimitError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (typeof current === "object" && current !== null && !seen.has(current)) {
    seen.add(current);
    const candidate = current as { status?: unknown; message?: unknown; innerError?: unknown };
    if (candidate.status === 429) {
      return true;
    }
    if (typeof candidate.message === "string" && /(?:\b429\b|rate limit)/i.test(candidate.message)) {
      return true;
    }
    current = candidate.innerError;
  }
  return false;
}

export function jwtCursorStartOffset(salt: string, poolSize: number): number {
  if (poolSize <= 0) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < salt.length; i += 1) {
    hash = (hash * 31 + salt.charCodeAt(i)) >>> 0;
  }
  return hash % poolSize;
}

export function createJwtCursor(jwts: readonly string[], startOffset = 0): { next: () => string } {
  if (jwts.length === 0) {
    throw new Error("JWT pool is empty");
  }
  let index = ((startOffset % jwts.length) + jwts.length) % jwts.length;
  return {
    next(): string {
      const jwt = jwts[index];
      index = (index + 1) % jwts.length;
      return jwt;
    },
  };
}

export async function withJwtRateLimitRetry<T>(
  cursor: { next: () => string },
  maxAttempts: number,
  fn: (jwt: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const jwt = cursor.next();
    try {
      return await fn(jwt);
    } catch (error) {
      lastError = error;
      if (!isProverRateLimitError(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}
