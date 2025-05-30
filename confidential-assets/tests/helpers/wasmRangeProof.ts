// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, {
  range_proof as rangeProof,
  verify_proof as verifyProof,
  batch_range_proof as batchRangeProof,
  batch_verify_proof as batchVerifyProof,
} from "@cedra-labs/confidential-asset-wasm-bindings/range-proofs";
import {
  BatchRangeProofInputs,
  BatchVerifyRangeProofInputs,
  RangeProofInputs,
  VerifyRangeProofInputs,
} from "../../src";

const RANGE_PROOF_WASM_URL =
  "https://unpkg.com/@cedra-labs/confidential-asset-wasm-bindings@0.0.2/range-proofs/cedra_rp_wasm_bg.wasm";

/**
 * Generate range Zero Knowledge Proof
 *
 * @param opts.v The value to create the range proof for
 * @param opts.r A vector of bytes representing the blinding scalar used to hide the value.
 * @param opts.valBase A vector of bytes representing the generator point for the value.
 * @param opts.randBase A vector of bytes representing the generator point for the randomness.
 * @param opts.bits Bits size of value to create the range proof
 */
export async function generateRangeZKP(opts: RangeProofInputs): Promise<{ proof: Uint8Array; commitment: Uint8Array }> {
  await initWasm({ module_or_path: RANGE_PROOF_WASM_URL });

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
  await initWasm({ module_or_path: RANGE_PROOF_WASM_URL });

  return verifyProof(opts.proof, opts.commitment, opts.valBase, opts.randBase, opts.bits ?? 32);
}

export async function genBatchRangeZKP(
  opts: BatchRangeProofInputs,
): Promise<{ proof: Uint8Array; commitments: Uint8Array[] }> {
  await initWasm({ module_or_path: RANGE_PROOF_WASM_URL });

  const proof = batchRangeProof(new BigUint64Array(opts.v), opts.rs, opts.val_base, opts.rand_base, opts.num_bits);

  return {
    proof: proof.proof(),
    commitments: proof.comms(),
  };
}

export async function verifyBatchRangeZKP(opts: BatchVerifyRangeProofInputs): Promise<boolean> {
  await initWasm({ module_or_path: RANGE_PROOF_WASM_URL });

  return batchVerifyProof(opts.proof, opts.comm, opts.val_base, opts.rand_base, opts.num_bits);
}
