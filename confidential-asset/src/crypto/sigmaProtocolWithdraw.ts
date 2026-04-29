// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Sigma protocol proof for confidential asset withdrawal and normalization.
 *
 * The NP relation (from `sigma_protocol_withdraw.move`):
 *
 * Given old balance ciphertexts (old_P, old_R) and new balance ciphertexts (new_P, new_R),
 * proves knowledge of dk, new_a[], new_r[] such that:
 *
 *   1. H = dk * ek                                           (knowledge of dk)
 *   2. new_P[i] = new_a[i] * G + new_r[i] * H               (new commitments are well-formed)
 *   3. new_R[i] = new_r[i] * ek                              (new ciphertext consistency)
 *   4. <B, old_P> - v*G = dk * <B, old_R> + <B, new_a> * G  (balance equation)
 *
 * where B = (1, 2^16, 2^32, ...) are the chunk base powers.
 *
 * For normalization, v = 0 (same protocol ID).
 *
 * When an auditor is present, additional outputs prove new_R_aud[i] = new_r[i] * ek_aud.
 */

import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { ristretto255, H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from ".";
import type { RistPoint } from ".";
import { ed25519modN } from "../utils";
import {
  sigmaProtocolProve,
  sigmaProtocolVerify,
  APTOS_FRAMEWORK_ADDRESS,
  type DomainSeparator,
  type SigmaProtocolStatement,
  type SigmaProtocolProof,
  type PsiFunction,
  type TransformationFunction,
} from "./sigmaProtocol";
import { Serializer, FixedBytes, U64 } from "@aptos-labs/ts-sdk";

const PROTOCOL_ID_WITHDRAWAL = "AptosConfidentialAsset/WithdrawalV1";

/** Fully qualified Move type name for the phantom marker type, matching `type_info::type_name<Withdrawal>()` */
const TYPE_NAME = "0x1::sigma_protocol_withdraw::Withdrawal";

/**
 * BCS-serialize a WithdrawSession matching the Move struct:
 * ```move
 * struct WithdrawSession { sender: address, asset_type: Object<Metadata>, num_chunks: u64, has_auditor: bool }
 * ```
 */
export function bcsSerializeWithdrawSession(
  senderAddress: Uint8Array,
  tokenTypeAddress: Uint8Array,
  numChunks: number,
  hasAuditor: boolean,
): Uint8Array {
  const serializer = new Serializer();
  serializer.serialize(new FixedBytes(senderAddress));
  serializer.serialize(new FixedBytes(tokenTypeAddress));
  serializer.serialize(new U64(numChunks));
  serializer.serializeBool(hasAuditor);
  return serializer.toUint8Array();
}

/**
 * Compute the chunk base powers: [1, 2^16, 2^32, ...] mod l.
 */
function computeBPowers(count: number): bigint[] {
  const B = 1n << 16n;
  const powers: bigint[] = [1n];
  for (let i = 1; i < count; i++) {
    powers.push(ed25519modN(powers[i - 1] * B));
  }
  return powers;
}

/** Statement point layout (auditorless):
 *   [G, H, ek, old_P[0..ell-1], old_R[0..ell-1], new_P[0..ell-1], new_R[0..ell-1]]
 *   total = 3 + 4*ell
 *
 * With auditor:
 *   [..., ek_aud, new_R_aud[0..ell-1]]
 *   total = 4 + 5*ell
 */
const IDX_G = 0;
const IDX_H = 1;
const IDX_EK = 2;
const START_IDX_OLD_P = 3;

function getStartIdxOldR(ell: number): number {
  return START_IDX_OLD_P + ell;
}
function getStartIdxNewP(ell: number): number {
  return START_IDX_OLD_P + 2 * ell;
}
function getStartIdxNewR(ell: number): number {
  return START_IDX_OLD_P + 3 * ell;
}
function getIdxEkAud(ell: number): number {
  return START_IDX_OLD_P + 4 * ell;
}
function getStartIdxNewRAud(ell: number): number {
  return START_IDX_OLD_P + 4 * ell + 1;
}

/**
 * Build the homomorphism psi for withdrawal/normalization.
 *
 * Witness layout: [dk, new_a[0..ell-1], new_r[0..ell-1]]
 *
 * psi outputs (auditorless, m = 2 + 2*ell):
 *   0: dk * ek
 *   1..ell: new_a[i] * G + new_r[i] * H
 *   ell+1..2*ell: new_r[i] * ek
 *   2*ell+1: dk * <B, old_R> + <B, new_a> * G (balance equation)
 *
 * With auditor (m = 2 + 3*ell):
 *   Insert new_r[i] * ek_aud between the ek outputs and the balance equation.
 */
function makeWithdrawPsi(ell: number, hasAuditor: boolean): PsiFunction {
  return (s: SigmaProtocolStatement, w: bigint[]): RistPoint[] => {
    const dk = w[0];
    const newA = w.slice(1, 1 + ell);
    const newR = w.slice(1 + ell, 1 + 2 * ell);

    const G = s.points[IDX_G];
    const H = s.points[IDX_H];
    const ek = s.points[IDX_EK];

    const result: RistPoint[] = [];

    // Output 0: dk * ek
    result.push(ek.multiply(dk));

    // Outputs 1..ell: new_a[i] * G + new_r[i] * H
    for (let i = 0; i < ell; i++) {
      result.push(G.multiply(newA[i]).add(H.multiply(newR[i])));
    }

    // Outputs ell+1..2*ell: new_r[i] * ek
    for (let i = 0; i < ell; i++) {
      result.push(ek.multiply(newR[i]));
    }

    // If auditor, outputs 2*ell+1..3*ell: new_r[i] * ek_aud
    if (hasAuditor) {
      const ekAud = s.points[getIdxEkAud(ell)];
      for (let i = 0; i < ell; i++) {
        result.push(ekAud.multiply(newR[i]));
      }
    }

    // Balance equation: dk * <B, old_R> + <B, new_a> * G
    const bPowers = computeBPowers(ell);
    let balanceResult = ristretto255.Point.ZERO;
    const startOldR = getStartIdxOldR(ell);
    for (let i = 0; i < ell; i++) {
      balanceResult = balanceResult.add(s.points[startOldR + i].multiply(ed25519modN(dk * bPowers[i])));
    }
    for (let i = 0; i < ell; i++) {
      balanceResult = balanceResult.add(G.multiply(ed25519modN(newA[i] * bPowers[i])));
    }
    result.push(balanceResult);

    return result;
  };
}

/**
 * Build the transformation function f for withdrawal/normalization.
 *
 * f outputs (auditorless):
 *   0: H
 *   1..ell: new_P[i]
 *   ell+1..2*ell: new_R[i]
 *   2*ell+1: <B, old_P> - v*G
 *
 * With auditor:
 *   Insert new_R_aud[i] between the new_R outputs and the balance equation target.
 */
function makeWithdrawF(ell: number, hasAuditor: boolean, v: bigint): TransformationFunction {
  return (s: SigmaProtocolStatement): RistPoint[] => {
    const G = s.points[IDX_G];
    const result: RistPoint[] = [];

    // Output 0: H
    result.push(s.points[IDX_H]);

    // Outputs 1..ell: new_P[i]
    const startNewP = getStartIdxNewP(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewP + i]);
    }

    // Outputs ell+1..2*ell: new_R[i]
    const startNewR = getStartIdxNewR(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewR + i]);
    }

    // If auditor, outputs 2*ell+1..3*ell: new_R_aud[i]
    if (hasAuditor) {
      const startNewRAud = getStartIdxNewRAud(ell);
      for (let i = 0; i < ell; i++) {
        result.push(s.points[startNewRAud + i]);
      }
    }

    // Balance equation target: <B, old_P> - v*G
    const bPowers = computeBPowers(ell);
    let balanceTarget = ristretto255.Point.ZERO;
    for (let i = 0; i < ell; i++) {
      balanceTarget = balanceTarget.add(s.points[START_IDX_OLD_P + i].multiply(bPowers[i]));
    }
    // Subtract v*G: add (-v)*G (skip when v = 0 to avoid multiply-by-zero error)
    const vMod = ed25519modN(v);
    if (vMod !== 0n) {
      const negV = ed25519modN(ed25519.Point.CURVE().n - vMod);
      balanceTarget = balanceTarget.add(G.multiply(negV));
    }
    result.push(balanceTarget);

    return result;
  };
}

