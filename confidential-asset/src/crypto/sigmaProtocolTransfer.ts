// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Sigma protocol proof for confidential asset transfer.
 *
 * The NP relation (from `sigma_protocol_transfer.move`):
 *
 * Combines a "veiled withdrawal" on the sender side with an "equality" proof linking
 * the sender's transfer amount ciphertexts to the recipient's.
 *
 * Statement points:
 *   Base: [G, H, ek_sid, ek_rid, old_P[ell], old_R[ell], new_P[ell], new_R[ell], P[n], R_sid[n], R_rid[n]]
 *   If has_effective_auditor: + [ek_aud_eff, new_R_aud_eff[ell], R_aud_eff[n]]
 *   For each voluntary auditor: + [ek_volun, R_volun[n]]
 *
 * Witness: [dk, new_a[ell], new_r[ell], v[n], r[n]]
 */

import { utf8ToBytes } from "@noble/hashes/utils";
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
import { bytesToNumberLE } from "@noble/curves/utils";

const PROTOCOL_ID = "AptosConfidentialAsset/TransferV1";

/** Fully qualified Move type name for the phantom marker type, matching `type_info::type_name<Transfer>()` */
const TYPE_NAME = "0x1::sigma_protocol_transfer::Transfer";

/**
 * BCS-serialize a TransferSession matching the Move struct:
 * ```move
 * struct TransferSession {
 *   sender: address,
 *   recipient: address,
 *   asset_type: Object<Metadata>,
 *   num_avail_chunks: u64,
 *   num_transfer_chunks: u64,
 *   has_effective_auditor: bool,
 *   num_volun_auditors: u64,
 * }
 * ```
 */
