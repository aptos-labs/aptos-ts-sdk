// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { H_RISTRETTO, RistrettoPoint } from "../twistedEd25519";
import {
  genSigmaProofVeiledTransfer,
  genSigmaProofVeiledWithdraw,
  SigmaProofVeiledTransferInputs,
  SigmaProofVeiledTransferOutputs,
  SigmaProofVeiledWithdrawInputs,
  verifySigmaProofVeiledTransfer,
  VerifySigmaProofVeiledTransferInputs,
  verifySigmaProofVeiledWithdraw,
  VerifySigmaProofVeiledWithdrawInputs,
} from "./sigmaProofs";

import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";
import { toTwistedEd25519PrivateKey } from "./helpers";
import { ed25519GenRandom } from "../utils";

export interface VeiledWithdrawProof {
  sigma: Uint8Array;
  range: Uint8Array;
}
export interface VeiledTransferProof {
  sigma: Uint8Array;
  rangeAmount: Uint8Array;
  rangeNewBalance: Uint8Array;
}

export type ProofVeiledWithdrawInputs = SigmaProofVeiledWithdrawInputs;
export type ProofVeiledTransferInputs = SigmaProofVeiledTransferInputs;

export interface VeiledTransferProofOutputs extends Omit<SigmaProofVeiledTransferOutputs, "proof"> {
  proof: VeiledTransferProof;
}

export interface VerifyProofVeiledWithdrawInputs extends Omit<VerifySigmaProofVeiledWithdrawInputs, "proof"> {
  proof: VeiledWithdrawProof;
  rangeProofCommitment: Uint8Array;
}

export interface VerifyProofVeiledTransferInputs extends Omit<VerifySigmaProofVeiledTransferInputs, "proof"> {
  proof: VeiledTransferProof;
}

/**
 * Generates sigma and range Zero Knowledge Proof for withdraw from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of withdraw
 * @param opts.changedBalance Balance after withdraw
 */
export async function genProofVeiledWithdraw(opts: ProofVeiledWithdrawInputs): Promise<VeiledWithdrawProof> {
  const privateKey = toTwistedEd25519PrivateKey(opts.privateKey);
  const sigmaProof = genSigmaProofVeiledWithdraw(opts);
  const rangeProof = await generateRangeZKP({
    v: opts.changedBalance,
    r: privateKey.toUint8Array(),
    valBase: RistrettoPoint.BASE.toRawBytes(),
    randBase: opts.encryptedBalance.D.toRawBytes(),
  });

  return {
    sigma: sigmaProof,
    range: rangeProof.proof,
  };
}

/**
 * Generate sigma and range Zero Knowledge Proof for transfer
 *
 * @param opts.senderPrivateKey Sender private key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of transfer
 * @param opts.changedSenderBalance Balance after transfer
 * @param opts.auditorPublicKeys The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.random Random 32 bytes (Uint8Array)
 */
export async function genProofVeiledTransfer(opts: ProofVeiledTransferInputs): Promise<VeiledTransferProofOutputs> {
  if (opts.random !== undefined && opts.random < 0n && opts.random > ed25519.CURVE.n)
    throw new Error(`The random must be in the range 0n to ${ed25519.CURVE.n - 1n}`);

  const random = opts.random ?? ed25519GenRandom();
  const senderPrivateKey = toTwistedEd25519PrivateKey(opts.senderPrivateKey);

  const {
    proof: sigmaProof,
    encryptedAmountBySender,
    maskedRecipientPublicKey,
    maskedAuditorsPublicKeys,
  } = genSigmaProofVeiledTransfer({ ...opts, random });

  const [rangeProofAmount, rangeProofNewBalance] = await Promise.all([
    generateRangeZKP({
      v: opts.amount,
      r: numberToBytesLE(random, 32),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    }),
    generateRangeZKP({
      v: opts.changedSenderBalance,
      r: senderPrivateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.encryptedSenderBalance.D.subtract(encryptedAmountBySender.D).toRawBytes(),
    }),
  ]);

  return {
    proof: {
      sigma: sigmaProof,
      rangeAmount: rangeProofAmount.proof,
      rangeNewBalance: rangeProofNewBalance.proof,
    },
    encryptedAmountBySender,
    maskedRecipientPublicKey,
    maskedAuditorsPublicKeys,
  };
}

/**
 * Verify sigma and range Zero Knowledge Proof of withdraw from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.encryptedBalance Encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of withdraw
 * @param opts.proof.sigma Sigma proof of veiled withdraw
 * @param opts.proof.range Range proof of veiled withdraw
 */
export async function verifyProofVeiledWithdraw(opts: VerifyProofVeiledWithdrawInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledWithdraw({
    publicKey: opts.publicKey,
    encryptedBalance: opts.encryptedBalance,
    amount: opts.amount,
    proof: opts.proof.sigma,
  });

  const isRangeProofValid = await verifyRangeZKP({
    proof: opts.proof.range,
    commitment: opts.rangeProofCommitment,
    valBase: RistrettoPoint.BASE.toRawBytes(),
    randBase: opts.encryptedBalance.D.toRawBytes(),
  });

  return isSigmaProofValid && isRangeProofValid;
}

/**
 * Verify sigma and range Zero Knowledge Proof of veiled transfer
 *
 * @param opts.senderPublicKey Sender public key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Encrypted sender balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.encryptedAmountBySender Amount of transfer encrypted by sender using Twisted ElGamal
 * @param opts.maskedRecipientPublicKey The recipient's public key multiplied by the randomness used to encrypt the amount being sent
 * @param opts.proof.sigma Sigma proof for veiled transfer
 * @param opts.proof.rangeAmount Range proof of amount of transfer
 * @param opts.proof.rangeNewBalance Range proof of sender's new balance after transfer
 * @param opts.auditors.auditorPKs The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.auditors.auditorDecryptionKeys The list of corresponding auditor's decryption keys
 */
export async function verifyProofVeiledTransfer(opts: VerifyProofVeiledTransferInputs): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledTransfer({
    senderPublicKey: opts.senderPublicKey,
    recipientPublicKey: opts.recipientPublicKey,
    encryptedSenderBalance: opts.encryptedSenderBalance,
    encryptedAmountBySender: opts.encryptedAmountBySender,
    maskedRecipientPublicKey: opts.maskedRecipientPublicKey,
    auditors: opts.auditors,
    proof: opts.proof.sigma,
  });

  const rangeProofNewBalanceCommitment = opts.encryptedSenderBalance.C.subtract(opts.encryptedAmountBySender.C);

  const [isRangeProofAmountValid, isRangeProofNewBalanceValid] = await Promise.all([
    verifyRangeZKP({
      proof: opts.proof.rangeAmount,
      commitment: opts.encryptedAmountBySender.C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    }),
    verifyRangeZKP({
      proof: opts.proof.rangeNewBalance,
      commitment: rangeProofNewBalanceCommitment.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.encryptedSenderBalance.D.subtract(opts.encryptedAmountBySender.D).toRawBytes(),
    }),
  ]);

  return isSigmaProofValid && isRangeProofAmountValid && isRangeProofNewBalanceValid;
}