export type WithdrawProofArgs = {
  /** The sender's decryption key */
  dk: TwistedEd25519PrivateKey;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
  /** Chain ID for domain separation */
  chainId: number;
  /** The withdrawal amount (0 for normalization) */
  amount: bigint;
  /** Old balance C (commitment) points, one per chunk */
  oldBalanceC: RistPoint[];
  /** Old balance D (ciphertext) points, one per chunk */
  oldBalanceD: RistPoint[];
  /** New balance C points */
  newBalanceC: RistPoint[];
  /** New balance D points */
  newBalanceD: RistPoint[];
  /** New balance amount chunks (plaintext values per chunk) */
  newAmountChunks: bigint[];
  /** New balance randomness, one per chunk */
  newRandomness: bigint[];
  /** Optional auditor encryption key */
  auditorEncryptionKey?: TwistedEd25519PublicKey;
  /** Optional new balance D points encrypted with an auditor key */
  newBalanceDAud?: RistPoint[];
};

/**
 * Build the statement and witness for a withdrawal or normalization proof, then prove it.
 */
function proveWithdrawInternal(protocolId: string, args: WithdrawProofArgs): SigmaProtocolProof {
  const {
    dk,
    senderAddress,
    tokenAddress,
    chainId,
    amount,
    oldBalanceC,
    oldBalanceD,
    newBalanceC,
    newBalanceD,
    newAmountChunks,
    newRandomness,
    auditorEncryptionKey,
    newBalanceDAud,
  } = args;

  const ell = oldBalanceC.length;
  const hasAuditor = auditorEncryptionKey !== undefined;
  const dkBigint = bytesToNumberLE(dk.toUint8Array());
  const ekBytes = dk.publicKey().toUint8Array();
  const ek = ristretto255.Point.fromHex(ekBytes);

  const G = ristretto255.Point.BASE;
  const H = H_RISTRETTO;

  // Build statement points
  const stmtPoints: RistPoint[] = [G, H, ek];
  const stmtCompressed: Uint8Array[] = [G.toBytes(), H.toBytes(), ekBytes];

  // old_P (old balance C = commitments)
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceC[i]);
    stmtCompressed.push(oldBalanceC[i].toBytes());
  }
  // old_R (old balance D = ciphertext D components)
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceD[i]);
    stmtCompressed.push(oldBalanceD[i].toBytes());
  }
  // new_P (new balance C)
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceC[i]);
    stmtCompressed.push(newBalanceC[i].toBytes());
  }
  // new_R (new balance D)
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceD[i]);
    stmtCompressed.push(newBalanceD[i].toBytes());
  }

  // Auditor points
  if (hasAuditor) {
    const ekAudBytes = auditorEncryptionKey.toUint8Array();
    const ekAud = ristretto255.Point.fromHex(ekAudBytes);
    stmtPoints.push(ekAud);
    stmtCompressed.push(ekAudBytes);

    for (let i = 0; i < ell; i++) {
      stmtPoints.push(newBalanceDAud![i]);
      stmtCompressed.push(newBalanceDAud![i].toBytes());
    }
  }

  // Statement scalars: [v] as 32-byte LE
  const vScalar = numberToBytesLE(ed25519modN(amount), 32);

  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [vScalar],
  };

  // Build witness: [dk, new_a[0..ell-1], new_r[0..ell-1]]
  const witness: bigint[] = [dkBigint, ...newAmountChunks, ...newRandomness];

  // Build domain separator
  const sessionId = bcsSerializeWithdrawSession(senderAddress, tokenAddress, ell, hasAuditor);
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(protocolId),
    sessionId,
  };

  return sigmaProtocolProve(dst, TYPE_NAME, makeWithdrawPsi(ell, hasAuditor), stmt, witness);
}

