// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Client-side rejection of degenerate Twisted ElGamal encryption keys.
 *
 * On-chain confidential-asset entrypoints abort with `E_EK_IS_IDENTITY` for the
 * identity point (v1.1.2). Encrypting under the identity collapses D = r · 𝒪 = 𝒪,
 * which makes auditor ciphertexts undecryptable and degenerates the auditor-binding
 * term in the transfer proof.
 */

import { describe, expect, it } from "vitest";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../../src/index.js";

describe("TwistedEd25519PublicKey encoding checks", () => {
  it("rejects the identity point (canonical 32 zero bytes)", () => {
    expect(() => new TwistedEd25519PublicKey(new Uint8Array(32))).toThrow(/identity/i);
    expect(() => new TwistedEd25519PublicKey(ristretto255.Point.ZERO.toBytes())).toThrow(/identity/i);
  });

  it("isIdentity() is true only for the canonical identity encoding", () => {
    expect(TwistedEd25519PublicKey.isIdentity(new Uint8Array(32))).toBe(true);
    expect(TwistedEd25519PublicKey.isIdentity(ristretto255.Point.ZERO.toBytes())).toBe(true);
    expect(TwistedEd25519PublicKey.isIdentity(TwistedEd25519PrivateKey.generate().publicKey().toUint8Array())).toBe(
      false,
    );
    expect(TwistedEd25519PublicKey.isIdentity(new Uint8Array(31))).toBe(false);
  });

  it("rejects a non-canonical 32-byte encoding", () => {
    const nonCanonical = new Uint8Array(32).fill(0xff);
    expect(TwistedEd25519PublicKey.isIdentity(nonCanonical)).toBe(false);
    expect(() => new TwistedEd25519PublicKey(nonCanonical)).toThrow(/canonical|Ristretto/i);
  });

  it("accepts a generated encryption key", () => {
    const pk = TwistedEd25519PrivateKey.generate().publicKey();
    expect(pk.toUint8Array()).toHaveLength(TwistedEd25519PublicKey.LENGTH);
    expect(TwistedEd25519PublicKey.isIdentity(pk.toUint8Array())).toBe(false);
  });

  it("round-trips a generated key through the constructor", () => {
    const original = TwistedEd25519PrivateKey.generate().publicKey();
    const restored = new TwistedEd25519PublicKey(original.toUint8Array());
    expect(restored.toUint8Array()).toEqual(original.toUint8Array());
  });
});
