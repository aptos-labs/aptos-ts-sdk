// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Generic Sigma protocol prover matching the Move verifier in `sigma_protocol.move`.
 *
 * The Move verifier uses BCS-serialized `FiatShamirInputs` for the Fiat-Shamir challenge,
 * so the prover must produce the exact same serialization.
 */

import { sha512 } from "@noble/hashes/sha512";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { Serializer, U64, Serializable, FixedBytes } from "@aptos-labs/ts-sdk";
import { ed25519modN, ed25519GenListOfRandom } from "../utils";
import { RistrettoPoint } from ".";
import type { RistPoint } from ".";

// =============================================================================
// Domain Separator & Session
// =============================================================================

/**
 * Matches the Move `DomainSeparator` struct:
 * ```move
 * struct DomainSeparator { protocol_id: vector<u8>, session_id: vector<u8> }
 * ```
 */
export interface DomainSeparator {
  protocolId: Uint8Array;
  sessionId: Uint8Array;
}

/**
 * BCS-serializable DomainSeparator.
 */
class BcsDomainSeparator extends Serializable {
  constructor(public readonly dst: DomainSeparator) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.dst.protocolId);
    serializer.serializeBytes(this.dst.sessionId);
  }
}

/**
 * Serialize a KeyRotationSession to BCS bytes (to be used as sessionId in DomainSeparator).
 *
 * Matches the Move struct:
 * ```move
 * struct KeyRotationSession { sender: address, token_type: Object<Metadata>, num_chunks: u64 }
 * ```
 */
export function bcsSerializeKeyRotationSession(
  senderAddress: Uint8Array,
  tokenTypeAddress: Uint8Array,
  numChunks: number,
): Uint8Array {
  const serializer = new Serializer();
  // address is 32 raw bytes (FixedBytes, no length prefix)
  serializer.serialize(new FixedBytes(senderAddress));
  // Object<Metadata> is 32 raw bytes (FixedBytes, no length prefix)
  serializer.serialize(new FixedBytes(tokenTypeAddress));
  // u64 is 8 bytes LE
  serializer.serialize(new U64(numChunks));
  return serializer.toUint8Array();
}

// =============================================================================
// Statement
// =============================================================================

/**
 * A public statement for a Sigma protocol, matching `sigma_protocol_statement::Statement`.
 * Contains points (RistrettoPoints), their compressed forms, and optional scalars.
 */
export interface SigmaProtocolStatement {
  /** The decompressed points in the statement */
  points: RistPoint[];
  /** The compressed (serialized) points (32 bytes each) */
  compressedPoints: Uint8Array[];
  /** Optional public scalars in the statement (empty for key rotation) */
  scalars: Uint8Array[];
}

// =============================================================================
// Fiat-Shamir Challenge
// =============================================================================

/**
 * BCS-serializable `FiatShamirInputs` struct matching the Move definition:
 * ```move
 * struct FiatShamirInputs {
 *     dst: DomainSeparator,
 *     k: u64,
 *     stmt_X: vector<CompressedRistretto>,
 *     stmt_x: vector<Scalar>,
 *     proof_A: vector<CompressedRistretto>,
 * }
 * ```
 */
class BcsFiatShamirInputs extends Serializable {
  constructor(
    public readonly dst: DomainSeparator,
    public readonly k: number,
    public readonly stmtX: Uint8Array[],
    public readonly stmtx: Uint8Array[],
    public readonly proofA: Uint8Array[],
  ) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(new BcsDomainSeparator(this.dst));
    serializer.serialize(new U64(this.k));
    // vector<CompressedRistretto> where CompressedRistretto = { data: vector<u8> }
    serializer.serializeU32AsUleb128(this.stmtX.length);
    for (const p of this.stmtX) {
      serializer.serializeBytes(p);
    }
    // vector<Scalar> where Scalar = { data: vector<u8> }
    serializer.serializeU32AsUleb128(this.stmtx.length);
    for (const s of this.stmtx) {
      serializer.serializeBytes(s);
    }
    // vector<CompressedRistretto>
    serializer.serializeU32AsUleb128(this.proofA.length);
    for (const a of this.proofA) {
      serializer.serializeBytes(a);
    }
  }
}

/**
 * Converts 64 hash bytes to a scalar using the same method as Move's
 * `ristretto255::new_scalar_uniform_from_64_bytes`: interpret as 512-bit LE integer, reduce mod l.
 */
function scalarFromUniform64Bytes(hash: Uint8Array): bigint {
  return ed25519modN(bytesToNumberLE(hash));
}

/**
 * Compute the Fiat-Shamir challenge matching Move's `sigma_protocol_fiat_shamir::fiat_shamir`.
 *
 * Returns `{ e, betas }` where `e` is the challenge scalar and `betas = [1, beta, beta^2, ...]`.
 */