/**
 * Prove a confidential withdrawal.
 */
export function proveWithdrawal(args: WithdrawProofArgs): SigmaProtocolProof {
  return proveWithdrawInternal(PROTOCOL_ID_WITHDRAWAL, args);
}

/**
 * Prove a confidential normalization (same as withdrawal with v = 0).
 * @deprecated Use `proveWithdrawal` instead — normalization is just withdrawal with amount = 0.
 */
export function proveNormalization(args: WithdrawProofArgs): SigmaProtocolProof {
  return proveWithdrawInternal(PROTOCOL_ID_WITHDRAWAL, args);
}

/**
 * Verify a confidential withdrawal proof.
 */
export function verifyWithdrawal(args: {
  senderAddress: Uint8Array;
  tokenAddress: Uint8Array;
  chainId: number;
  amount: bigint;
  ekBytes: Uint8Array;
  oldBalanceC: RistPoint[];
  oldBalanceD: RistPoint[];
  newBalanceC: RistPoint[];
  newBalanceD: RistPoint[];
  auditorEkBytes?: Uint8Array;
  newBalanceDAud?: RistPoint[];
  proof: SigmaProtocolProof;
}): boolean {
  return verifyWithdrawInternal(PROTOCOL_ID_WITHDRAWAL, args);
}

