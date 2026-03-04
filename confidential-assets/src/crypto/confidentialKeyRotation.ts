// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Key rotation proof using the new generic Sigma protocol framework.
 *
 * The NP relation (from `sigma_protocol_key_rotation.move`):
 *
 *   H = dk * ek
 *   new_ek = delta * ek
 *   ek = delta_inv * new_ek
 *   new_D_i = delta * old_D_i,  for all i in [num_chunks]
 *
 * where:
 *   - H is the encryption key basepoint (= hash_to_point_base)
 *   - ek is the old encryption key
 *   - new_ek is the new encryption key
 *   - dk is the old decryption key
 *   - delta = old_dk * new_dk^{-1}  (since ek = dk^{-1} * H)
 *   - delta_inv = new_dk * old_dk^{-1}
 *
 * The homomorphism psi(dk, delta, delta_inv) outputs:
 *   [dk * ek, delta * ek, delta_inv * new_ek, delta * old_D_i for each i]
 *
 * The transformation function f outputs:
 *   [H, new_ek, ek, new_D_i for each i]
 */

import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey, RistrettoPoint, H_RISTRETTO } from ".";
import type { RistPoint } from ".";
import { ed25519InvertN, ed25519modN } from "../utils";
import { EncryptedAmount } from "./encryptedAmount";
import type { TwistedElGamalCiphertext } from "./twistedElGamal";
import { AVAILABLE_BALANCE_CHUNK_COUNT } from "./chunkedAmount";
import {
  sigmaProtocolProve,
  sigmaProtocolVerify,
  bcsSerializeKeyRotationSession,
  APTOS_EXPERIMENTAL_ADDRESS,
  type DomainSeparator,
  type SigmaProtocolStatement,
  type SigmaProtocolProof,
  type PsiFunction,
  type TransformationFunction,
} from "./sigmaProtocol";

/** Protocol ID matching the Move constant */
const PROTOCOL_ID = "AptosConfidentialAsset/KeyRotationV1";

/** Statement point indices (matching Move constants) */
const IDX_H = 0;
const IDX_EK = 1;
const IDX_EK_NEW = 2;
const START_IDX_OLD_D = 3;

/** Helper to get the starting index for new_D values */
function getStartIdxForNewD(numChunks: number): number {
  return START_IDX_OLD_D + numChunks;
}

/**
 * Build the homomorphism psi for key rotation.
 *
 * psi(dk, delta, delta_inv) = [dk*ek, delta*ek, delta_inv*new_ek, delta*old_D_i for each i]
 */
function makeKeyRotationPsi(numChunks: number): PsiFunction {
  return (s: SigmaProtocolStatement, w: bigint[]): RistPoint[] => {
    const dk_w = w[0];
    const delta_w = w[1];
    const deltaInv_w = w[2];

    const ek = s.points[IDX_EK];
    const new_ek = s.points[IDX_EK_NEW];

    const result: RistPoint[] = [
      ek.multiply(dk_w),            // dk * ek
      ek.multiply(delta_w),         // delta * ek
      new_ek.multiply(deltaInv_w),  // delta_inv * new_ek
    ];

    for (let i = 0; i < numChunks; i++) {
      result.push(s.points[START_IDX_OLD_D + i].multiply(delta_w));
    }

    return result;
  };
}

/**
 * Build the transformation function f for key rotation.
 *
 * f(stmt) = [H, new_ek, ek, new_D_i for each i]
 */
function makeKeyRotationF(numChunks: number): TransformationFunction {
  return (s: SigmaProtocolStatement): RistPoint[] => {
    const idxNewDStart = getStartIdxForNewD(numChunks);

    const result: RistPoint[] = [
      s.points[IDX_H],       // H
      s.points[IDX_EK_NEW],  // new_ek
      s.points[IDX_EK],      // ek
    ];

    for (let i = 0; i < numChunks; i++) {
      result.push(s.points[idxNewDStart + i]);
    }

    return result;
  };
}

