/**
 * Discrete Logarithm (DLP) tests and benchmarks.
 *
 * Covers two implementations:
 * - WASM-based solver (algorithm determined at compile time)
 * - Baby-Step Giant-Step (pure TypeScript)
 */

import { RistrettoPoint } from "@noble/curves/ed25519";
import { TwistedElGamal, TwistedEd25519PrivateKey } from "../../src";
import { createBsgsTable, BsgsSolver } from "../../src/crypto/bsgs";
import crypto from "crypto";

// ============================================================================
// Helpers
// ============================================================================

const BENCHMARK_ITERATIONS = 10;

function generateRandomInteger(bits: number): bigint {
  if (bits <= 0) return 0n;

  const bytes = Math.ceil(bits / 8);
  const randomBytes = crypto.getRandomValues(new Uint8Array(bytes));

  let result = 0n;
  for (let i = 0; i < bytes; i++) {
    result = (result << 8n) | BigInt(randomBytes[i]);
  }

  return result & ((1n << BigInt(bits)) - 1n);
}

/**
 * Split a nonnegative integer v into base-(2^radix_decomp_bits) digits, then greedily
 * "borrow" from higher digits to maximize each lower chunk while keeping each
 * chunk < 2^bits_per_chunk.
 */
function maximalRadixChunks(
  v: bigint,
  radix_decomp_bits: number,
  v_max_bits: number,
  bits_per_chunk: number,
): bigint[] {
  if (radix_decomp_bits <= 0) throw new Error("radix_decomp_bits must be > 0");
  if (v_max_bits <= 0) throw new Error("v_max_bits must be > 0");
  if (bits_per_chunk <= 0) throw new Error("bits_per_chunk must be > 0");
  if (v_max_bits % radix_decomp_bits !== 0) {
    throw new Error("v_max_bits must be a multiple of radix_decomp_bits");
  }
  if (bits_per_chunk < radix_decomp_bits) {
    throw new Error("bits_per_chunk must be >= radix_decomp_bits");
  }
  if (v < 0n) throw new Error("v must be nonnegative");

  const ell = v_max_bits / radix_decomp_bits;

  const RADIX = 1n << BigInt(radix_decomp_bits);
  const DIGIT_MASK = RADIX - 1n;
  const CHUNK_LIM = (1n << BigInt(bits_per_chunk)) - 1n;

  const V_MAX = 1n << BigInt(v_max_bits);
  if (v >= V_MAX) throw new Error("v does not fit in v_max_bits");

  // 1) canonical base-B digits
  const w: bigint[] = new Array(ell);
  for (let i = 0; i < ell; i++) {
    const shift = BigInt(i * radix_decomp_bits);
    w[i] = (v >> shift) & DIGIT_MASK;
  }

  // 2) greedy borrowing to maximize each w[i]
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < ell - 1; i++) {
      const room = CHUNK_LIM - w[i];
      if (room < RADIX) continue;

      const tCap = room / RADIX;
      const t = w[i + 1] < tCap ? w[i + 1] : tCap;

      if (t > 0n) {
        w[i] += t * RADIX;
        w[i + 1] -= t;
        changed = true;
      }
    }
  }

  return w;
}

/** Recompose value from chunks: Σ (2^radix_decomp_bits)^i * chunks[i] */
function recompose(chunks: bigint[], radix_decomp_bits: number): bigint {
  const RADIX = 1n << BigInt(radix_decomp_bits);
  let acc = 0n;
  let pow = 1n;
  for (let i = 0; i < chunks.length; i++) {
    acc += chunks[i] * pow;
    pow *= RADIX;
  }
  return acc;
}

interface BenchmarkResult {
  algorithm: string;
  bitWidth: number;
  iterations: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  tableCreationMs?: number;
}

function formatResult(r: BenchmarkResult): string {
  const tableInfo = r.tableCreationMs !== undefined ? `, table=${r.tableCreationMs.toFixed(0)}ms` : "";
  return `${r.algorithm} ${r.bitWidth}-bit: avg=${r.avgMs.toFixed(2)}ms, min=${r.minMs.toFixed(2)}ms, max=${r.maxMs.toFixed(2)}ms${tableInfo}`;
}