export function bcsSerializeTransferSession(
  senderAddress: Uint8Array,
  recipientAddress: Uint8Array,
  tokenTypeAddress: Uint8Array,
  numAvailChunks: number,
  numTransferChunks: number,
  hasEffectiveAuditor: boolean,
  numVolunAuditors: number,
): Uint8Array {
  const serializer = new Serializer();
  serializer.serialize(new FixedBytes(senderAddress));
  serializer.serialize(new FixedBytes(recipientAddress));
  serializer.serialize(new FixedBytes(tokenTypeAddress));
  serializer.serialize(new U64(numAvailChunks));
  serializer.serialize(new U64(numTransferChunks));
  serializer.serializeBool(hasEffectiveAuditor);
  serializer.serialize(new U64(numVolunAuditors));
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

/**
 * Statement point layout:
 *
 * Base (always):
 *   [G, H, ek_sid, ek_rid, old_P[ell], old_R[ell], new_P[ell], new_R[ell], P[n], R_sid[n], R_rid[n]]
 *   → 4 + 4*ell + 3*n points
 *
 * If has_effective_auditor:
 *   + [ek_aud_eff, new_R_aud_eff[ell], R_aud_eff[n]]
 *   → +1 + ell + n points
 *
 * For each voluntary auditor i ∈ [num_volun]:
 *   + [ek_volun_i, R_volun_i[n]]
 *   → +(1 + n) points per voluntary auditor
 */
const IDX_G = 0;
const IDX_H = 1;
const IDX_EK_SID = 2;
const IDX_EK_RID = 3;
const START_IDX_OLD_P = 4;

function getStartIdxOldR(ell: number): number {
  return START_IDX_OLD_P + ell;
}
function getStartIdxNewP(ell: number): number {
  return START_IDX_OLD_P + 2 * ell;
}
function getStartIdxNewR(ell: number): number {
  return START_IDX_OLD_P + 3 * ell;
}
function getStartIdxP(ell: number): number {
  return START_IDX_OLD_P + 4 * ell;
}
function getStartIdxRSid(ell: number, n: number): number {
  return START_IDX_OLD_P + 4 * ell + n;
}
function getStartIdxRRid(ell: number, n: number): number {
  return START_IDX_OLD_P + 4 * ell + 2 * n;
}
/** Starting index of the effective auditor section (if present). */
function getIdxEkAudEff(ell: number, n: number): number {
  return START_IDX_OLD_P + 4 * ell + 3 * n;
}
/** Starting index of the voluntary auditors section. */
function getStartIdxVolun(ell: number, n: number, hasEffective: boolean): number {
  return START_IDX_OLD_P + 4 * ell + 3 * n + (hasEffective ? 1 + ell + n : 0);
}

// Note: the old single-auditor makeTransferPsi/makeTransferF have been removed.
// All auditor logic is handled by makeTransferPsi/makeTransferF below.

export type TransferProofArgs = {
  /** The sender's decryption key */
  dk: TwistedEd25519PrivateKey;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte recipient address */
  recipientAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
  /** Chain ID for domain separation */
  chainId: number;
  /** Sender's encryption key */
  senderEncryptionKey: TwistedEd25519PublicKey;
  /** Recipient's encryption key */
  recipientEncryptionKey: TwistedEd25519PublicKey;
  /** Old sender balance C (commitment) points, one per chunk (ell chunks) */
  oldBalanceC: RistPoint[];
  /** Old sender balance D (ciphertext) points, one per chunk (ell chunks) */
  oldBalanceD: RistPoint[];
  /** New sender balance C points (ell chunks) */
  newBalanceC: RistPoint[];
  /** New sender balance D points (ell chunks) */
  newBalanceD: RistPoint[];
  /** New balance amount chunks (plaintext values per chunk, ell chunks) */
  newAmountChunks: bigint[];
  /** New balance randomness (ell values) */
  newRandomness: bigint[];
  /** Transfer amount C (commitment) points (n chunks) */
  transferAmountC: RistPoint[];
  /** Transfer amount D for sender (n chunks) */
  transferAmountDSender: RistPoint[];
  /** Transfer amount D for recipient (n chunks) */
  transferAmountDRecipient: RistPoint[];
  /** Transfer amount chunks (plaintext values, n chunks) */
  transferAmountChunks: bigint[];
  /** Transfer amount randomness (n values) */
  transferRandomness: bigint[];
  /**
   * Whether an effective (asset-level or global) auditor is present.
   * If true, the LAST element in auditorEncryptionKeys / newBalanceDAud / transferAmountDAud
   * is the effective auditor; all preceding elements are voluntary auditors.
   */
  hasEffectiveAuditor: boolean;
  /** Auditor encryption keys: voluntary first, then effective (if hasEffectiveAuditor) */
  auditorEncryptionKeys?: TwistedEd25519PublicKey[];
  /** New balance D points encrypted under each auditor key (only effective auditor's is used in sigma proof) */
  newBalanceDAud?: RistPoint[][];
  /** Transfer amount D points encrypted under each auditor key (all used in sigma proof) */
  transferAmountDAud?: RistPoint[][];
};

/**
 * Prove a confidential transfer.
 *
 * The sigma proof covers all auditors in a single proof. The statement layout
 * distinguishes between the effective auditor (sees balance + transfer amount)
 * and voluntary auditors (see only transfer amount).
 *
 * Convention: if hasEffectiveAuditor is true, the LAST element in auditorEncryptionKeys
 * (and newBalanceDAud / transferAmountDAud) is the effective auditor. All preceding
 * elements are voluntary.
 */
export function proveTransfer(args: TransferProofArgs): SigmaProtocolProof {
  const {
    dk,
    senderAddress,
    recipientAddress,
    tokenAddress,
    chainId,
    senderEncryptionKey,
    recipientEncryptionKey,
    oldBalanceC,
    oldBalanceD,
    newBalanceC,
    newBalanceD,
    newAmountChunks,
    newRandomness,
    transferAmountC,
    transferAmountDSender,
    transferAmountDRecipient,
    transferAmountChunks,
    transferRandomness,
    hasEffectiveAuditor,
    auditorEncryptionKeys = [],
    newBalanceDAud = [],
    transferAmountDAud = [],
  } = args;

  const ell = oldBalanceC.length;
  const n = transferAmountC.length;
  const numVolun = hasEffectiveAuditor ? auditorEncryptionKeys.length - 1 : auditorEncryptionKeys.length;
  const dkBigint = bytesToNumberLE(dk.toUint8Array());

  const G = ristretto255.Point.BASE;
  const H = H_RISTRETTO;
  const ekSidBytes = senderEncryptionKey.toUint8Array();
  const ekSid = ristretto255.Point.fromHex(ekSidBytes);
  const ekRidBytes = recipientEncryptionKey.toUint8Array();
  const ekRid = ristretto255.Point.fromHex(ekRidBytes);

  // Build statement points — base
  const stmtPoints: RistPoint[] = [G, H, ekSid, ekRid];
  const stmtCompressed: Uint8Array[] = [G.toBytes(), H.toBytes(), ekSidBytes, ekRidBytes];

  const pushPoint = (p: RistPoint) => {
    stmtPoints.push(p);
    stmtCompressed.push(p.toBytes());
  };
  const pushPointBytes = (p: RistPoint, bytes: Uint8Array) => {
    stmtPoints.push(p);
    stmtCompressed.push(bytes);
  };

  for (let i = 0; i < ell; i++) pushPoint(oldBalanceC[i]); // old_P
  for (let i = 0; i < ell; i++) pushPoint(oldBalanceD[i]); // old_R
  for (let i = 0; i < ell; i++) pushPoint(newBalanceC[i]); // new_P
  for (let i = 0; i < ell; i++) pushPoint(newBalanceD[i]); // new_R
  for (let j = 0; j < n; j++) pushPoint(transferAmountC[j]); // P
  for (let j = 0; j < n; j++) pushPoint(transferAmountDSender[j]); // R_sid
  for (let j = 0; j < n; j++) pushPoint(transferAmountDRecipient[j]); // R_rid

  // Effective auditor: [ek_eff, new_R_aud_eff[ell], R_aud_eff[n]]
  if (hasEffectiveAuditor) {
    const effIdx = auditorEncryptionKeys.length - 1;
    const ekEffBytes = auditorEncryptionKeys[effIdx].toUint8Array();
    pushPointBytes(ristretto255.Point.fromHex(ekEffBytes), ekEffBytes);
    for (let i = 0; i < ell; i++) pushPoint(newBalanceDAud[effIdx][i]);
    for (let j = 0; j < n; j++) pushPoint(transferAmountDAud[effIdx][j]);
  }

  // Voluntary auditors: for each, [ek_volun, R_volun[n]]
  for (let a = 0; a < numVolun; a++) {
    const ekVolunBytes = auditorEncryptionKeys[a].toUint8Array();
    pushPointBytes(ristretto255.Point.fromHex(ekVolunBytes), ekVolunBytes);
    for (let j = 0; j < n; j++) pushPoint(transferAmountDAud[a][j]);
  }

  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [],
  };

  // Witness: [dk, new_a[ell], new_r[ell], v[n], r[n]]
  const witness: bigint[] = [
    dkBigint,
    ...newAmountChunks,
    ...newRandomness,
    ...transferAmountChunks,
    ...transferRandomness,
  ];

  // Domain separator
  const sessionId = bcsSerializeTransferSession(
    senderAddress,
    recipientAddress,
    tokenAddress,
    ell,
    n,
    hasEffectiveAuditor,
    numVolun,
  );
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolProve(dst, TYPE_NAME, makeTransferPsi(ell, n, hasEffectiveAuditor, numVolun), stmt, witness);
}