export function sigmaProtocolFiatShamir(
  dst: DomainSeparator,
  stmt: SigmaProtocolStatement,
  compressedA: Uint8Array[],
  k: number,
): { e: bigint; betas: bigint[] } {
  const m = compressedA.length;
  if (m === 0) throw new Error("Proof commitment must not be empty");

  const fiatShamirInputs = new BcsFiatShamirInputs(dst, k, stmt.compressedPoints, stmt.scalars, compressedA);
  const bytes = fiatShamirInputs.bcsToBytes();

  const eHash = sha512(bytes);
  const betaHash = sha512(eHash);

  const e = scalarFromUniform64Bytes(eHash);
  const beta = scalarFromUniform64Bytes(betaHash);

  const betas: bigint[] = [1n]; // beta^0 = 1
  let prevBeta = 1n;
  for (let i = 1; i < m; i++) {
    prevBeta = ed25519modN(prevBeta * beta);
    betas.push(prevBeta);
  }

  return { e, betas };
}

// =============================================================================
// Generic Sigma Protocol Prover
// =============================================================================

/**
 * A homomorphism function psi: given witness scalars and statement points,
 * returns a vector of m RistrettoPoints.
 */
export type PsiFunction = (stmt: SigmaProtocolStatement, witness: bigint[]) => RistPoint[];

/**
 * A transformation function f: given a statement, returns the target vector
 * that psi(witness) should equal.
 */
export type TransformationFunction = (stmt: SigmaProtocolStatement) => RistPoint[];

/**
 * The result of a Sigma protocol proof.
 */
export interface SigmaProtocolProof {
  /** Compressed commitment points A (one per output of psi) */
  commitment: Uint8Array[];
  /** Response scalars sigma = alpha + e * w (one per witness element) */
  response: Uint8Array[];
}

/**
 * Generic Sigma protocol prover.
 *
 * Given:
 * - A domain separator `dst`
 * - A homomorphism `psi` mapping witness scalars to group elements
 * - A statement `stmt` containing the public points/scalars
 * - A witness `w` (vector of secret scalars)
 *
 * Produces a proof (A, sigma) where:
 * - A = psi(alpha) for random alpha
 * - e = FiatShamir(dst, stmt, A, k)
 * - sigma = alpha + e * w
 */
export function sigmaProtocolProve(
  dst: DomainSeparator,
  psi: PsiFunction,
  stmt: SigmaProtocolStatement,
  witness: bigint[],
): SigmaProtocolProof {
  const k = witness.length;

  // Step 1: Pick random alpha in F^k
  const alpha = ed25519GenListOfRandom(k);

  // Step 2: A = psi(alpha)
  const _A = psi(stmt, alpha);

  // Step 3: Compress A
  const compressedA = _A.map((p) => p.toRawBytes());

  // Step 4: Derive challenge e via Fiat-Shamir
  const { e } = sigmaProtocolFiatShamir(dst, stmt, compressedA, k);

  // Step 5: sigma_i = alpha_i + e * w_i  (mod l)
  const sigma = witness.map((w_i, i) => ed25519modN(alpha[i] + e * w_i));

  return {
    commitment: compressedA,
    response: sigma.map((s) => numberToBytesLE(s, 32)),
  };
}

// =============================================================================
// Generic Sigma Protocol Verifier
// =============================================================================

/**
 * Generic Sigma protocol verifier.
 *
 * Verifies a proof (A, sigma) by checking:
 *   psi(sigma) == A + e * f(stmt)
 *
 * For each output index i:
 *   psi(stmt, sigma)[i] == A[i] + e * f(stmt)[i]
 *
 * @param dst - Domain separator for Fiat-Shamir
 * @param psi - Homomorphism function mapping scalars to group elements
 * @param f - Transformation function that extracts target points from statement
 * @param stmt - The public statement
 * @param proof - The proof to verify (commitment A and response sigma)
 * @returns true if the proof verifies, false otherwise
 */
export function sigmaProtocolVerify(
  dst: DomainSeparator,
  psi: PsiFunction,
  f: TransformationFunction,
  stmt: SigmaProtocolStatement,
  proof: SigmaProtocolProof,
): boolean {
  const { commitment, response } = proof;
  const m = commitment.length;
  const k = response.length;

  if (m === 0) return false;

  // Convert response bytes back to bigints
  const sigma = response.map((r) => bytesToNumberLE(r));

  // Recompute the challenge e
  const { e } = sigmaProtocolFiatShamir(dst, stmt, commitment, k);

  // Compute psi(sigma) - evaluating the homomorphism on the response
  const psiSigma = psi(stmt, sigma);

  // Compute f(stmt) - the transformation function output
  const fStmt = f(stmt);

  if (psiSigma.length !== m || fStmt.length !== m) {
    return false;
  }

  // Decompress commitment points A
  const _A = commitment.map((c) => RistrettoPoint.fromHex(c));

  // Check: psi(sigma)[i] == A[i] + e * f(stmt)[i] for all i
  for (let i = 0; i < m; i++) {
    // RHS = A[i] + e * f(stmt)[i]
    const rhs = _A[i].add(fStmt[i].multiply(e));

    if (!psiSigma[i].equals(rhs)) {
      return false;
    }
  }

  return true;
}
