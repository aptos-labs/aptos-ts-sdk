// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519, RistrettoPoint } from "@noble/curves/ed25519";
import { invert, mod } from "@noble/curves/abstract/modular";
import { bytesToNumberLE, concatBytes, ensureBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { sha512 } from "@noble/hashes/sha512";
import { randomBytes, utf8ToBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "./twistedElGamal";

export interface VeiledWithdrawProofOptions {
  privateKey: TwistedEd25519PrivateKey;
  encryptedBalance: TwistedElGamalCiphertext;
  amount: bigint;
  changedBalance: bigint;
}

export interface VerifyVeiledWithdrawProofOptions {
  publicKey: TwistedEd25519PublicKey;
  encryptedBalance: TwistedElGamalCiphertext;
  amount: bigint;
  proof: VeiledWithdrawProof;
}

export interface VeiledTransferProofOptions {
  senderPrivateKey: TwistedEd25519PrivateKey;
  receiverPublicKey: TwistedEd25519PublicKey;
  encryptedSenderBalance: TwistedElGamalCiphertext;
  amount: bigint;
  changedSenderBalance: bigint;
  random?: Uint8Array;
}

export interface VerifyVeiledTransferProofOptions {
  senderPublicKey: TwistedEd25519PublicKey;
  receiverPublicKey: TwistedEd25519PublicKey;
  encryptedSenderBalance: TwistedElGamalCiphertext;
  encryptedAmountBySender: TwistedElGamalCiphertext;
  receiverDa: string | Uint8Array;
  proof: VeiledTransferProof;
}

export interface VeiledWithdrawProof {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  X1: Uint8Array;
  X2: Uint8Array;
}

export interface VeiledTransferProof {
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
}

/*
 * The domain separation tag (DST) used in the Fiat-Shamir transform of our Sigma-protocol.
 */
const FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalSubproofFiatShamir";

/*
 * Number modulo order of curve
 */
function modN(a: bigint): bigint {
  return mod(a, ed25519.CURVE.n);
}

/*
 * Little-endian random bytes modulo order of curve
 */
function genModRandom(): bigint {
  return modN(bytesToNumberLE(randomBytes(32)));
}

/*
 * Generate Fiat-Shamir challenge
 */
function genFiatShamirChallenge(...arrays: Uint8Array[]): bigint {
  const hash = sha512(concatBytes(...arrays));
  return modN(bytesToNumberLE(hash));
}

/**
 * Generates Zero Knowledge Proofs for withdraw from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of withdraw
 * @param opts.changedBalance Balance after withdraw
 */
export function generateVeiledWithdrawProof(opts: VeiledWithdrawProofOptions): VeiledWithdrawProof {
  const x1 = genModRandom();
  const x2 = genModRandom();
  const x3 = genModRandom();

  const X1 = RistrettoPoint.BASE.multiply(x1).add(opts.encryptedBalance.D.multiply(x2));
  const X2 = H_RISTRETTO.multiply(x3);

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    numberToBytesLE(opts.amount, 32),
    opts.privateKey.publicKey().toUint8Array(),
    opts.encryptedBalance.C.toRawBytes(),
    opts.encryptedBalance.D.toRawBytes(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    X1.toRawBytes(),
    X2.toRawBytes(),
  );

  const sLE = bytesToNumberLE(opts.privateKey.toUint8Array());
  const invertSLE = invert(sLE, ed25519.CURVE.n);

  const pt = modN(p * opts.changedBalance);
  const ps = modN(p * sLE);
  const psInvert = modN(p * invertSLE);

  const alpha1 = modN(x1 - pt);
  const alpha2 = modN(x2 - ps);
  const alpha3 = modN(x3 - psInvert);

  return {
    alpha1: numberToBytesLE(alpha1, 32),
    alpha2: numberToBytesLE(alpha2, 32),
    alpha3: numberToBytesLE(alpha3, 32),
    X1: X1.toRawBytes(),
    X2: X2.toRawBytes(),
  };
}

/**
 * Generate Zero Knowledge Proofs for transfer
 *
 * @param opts.senderPrivateKey Sender private key (Twisted ElGamal Ed25519).
 * @param opts.receiverPublicKey Receiver public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of transfer
 * @param opts.changedSenderBalance Balance after transfer
 * @param opts.random Random 32 bytes (Uint8Array)
 */
export function generateVeiledTransferProof(opts: VeiledTransferProofOptions): VeiledTransferProof {
  const x1 = genModRandom();
  const x2 = genModRandom();
  const x3 = genModRandom();
  const x4 = genModRandom();
  const x5 = genModRandom();

  const rBytes = ensureBytes("Random bytes", opts.random ?? randomBytes(32), 32);
  const rAmount = modN(bytesToNumberLE(rBytes));

  const senderPublicKey = opts.senderPrivateKey.publicKey();
  const senderPKRistretto = RistrettoPoint.fromHex(senderPublicKey.toUint8Array());
  const receiverPKRistretto = RistrettoPoint.fromHex(opts.receiverPublicKey.toUint8Array());
  const receiverDRistretto = receiverPKRistretto.multiply(rAmount);

  const amountCiphertext = TwistedElGamal.encryptWithPK(opts.amount, senderPublicKey, rBytes);

  const X1 = RistrettoPoint.BASE.multiply(x1).add(
    opts.encryptedSenderBalance.D.subtract(amountCiphertext.D).multiply(x2),
  );
  const X2 = senderPKRistretto.multiply(x3);
  const X3 = receiverPKRistretto.multiply(x3);
  const X4 = RistrettoPoint.BASE.multiply(x4).add(H_RISTRETTO.multiply(x3));
  const X5 = H_RISTRETTO.multiply(x5);

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    senderPublicKey.toUint8Array(),
    opts.receiverPublicKey.toUint8Array(),
    opts.encryptedSenderBalance.C.toRawBytes(),
    opts.encryptedSenderBalance.D.toRawBytes(),
    amountCiphertext.C.toRawBytes(),
    amountCiphertext.D.toRawBytes(),
    receiverDRistretto.toRawBytes(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    X1.toRawBytes(),
    X2.toRawBytes(),
    X3.toRawBytes(),
    X4.toRawBytes(),
    X5.toRawBytes(),
  );

  const sLE = bytesToNumberLE(opts.senderPrivateKey.toUint8Array());
  const invertSLE = invert(sLE, ed25519.CURVE.n);

  const alpha1 = modN(x1 - p * opts.changedSenderBalance);
  const alpha2 = modN(x2 - p * sLE);
  const alpha3 = modN(x3 - p * rAmount);
  const alpha4 = modN(x4 - p * opts.amount);
  const alpha5 = modN(x5 - p * invertSLE);

  return {
    alpha1: numberToBytesLE(alpha1, 32),
    alpha2: numberToBytesLE(alpha2, 32),
    alpha3: numberToBytesLE(alpha3, 32),
    alpha4: numberToBytesLE(alpha4, 32),
    alpha5: numberToBytesLE(alpha5, 32),
    X1: X1.toRawBytes(),
    X2: X2.toRawBytes(),
    X3: X3.toRawBytes(),
    X4: X4.toRawBytes(),
    X5: X5.toRawBytes(),
  };
}

/**
 * Verify Zero Knowledge Proofs for withdraw from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.encryptedBalance Encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of withdraw
 * @param opts.proof Zero Knowledge Proofs for withdraw
 */
export function verifyVeiledWithdrawProof(opts: VerifyVeiledWithdrawProofOptions): boolean {
  const alpha1LE = bytesToNumberLE(opts.proof.alpha1);
  const alpha2LE = bytesToNumberLE(opts.proof.alpha2);
  const alpha3LE = bytesToNumberLE(opts.proof.alpha3);

  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
  const alpha2D = opts.encryptedBalance.D.multiply(alpha2LE);
  const alpha3H = H_RISTRETTO.multiply(alpha3LE);

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    numberToBytesLE(opts.amount, 32),
    opts.publicKey.toUint8Array(),
    opts.encryptedBalance.C.toRawBytes(),
    opts.encryptedBalance.D.toRawBytes(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    opts.proof.X1,
    opts.proof.X2,
  );

  const pP = RistrettoPoint.fromHex(opts.publicKey.toUint8Array()).multiply(p);
  const X1 = alpha1G
    .add(alpha2D)
    .add(opts.encryptedBalance.C.subtract(RistrettoPoint.BASE.multiply(opts.amount)).multiply(p));
  const X2 = alpha3H.add(pP);

  return X1.equals(RistrettoPoint.fromHex(opts.proof.X1)) && X2.equals(RistrettoPoint.fromHex(opts.proof.X2));
}

/**
 * Verify Zero Knowledge Proofs for transfer
 *
 * @param opts.senderPublicKey Sender public key (Twisted ElGamal Ed25519).
 * @param opts.receiverPublicKey Receiver public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedSenderBalance Encrypted sender balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.encryptedAmountBySender Amount of transfer encrypted by sender using Twisted ElGamal
 * @param opts.receiverDa The recipient's public key multiplied by the randomness used to encrypt the amount being sent
 * @param opts.proof Zero Knowledge Proofs for transfer
 */
export function verifyVeiledTransferProof(opts: VerifyVeiledTransferProofOptions): boolean {
  const receiverDRistretto = RistrettoPoint.fromHex(opts.receiverDa);

  const alpha1LE = bytesToNumberLE(opts.proof.alpha1);
  const alpha2LE = bytesToNumberLE(opts.proof.alpha2);
  const alpha3LE = bytesToNumberLE(opts.proof.alpha3);
  const alpha4LE = bytesToNumberLE(opts.proof.alpha4);
  const alpha5LE = bytesToNumberLE(opts.proof.alpha5);

  const senderPKUint8Array = opts.senderPublicKey.toUint8Array();
  const receiverPKUint8Array = opts.receiverPublicKey.toUint8Array();
  const senderPKRistretto = RistrettoPoint.fromHex(senderPKUint8Array);
  const receiverPKRistretto = RistrettoPoint.fromHex(receiverPKUint8Array);

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    senderPKUint8Array,
    receiverPKUint8Array,
    opts.encryptedSenderBalance.C.toRawBytes(),
    opts.encryptedSenderBalance.D.toRawBytes(),
    opts.encryptedAmountBySender.C.toRawBytes(),
    opts.encryptedAmountBySender.D.toRawBytes(),
    receiverDRistretto.toRawBytes(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    opts.proof.X1,
    opts.proof.X2,
    opts.proof.X3,
    opts.proof.X4,
    opts.proof.X5,
  );

  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
  const alpha2Db = opts.encryptedSenderBalance.D.subtract(opts.encryptedAmountBySender.D).multiply(alpha2LE);
  const pCb = opts.encryptedSenderBalance.C.subtract(opts.encryptedAmountBySender.C).multiply(p);

  const X1 = alpha1G.add(alpha2Db).add(pCb);
  const X2 = senderPKRistretto.multiply(alpha3LE).add(opts.encryptedAmountBySender.D.multiply(p));
  const X3 = receiverPKRistretto.multiply(alpha3LE).add(receiverDRistretto.multiply(p));
  const X4 = RistrettoPoint.BASE.multiply(alpha4LE)
    .add(H_RISTRETTO.multiply(alpha3LE))
    .add(opts.encryptedAmountBySender.C.multiply(p));
  const X5 = H_RISTRETTO.multiply(alpha5LE).add(senderPKRistretto.multiply(p));

  return (
    X1.equals(RistrettoPoint.fromHex(opts.proof.X1)) &&
    X2.equals(RistrettoPoint.fromHex(opts.proof.X2)) &&
    X3.equals(RistrettoPoint.fromHex(opts.proof.X3)) &&
    X4.equals(RistrettoPoint.fromHex(opts.proof.X4)) &&
    X5.equals(RistrettoPoint.fromHex(opts.proof.X5))
  );
}
