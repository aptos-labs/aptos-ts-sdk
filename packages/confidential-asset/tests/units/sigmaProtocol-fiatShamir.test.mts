// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Regression tests for aptos-core #19711 (Fiat-Shamir batching-challenge binding).
 *
 * Soundness of the aggregated check
 *
 *   sum_i β^i · (ψ_i(σ) − A_i − e · f_i(X)) = 0
 *
 * requires β to be unpredictable to the prover at the moment σ is committed. That
 * requires σ to be part of the Fiat-Shamir transcript that derives β. Conversely,
 * e MUST NOT depend on σ — the honest prover computes σ = α + e · w, so e must be
 * fixed before σ exists.
 *
 * These tests pin the same transcript properties as
 * `sigma_protocol_fiat_shamir.move::beta_changes_with_sigma_e_does_not`.
 */

import { describe, expect, it } from "vitest";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/utils.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { concatBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { FixedBytes, Serializer, U64 } from "@aptos-labs/ts-sdk";
import { H_RISTRETTO, TwistedEd25519PrivateKey } from "../../src/crypto/twistedEd25519.js";
import {
  APTOS_FRAMEWORK_ADDRESS,
  sigmaProtocolFiatShamir,
  type DomainSeparator,
  type SigmaProtocolStatement,
} from "../../src/crypto/sigmaProtocol.js";
import { proveRegistration, verifyRegistration } from "../../src/crypto/sigmaProtocolRegistration.js";
import { ed25519modN } from "../../src/utils.js";

const TYPE_NAME = "0x1::sigma_protocol_fiat_shamir::TestProtocol";

function testDst(): DomainSeparator {
  return {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId: 4,
    protocolId: utf8ToBytes("fs regression"),
    sessionId: utf8ToBytes("session"),
  };
}

function baseStatement(): SigmaProtocolStatement {
  const G = ristretto255.Point.BASE;
  const H = H_RISTRETTO;
  return {
    points: [G, H],
    compressedPoints: [G.toBytes(), H.toBytes()],
    scalars: [],
  };
}

/**
 * Independently reconstruct Move's Fiat-Shamir seed:
 * SHA2-512(BCS{ DomainSeparator::V1, type_name, k, stmt_X, stmt_x, proof_A }).
 * Used to pin that empty σ still appends BCS `0x00`, not the pre-#19711 `seed || 0x01`.
 */
function fiatShamirSeed(
  dst: DomainSeparator,
  typeName: string,
  k: number,
  stmt: SigmaProtocolStatement,
  compressedA: Uint8Array[],
): Uint8Array {
  const serializer = new Serializer();
  serializer.serializeU32AsUleb128(0); // DomainSeparator::V1
  serializer.serialize(new FixedBytes(dst.contractAddress));
  serializer.serializeU8(dst.chainId);
  serializer.serializeBytes(dst.protocolId);
  serializer.serializeBytes(dst.sessionId);
  serializer.serializeBytes(utf8ToBytes(typeName));
  serializer.serialize(new U64(k));
  serializer.serializeU32AsUleb128(stmt.compressedPoints.length);
  for (const p of stmt.compressedPoints) {
    serializer.serializeBytes(p);
  }
  serializer.serializeU32AsUleb128(stmt.scalars.length);
  for (const s of stmt.scalars) {
    serializer.serializeBytes(s);
  }
  serializer.serializeU32AsUleb128(compressedA.length);
  for (const a of compressedA) {
    serializer.serializeBytes(a);
  }
  return sha512(serializer.toUint8Array());
}

function scalarFromUniform64(hash: Uint8Array): bigint {
  return ed25519modN(bytesToNumberLE(hash));
}

describe("sigmaProtocolFiatShamir transcript binding (aptos-core #19711)", () => {
  const dst = testDst();
  const stmt = baseStatement();
  // m = 2 ⇒ betas = [1, β]; betas[1] is the raw β value.
  const compressedA = [ristretto255.Point.ZERO.toBytes(), ristretto255.Point.ZERO.toBytes()];
  const k = 1;
  const sigmasA = [numberToBytesLE(7n, 32)];
  const sigmasB = [numberToBytesLE(8n, 32)];

  it("changing σ changes β and does not change e", () => {
    const a = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasA);
    const b = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasB);

    expect(a.e).toBe(b.e);
    expect(a.betas[1]).not.toBe(b.betas[1]);
  });

  it("an empty σ vector still binds the BCS length prefix into β", () => {
    const empty = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, []);
    const nonempty = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasA);

    expect(empty.e).toBe(nonempty.e);
    expect(empty.betas[1]).not.toBe(nonempty.betas[1]);

    const seed = fiatShamirSeed(dst, TYPE_NAME, k, stmt, compressedA);
    const betaWithEmptyBcs = scalarFromUniform64(sha512(concatBytes(seed, new Uint8Array([0x01, 0x00]))));
    const betaWithoutBcs = scalarFromUniform64(sha512(concatBytes(seed, new Uint8Array([0x01]))));
    expect(empty.betas[1]).toBe(betaWithEmptyBcs);
    expect(empty.betas[1]).not.toBe(betaWithoutBcs);
    expect(empty.e).toBe(scalarFromUniform64(sha512(concatBytes(seed, new Uint8Array([0x00])))));
  });

  it("changing A changes both e and β", () => {
    const altA = [ristretto255.Point.BASE.toBytes(), ristretto255.Point.ZERO.toBytes()];
    const base = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasA);
    const alt = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, altA, k, sigmasA);

    expect(base.e).not.toBe(alt.e);
    expect(base.betas[1]).not.toBe(alt.betas[1]);
  });

  it("changing the statement changes both e and β", () => {
    const altStmt: SigmaProtocolStatement = {
      ...stmt,
      scalars: [numberToBytesLE(1n, 32)],
    };
    const base = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasA);
    const alt = sigmaProtocolFiatShamir(dst, TYPE_NAME, stmt, compressedA, k, sigmasA);

    // Sanity: same inputs produce the same challenges.
    expect(base.e).toBe(alt.e);
    expect(base.betas[1]).toBe(alt.betas[1]);

    const changed = sigmaProtocolFiatShamir(dst, TYPE_NAME, altStmt, compressedA, k, sigmasA);
    expect(base.e).not.toBe(changed.e);
    expect(base.betas[1]).not.toBe(changed.betas[1]);
  });

  it("honest registration proofs still verify (e is independent of σ)", () => {
    const dk = TwistedEd25519PrivateKey.generate();
    const senderAddress = new Uint8Array(32);
    const tokenAddress = new Uint8Array(32).fill(0x0a);
    const proof = proveRegistration({
      dk,
      senderAddress,
      tokenAddress,
      chainId: 4,
    });
    expect(
      verifyRegistration({
        ek: dk.publicKey().toUint8Array(),
        senderAddress,
        tokenAddress,
        chainId: 4,
        proof,
      }),
    ).toBe(true);
  });
});