/**
 * Build the homomorphism psi for the transfer relation.
 *
 * Matches the Move implementation ordering:
 *   1. dk * ek_sid
 *   2. new_a[i]*G + new_r[i]*H,  ∀i ∈ [ℓ]
 *   3. new_r[i]*ek_sid,           ∀i ∈ [ℓ]
 *   3b. new_r[i]*ek_aud_eff,      ∀i ∈ [ℓ]  (effective auditor only)
 *   4. dk*⟨B,old_R⟩ + (⟨B,new_a⟩ + ⟨B,v⟩)*G
 *   5. v[j]*G + r[j]*H,          ∀j ∈ [n]
 *   6. r[j]*ek_sid,              ∀j ∈ [n]
 *   7. r[j]*ek_rid,              ∀j ∈ [n]
 *   7b. r[j]*ek_aud_eff,          ∀j ∈ [n]  (effective auditor only)
 *   7c. r[j]*ek_volun_t,          ∀j ∈ [n], ∀t ∈ [T]  (voluntary auditors)
 */
function makeTransferPsi(ell: number, n: number, hasEffective: boolean, numVolun: number): PsiFunction {
  return (s: SigmaProtocolStatement, w: bigint[]): RistPoint[] => {
    const dk = w[0];
    const newA = w.slice(1, 1 + ell);
    const newR = w.slice(1 + ell, 1 + 2 * ell);
    const vChunks = w.slice(1 + 2 * ell, 1 + 2 * ell + n);
    const rTransfer = w.slice(1 + 2 * ell + n, 1 + 2 * ell + 2 * n);

    const G = s.points[IDX_G];
    const H = s.points[IDX_H];
    const ekSid = s.points[IDX_EK_SID];
    const ekRid = s.points[IDX_EK_RID];

    const result: RistPoint[] = [];

    // 1. dk * ek_sid
    result.push(ekSid.multiply(dk));

    // 2. new_a[i]*G + new_r[i]*H
    for (let i = 0; i < ell; i++) {
      result.push(G.multiply(newA[i]).add(H.multiply(newR[i])));
    }

    // 3. new_r[i]*ek_sid
    for (let i = 0; i < ell; i++) {
      result.push(ekSid.multiply(newR[i]));
    }

    // 3b. (effective auditor only) new_r[i]*ek_aud_eff
    if (hasEffective) {
      const ekAudEff = s.points[getIdxEkAudEff(ell, n)];
      for (let i = 0; i < ell; i++) {
        result.push(ekAudEff.multiply(newR[i]));
      }
    }

    // 4. Balance equation: dk*⟨B,old_R⟩ + (⟨B,new_a⟩ + ⟨B,v⟩)*G
    const bPowersEll = computeBPowers(ell);
    const bPowersN = computeBPowers(n);
    let balanceResult = ristretto255.Point.ZERO;
    const startOldR = getStartIdxOldR(ell);
    for (let i = 0; i < ell; i++) {
      balanceResult = balanceResult.add(s.points[startOldR + i].multiply(ed25519modN(dk * bPowersEll[i])));
    }
    for (let i = 0; i < ell; i++) {
      balanceResult = balanceResult.add(G.multiply(ed25519modN(newA[i] * bPowersEll[i])));
    }
    for (let j = 0; j < n; j++) {
      balanceResult = balanceResult.add(G.multiply(ed25519modN(vChunks[j] * bPowersN[j])));
    }
    result.push(balanceResult);

    // 5. v[j]*G + r[j]*H
    for (let j = 0; j < n; j++) {
      result.push(G.multiply(vChunks[j]).add(H.multiply(rTransfer[j])));
    }

    // 6. r[j]*ek_sid
    for (let j = 0; j < n; j++) {
      result.push(ekSid.multiply(rTransfer[j]));
    }

    // 7. r[j]*ek_rid
    for (let j = 0; j < n; j++) {
      result.push(ekRid.multiply(rTransfer[j]));
    }

    // 7b. (effective auditor only) r[j]*ek_aud_eff
    if (hasEffective) {
      const ekAudEff = s.points[getIdxEkAudEff(ell, n)];
      for (let j = 0; j < n; j++) {
        result.push(ekAudEff.multiply(rTransfer[j]));
      }
    }

    // 7c. (voluntary auditors) r[j]*ek_volun_t
    const volunStart = getStartIdxVolun(ell, n, hasEffective);
    for (let t = 0; t < numVolun; t++) {
      const ekVolunIdx = volunStart + t * (1 + n);
      const ekVolun = s.points[ekVolunIdx];
      for (let j = 0; j < n; j++) {
        result.push(ekVolun.multiply(rTransfer[j]));
      }
    }

    return result;
  };
}

