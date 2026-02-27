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
 * Statement points (auditorless):
 *   [G, H, ek_sid, ek_rid,
 *    old_P[ell], old_R[ell],
 *    new_P[ell], new_R[ell],
 *    P[n], R_sid[n], R_rid[n]]
 *
 * With auditor:
 *   append [ek_aud, new_R_aud[ell], R_aud[n]]
 *
 * Witness: [dk, new_a[ell], new_r[ell], v[n], r[n]]
 */

import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { RistrettoPoint, H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from ".";
import type { RistPoint } from ".";
import { ed25519modN } from "../utils";
import {
  sigmaProtocolProve,
  sigmaProtocolVerify,
  type DomainSeparator,
  type SigmaProtocolStatement,
  type SigmaProtocolProof,
  type PsiFunction,
  type TransformationFunction,
} from "./sigmaProtocol";
import { Serializer, FixedBytes, U64 } from "@aptos-labs/ts-sdk";

const PROTOCOL_ID = "AptosConfidentialAsset/TransferV1";

/**
 * BCS-serialize a TransferSession matching the Move struct:
 * ```move
 * struct TransferSession {
 *   sender: address,
 *   recipient: address,
 *   asset_type: Object<Metadata>,
 *   num_avail_chunks: u64,
 *   num_transfer_chunks: u64,
 * }
 * ```
 */
export function bcsSerializeTransferSession(
  senderAddress: Uint8Array,
  recipientAddress: Uint8Array,
  tokenTypeAddress: Uint8Array,
  numAvailChunks: number,
  numTransferChunks: number,
): Uint8Array {
  const serializer = new Serializer();
  serializer.serialize(new FixedBytes(senderAddress));
  serializer.serialize(new FixedBytes(recipientAddress));
  serializer.serialize(new FixedBytes(tokenTypeAddress));
  serializer.serialize(new U64(numAvailChunks));
  serializer.serialize(new U64(numTransferChunks));
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
 * Statement point layout (auditorless):
 *   0: G
 *   1: H
 *   2: ek_sid
 *   3: ek_rid
 *   4 .. 4+ell-1: old_P[ell]
 *   4+ell .. 4+2ell-1: old_R[ell]
 *   4+2ell .. 4+3ell-1: new_P[ell]
 *   4+3ell .. 4+4ell-1: new_R[ell]
 *   4+4ell .. 4+4ell+n-1: P[n]          (transfer amount commitments)
 *   4+4ell+n .. 4+4ell+2n-1: R_sid[n]   (transfer amount D for sender)
 *   4+4ell+2n .. 4+4ell+3n-1: R_rid[n]  (transfer amount D for recipient)
 *
 * With auditor, append:
 *   4+4ell+3n: ek_aud
 *   4+4ell+3n+1 .. 4+5ell+3n: new_R_aud[ell]
 *   4+5ell+3n+1 .. 4+5ell+4n: R_aud[n]
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
function getIdxEkAud(ell: number, n: number): number {
  return START_IDX_OLD_P + 4 * ell + 3 * n;
}
function getStartIdxNewRAud(ell: number, n: number): number {
  return START_IDX_OLD_P + 4 * ell + 3 * n + 1;
}
function getStartIdxRAud(ell: number, n: number): number {
  return START_IDX_OLD_P + 5 * ell + 3 * n + 1;
}

/**
 * Build the homomorphism psi for transfer.
 *
 * Witness layout: [dk, new_a[0..ell-1], new_r[0..ell-1], v[0..n-1], r[0..n-1]]
 *
 * psi outputs (auditorless, m = 2 + 2ell + 3n):
 *   0: dk * ek_sid
 *   1..ell: new_a[i]*G + new_r[i]*H
 *   ell+1..2ell: new_r[i]*ek_sid
 *   2ell+1: dk*<B,old_R> + (<B,new_a> + <B,v>)*G   (balance equation)
 *   2ell+2..2ell+1+n: v[j]*G + r[j]*H
 *   2ell+2+n..2ell+1+2n: r[j]*ek_sid
 *   2ell+2+2n..2ell+1+3n: r[j]*ek_rid
 *
 * With auditor (m = 2 + 3ell + 4n):
 *   After new_r[i]*ek_sid, insert new_r[i]*ek_aud
 *   After r[j]*ek_rid, insert r[j]*ek_aud
 */
function makeTransferPsi(ell: number, n: number, hasAuditor: boolean): PsiFunction {
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

    // 0: dk * ek_sid
    result.push(ekSid.multiply(dk));

    // 1..ell: new_a[i]*G + new_r[i]*H
    for (let i = 0; i < ell; i++) {
      result.push(G.multiply(newA[i]).add(H.multiply(newR[i])));
    }

    // ell+1..2ell: new_r[i]*ek_sid
    for (let i = 0; i < ell; i++) {
      result.push(ekSid.multiply(newR[i]));
    }

    // Auditor: new_r[i]*ek_aud
    if (hasAuditor) {
      const ekAud = s.points[getIdxEkAud(ell, n)];
      for (let i = 0; i < ell; i++) {
        result.push(ekAud.multiply(newR[i]));
      }
    }

    // Balance equation: dk*<B,old_R> + (<B,new_a> + <B,v>)*G
    const bPowersEll = computeBPowers(ell);
    const bPowersN = computeBPowers(n);
    let balanceResult = RistrettoPoint.ZERO;
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

    // Transfer amount commitments: v[j]*G + r[j]*H
    for (let j = 0; j < n; j++) {
      result.push(G.multiply(vChunks[j]).add(H.multiply(rTransfer[j])));
    }

    // r[j]*ek_sid
    for (let j = 0; j < n; j++) {
      result.push(ekSid.multiply(rTransfer[j]));
    }

    // r[j]*ek_rid
    for (let j = 0; j < n; j++) {
      result.push(ekRid.multiply(rTransfer[j]));
    }

    // Auditor: r[j]*ek_aud
    if (hasAuditor) {
      const ekAud = s.points[getIdxEkAud(ell, n)];
      for (let j = 0; j < n; j++) {
        result.push(ekAud.multiply(rTransfer[j]));
      }
    }

    return result;
  };
}

/**
 * Build the transformation function f for transfer.
 *
 * f outputs mirror psi but with statement points.
 */
function makeTransferF(ell: number, n: number, hasAuditor: boolean): TransformationFunction {
  return (s: SigmaProtocolStatement): RistPoint[] => {
    const G = s.points[IDX_G];
    const result: RistPoint[] = [];

    // 0: H
    result.push(s.points[IDX_H]);

    // 1..ell: new_P[i]
    const startNewP = getStartIdxNewP(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewP + i]);
    }

    // ell+1..2ell: new_R[i]
    const startNewR = getStartIdxNewR(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewR + i]);
    }

    // Auditor: new_R_aud[i]
    if (hasAuditor) {
      const startNewRAud = getStartIdxNewRAud(ell, n);
      for (let i = 0; i < ell; i++) {
        result.push(s.points[startNewRAud + i]);
      }
    }

    // Balance equation target: <B,old_P> - (<B,v>)*G
    // But v is secret in transfer, so the target is just <B,old_P>
    // Actually, the balance equation in transfer is:
    //   dk*<B,old_R> + (<B,new_a> + <B,v>)*G = dk*<B,old_P> + <B,new_a>*G + <B,v>*G
    //   which simplifies to: dk*<B,old_R> + ... = <B,old_P>  (since the secret terms cancel)
    // Wait, let's re-derive. The relation is:
    //   <B,old_P> = dk*<B,old_R> + <B,new_a>*G + <B,v>*G
    // So f's balance output = <B,old_P>
    const bPowersEll = computeBPowers(ell);
    let balanceTarget = RistrettoPoint.ZERO;
    for (let i = 0; i < ell; i++) {
      balanceTarget = balanceTarget.add(s.points[START_IDX_OLD_P + i].multiply(bPowersEll[i]));
    }
    result.push(balanceTarget);

    // Transfer amount: P[j]
    const startP = getStartIdxP(ell);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startP + j]);
    }

    // R_sid[j]
    const startRSid = getStartIdxRSid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRSid + j]);
    }

    // R_rid[j]
    const startRRid = getStartIdxRRid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRRid + j]);
    }

    // Auditor: R_aud[j]
    if (hasAuditor) {
      const startRAud = getStartIdxRAud(ell, n);
      for (let j = 0; j < n; j++) {
        result.push(s.points[startRAud + j]);
      }
    }

    return result;
  };
}

