// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  ensureWasmInitialized,
  initializeWasm,
  rangeProofWasm,
  verifyProofWasm,
  batchRangeProofWasm,
  batchVerifyProofWasm,
} from "./wasmLoader";

/**
 * Initialize range proof WASM module.
 * @param wasmSource - Optional WASM source: URL string, or Buffer/ArrayBuffer for Node.js
 * @deprecated Use initializeWasm() from wasmLoader instead for unified initialization
 */
export async function initializeRangeProofWasm(wasmSource?: string | BufferSource) {
  await initializeWasm(wasmSource);
}

export interface RangeProofInputs {
  v: bigint;
  r: Uint8Array;
  valBase: Uint8Array;
  randBase: Uint8Array;
  bits?: number;
}

export interface VerifyRangeProofInputs {
  proof: Uint8Array;
  commitment: Uint8Array;
  valBase: Uint8Array;
  randBase: Uint8Array;
  bits?: number;
}

export interface BatchRangeProofInputs {
  v: bigint[];
  rs: Uint8Array[];
  val_base: Uint8Array;
  rand_base: Uint8Array;
  num_bits: number;
}

export interface BatchVerifyRangeProofInputs {
  proof: Uint8Array;
  comm: Uint8Array[];
  val_base: Uint8Array;
  rand_base: Uint8Array;
  num_bits: number;
}

export class RangeProofExecutor {
  /**
   * Generate range Zero Knowledge Proof
   *
   * @param opts.v The value to create the range proof for
   * @param opts.r A vector of bytes representing the blinding scalar used to hide the value.
   * @param opts.valBase A vector of bytes representing the generator point for the value.
   * @param opts.randBase A vector of bytes representing the generator point for the randomness.
   * @param opts.bits Bits size of value to create the range proof
   */
  static async generateRangeZKP(opts: RangeProofInputs): Promise<{ proof: Uint8Array; commitment: Uint8Array }> {
    await ensureWasmInitialized();

    const proof = rangeProofWasm(opts.v, opts.r, opts.valBase, opts.randBase, opts.bits ?? 32);

    return {
      proof: proof.proof(),
      commitment: proof.comm(),
    };
  }

  /**
   * Verify range Zero Knowledge Proof
   *
   * @param opts.proof A vector of bytes representing the serialized range proof to be verified.
   * @param opts.commitment A vector of bytes representing the Pedersen commitment the range proof is generated for.
   * @param opts.valBase A vector of bytes representing the generator point for the value.
   * @param opts.randBase A vector of bytes representing the generator point for the randomness.
   * @param opts.bits Bits size of the value for range proof
   */
  static async verifyRangeZKP(opts: VerifyRangeProofInputs): Promise<boolean> {
    await ensureWasmInitialized();

    return verifyProofWasm(opts.proof, opts.commitment, opts.valBase, opts.randBase, opts.bits ?? 32);
  }

  /**
   * Generate batch range Zero Knowledge Proof for multiple values
   *
   * @param opts.v Array of values to create the range proofs for
   * @param opts.rs Array of blinding scalars used to hide the values
   * @param opts.val_base A vector of bytes representing the generator point for the value
   * @param opts.rand_base A vector of bytes representing the generator point for the randomness
   * @param opts.num_bits Bits size of values to create the range proof
   */
  static async genBatchRangeZKP(
    opts: BatchRangeProofInputs,
  ): Promise<{ proof: Uint8Array; commitments: Uint8Array[] }> {
    await ensureWasmInitialized();

    const proof = batchRangeProofWasm(
      new BigUint64Array(opts.v),
      opts.rs,
      opts.val_base,
      opts.rand_base,
      opts.num_bits,
    );

    return {
      proof: proof.proof(),
      commitments: proof.comms(),
    };
  }

  /**
   * Verify batch range Zero Knowledge Proof for multiple values
   *
   * @param opts.proof A vector of bytes representing the serialized range proof to be verified.
   * @param opts.comm Array of vectors of bytes representing the Pedersen commitments the range proofs are generated for.
   * @param opts.val_base A vector of bytes representing the generator point for the value.
   * @param opts.rand_base A vector of bytes representing the generator point for the randomness.
   * @param opts.num_bits Bits size of values to create the range proof
   */
  static async verifyBatchRangeZKP(opts: BatchVerifyRangeProofInputs): Promise<boolean> {
    await ensureWasmInitialized();

    return batchVerifyProofWasm(opts.proof, opts.comm, opts.val_base, opts.rand_base, opts.num_bits);
  }
}
