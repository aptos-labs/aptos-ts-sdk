// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { H_RISTRETTO, RistrettoPoint } from "../twistedEd25519";
import {
  genSigmaProofVeiledKeyRotation,
  genSigmaProofVeiledNormalization,
  genSigmaProofVeiledTransfer,
  genSigmaProofVeiledWithdraw,
  SigmaProofVeiledKeyRotationInputs,
  SigmaProofVeiledKeyRotationOutputs,
  SigmaProofVeiledNormalizationInputs,
  SigmaProofVeiledNormalizationOutputs,
  SigmaProofVeiledTransferInputs,
  SigmaProofVeiledTransferOutputs,
  SigmaProofVeiledWithdrawInputs,
  SigmaProofVeiledWithdrawOutputs,
  verifySigmaProofVeiledKeyRotation,
  VerifySigmaProofVeiledKeyRotationInputs,
  verifySigmaProofVeiledNormalization,
  VerifySigmaProofVeiledNormalizationInputs,
  verifySigmaProofVeiledTransfer,
  VerifySigmaProofVeiledTransferInputs,
  verifySigmaProofVeiledWithdraw,
  VerifySigmaProofVeiledWithdrawInputs,
} from "./sigmaProofs";

import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";
import { amountToChunks, toTwistedEd25519PrivateKey } from "./helpers";
import { VEILED_BALANCE_CHUNK_SIZE } from "./consts";
import { ed25519GenListOfRandom } from "../utils";

export interface VeiledWithdrawProof {
  sigma: Uint8Array;
  range: Uint8Array[];
}
export interface VeiledTransferProof {
  sigma: Uint8Array;
  rangeAmount: Uint8Array[];
  rangeNewBalance: Uint8Array[];
}

export interface VeiledKeyRotationProof {
  sigma: Uint8Array;
  range: Uint8Array[];
}

export interface VeiledNormalizationProof {
  sigma: Uint8Array;
  range: Uint8Array[];
}

export type ProofVeiledWithdrawInputs = SigmaProofVeiledWithdrawInputs;
export type ProofVeiledTransferInputs = SigmaProofVeiledTransferInputs;
export type ProofVeiledKeyRotationInputs = SigmaProofVeiledKeyRotationInputs;
export type ProofVeiledNormalizationInputs = SigmaProofVeiledNormalizationInputs;

export interface VeiledWithdrawProofOutputs extends Omit<SigmaProofVeiledWithdrawOutputs, "proof"> {
  proof: VeiledWithdrawProof;
}
export interface VeiledTransferProofOutputs extends Omit<SigmaProofVeiledTransferOutputs, "proof"> {
  proof: VeiledTransferProof;
}
export interface VeiledKeyRotationProofOutputs extends Omit<SigmaProofVeiledKeyRotationOutputs, "proof"> {
  proof: VeiledKeyRotationProof;
}
export interface VeiledNormalizationProofOutputs extends Omit<SigmaProofVeiledNormalizationOutputs, "proof"> {
  proof: VeiledKeyRotationProof;
}

export interface VerifyProofVeiledWithdrawInputs extends Omit<VerifySigmaProofVeiledWithdrawInputs, "proof"> {
  proof: VeiledWithdrawProof;
}
export interface VerifyProofVeiledTransferInputs extends Omit<VerifySigmaProofVeiledTransferInputs, "proof"> {
  proof: VeiledTransferProof;
}
export interface VerifyProofVeiledKeyRotationInputs extends Omit<VerifySigmaProofVeiledKeyRotationInputs, "proof"> {
  proof: VeiledKeyRotationProof;
}
export interface VerifyProofVeiledNormalizationInputs extends Omit<VerifySigmaProofVeiledNormalizationInputs, "proof"> {
  proof: VeiledNormalizationProof;
}
/**
 * Generates Zero Knowledge Proof for withdraw from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of withdraw
 * @param opts.changedBalance Balance after withdraw
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export async function genProofVeiledWithdraw(opts: ProofVeiledWithdrawInputs): Promise<VeiledWithdrawProofOutputs> {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const randomness = opts.randomness ?? ed25519GenListOfRandom()

  const privateKey = toTwistedEd25519PrivateKey(opts.privateKey);
  const { proof: sigmaProof, newEncryptedBalance } = genSigmaProofVeiledWithdraw({...opts, randomness});
  const rangeProof = await Promise.all(
    amountToChunks(opts.changedBalance, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) => generateRangeZKP({
      v: chunk,
      r: privateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: newEncryptedBalance[i].D.toRawBytes(),
    }))
  ) ;

  return {
    proof: {
      sigma: sigmaProof,
      range: rangeProof.map(({ proof }) => proof),
    },
    newEncryptedBalance,
  };
}

/**
 * Generate Zero Knowledge Proof for transfer between veiled balances
 *
 * @param opts.senderPrivateKey Sender private key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedBalance Sender's encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of transfer
 * @param opts.changedBalance Sender's balance after transfer
 * @param opts.auditorPublicKeys The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.random Random number less than ed25519.CURVE.n (bigint)
 */