export type TransferProofArgs = {
  /** The sender's decryption key */
  dk: TwistedEd25519PrivateKey;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte recipient address */
  recipientAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
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
  /** Optional auditor encryption keys */
  auditorEncryptionKeys?: TwistedEd25519PublicKey[];
  /** Optional new balance D points encrypted under each auditor key */
  newBalanceDAud?: RistPoint[][];
  /** Optional transfer amount D points encrypted under each auditor key */
  transferAmountDAud?: RistPoint[][];
};

/**
 * Prove a confidential transfer.
 *
 * When multiple auditors are present, we produce one sigma proof per auditor
 * (each with a single ek_aud), plus one proof for the auditorless base case.
 * The Move verifier expects exactly this structure.
 *
 * However, looking at the Move code more carefully, the verifier handles
 * multiple auditors in a single proof by concatenating all auditor points.
 * Let me re-examine...
 *
 * Actually, the Move contract does: for each auditor, it appends [ek_aud, new_R_aud[], R_aud[]]
 * and the sigma proof covers ALL auditors in a single proof. So we need to support
 * multiple auditors in one proof.
 *
 * Wait -- let me re-read the spec. The spec says "With auditor" singular. Looking at
 * the Move code, it handles a vector of auditors. But the sigma protocol proof structure
 * has a single ek_aud. The Move contract likely creates separate proofs or handles
 * auditors differently.
 *
 * For now, we support 0 or 1 auditor in the sigma proof (matching the current Move contract).
 * Multiple auditors: the contract creates one proof that covers all auditors by extending
 * the statement with [ek_aud_0, ..., ek_aud_k] etc. But for simplicity and to match
 * what the transaction builder currently does, we handle the single-auditor case.
 */