// ============================================================================
// WASM Discrete Log Solver Tests
// ============================================================================

describe("Discrete Log Solver (WASM)", () => {
  beforeAll(async () => {
    // WASM auto-loads from node_modules in Node.js environment
    await TwistedElGamal.initializeSolver();
    console.log(`WASM algorithm: ${TwistedElGamal.getAlgorithmName()}`);
  }, 30000);

  describe("correctness", () => {
    it("decrypts 16-bit values correctly", async () => {
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(16);
        const alice = TwistedEd25519PrivateKey.generate();
        const encrypted = TwistedElGamal.encryptWithPK(x, alice.publicKey());
        const decrypted = await TwistedElGamal.decryptWithPK(encrypted, alice);
        expect(decrypted).toBe(x);
      }
    });

    it("decrypts 32-bit values correctly", async () => {
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(32);
        const alice = TwistedEd25519PrivateKey.generate();
        const encrypted = TwistedElGamal.encryptWithPK(x, alice.publicKey());
        const decrypted = await TwistedElGamal.decryptWithPK(encrypted, alice);
        expect(decrypted).toBe(x);
      }
    });
  });

  describe("benchmark", () => {
    const benchmarkWasm = async (bitWidth: number): Promise<BenchmarkResult> => {
      expect(TwistedElGamal.isInitialized()).toBe(true);

      const times: number[] = [];
      const alice = TwistedEd25519PrivateKey.generate();

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(bitWidth);
        const encrypted = TwistedElGamal.encryptWithPK(x, alice.publicKey());

        const start = performance.now();
        const result = await TwistedElGamal.decryptWithPK(encrypted, alice);
        const elapsed = performance.now() - start;

        times.push(elapsed);
        expect(result).toBe(x);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        algorithm: `WASM`,
        bitWidth,
        iterations: BENCHMARK_ITERATIONS,
        avgMs: avg,
        minMs: Math.min(...times),
        maxMs: Math.max(...times),
      };
    };

    it("benchmarks 16-bit DLP", async () => {
      const result = await benchmarkWasm(16);
      console.log(formatResult(result));
    });

    it("benchmarks 32-bit DLP", async () => {
      const result = await benchmarkWasm(32);
      console.log(formatResult(result));
    });
  });
});

// ============================================================================
// Baby-Step Giant-Step Tests (TypeScript)
// ============================================================================