/**
 * Build the transformation function f for the transfer relation.
 *
 * Matches the Move implementation ordering (mirrors psi with statement points).
 */
function makeTransferF(ell: number, n: number, hasEffective: boolean, numVolun: number): TransformationFunction {
  return (s: SigmaProtocolStatement): RistPoint[] => {
    const result: RistPoint[] = [];

    // 1. H
    result.push(s.points[IDX_H]);

    // 2. new_P[i]
    const startNewP = getStartIdxNewP(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewP + i]);
    }

    // 3. new_R[i]
    const startNewR = getStartIdxNewR(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewR + i]);
    }

    // 3b. (effective auditor only) new_R_aud_eff[i]
    if (hasEffective) {
      const newRAudStart = getIdxEkAudEff(ell, n) + 1;
      for (let i = 0; i < ell; i++) {
        result.push(s.points[newRAudStart + i]);
      }
    }

    // 4. Balance equation target: ⟨B, old_P⟩
    const bPowersEll = computeBPowers(ell);
    let balanceTarget = ristretto255.Point.ZERO;
    for (let i = 0; i < ell; i++) {
      balanceTarget = balanceTarget.add(s.points[START_IDX_OLD_P + i].multiply(bPowersEll[i]));
    }
    result.push(balanceTarget);

    // 5. P[j]
    const startP = getStartIdxP(ell);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startP + j]);
    }

    // 6. R_sid[j]
    const startRSid = getStartIdxRSid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRSid + j]);
    }

    // 7. R_rid[j]
    const startRRid = getStartIdxRRid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRRid + j]);
    }

    // 7b. (effective auditor only) R_aud_eff[j]
    if (hasEffective) {
      const rAudEffStart = getIdxEkAudEff(ell, n) + 1 + ell;
      for (let j = 0; j < n; j++) {
        result.push(s.points[rAudEffStart + j]);
      }
    }

    // 7c. (voluntary auditors) R_volun_t[j]
    const volunStart = getStartIdxVolun(ell, n, hasEffective);
    for (let t = 0; t < numVolun; t++) {
      const rVolunStart = volunStart + t * (1 + n) + 1;
      for (let j = 0; j < n; j++) {
        result.push(s.points[rVolunStart + j]);
      }
    }

    return result;
  };
}