/**
 * Verify a confidential normalization proof.
 * @deprecated Use `verifyWithdrawal` instead — normalization is just withdrawal with amount = 0.
 */
export function verifyNormalization(args: {
  senderAddress: Uint8Array;
  tokenAddress: Uint8Array;
  chainId: number;
  amount: bigint;
  ekBytes: Uint8Array;
  oldBalanceC: RistPoint[];
  oldBalanceD: RistPoint[];
  newBalanceC: RistPoint[];
  newBalanceD: RistPoint[];
  auditorEkBytes?: Uint8Array;
  newBalanceDAud?: RistPoint[];
  proof: SigmaProtocolProof;
}): boolean {
  return verifyWithdrawInternal(PROTOCOL_ID_WITHDRAWAL, args);
}

function verifyWithdrawInternal(
  protocolId: string,
  args: {
    senderAddress: Uint8Array;
    tokenAddress: Uint8Array;
    chainId: number;
    amount: bigint;
    ekBytes: Uint8Array;
    oldBalanceC: RistPoint[];
    oldBalanceD: RistPoint[];
    newBalanceC: RistPoint[];
    newBalanceD: RistPoint[];
    auditorEkBytes?: Uint8Array;
    newBalanceDAud?: RistPoint[];
    proof: SigmaProtocolProof;
  },
): boolean {
  const {
    senderAddress,
    tokenAddress,
    chainId,
    amount,
    ekBytes,
    oldBalanceC,
    oldBalanceD,
    newBalanceC,
    newBalanceD,
    auditorEkBytes,
    newBalanceDAud,
    proof,
  } = args;

  const ell = oldBalanceC.length;
  const hasAuditor = auditorEkBytes !== undefined;
  const ek = ristretto255.Point.fromHex(ekBytes);
  const G = ristretto255.Point.BASE;
  const H = H_RISTRETTO;

  // Build statement points
  const stmtPoints: RistPoint[] = [G, H, ek];
  const stmtCompressed: Uint8Array[] = [G.toBytes(), H.toBytes(), ekBytes];

  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceC[i]);
    stmtCompressed.push(oldBalanceC[i].toBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceD[i]);
    stmtCompressed.push(oldBalanceD[i].toBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceC[i]);
    stmtCompressed.push(newBalanceC[i].toBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceD[i]);
    stmtCompressed.push(newBalanceD[i].toBytes());
  }

  if (hasAuditor) {
    const ekAud = ristretto255.Point.fromHex(auditorEkBytes);
    stmtPoints.push(ekAud);
    stmtCompressed.push(auditorEkBytes);

    for (let i = 0; i < ell; i++) {
      stmtPoints.push(newBalanceDAud![i]);
      stmtCompressed.push(newBalanceDAud![i].toBytes());
    }
  }

  const vScalar = numberToBytesLE(ed25519modN(amount), 32);

  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [vScalar],
  };

  const sessionId = bcsSerializeWithdrawSession(senderAddress, tokenAddress, ell, hasAuditor);
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(protocolId),
    sessionId,
  };

  return sigmaProtocolVerify(
    dst,
    TYPE_NAME,
    makeWithdrawPsi(ell, hasAuditor),
    makeWithdrawF(ell, hasAuditor, amount),
    stmt,
    proof,
  );
}