describe("Baby-Step Giant-Step (TypeScript)", () => {
  let solver: BsgsSolver;

  beforeAll(async () => {
    solver = new BsgsSolver();
    await solver.initialize([16, 32]);
  });

  describe.skip("createBsgsTable", () => {
    it("creates correct table for 16-bit DLPs", () => {
      const table16 = createBsgsTable(16);
      expect(table16.bitWidth).toBe(16);
      expect(table16.m).toBe(256n);
      expect(table16.babySteps.size).toBe(256);
    });

    it("throws for odd bit widths", () => {
      expect(() => createBsgsTable(15)).toThrow("bitWidth must be even");
    });

    it("throws for non-positive bit widths", () => {
      expect(() => createBsgsTable(0)).toThrow("bitWidth must be positive");
      expect(() => createBsgsTable(-2)).toThrow("bitWidth must be positive");
    });
  });

  describe("BsgsSolver", () => {
    it("solves known 16-bit values correctly", () => {
      for (const x of [0n, 1n, 255n, 256n, 1000n, 65535n]) {
        const P = x === 0n ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(x);
        const result = solver.solve(P.toRawBytes());
        expect(result).toBe(x);
      }
    });

    it("solves random 16-bit values correctly", () => {
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(16);
        const P = x === 0n ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(x);
        const result = solver.solve(P.toRawBytes());
        expect(result).toBe(x);
      }
    });

    it("throws for values outside search space", () => {
      const x = 1n << 32n;
      const P = RistrettoPoint.BASE.multiply(x);
      expect(() => solver.solve(P.toRawBytes())).toThrow();
    });

    it("solves using smallest sufficient table", () => {
      expect(solver.hasTable(16)).toBe(true);
      expect(solver.hasTable(32)).toBe(true);

      const x1 = 100n;
      const P1 = RistrettoPoint.BASE.multiply(x1);
      expect(solver.solve(P1.toRawBytes())).toBe(x1);

      const x2 = 100000n;
      const P2 = RistrettoPoint.BASE.multiply(x2);
      expect(solver.solve(P2.toRawBytes())).toBe(x2);
    });
  });

  describe("benchmarks", () => {
    it("benchmarks 16-bit DLP", () => {
      const times: number[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(16);
        const P = x === 0n ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(x);

        const start = performance.now();
        const result = solver.solve(P.toRawBytes());
        const elapsed = performance.now() - start;

        times.push(elapsed);
        expect(result).toBe(x);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(
        `TS BSGS 16-bit: avg=${avg.toFixed(2)}ms, min=${Math.min(...times).toFixed(2)}ms, max=${Math.max(...times).toFixed(2)}ms`,
      );
    });

    it("benchmarks 32-bit DLP", () => {
      const times: number[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const x = generateRandomInteger(32);
        const P = x === 0n ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(x);

        const start = performance.now();
        const result = solver.solve(P.toRawBytes());
        const elapsed = performance.now() - start;

        times.push(elapsed);
        expect(result).toBe(x);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(
        `TS BSGS 32-bit: avg=${avg.toFixed(2)}ms, min=${Math.min(...times).toFixed(2)}ms, max=${Math.max(...times).toFixed(2)}ms`,
      );
    });
  });
});

// ============================================================================
// Chunking Utilities (for balance decomposition)
// ============================================================================

describe.skip("maximalRadixChunks", () => {
  it("correctly decomposes and recomposes random 128-bit values", () => {
    const v = generateRandomInteger(128);
    const chunks = maximalRadixChunks(v, 16, 128, 32);

    const vBitWidth = v === 0n ? 0 : v.toString(2).length;
    const bitWidths = chunks.map((c) => (c === 0n ? 0 : c.toString(2).length));
    console.log(`v=${v} (${vBitWidth} bits), num chunks=${chunks.length}, chunk bit widths=[${bitWidths.join(", ")}]`);

    expect(chunks.length).toBe(8);

    for (const c of chunks) {
      expect(c >= 0n).toBe(true);
      expect(c < 1n << 32n).toBe(true);
    }

    expect(recompose(chunks, 16)).toBe(v);

    // local maximality check
    for (let i = 0; i < 7; i++) {
      const saturated = chunks[i] + (1n << 16n) > (1n << 32n) - 1n;
      const noBorrow = chunks[i + 1] === 0n;
      expect(saturated || noBorrow).toBe(true);
    }
  });

  const testDecomposition = (v: bigint, vMaxBits: number) => {
    const chunks = maximalRadixChunks(v, 16, vMaxBits, 32);
    const vBitWidth = v === 0n ? 0 : v.toString(2).length;
    const bitWidths = chunks.map((c) => (c === 0n ? 0 : c.toString(2).length));
    console.log(`v=${v} (${vBitWidth} bits), num chunks=${chunks.length}, chunk bit widths=[${bitWidths.join(", ")}]`);
    expect(recompose(chunks, 16)).toBe(v);
  };

  it("handles zero correctly", () => testDecomposition(0n, 128));
  it("handles 32-bit values correctly", () => testDecomposition(generateRandomInteger(32), 32));
  it("handles 48-bit values correctly", () => testDecomposition(generateRandomInteger(48), 48));
  it("handles 64-bit values correctly", () => testDecomposition(generateRandomInteger(64), 64));
  it("handles 96-bit values correctly", () => testDecomposition(generateRandomInteger(96), 96));
  it("handles the maximum 128-bit value correctly", () => testDecomposition((1n << 128n) - 1n, 128));

  it("throws if v does not fit in v_max_bits", () => {
    expect(() => maximalRadixChunks(1n << 128n, 16, 128, 32)).toThrow();
  });
});
