import { invert, mod } from "@noble/curves/abstract/modular.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { randomBytes } from "@noble/hashes/utils.js";

/*
 * Number modulo order of curve ed25519
 */
export function ed25519modN(a: bigint): bigint {
  return mod(a, ed25519.Point.CURVE().n);
}

/*
 * Inverses number over modulo of curve ed25519
 */
export function ed25519InvertN(a: bigint): bigint {
  return invert(a, ed25519.Point.CURVE().n);
}

/*
 * Generate random number less than order of curve ed25519 (i.e. in [0, n)).
 */
export function ed25519GenRandom(): bigint {
  const n = ed25519.Point.CURVE().n;
  let rand: bigint;
  do {
    rand = bytesToNumberBE(randomBytes(32));
  } while (rand >= n);

  return rand;
}

/**
 * Generate a list of random number less than order of the curve ed25519
 * @param len - chunks count
 */
export function ed25519GenListOfRandom(len: number) {
  return new Array(len).fill(0n).map(() => ed25519GenRandom());
}

/**
 * Convert bytes to a BigInt key for fast Map lookups.
 * Uses little-endian interpretation of the full 32 bytes.
 */
export function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}
