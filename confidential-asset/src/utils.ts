import { invert, mod } from "@noble/curves/abstract/modular";
import { bytesToNumberBE } from "@noble/curves/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { randomBytes } from "@noble/hashes/utils";

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
 * Generate random number less than order of curve ed25519
 */
export function ed25519GenRandom(): bigint {
  let rand: bigint;
  do {
    rand = bytesToNumberBE(randomBytes(32));
  } while (rand > ed25519.Point.CURVE().n);

  return rand;
}

/**
 * Generate a list of random number less than order of the curve ed25519
 * @param len - chunks count
 */
export function ed25519GenListOfRandom(len: number) {
  return new Array(len).fill(0n).map(() => ed25519GenRandom());
}
