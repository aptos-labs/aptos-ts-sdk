import { EncryptedAmount, TwistedEd25519PrivateKey, TwistedElGamal } from "../../src";
import crypto from "crypto";

const BENCHMARK_ITERATIONS = 10;

function generateRandomInteger(bits: number): bigint {
  if (bits <= 0) return 0n;

  const bytes = Math.ceil(bits / 8);
  const randomBytes = crypto.getRandomValues(new Uint8Array(bytes));

  let result = 0n;
  for (let i = 0; i < bytes; i++) {
    result = (result << 8n) | BigInt(randomBytes[i]);
  }

  // Mask to the requested bit size
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
  bits_per_chunk: number
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

  const RADIX = 1n << BigInt(radix_decomp_bits); // B
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
  // Keep iterating until no more borrowing is possible.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < ell - 1; i++) {
      const room = CHUNK_LIM - w[i];
      if (room < RADIX) continue; // Can't fit another full RADIX unit

      const tCap = room / RADIX; // floor(room / B)
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

/**
 * Benchmarks decryption of a SINGLE twisted ElGamal ciphertext element.
 * This tests the raw Pollard Kangaroo DLP performance for the given bit size.
 */
const benchmarkSingleElementDecryption = async (
  bitsAmount: number,
  length = BENCHMARK_ITERATIONS,
): Promise<{ randBalances: bigint[]; results: { result: bigint; elapsedTime: number }[] }> => {
  const randBalances = Array.from({ length }, () => generateRandomInteger(bitsAmount));

  const decryptedAmounts: { result: bigint; elapsedTime: number }[] = [];

  for (const balance of randBalances) {
    const newAlice = TwistedEd25519PrivateKey.generate();

    const encryptedBalance = TwistedElGamal.encryptWithPK(balance, newAlice.publicKey());

    const startMainTime = performance.now();
    const decryptedBalance = await TwistedElGamal.decryptWithPK(encryptedBalance, newAlice);
    const endMainTime = performance.now();

    const elapsedMainTime = endMainTime - startMainTime;

    decryptedAmounts.push({ result: decryptedBalance, elapsedTime: elapsedMainTime });
  }

  const averageTime = decryptedAmounts.reduce((acc, { elapsedTime }) => acc + elapsedTime, 0) / decryptedAmounts.length;

  const lowestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.min(acc, elapsedTime), Infinity);
  const highestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.max(acc, elapsedTime), 0);

  console.log(
    `Single element decryption (${bitsAmount}-bit):\n`,
    `Average time: ${averageTime.toFixed(2)} ms\n`,
    `Lowest time: ${lowestTime.toFixed(2)} ms\n`,
    `Highest time: ${highestTime.toFixed(2)} ms`,
  );

  return {
    randBalances,
    results: decryptedAmounts,
  };
};

describe("Pollard Kangaroo decryption benchmarks", () => {
  // Initialize kangaroo tables before running benchmarks to avoid
  // counting table computation time in the first iteration
  beforeAll(async () => {
    await TwistedElGamal.initializeKangaroos();
  }, 30000);

  describe("Single element decryption (one DLP per value)", () => {
    it(`16-bit: Should decrypt ${BENCHMARK_ITERATIONS} random values`, async () => {
      const { randBalances, results } = await benchmarkSingleElementDecryption(16);

      results.forEach(({ result }, i) => {
        expect(result).toEqual(randBalances[i]);
      });
    });

    it(`32-bit: Should decrypt ${BENCHMARK_ITERATIONS} random values`, async () => {
      const { randBalances, results } = await benchmarkSingleElementDecryption(32);

      results.forEach(({ result }, i) => {
        expect(result).toEqual(randBalances[i]);
      });
    });

    it.skip(`48-bit: Should decrypt ${BENCHMARK_ITERATIONS} random values (slow)`, async () => {
      const { randBalances, results } = await benchmarkSingleElementDecryption(48);

      results.forEach(({ result }, i) => {
        expect(result).toEqual(randBalances[i]);
      });
    });
  });

  describe("maximalRadixChunks", () => {
    it("correctly decomposes and recomposes random 128-bit values", () => {
      const v = generateRandomInteger(128);

      const chunks = maximalRadixChunks(v, 16, 128, 32);

      const vBitWidth = v === 0n ? 0 : v.toString(2).length;
      const bitWidths = chunks.map((c) => (c === 0n ? 0 : c.toString(2).length));
      console.log(
        `v=${v} (${vBitWidth} bits), num chunks=${chunks.length}, chunk bit widths=[${bitWidths.join(", ")}]`,
      );

      // length: 128 / 16 = 8 chunks
      expect(chunks.length).toBe(8);

      // each chunk fits in 32 bits
      for (const c of chunks) {
        expect(c >= 0n).toBe(true);
        expect(c < 1n << 32n).toBe(true);
      }

      // recomposition correctness
      expect(recompose(chunks, 16)).toBe(v);

      // local maximality:
      // for each i < ell-1, either saturated or no borrow left
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
      console.log(
        `v=${v} (${vBitWidth} bits), num chunks=${chunks.length}, chunk bit widths=[${bitWidths.join(", ")}]`,
      );

      expect(recompose(chunks, 16)).toBe(v);
    };

    it("handles zero correctly", () => {
      testDecomposition(0n, 128);
    });

    it("handles 32-bit values correctly", () => {
      testDecomposition(generateRandomInteger(32), 32);
    });

    it("handles 48-bit values correctly", () => {
      testDecomposition(generateRandomInteger(48), 48);
    });

    it("handles 64-bit values correctly", () => {
      testDecomposition(generateRandomInteger(64), 64);
    });

    it("handles 96-bit values correctly", () => {
      testDecomposition(generateRandomInteger(96), 96);
    });

    it("handles the maximum 128-bit value correctly", () => {
      testDecomposition((1n << 128n) - 1n, 128);
    });

    it("throws if v does not fit in v_max_bits", () => {
      expect(() => maximalRadixChunks(1n << 128n, 16, 128, 32)).toThrow();
    });
  });
});