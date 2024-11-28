// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/curves/abstract/utils";
import { VEILED_BALANCE_CHUNK_SIZE } from "./consts";

export interface VeiledWithdrawSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  alpha5List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
}

export interface VeiledTransferSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3List: Uint8Array[];
  alpha4List: Uint8Array[];
  alpha5: Uint8Array;
  alpha6List: Uint8Array[];
  X1: Uint8Array;
  X2List: Uint8Array[];
  X3List: Uint8Array[];
  X4List: Uint8Array[];
  X5: Uint8Array;
  X6List: Uint8Array[];
  X7List?: Uint8Array[];
}

export interface VeiledKeyRotationSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4: Uint8Array;
  alpha5List: Uint8Array[];
  alpha6List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3: Uint8Array;
  X4List: Uint8Array[];
  X5List: Uint8Array[];
}

export interface VeiledNormalizationSigmaProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  alpha5List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
}

const PROOF_CHUNK_SIZE = 32; // bytes

const SIGMA_PROOF_WITHDRAW_SIZE = PROOF_CHUNK_SIZE * 21; // bytes

const SIGMA_PROOF_TRANSFER_SIZE = PROOF_CHUNK_SIZE * 33; // bytes

const SIGMA_PROOF_KEY_ROTATION_SIZE = PROOF_CHUNK_SIZE * 23; // bytes

const SIGMA_PROOF_NORMALIZATION_SIZE = PROOF_CHUNK_SIZE * 21; // bytes

/**
 * Serializes a sigma proof of veiled withdraw into a single Uint8Array.
 *
 * @param proof - The sigma proof of veiled withdraw to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of veiled withdraw.
 */