export async function genProofVeiledTransfer(opts: ProofVeiledTransferInputs): Promise<VeiledTransferProofOutputs> {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }

  const randomness = opts.randomness ?? ed25519GenListOfRandom()
  const senderPrivateKey = toTwistedEd25519PrivateKey(opts.senderPrivateKey);

  const {
    proof: sigmaProof,
    encryptedAmountByRecipient,
    newEncryptedBalance,
    maskedAuditorsPublicKeys,
  } = genSigmaProofVeiledTransfer({ ...opts, randomness });

  const rangeProofAmountPromise = Promise.all(
    amountToChunks(opts.amount, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) => generateRangeZKP({
      v: chunk,
      r: numberToBytesLE(randomness[i], 32),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    }))
  )

  const rangeProofNewBalancePromise = Promise.all(
    amountToChunks(opts.changedBalance, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) => generateRangeZKP({
      v: chunk,
      r: senderPrivateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: newEncryptedBalance[i].D.toRawBytes(),
    }))
  )

  const [rangeProofAmount, rangeProofNewBalance] = await Promise.all([
    rangeProofAmountPromise,
    rangeProofNewBalancePromise,
  ])

  return {
    proof: {
      sigma: sigmaProof,
      rangeAmount: rangeProofAmount.map(({ proof }) => proof),
      rangeNewBalance: rangeProofNewBalance.map(({ proof }) => proof),
    },
    encryptedAmountByRecipient,
    newEncryptedBalance,
    maskedAuditorsPublicKeys,
  };
}

/**
 * Generate Zero Knowledge Proof for key rotation
 *
 * @param opts.oldPrivateKey Old private key (Twisted ElGamal Ed25519).
 * @param opts.newPrivateKey New private key (Twisted ElGamal Ed25519).
 * @param opts.balance Decrypted balance
 * @param opts.oldEncryptedBalance Encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export async function genProofVeiledKeyRotation(opts: ProofVeiledKeyRotationInputs): Promise<VeiledKeyRotationProofOutputs> {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const randomness = opts.randomness ?? ed25519GenListOfRandom()

  const privateKey = toTwistedEd25519PrivateKey(opts.newPrivateKey);
  const { proof: sigmaProof, newEncryptedBalance } = genSigmaProofVeiledKeyRotation({...opts, randomness});
  const rangeProof = await Promise.all(
    amountToChunks(opts.balance, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) => generateRangeZKP({
      v: chunk,
      r: privateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: newEncryptedBalance[i].D.toRawBytes(),
    }))
  ) ;

  return {
    proof: {
      sigma: sigmaProof,
      range: rangeProof.map(({ proof }) => proof),
    },
    newEncryptedBalance,
  };
}

/**
 * Generate Zero Knowledge Proof for normalization from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.balance Decrypted balance
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export async function genProofVeiledNormalization(opts: ProofVeiledNormalizationInputs): Promise<VeiledNormalizationProofOutputs> {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const randomness = opts.randomness ?? ed25519GenListOfRandom()

  const privateKey = toTwistedEd25519PrivateKey(opts.privateKey);
  const { proof: sigmaProof, normalizedEncryptedBalance } = genSigmaProofVeiledNormalization({...opts, randomness});
  const rangeProof = await Promise.all(
    amountToChunks(opts.balance, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) => generateRangeZKP({
      v: chunk,
      r: privateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: normalizedEncryptedBalance[i].D.toRawBytes(),
    }))
  ) ;

  return {
    proof: {
      sigma: sigmaProof,
      range: rangeProof.map(({ proof }) => proof),
    },
    normalizedEncryptedBalance,
  };
}

/**
 * Verify Zero Knowledge Proof of withdraw from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.oldEncryptedBalance Original encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Encrypted balance after withdraw (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of withdraw
 * @param opts.proof Zero knowledge subpproofs for veiled transfer
 */