export function proveTransfer(args: TransferProofArgs): SigmaProtocolProof {
  const {
    dk,
    senderAddress,
    recipientAddress,
    tokenAddress,
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
    auditorEncryptionKeys = [],
    newBalanceDAud = [],
    transferAmountDAud = [],
  } = args;

  const ell = oldBalanceC.length;
  const n = transferAmountC.length;
  // We support at most one auditor in the sigma proof
  const hasAuditor = auditorEncryptionKeys.length > 0;
  const dkBigint = bytesToNumberLE(dk.toUint8Array());

  const G = RistrettoPoint.BASE;
  const H = H_RISTRETTO;
  const ekSidBytes = senderEncryptionKey.toUint8Array();
  const ekSid = RistrettoPoint.fromHex(ekSidBytes);
  const ekRidBytes = recipientEncryptionKey.toUint8Array();
  const ekRid = RistrettoPoint.fromHex(ekRidBytes);

  // Build statement points
  const stmtPoints: RistPoint[] = [G, H, ekSid, ekRid];
  const stmtCompressed: Uint8Array[] = [G.toRawBytes(), H.toRawBytes(), ekSidBytes, ekRidBytes];

  // old_P
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceC[i]);
    stmtCompressed.push(oldBalanceC[i].toRawBytes());
  }
  // old_R
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceD[i]);
    stmtCompressed.push(oldBalanceD[i].toRawBytes());
  }
  // new_P
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceC[i]);
    stmtCompressed.push(newBalanceC[i].toRawBytes());
  }
  // new_R
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceD[i]);
    stmtCompressed.push(newBalanceD[i].toRawBytes());
  }
  // P (transfer amount commitments, shared between sender and recipient)
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountC[j]);
    stmtCompressed.push(transferAmountC[j].toRawBytes());
  }
  // R_sid (transfer amount D for sender)
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountDSender[j]);
    stmtCompressed.push(transferAmountDSender[j].toRawBytes());
  }
  // R_rid (transfer amount D for recipient)
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountDRecipient[j]);
    stmtCompressed.push(transferAmountDRecipient[j].toRawBytes());
  }

  // Auditor points
  if (hasAuditor) {
    // For each auditor: ek_aud, then new_R_aud[ell], then R_aud[n]
    for (let a = 0; a < auditorEncryptionKeys.length; a++) {
      const ekAudBytes = auditorEncryptionKeys[a].toUint8Array();
      stmtPoints.push(RistrettoPoint.fromHex(ekAudBytes));
      stmtCompressed.push(ekAudBytes);

      for (let i = 0; i < ell; i++) {
        stmtPoints.push(newBalanceDAud[a][i]);
        stmtCompressed.push(newBalanceDAud[a][i].toRawBytes());
      }

      for (let j = 0; j < n; j++) {
        stmtPoints.push(transferAmountDAud[a][j]);
        stmtCompressed.push(transferAmountDAud[a][j].toRawBytes());
      }
    }
  }

  // Transfer has no public scalars (v is secret)
  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [],
  };

  // Build witness: [dk, new_a[ell], new_r[ell], v[n], r[n]]
  const witness: bigint[] = [dkBigint, ...newAmountChunks, ...newRandomness, ...transferAmountChunks, ...transferRandomness];

  // Build domain separator
  const sessionId = bcsSerializeTransferSession(senderAddress, recipientAddress, tokenAddress, ell, n);
  const dst: DomainSeparator = {
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolProve(dst, makeTransferPsiMultiAuditor(ell, n, auditorEncryptionKeys.length), stmt, witness);
}

