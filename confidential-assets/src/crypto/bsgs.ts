// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Baby-Step Giant-Step (BSGS) algorithm for solving discrete logarithms.
 *
 * Given a point P = x * G, finds x in O(sqrt(n)) time using O(sqrt(n)) space,
 * where n = 2^bitWidth is the search space size.
 */

import { RistrettoPoint } from "@noble/curves/ed25519";
import { RistPoint } from "./twistedEd25519";

/**
 * BSGS table for a specific bit width.
 */
export interface BsgsTable {
  /** The bit width this table was created for */
  bitWidth: number;
  /** m = 2^(bitWidth/2), the number of baby steps */
  m: bigint;
  /** The baby-step table: maps point (as bigint) to index j */
  babySteps: Map<bigint, bigint>;
  /** Precomputed -m * G for giant steps */
  giantStep: RistPoint;
}

/**
 * Convert bytes to a BigInt key for fast Map lookups.
 * Uses little-endian interpretation of the full 32 bytes.
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Creates a BSGS table for solving DLPs up to the given bit width.
 *
 * Time complexity: O(2^(bitWidth/2))
 * Space complexity: O(2^(bitWidth/2))
 *
 * @param bitWidth - Maximum bit width of discrete logs to solve (must be even)
 * @returns The BSGS table
 */
export function createBsgsTable(bitWidth: number): BsgsTable {
  if (bitWidth <= 0) {
    throw new Error("bitWidth must be positive");
  }
  if (bitWidth % 2 !== 0) {
    throw new Error("bitWidth must be even for BSGS");
  }

  const m = 1n << BigInt(bitWidth / 2);
  const babySteps = new Map<bigint, bigint>();

  // Baby steps: compute j * G for j = 0, 1, ..., m-1 using only additions
  let current = RistrettoPoint.ZERO;
  const G = RistrettoPoint.BASE;

  for (let j = 0n; j < m; j++) {
    const key = bytesToBigInt(current.toRawBytes());
    babySteps.set(key, j);
    current = current.add(G);
  }

  // After the loop, current = m * G (no need to recompute with multiply)
  const giantStep = current.negate();

  return {
    bitWidth,
    m,
    babySteps,
    giantStep,
  };
}

/**
 * Solves the discrete log problem using BSGS.
 *
 * Given P = x * G, finds x where 0 <= x < 2^bitWidth.
 *
 * Time complexity: O(2^(bitWidth/2))
 *
 * @param point - The point P = x * G (as Uint8Array serialization)
 * @param table - The precomputed BSGS table
 * @returns The discrete log x, or null if not found
 */
export function solveDlpBsgs(point: Uint8Array, table: BsgsTable): bigint | null {
  // Handle zero point (identity) - check if in baby steps first
  const pointKey = bytesToBigInt(point);
  if (table.babySteps.has(pointKey)) {
    return table.babySteps.get(pointKey)!;
  }

  const P = RistrettoPoint.fromHex(point);
  const { m, babySteps, giantStep } = table;

  // Giant steps: for i = 1, 2, ..., m-1
  // Compute gamma = P + i * giantStep = P - i * m * G
  // If gamma is in babySteps at index j, then x = i * m + j
  let gamma = P.add(giantStep); // Start with i = 1

  for (let i = 1n; i < m; i++) {
    const gammaKey = bytesToBigInt(gamma.toBytes());

    if (babySteps.has(gammaKey)) {
      const j = babySteps.get(gammaKey)!;
      return i * m + j;
    }

    gamma = gamma.add(giantStep);
  }

  // Not found in search space
  return null;
}

/**
 * BSGS solver class that manages multiple tables for different bit widths.
 */
export class BsgsSolver {
  private tables: Map<number, BsgsTable> = new Map();
  private initPromise: Promise<void> | undefined;

  /**
   * Initialize tables for the specified bit widths.
   * @param bitWidths - Array of bit widths to precompute tables for (must be even)
   */
  async initialize(bitWidths: number[]): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      for (const bitWidth of bitWidths) {
        if (!this.tables.has(bitWidth)) {
          //console.log(`BSGS: Creating table for ${bitWidth}-bit DLPs...`);
          const startTime = performance.now();
          const table = createBsgsTable(bitWidth);
          const elapsed = performance.now() - startTime;
          //console.log(`BSGS: ${bitWidth}-bit table created in ${elapsed.toFixed(2)}ms (${table.babySteps.size} entries)`);
          this.tables.set(bitWidth, table);
        }
      }
    })();

    return this.initPromise;
  }

  /**
   * Solve DLP using the appropriate table.
   * Tries tables from smallest to largest bit width.
   *
   * @param point - The point P = x * G (as Uint8Array)
   * @returns The discrete log x
   * @throws If no solution found in any table
   */
  solve(point: Uint8Array): bigint {
    // Sort tables by bit width (smallest first for efficiency)
    const sortedTables = [...this.tables.entries()].sort((a, b) => a[0] - b[0]);

    for (const [bitWidth, table] of sortedTables) {
      const result = solveDlpBsgs(point, table);
      if (result !== null) {
        return result;
      }
    }

    throw new Error("BSGS: No solution found in search space");
  }

  /**
   * Check if a table exists for the given bit width.
   */
  hasTable(bitWidth: number): boolean {
    return this.tables.has(bitWidth);
  }

  /**
   * Get the table for a specific bit width.
   */
  getTable(bitWidth: number): BsgsTable | undefined {
    return this.tables.get(bitWidth);
  }

  /**
   * Clear all tables to free memory.
   */
  clear(): void {
    this.tables.clear();
    this.initPromise = undefined;
  }
}