/**
 * Verify a confidential transfer proof.
 *
 * Convention: if hasEffectiveAuditor, the last element in auditorEkBytes / newBalanceDAud /
 * transferAmountDAud is the effective auditor; preceding elements are voluntary.
 */
export function verifyTransfer(args: {
  senderAddress: Uint8Array;
  recipientAddress: Uint8Array;
  tokenAddress: Uint8Array;
  chainId: number;
  ekSidBytes: Uint8Array;
  ekRidBytes: Uint8Array;
  oldBalanceC: RistPoint[];
  oldBalanceD: RistPoint[];
  newBalanceC: RistPoint[];
  newBalanceD: RistPoint[];
  transferAmountC: RistPoint[];
  transferAmountDSender: RistPoint[];
  transferAmountDRecipient: RistPoint[];
  hasEffectiveAuditor: boolean;
  auditorEkBytes?: Uint8Array[];
  newBalanceDAud?: RistPoint[][];
  transferAmountDAud?: RistPoint[][];
  proof: SigmaProtocolProof;
}): boolean {
  const {
    senderAddress,
    recipientAddress,
    tokenAddress,
    chainId,
    ekSidBytes,
    ekRidBytes,
    oldBalanceC,
    oldBalanceD,
    newBalanceC,
    newBalanceD,
    transferAmountC,
    transferAmountDSender,
    transferAmountDRecipient,
    hasEffectiveAuditor,
    auditorEkBytes = [],
    newBalanceDAud = [],
    transferAmountDAud = [],
    proof,
  } = args;

  const ell = oldBalanceC.length;
  const n = transferAmountC.length;
  const numVolun = hasEffectiveAuditor ? auditorEkBytes.length - 1 : auditorEkBytes.length;

  const G = ristretto255.Point.BASE;
  const H = H_RISTRETTO;
  const ekSid = ristretto255.Point.fromHex(ekSidBytes);
  const ekRid = ristretto255.Point.fromHex(ekRidBytes);

  const stmtPoints: RistPoint[] = [G, H, ekSid, ekRid];
  const stmtCompressed: Uint8Array[] = [G.toBytes(), H.toBytes(), ekSidBytes, ekRidBytes];

  const pushPoint = (p: RistPoint) => {
    stmtPoints.push(p);
    stmtCompressed.push(p.toBytes());
  };
  const pushPointBytes = (p: RistPoint, bytes: Uint8Array) => {
    stmtPoints.push(p);
    stmtCompressed.push(bytes);
  };

  for (let i = 0; i < ell; i++) pushPoint(oldBalanceC[i]);
  for (let i = 0; i < ell; i++) pushPoint(oldBalanceD[i]);
  for (let i = 0; i < ell; i++) pushPoint(newBalanceC[i]);
  for (let i = 0; i < ell; i++) pushPoint(newBalanceD[i]);
  for (let j = 0; j < n; j++) pushPoint(transferAmountC[j]);
  for (let j = 0; j < n; j++) pushPoint(transferAmountDSender[j]);
  for (let j = 0; j < n; j++) pushPoint(transferAmountDRecipient[j]);

  // Effective auditor: [ek_eff, new_R_aud_eff[ell], R_aud_eff[n]]
  if (hasEffectiveAuditor) {
    const effIdx = auditorEkBytes.length - 1;
    pushPointBytes(ristretto255.Point.fromHex(auditorEkBytes[effIdx]), auditorEkBytes[effIdx]);
    for (let i = 0; i < ell; i++) pushPoint(newBalanceDAud[effIdx][i]);
    for (let j = 0; j < n; j++) pushPoint(transferAmountDAud[effIdx][j]);
  }

  // Voluntary auditors: [ek_volun, R_volun[n]]
  for (let a = 0; a < numVolun; a++) {
    pushPointBytes(ristretto255.Point.fromHex(auditorEkBytes[a]), auditorEkBytes[a]);
    for (let j = 0; j < n; j++) pushPoint(transferAmountDAud[a][j]);
  }

  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [],
  };

  const sessionId = bcsSerializeTransferSession(
    senderAddress,
    recipientAddress,
    tokenAddress,
    ell,
    n,
    hasEffectiveAuditor,
    numVolun,
  );
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolVerify(
    dst,
    TYPE_NAME,
    makeTransferPsi(ell, n, hasEffectiveAuditor, numVolun),
    makeTransferF(ell, n, hasEffectiveAuditor, numVolun),
    stmt,
    proof,
  );
}