export type CreateConfidentialKeyRotationOpArgs = {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  newSenderDecryptionKey: TwistedEd25519PrivateKey;
  currentEncryptedAvailableBalance: EncryptedAmount;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte token/metadata object address */
  tokenAddress: Uint8Array;
  /** Chain ID for domain separation */
  chainId: number;
};

export type KeyRotationProof = {
  /** New encryption key (32 bytes, compressed Ristretto point) */
  newEkBytes: Uint8Array;
  /** Re-encrypted D components (one 32-byte array per chunk) */
  newDBytes: Uint8Array[];
  /** Sigma protocol proof */
  proof: SigmaProtocolProof;
};

export class ConfidentialKeyRotation {
  private currentDecryptionKey: TwistedEd25519PrivateKey;

  private newDecryptionKey: TwistedEd25519PrivateKey;

  private currentEncryptedAvailableBalance: EncryptedAmount;

  private senderAddress: Uint8Array;

  private tokenAddress: Uint8Array;

  private chainId: number;

  constructor(args: {
    currentDecryptionKey: TwistedEd25519PrivateKey;
    newDecryptionKey: TwistedEd25519PrivateKey;
    currentEncryptedAvailableBalance: EncryptedAmount;
    senderAddress: Uint8Array;
    tokenAddress: Uint8Array;
    chainId: number;
  }) {
    this.currentDecryptionKey = args.currentDecryptionKey;
    this.newDecryptionKey = args.newDecryptionKey;
    this.currentEncryptedAvailableBalance = args.currentEncryptedAvailableBalance;
    this.senderAddress = args.senderAddress;
    this.tokenAddress = args.tokenAddress;
    this.chainId = args.chainId;
  }

  static create(args: CreateConfidentialKeyRotationOpArgs): ConfidentialKeyRotation {
    return new ConfidentialKeyRotation({
      currentDecryptionKey: args.senderDecryptionKey,
      newDecryptionKey: args.newSenderDecryptionKey,
      currentEncryptedAvailableBalance: args.currentEncryptedAvailableBalance,
      senderAddress: args.senderAddress,
      tokenAddress: args.tokenAddress,
      chainId: args.chainId,
    });
  }

  /**
   * Generate the key rotation proof and re-encrypted balance components.
   *
   * Returns everything needed to call the `rotate_encryption_key_raw` entry function.
   */
  authorizeKeyRotation(): KeyRotationProof {
    const numChunks = AVAILABLE_BALANCE_CHUNK_COUNT;
    const oldDk = bytesToNumberLE(this.currentDecryptionKey.toUint8Array());
    const newDk = bytesToNumberLE(this.newDecryptionKey.toUint8Array());

    // delta = old_dk * new_dk^{-1} (since ek = dk^{-1} * H, new_ek = delta * old_ek)
    const newDkInv = ed25519InvertN(newDk);
    const delta = ed25519modN(oldDk * newDkInv);
    const deltaInv = ed25519InvertN(delta);

    // Get old encryption key (compressed Ristretto point)
    const oldEkBytes = this.currentDecryptionKey.publicKey().toUint8Array();
    const oldEk = RistrettoPoint.fromHex(oldEkBytes);

    // H = encryption key basepoint (hash_to_point_base)
    const H = H_RISTRETTO;
    const compressedH = H.toRawBytes();

    // new_ek = delta * old_ek
    const newEk = oldEk.multiply(delta);
    const compressedNewEk = newEk.toRawBytes();

    // Get old D components from the current balance
    const oldCipherTexts = this.currentEncryptedAvailableBalance.getCipherText();
    const oldD: RistPoint[] = oldCipherTexts.map((ct) => ct.D);
    const compressedOldD: Uint8Array[] = oldD.map((d) => d.toRawBytes());

    // Compute new_D = delta * old_D for each chunk
    const newD: RistPoint[] = oldD.map((d) => d.multiply(delta));
    const compressedNewD: Uint8Array[] = newD.map((d) => d.toRawBytes());

    // Build statement: points = [H, ek, new_ek, old_D_0..old_D_{n-1}, new_D_0..new_D_{n-1}]
    const stmtPoints: RistPoint[] = [H, oldEk, newEk, ...oldD, ...newD];
    const stmtCompressedPoints: Uint8Array[] = [compressedH, oldEkBytes, compressedNewEk, ...compressedOldD, ...compressedNewD];

    const stmt: SigmaProtocolStatement = {
      points: stmtPoints,
      compressedPoints: stmtCompressedPoints,
      scalars: [], // key rotation has no public scalars
    };

    // Build witness: [dk, delta, delta_inv]
    const witness: bigint[] = [oldDk, delta, deltaInv];

    // Build domain separator
    const sessionId = bcsSerializeKeyRotationSession(this.senderAddress, this.tokenAddress, numChunks);
    const dst: DomainSeparator = {
      contractAddress: APTOS_EXPERIMENTAL_ADDRESS,
      chainId: this.chainId,
      protocolId: utf8ToBytes(PROTOCOL_ID),
      sessionId,
    };

    // Generate the proof
    const proof: SigmaProtocolProof = sigmaProtocolProve(dst, makeKeyRotationPsi(numChunks), stmt, witness);

    return {
      newEkBytes: compressedNewEk,
      newDBytes: compressedNewD,
      proof,
    };
  }

