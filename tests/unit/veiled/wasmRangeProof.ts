// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, {
  range_proof as rangeProof,
  verify_proof as verifyProof,
} from "@distributedlab/aptos-wasm-bindings/range-proofs";

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

const RANGE_PROOF_WASM_URL = "https://unpkg.com/@distributedlab/aptos-wasm-bindings/range-proofs/aptos_rp_wasm_bg.wasm";

/**
 * Generate range Zero Knowledge Proof
 *
 * @param opts.v The value to create the range proof for
 * @param opts.r A vector of bytes representing the blinding scalar used to hide the value.
 * @param opts.valBase A vector of bytes representing the generator point for the value.
 * @param opts.randBase A vector of bytes representing the generator point for the randomness.
 * @param opts.bits Bits size of value to create the range proof
 */
export async function generateRangeZKP(opts: RangeProofInputs) {
  await initWasm(RANGE_PROOF_WASM_URL);
  const proof = rangeProof(opts.v, opts.r, opts.valBase, opts.randBase, opts.bits ?? 32);

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
export async function verifyRangeZKP(opts: VerifyRangeProofInputs) {
  await initWasm(RANGE_PROOF_WASM_URL);

  return verifyProof(opts.proof, opts.commitment, opts.valBase, opts.randBase, opts.bits ?? 32);
}