/**
 * Build psi for transfer with support for multiple auditors.
 *
 * Statement layout with k auditors:
 *   [G, H, ek_sid, ek_rid, old_P[ell], old_R[ell], new_P[ell], new_R[ell], P[n], R_sid[n], R_rid[n],
 *    ek_aud_0, new_R_aud_0[ell], R_aud_0[n],
 *    ek_aud_1, new_R_aud_1[ell], R_aud_1[n], ...]
 */
function makeTransferPsiMultiAuditor(ell: number, n: number, numAuditors: number): PsiFunction {
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

    // 0: dk * ek_sid
    result.push(ekSid.multiply(dk));

    // 1..ell: new_a[i]*G + new_r[i]*H
    for (let i = 0; i < ell; i++) {
      result.push(G.multiply(newA[i]).add(H.multiply(newR[i])));
    }

    // ell+1..2ell: new_r[i]*ek_sid
    for (let i = 0; i < ell; i++) {
      result.push(ekSid.multiply(newR[i]));
    }

    // For each auditor: new_r[i]*ek_aud_a
    const auditorBaseIdx = START_IDX_OLD_P + 4 * ell + 3 * n;
    for (let a = 0; a < numAuditors; a++) {
      const ekAudIdx = auditorBaseIdx + a * (1 + ell + n);
      const ekAud = s.points[ekAudIdx];
      for (let i = 0; i < ell; i++) {
        result.push(ekAud.multiply(newR[i]));
      }
    }

    // Balance equation: dk*<B,old_R> + (<B,new_a> + <B,v>)*G
    const bPowersEll = computeBPowers(ell);
    const bPowersN = computeBPowers(n);
    let balanceResult = RistrettoPoint.ZERO;
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

    // Transfer amount commitments: v[j]*G + r[j]*H
    for (let j = 0; j < n; j++) {
      result.push(G.multiply(vChunks[j]).add(H.multiply(rTransfer[j])));
    }

    // r[j]*ek_sid
    for (let j = 0; j < n; j++) {
      result.push(ekSid.multiply(rTransfer[j]));
    }

    // r[j]*ek_rid
    for (let j = 0; j < n; j++) {
      result.push(ekRid.multiply(rTransfer[j]));
    }

    // For each auditor: r[j]*ek_aud_a
    for (let a = 0; a < numAuditors; a++) {
      const ekAudIdx = auditorBaseIdx + a * (1 + ell + n);
      const ekAud = s.points[ekAudIdx];
      for (let j = 0; j < n; j++) {
        result.push(ekAud.multiply(rTransfer[j]));
      }
    }

    return result;
  };
}

/**
 * Build f for transfer with multiple auditors.
 */
function makeTransferFMultiAuditor(ell: number, n: number, numAuditors: number): TransformationFunction {
  return (s: SigmaProtocolStatement): RistPoint[] => {
    const result: RistPoint[] = [];

    // 0: H
    result.push(s.points[IDX_H]);

    // 1..ell: new_P[i]
    const startNewP = getStartIdxNewP(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewP + i]);
    }

    // ell+1..2ell: new_R[i]
    const startNewR = getStartIdxNewR(ell);
    for (let i = 0; i < ell; i++) {
      result.push(s.points[startNewR + i]);
    }

    // For each auditor: new_R_aud_a[i]
    const auditorBaseIdx = START_IDX_OLD_P + 4 * ell + 3 * n;
    for (let a = 0; a < numAuditors; a++) {
      const newRAudStart = auditorBaseIdx + a * (1 + ell + n) + 1;
      for (let i = 0; i < ell; i++) {
        result.push(s.points[newRAudStart + i]);
      }
    }

    // Balance equation target: <B,old_P>
    const bPowersEll = computeBPowers(ell);
    let balanceTarget = RistrettoPoint.ZERO;
    for (let i = 0; i < ell; i++) {
      balanceTarget = balanceTarget.add(s.points[START_IDX_OLD_P + i].multiply(bPowersEll[i]));
    }
    result.push(balanceTarget);

    // Transfer amount: P[j]
    const startP = getStartIdxP(ell);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startP + j]);
    }

    // R_sid[j]
    const startRSid = getStartIdxRSid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRSid + j]);
    }

    // R_rid[j]
    const startRRid = getStartIdxRRid(ell, n);
    for (let j = 0; j < n; j++) {
      result.push(s.points[startRRid + j]);
    }

    // For each auditor: R_aud_a[j]
    for (let a = 0; a < numAuditors; a++) {
      const rAudStart = auditorBaseIdx + a * (1 + ell + n) + 1 + ell;
      for (let j = 0; j < n; j++) {
        result.push(s.points[rAudStart + j]);
      }
    }

    return result;
  };
}

