// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/curves/abstract/utils";

export interface VeiledWithdrawSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  X1: Uint8Array;
  X2: Uint8Array;
}

export interface VeiledTransferSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4: Uint8Array;
  alpha5: Uint8Array;
  X1: Uint8Array;
  X2: Uint8Array;
  X3: Uint8Array;
  X4: Uint8Array;
  X5: Uint8Array;
  auditorsX?: Uint8Array[];
}

export interface VeiledKeyRotationSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4: Uint8Array;
  alpha5: Uint8Array;
  X1: Uint8Array;
  X2: Uint8Array;
  X3: Uint8Array;
  X4: Uint8Array;
}

const PROOF_CHUNK_SIZE = 32; // bytes

const SIGMA_PROOF_WITHDRAW_SIZE = PROOF_CHUNK_SIZE * 5; // bytes

const SIGMA_PROOF_TRANSFER_SIZE = PROOF_CHUNK_SIZE * 10; // bytes

const SIGMA_PROOF_KEY_ROTATION_SIZE = PROOF_CHUNK_SIZE * 9; // bytes

/**
 * Serializes a sigma proof of veiled withdraw into a single Uint8Array.
 *
 * @param proof - The sigma proof of veiled withdraw to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of veiled withdraw.
 */
export function serializeVeiledWithdrawSigmaProof(proof: VeiledWithdrawSigmaProof): Uint8Array {
  return concatBytes(proof.X2, proof.X1, proof.alpha3, proof.alpha2, proof.alpha1);
}

/**
 * Deserializes a Uint8Array containing a sigma proof of veiled withdraw into a VeiledWithdrawSigmaProof object.
 *
 * @param proof - The Uint8Array containing the serialized sigma proof of veiled withdraw.
 * @returns A VeiledWithdrawSigmaProof object containing the deserialized sigma proof of veiled withdraw.
 */
export function deserializeSigmaProofVeiledWithdraw(proof: Uint8Array): VeiledWithdrawSigmaProof {
  if (proof.length !== SIGMA_PROOF_WITHDRAW_SIZE) {
    throw new Error(
      `Invalid sigma proof length of veiled withdraw: got ${proof.length}, expected ${SIGMA_PROOF_WITHDRAW_SIZE}`,
    );
  }

  const array: Uint8Array[] = [];
  for (let i = 0; i < SIGMA_PROOF_WITHDRAW_SIZE; i += PROOF_CHUNK_SIZE) {
    array.push(proof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  const [X2, X1, alpha3, alpha2, alpha1] = array;

  return {
    X2,
    X1,
    alpha3,
    alpha2,
    alpha1,
  };
}

/**
 * Serializes a sigma proof of veiled transfer into a single Uint8Array.
 *
 * @param proof - The sigma proof of veiled transfer to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of veiled transfer.
 */
export function serializeSigmaProofVeiledTransfer(proof: VeiledTransferSigmaProof): Uint8Array {
  const auditorsX = proof.auditorsX ?? [];

  return concatBytes(
    ...auditorsX,
    proof.X5,
    proof.X4,
    proof.X3,
    proof.X2,
    proof.X1,
    proof.alpha5,
    proof.alpha4,
    proof.alpha3,
    proof.alpha2,
    proof.alpha1,
  );
}

/**
 * Deserializes a Uint8Array containing a sigma proof of veiled transfer into a VeiledTransferProof object.
 *
 * @param proof - The Uint8Array containing the serialized sigma proof of veiled transfer.
 * @returns A VeiledTransferProof object containing the deserialized sigma proof of transfer.
 */
export function deserializeSigmaProofVeiledTransfer(proof: Uint8Array): VeiledTransferSigmaProof {
  if (proof.length % PROOF_CHUNK_SIZE !== 0) {
    throw new Error(
      `Invalid sigma proof length: the length must be a multiple of ${PROOF_CHUNK_SIZE}`,
    );
  }

  if (proof.length < SIGMA_PROOF_TRANSFER_SIZE) {
    throw new Error(
      `Invalid sigma proof length of veiled transfer: got ${proof.length}, expected ${SIGMA_PROOF_TRANSFER_SIZE}`,
    );
  }

  const baseProof = proof.slice(-SIGMA_PROOF_TRANSFER_SIZE);

  const auditorsX: Uint8Array[] = [];
  const baseProofArray: Uint8Array[] = [];

  for (let i = 0; i < SIGMA_PROOF_TRANSFER_SIZE; i += PROOF_CHUNK_SIZE) {
    baseProofArray.push(baseProof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  if (proof.length > SIGMA_PROOF_TRANSFER_SIZE) {
    const auditorsPartLength = proof.length - SIGMA_PROOF_TRANSFER_SIZE;
    const auditorsPart = proof.slice(0, auditorsPartLength);

    for (let i = 0; i < auditorsPartLength; i += PROOF_CHUNK_SIZE) {
      auditorsX.push(auditorsPart.subarray(i, i + PROOF_CHUNK_SIZE));
    }
  }

  const [X5, X4, X3, X2, X1, alpha5, alpha4, alpha3, alpha2, alpha1] = baseProofArray;

  return {
    auditorsX,
    X5,
    X4,
    X3,
    X2,
    X1,
    alpha5,
    alpha4,
    alpha3,
    alpha2,
    alpha1,
  };
}

/**
 * Serializes a sigma proof of key rotation of veiled balance into a single Uint8Array.
 *
 * @param proof - The sigma proof of key rotation of veiled balance to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of key rotation of veiled balance.
 */
export function serializeSigmaProofVeiledKeyRotation(proof: VeiledKeyRotationSigmaProof): Uint8Array {
  return concatBytes(
    proof.X4,
    proof.X3,
    proof.X2,
    proof.X1,
    proof.alpha5,
    proof.alpha4,
    proof.alpha3,
    proof.alpha2,
    proof.alpha1,
  );
}

/**
 * Deserializes a Uint8Array containing a sigma proof of key rotation of veiled into a VeiledKeyRotationProof object.
 *
 * @param proof - The Uint8Array containing the serialized sigma proof of key rotation of veiled.
 * @returns A VeiledKeyRotationProof object containing the deserialized sigma proof of key rotation of veiled.
 */
export function deserializeSigmaProofVeiledKeyRotation(proof: Uint8Array): VeiledKeyRotationSigmaProof {
  if (proof.length !== SIGMA_PROOF_KEY_ROTATION_SIZE) {
    throw new Error(
      `Invalid sigma proof length of veiled key rotation: got ${proof.length}, expected ${SIGMA_PROOF_KEY_ROTATION_SIZE}`,
    );
  }

  const array: Uint8Array[] = [];
  for (let i = 0; i < SIGMA_PROOF_KEY_ROTATION_SIZE; i += PROOF_CHUNK_SIZE) {
    array.push(proof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  const [X4, X3, X2, X1, alpha5, alpha4, alpha3, alpha2, alpha1] = array;

  return {
    X4,
    X3,
    X2,
    X1,
    alpha5,
    alpha4,
    alpha3,
    alpha2,
    alpha1,
  };
}
