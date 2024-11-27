// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha512 } from "@noble/hashes/sha512";
import { bytesToNumberLE, concatBytes } from "@noble/curves/abstract/utils";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { HexInput } from "../../../types";
import { ed25519modN } from "../utils";
import { CHUNK_BITS_BI } from "./consts";

/*
 * Transform public keys to Uint8Array
 */
export function publicKeyToU8(pk: TwistedEd25519PublicKey | HexInput): Uint8Array {
  const publicKey = ArrayBuffer.isView(pk) || typeof pk === "string" ? new TwistedEd25519PublicKey(pk) : pk;
  return publicKey.toUint8Array();
}

/*
 * Transform private keys to TwistedEd25519PrivateKey
 */
export function toTwistedEd25519PrivateKey(pk: TwistedEd25519PrivateKey | HexInput): TwistedEd25519PrivateKey {
  return ArrayBuffer.isView(pk) || typeof pk === "string" ? new TwistedEd25519PrivateKey(pk) : pk;
}

/*
 * Generate Fiat-Shamir challenge
 */
export function genFiatShamirChallenge(...arrays: Uint8Array[]): bigint {
  const hash = sha512(concatBytes(...arrays));
  return ed25519modN(bytesToNumberLE(hash));
}

/**
 * Returns the original amount from the provided chunks,
 * where each chunk is represented as a 32 bit number
 * 
 * amount = a0 + a1 * (2 ** 32) + a2 * (2 ** 64) ... a_i * (2 ** 32 * i)
 */
export function chunksToAmount (chunks: bigint[]): bigint {
  return chunks.reduce((acc, chunk, i) => acc + chunk * (2n ** (CHUNK_BITS_BI * BigInt(i))), 0n)
}

/**
 * Returns a list of chunks of the given length from the amount, where each chunk is represented as a 32-bit number
 * 
 * @example
 * const amount = 10n + 20n * (2n ** 32n) + 30n (2n ** 64n) + 40n * (2n ** 96n )
 * const chunkedAmount = amountToChunks(a, 4)
 * // an example of the returned data
 * ```
 * chunkedAmount = [10n, 20n, 30n, 40n]
 * ```
 */
export function amountToChunks(amount: bigint, chunksCount: number): bigint[] { 
  const chunksCountBI = BigInt(chunksCount)
  if (amount > (2n ** (chunksCountBI * CHUNK_BITS_BI) - 1n)) {
    throw new Error (`Amount must be less than 2n**${CHUNK_BITS_BI * chunksCountBI}`)
  }

  const chunks = [];
  let a = amount
  for (let i = chunksCount - 1; i >= 0; i -= 1) {
    if (i === 0) {
      chunks[i] = a
    } else {
      const bits = 2n ** (CHUNK_BITS_BI * BigInt(i))
      const aMod = a % bits;
      const chunk = a === aMod ? 0n : (a - aMod) / bits;
      chunks[i] = chunk;
      a = aMod
    }
  }

  return chunks
}