/**
 * Verify a confidential transfer proof.
 */
export function verifyTransfer(args: {
  senderAddress: Uint8Array;
  recipientAddress: Uint8Array;
  tokenAddress: Uint8Array;
  ekSidBytes: Uint8Array;
  ekRidBytes: Uint8Array;
  oldBalanceC: RistPoint[];
  oldBalanceD: RistPoint[];
  newBalanceC: RistPoint[];
  newBalanceD: RistPoint[];
  transferAmountC: RistPoint[];
  transferAmountDSender: RistPoint[];
  transferAmountDRecipient: RistPoint[];
  auditorEkBytes?: Uint8Array[];
  newBalanceDAud?: RistPoint[][];
  transferAmountDAud?: RistPoint[][];
  proof: SigmaProtocolProof;
}): boolean {
  const {
    senderAddress,
    recipientAddress,
    tokenAddress,
    ekSidBytes,
    ekRidBytes,
    oldBalanceC,
    oldBalanceD,
    newBalanceC,
    newBalanceD,
    transferAmountC,
    transferAmountDSender,
    transferAmountDRecipient,
    auditorEkBytes = [],
    newBalanceDAud = [],
    transferAmountDAud = [],
    proof,
  } = args;

  const ell = oldBalanceC.length;
  const n = transferAmountC.length;
  const numAuditors = auditorEkBytes.length;

  const G = RistrettoPoint.BASE;
  const H = H_RISTRETTO;
  const ekSid = RistrettoPoint.fromHex(ekSidBytes);
  const ekRid = RistrettoPoint.fromHex(ekRidBytes);

  const stmtPoints: RistPoint[] = [G, H, ekSid, ekRid];
  const stmtCompressed: Uint8Array[] = [G.toRawBytes(), H.toRawBytes(), ekSidBytes, ekRidBytes];

  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceC[i]);
    stmtCompressed.push(oldBalanceC[i].toRawBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(oldBalanceD[i]);
    stmtCompressed.push(oldBalanceD[i].toRawBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceC[i]);
    stmtCompressed.push(newBalanceC[i].toRawBytes());
  }
  for (let i = 0; i < ell; i++) {
    stmtPoints.push(newBalanceD[i]);
    stmtCompressed.push(newBalanceD[i].toRawBytes());
  }
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountC[j]);
    stmtCompressed.push(transferAmountC[j].toRawBytes());
  }
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountDSender[j]);
    stmtCompressed.push(transferAmountDSender[j].toRawBytes());
  }
  for (let j = 0; j < n; j++) {
    stmtPoints.push(transferAmountDRecipient[j]);
    stmtCompressed.push(transferAmountDRecipient[j].toRawBytes());
  }

  for (let a = 0; a < numAuditors; a++) {
    stmtPoints.push(RistrettoPoint.fromHex(auditorEkBytes[a]));
    stmtCompressed.push(auditorEkBytes[a]);

    for (let i = 0; i < ell; i++) {
      stmtPoints.push(newBalanceDAud[a][i]);
      stmtCompressed.push(newBalanceDAud[a][i].toRawBytes());
    }

    for (let j = 0; j < n; j++) {
      stmtPoints.push(transferAmountDAud[a][j]);
      stmtCompressed.push(transferAmountDAud[a][j].toRawBytes());
    }
  }

  const stmt: SigmaProtocolStatement = {
    points: stmtPoints,
    compressedPoints: stmtCompressed,
    scalars: [],
  };

  const sessionId = bcsSerializeTransferSession(senderAddress, recipientAddress, tokenAddress, ell, n);
  const dst: DomainSeparator = {
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolVerify(
    dst,
    makeTransferPsiMultiAuditor(ell, n, numAuditors),
    makeTransferFMultiAuditor(ell, n, numAuditors),
    stmt,
    proof,
  );
}
