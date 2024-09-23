// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ensureBytes } from "@noble/curves/abstract/utils";
import { randomBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, RistrettoPoint } from "../twistedEd25519";
import { TwistedElGamal } from "../twistedElGamal";
import {
  genSigmaProofVeiledTransfer,
  genSigmaProofVeiledWithdraw,
  SigmaProofVeiledTransferOptions,
  SigmaProofVeiledWithdrawOptions,
  verifySigmaProofVeiledTransfer,
  VerifySigmaProofVeiledTransferOptions,
  verifySigmaProofVeiledWithdraw,
  VerifySigmaProofVeiledWithdrawOptions,
} from "./sigmaProofs";

import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";
import { toTwistedEd25519PrivateKey } from "./helpers";

export interface VeiledWithdrawProofs {
  sigma: Uint8Array;
  range: Uint8Array;
}
export interface VeiledTransferProofs {
  sigma: Uint8Array;
  rangeAmount: Uint8Array;
  rangeNewBalance: Uint8Array;
}

export type ProofsVeiledWithdrawOptions = SigmaProofVeiledWithdrawOptions;
export type ProofsVeiledTransferOptions = SigmaProofVeiledTransferOptions;

export interface VerifyProofsVeiledWithdrawOptions extends Omit<VerifySigmaProofVeiledWithdrawOptions, "proof"> {
  proofs: VeiledWithdrawProofs;
  rangeProofCommitment: Uint8Array;
}
export interface VerifyProofsVeiledTransferOptions extends Omit<VerifySigmaProofVeiledTransferOptions, "proof"> {
  proofs: VeiledTransferProofs;
}

/**
 * Generates sigma and range Zero Knowledge Proofs for withdraw from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of withdraw
 * @param opts.changedBalance Balance after withdraw
 */
export async function genProofsVeiledWithdraw(opts: ProofsVeiledWithdrawOptions): Promise<VeiledWithdrawProofs> {
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
 * Generate sigma and range Zero Knowledge Proofs for transfer
 *
 * @param opts.senderPrivateKey Sender private key (Twisted ElGamal Ed25519).
 * @param opts.receiverPublicKey Receiver public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of transfer
 * @param opts.changedSenderBalance Balance after transfer
 * @param opts.random Random 32 bytes (Uint8Array)
 */
export async function genProofsVeiledTransfer(opts: ProofsVeiledTransferOptions): Promise<VeiledTransferProofs> {
  const rBytes = ensureBytes("Random bytes", opts.random ?? randomBytes(32), 32);
  const senderPrivateKey = toTwistedEd25519PrivateKey(opts.senderPrivateKey);

  const { D: amountD } = TwistedElGamal.encryptWithPK(opts.amount, senderPrivateKey.publicKey(), rBytes);

  const sigmaProof = genSigmaProofVeiledTransfer({
    ...opts,
    random: rBytes,
  });

  const [rangeProofAmount, rangeProofNewBalance] = await Promise.all([
    generateRangeZKP({
      v: opts.amount,
      r: rBytes,
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    }),
    generateRangeZKP({
      v: opts.changedSenderBalance,
      r: senderPrivateKey.toUint8Array(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.encryptedSenderBalance.D.subtract(amountD).toRawBytes(),
    }),
  ]);

  return {
    sigma: sigmaProof,
    rangeAmount: rangeProofAmount.proof,
    rangeNewBalance: rangeProofNewBalance.proof,
  };
}

/**
 * Verify sigma and range Zero Knowledge Proofs of withdraw from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.encryptedBalance Encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of withdraw
 * @param opts.proof.sigma Sigma Zero Knowledge Proof of veiled withdraw
 * @param opts.proof.range Range Zero Knowledge Proof of veiled withdraw
 */
export async function verifyProofsVeiledWithdraw(opts: VerifyProofsVeiledWithdrawOptions): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledWithdraw({
    publicKey: opts.publicKey,
    encryptedBalance: opts.encryptedBalance,
    amount: opts.amount,
    proof: opts.proofs.sigma,
  });

  const isRangeProofValid = await verifyRangeZKP({
    proof: opts.proofs.range,
    commitment: opts.rangeProofCommitment,
    valBase: RistrettoPoint.BASE.toRawBytes(),
    randBase: opts.encryptedBalance.D.toRawBytes(),
  });

  return isSigmaProofValid && isRangeProofValid;
}

/**
 * Verify sigma and range Zero Knowledge Proofs of veiled transfer
 *
 * @param opts.senderPublicKey Sender public key (Twisted ElGamal Ed25519).
 * @param opts.receiverPublicKey Receiver public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Encrypted sender balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.encryptedAmountBySender Amount of transfer encrypted by sender using Twisted ElGamal
 * @param opts.receiverDa The recipient's public key multiplied by the randomness used to encrypt the amount being sent
 * @param opts.proofs.sigma Sigma Zero Knowledge Proof for veiled transfer
 * @param opts.proofs.rangeAmount Range Zero Knowledge Proof of amount of transfer
 * @param opts.proofs.rangeNewBalance Range Zero Knowledge Proof of sender's new balance after transfer
 */
export async function verifyProofsVeiledTransfer(opts: VerifyProofsVeiledTransferOptions): Promise<boolean> {
  const isSigmaProofValid = verifySigmaProofVeiledTransfer({
    senderPublicKey: opts.senderPublicKey,
    receiverPublicKey: opts.receiverPublicKey,
    encryptedSenderBalance: opts.encryptedSenderBalance,
    encryptedAmountBySender: opts.encryptedAmountBySender,
    receiverDa: opts.receiverDa,
    auditors: opts.auditors,
    proof: opts.proofs.sigma,
  });

  const rangeProofNewBalanceCommitment = opts.encryptedSenderBalance.C.subtract(opts.encryptedAmountBySender.C);

  const [isRangeProofAmountValid, isRangeProofNewBalanceValid] = await Promise.all([
    verifyRangeZKP({
      proof: opts.proofs.rangeAmount,
      commitment: opts.encryptedAmountBySender.C.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: H_RISTRETTO.toRawBytes(),
    }),
    verifyRangeZKP({
      proof: opts.proofs.rangeNewBalance,
      commitment: rangeProofNewBalanceCommitment.toRawBytes(),
      valBase: RistrettoPoint.BASE.toRawBytes(),
      randBase: opts.encryptedSenderBalance.D.subtract(opts.encryptedAmountBySender.D).toRawBytes(),
    }),
  ]);

  return isSigmaProofValid && isRangeProofAmountValid && isRangeProofNewBalanceValid;
}