export function serializeVeiledWithdrawSigmaProof(proof: VeiledWithdrawSigmaProof): Uint8Array {
  return concatBytes(
    proof.alpha1,
    proof.alpha2,
    proof.alpha3,
    ...proof.alpha4List,
    ...proof.alpha5List,
    proof.X1,
    proof.X2,
    ...proof.X3List,
    ...proof.X4List,
  );
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

  const proofArr: Uint8Array[] = [];
  for (let i = 0; i < SIGMA_PROOF_WITHDRAW_SIZE; i += PROOF_CHUNK_SIZE) {
    proofArr.push(proof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  const alpha1 = proofArr[0];
  const alpha2 = proofArr[1];
  const alpha3 = proofArr[2];
  const alpha4List = proofArr.slice(3, 3 + VEILED_BALANCE_CHUNK_SIZE);
  const alpha5List = proofArr.slice(7, 7 + VEILED_BALANCE_CHUNK_SIZE);
  const X1 = proofArr[11];
  const X2 = proofArr[12];
  const X3List = proofArr.slice(13, 13 + VEILED_BALANCE_CHUNK_SIZE);
  const X4List = proofArr.slice(17);

  return {
    alpha1,
    alpha2,
    alpha3,
    alpha4List,
    alpha5List,
    X1,
    X2,
    X3List,
    X4List,
  };
}

/**
 * Serializes a sigma proof of veiled transfer into a single Uint8Array.
 *
 * @param proof - The sigma proof of veiled transfer to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of veiled transfer.
 */
export function serializeSigmaProofVeiledTransfer(proof: VeiledTransferSigmaProof): Uint8Array {
  return concatBytes(
    proof.alpha1,
    proof.alpha2,
    ...proof.alpha3List,
    ...proof.alpha4List,
    proof.alpha5,
    ...proof.alpha6List,
    proof.X1,
    ...proof.X2List,
    ...proof.X3List,
    ...proof.X4List,
    proof.X5,
    ...proof.X6List,
    ...(proof.X7List ?? []),
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
    throw new Error(`Invalid sigma proof length: the length must be a multiple of ${PROOF_CHUNK_SIZE}`);
  }

  if (proof.length < SIGMA_PROOF_TRANSFER_SIZE) {
    throw new Error(
      `Invalid sigma proof length of veiled transfer: got ${proof.length}, expected minimum ${SIGMA_PROOF_TRANSFER_SIZE}`,
    );
  }

  const baseProof = proof.slice(0, SIGMA_PROOF_TRANSFER_SIZE);

  const X7List: Uint8Array[] = [];
  const baseProofArray: Uint8Array[] = [];

  for (let i = 0; i < SIGMA_PROOF_TRANSFER_SIZE; i += PROOF_CHUNK_SIZE) {
    baseProofArray.push(baseProof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  if (proof.length > SIGMA_PROOF_TRANSFER_SIZE) {
    const auditorsPartLength = proof.length - SIGMA_PROOF_TRANSFER_SIZE;
    const auditorsPart = proof.slice(SIGMA_PROOF_TRANSFER_SIZE);

    for (let i = 0; i < auditorsPartLength; i += PROOF_CHUNK_SIZE) {
      X7List.push(auditorsPart.subarray(i, i + PROOF_CHUNK_SIZE));
    }
  }

  const alpha1 = baseProofArray[0];
  const alpha2 = baseProofArray[1];
  const alpha3List = baseProofArray.slice(2, 2+ VEILED_BALANCE_CHUNK_SIZE);
  const alpha4List = baseProofArray.slice(6, 6 + VEILED_BALANCE_CHUNK_SIZE);
  const alpha5 = baseProofArray[10]
  const alpha6List = baseProofArray.slice(11, 11 + VEILED_BALANCE_CHUNK_SIZE);
  const X1 = baseProofArray[15];
  const X2List = baseProofArray.slice(16, 16 + VEILED_BALANCE_CHUNK_SIZE);
  const X3List = baseProofArray.slice(20, 20 + VEILED_BALANCE_CHUNK_SIZE);
  const X4List = baseProofArray.slice(24, 24 + VEILED_BALANCE_CHUNK_SIZE);
  const X5 = baseProofArray[28];
  const X6List = baseProofArray.slice(29);


  return {
    alpha1,
    alpha2,
    alpha3List,
    alpha4List,
    alpha5,
    alpha6List,
    X1,
    X2List,
    X3List,
    X4List,
    X5,
    X6List,
    X7List,
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
    proof.alpha1,
    proof.alpha2,
    proof.alpha3,
    proof.alpha4,
    ...proof.alpha5List,
    ...proof.alpha6List,
    proof.X1,
    proof.X2,
    proof.X3,
    ...proof.X4List,
    ...proof.X5List,
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

  const proofArr: Uint8Array[] = [];
  for (let i = 0; i < SIGMA_PROOF_KEY_ROTATION_SIZE; i += PROOF_CHUNK_SIZE) {
    proofArr.push(proof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  const alpha1 = proofArr[0];
  const alpha2 = proofArr[1];
  const alpha3 = proofArr[2];
  const alpha4 = proofArr[3];
  const alpha5List = proofArr.slice(4, 4 + VEILED_BALANCE_CHUNK_SIZE);
  const alpha6List = proofArr.slice(8, 8 + VEILED_BALANCE_CHUNK_SIZE);
  const X1 = proofArr[12];
  const X2 = proofArr[13];
  const X3 = proofArr[14];
  const X4List = proofArr.slice(15, 15 + VEILED_BALANCE_CHUNK_SIZE);
  const X5List = proofArr.slice(19);

  return {
    alpha1,
    alpha2,
    alpha3,
    alpha4,
    alpha5List,
    alpha6List,
    X1,
    X2,
    X3,
    X4List,
    X5List,
  };
}



/**
 * Serializes a sigma proof of normalization of veiled balance into a single Uint8Array.
 *
 * @param proof - The sigma proof of normalization of veiled balance to serialize.
 * @returns A Uint8Array containing the serialized sigma proof of normalization of veiled balance.
 */
export function serializeSigmaProofVeiledNormalization(proof: VeiledNormalizationSigmaProof): Uint8Array {
  return concatBytes(
    proof.alpha1,
    proof.alpha2,
    proof.alpha3,
    ...proof.alpha4List,
    ...proof.alpha5List,
    proof.X1,
    proof.X2,
    ...proof.X3List,
    ...proof.X4List,
  );
}

/**
 * Deserializes a Uint8Array containing a sigma proof of normalization of veiled into a VeiledKeyRotationProof object.
 *
 * @param proof - The Uint8Array containing the serialized sigma proof of normalization of veiled.
 * @returns A VeiledNormalizationProof object containing the deserialized sigma proof of normalization of veiled.
 */
export function deserializeSigmaProofVeiledNormalization(proof: Uint8Array): VeiledNormalizationSigmaProof {
  if (proof.length !== SIGMA_PROOF_NORMALIZATION_SIZE) {
    throw new Error(
      `Invalid sigma proof length of veiled normalization: got ${proof.length}, expected ${SIGMA_PROOF_NORMALIZATION_SIZE}`,
    );
  }

  const proofArr: Uint8Array[] = [];
  for (let i = 0; i < SIGMA_PROOF_NORMALIZATION_SIZE; i += PROOF_CHUNK_SIZE) {
    proofArr.push(proof.subarray(i, i + PROOF_CHUNK_SIZE));
  }

  const alpha1 = proofArr[0];
  const alpha2 = proofArr[1];
  const alpha3 = proofArr[2];
  const alpha4List = proofArr.slice(3, 3 + VEILED_BALANCE_CHUNK_SIZE);
  const alpha5List = proofArr.slice(7, 7 + VEILED_BALANCE_CHUNK_SIZE);
  const X1 = proofArr[11];
  const X2 = proofArr[12];
  const X3List = proofArr.slice(13, 13 + VEILED_BALANCE_CHUNK_SIZE);
  const X4List = proofArr.slice(17);

  return {
    alpha1,
    alpha2,
    alpha3,
    alpha4List,
    alpha5List,
    X1,
    X2,
    X3List,
    X4List,
  };
}