  /**
   * Verify a key rotation sigma protocol proof.
   *
   * @param args.oldEk - The old encryption key (32 bytes compressed)
   * @param args.newEk - The new encryption key (32 bytes compressed)
   * @param args.oldD - The old D components from the ciphertext (one per chunk)
   * @param args.newD - The new D components after re-encryption (one per chunk)
   * @param args.senderAddress - 32-byte sender address
   * @param args.tokenAddress - 32-byte token/metadata address
   * @param args.proof - The sigma protocol proof to verify
   * @returns true if the proof verifies, false otherwise
   */
  static verify(args: {
    oldEk: Uint8Array;
    newEk: Uint8Array;
    oldD: Uint8Array[];
    newD: Uint8Array[];
    senderAddress: Uint8Array;
    tokenAddress: Uint8Array;
    chainId: number;
    proof: SigmaProtocolProof;
  }): boolean {
    const { oldEk, newEk, oldD, newD, senderAddress, tokenAddress, chainId, proof } = args;
    const numChunks = oldD.length;

    if (newD.length !== numChunks) {
      return false;
    }

    // Build statement points
    const H = H_RISTRETTO;
    const ek = RistrettoPoint.fromHex(oldEk);
    const new_ek = RistrettoPoint.fromHex(newEk);
    const oldDPoints = oldD.map((d) => RistrettoPoint.fromHex(d));
    const newDPoints = newD.map((d) => RistrettoPoint.fromHex(d));

    const stmtPoints: RistPoint[] = [H, ek, new_ek, ...oldDPoints, ...newDPoints];
    const stmtCompressedPoints: Uint8Array[] = [
      H.toRawBytes(),
      oldEk,
      newEk,
      ...oldD,
      ...newD,
    ];

    const stmt: SigmaProtocolStatement = {
      points: stmtPoints,
      compressedPoints: stmtCompressedPoints,
      scalars: [],
    };

    // Build domain separator
    const sessionId = bcsSerializeKeyRotationSession(senderAddress, tokenAddress, numChunks);
    const dst: DomainSeparator = {
      contractAddress: APTOS_EXPERIMENTAL_ADDRESS,
      chainId,
      protocolId: utf8ToBytes(PROTOCOL_ID),
      sessionId,
    };

    return sigmaProtocolVerify(dst, makeKeyRotationPsi(numChunks), makeKeyRotationF(numChunks), stmt, proof);
  }
}