export async function verifyProofVeiledWithdraw(opts: VerifyProofVeiledWithdrawInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledWithdraw({
    publicKey: opts.publicKey,
    oldEncryptedBalance: opts.oldEncryptedBalance,
    newEncryptedBalance: opts.newEncryptedBalance,
    amount: opts.amount,
    proof: opts.proof.sigma,
  });

  const isRangeProofValid = (await Promise.all(
    opts.proof.range.map((proof, i) => verifyRangeZKP({
      proof,
      commitment: opts.newEncryptedBalance[i].C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.newEncryptedBalance[i].D.toRawBytes(),
    }))
  )).every(isValid => isValid)

  return isSigmaProofValid && isRangeProofValid;
}

/**
 * Verify Zero Knowledge Proof of veiled transfer
 *
 * @param opts.senderPublicKey Sender public key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.oldEncryptedBalance Sender's encrypted balance before transfer (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Sender's encrypted balance after transfer (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.encryptedAmountByRecipient Amount of transfer encrypted by recipient using Twisted ElGamal
 * @param opts.proof Zero knowledge Proof for veiled transfer
 * @param opts.auditors.publicKeys The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.auditors.decryptionKeys The list of corresponding auditor's decryption keys
 */
export async function verifyProofVeiledTransfer(opts: VerifyProofVeiledTransferInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledTransfer({
    senderPublicKey: opts.senderPublicKey,
    recipientPublicKey: opts.recipientPublicKey,
    oldEncryptedBalance: opts.oldEncryptedBalance,
    newEncryptedBalance: opts.newEncryptedBalance,
    encryptedAmountByRecipient: opts.encryptedAmountByRecipient,
    auditors: opts.auditors,
    proof: opts.proof.sigma,
  });

  const isRangeProofsValid = (await Promise.all([
    ...opts.proof.rangeAmount.map((proof, i) => verifyRangeZKP({
      proof,
      commitment: opts.encryptedAmountByRecipient[i].C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    })),
    ...opts.proof.rangeNewBalance.map((proof, i) => verifyRangeZKP({
      proof,
      commitment: opts.newEncryptedBalance[i].C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.newEncryptedBalance[i].D.toRawBytes(),
    })),
  ])).every(isValid => isValid);

  return isSigmaProofValid && isRangeProofsValid;
}

/**
 * Verify Zero Knowledge Proof of key rotation
 *
 * @param opts.oldPrivateKey Old public key (Twisted ElGamal Ed25519).
 * @param opts.newPrivateKey New public key (Twisted ElGamal Ed25519).
 * @param opts.oldEncryptedBalance Balance encrypted with previous public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Balance encrypted with new public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.proof Zero Knowledge Proof for veiled balance key rotation
 */
export async function verifyProofVeiledKeyRotation(opts: VerifyProofVeiledKeyRotationInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledKeyRotation({
    oldPublicKey: opts.oldPublicKey,
    newPublicKey: opts.newPublicKey,
    oldEncryptedBalance: opts.oldEncryptedBalance,
    newEncryptedBalance: opts.newEncryptedBalance,
    proof: opts.proof.sigma,
  });

  const isRangeProofValid = (await Promise.all(
    opts.proof.range.map((proof, i) => verifyRangeZKP({
      proof,
      commitment: opts.newEncryptedBalance[i].C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.newEncryptedBalance[i].D.toRawBytes(),
    }))
  )).every(isValid => isValid)

  return isSigmaProofValid && isRangeProofValid;
}

/**
 * Verify Zero Knowledge Proof for normalization from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.encryptedBalance Non-normalized balance encrypted by public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.normalizedEncryptedBalance Normalized balance encrypted by public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.proof Zero Knowledge Proof for veiled normalization
 */
export async function verifyProofVeiledNormalization(opts: VerifyProofVeiledNormalizationInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledNormalization({
    publicKey: opts.publicKey,
    encryptedBalance: opts.encryptedBalance,
    normalizedEncryptedBalance: opts.normalizedEncryptedBalance,
    proof: opts.proof.sigma,
  });

  const isRangeProofValid = (await Promise.all(
    opts.proof.range.map((proof, i) => verifyRangeZKP({
      proof,
      commitment: opts.normalizedEncryptedBalance[i].C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.normalizedEncryptedBalance[i].D.toRawBytes(),
    }))
  )).every(isValid => isValid)

  return isSigmaProofValid && isRangeProofValid;
}
