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
import { numberToBytesLE } from "@noble/curves/utils.js";
import { H_RISTRETTO, TwistedEd25519PrivateKey } from "../../src/crypto/twistedEd25519.js";
import {
  APTOS_FRAMEWORK_ADDRESS,
  sigmaProtocolFiatShamir,
  type DomainSeparator,
  type SigmaProtocolStatement,
} from "../../src/crypto/sigmaProtocol.js";
import { proveRegistration, verifyRegistration } from "../../src/crypto/sigmaProtocolRegistration.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

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
