// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers `src/core/crypto/deserializationUtils.ts` (`deserializePublicKey` /
// `deserializeSignature`), which probe every supported key/signature type in
// turn. Each test serializes a real key/signature, round-trips it through the
// generic deserializer, and asserts the concrete returned subclass, the
// ambiguity guard, and the "Failed to deserialize" error path on garbage input.

import { describe, expect, it } from "vitest";
import { deserializePublicKey, deserializeSignature } from "../../../../src/core/crypto/deserializationUtils.js";
import { Account } from "../../../../src/account/Account.js";
import { Ed25519PublicKey, Ed25519Signature } from "../../../../src/core/crypto/ed25519.js";
import { AnyPublicKey, AnySignature } from "../../../../src/core/crypto/singleKey.js";
import { MultiKey } from "../../../../src/core/crypto/multiKey.js";
import { SigningSchemeInput } from "../../../../src/types/index.js";

const MESSAGE = new TextEncoder().encode("coverage");

describe("deserializePublicKey", () => {
  it("deserializes a raw Ed25519 public key", () => {
    const account = Account.generate();
    const result = deserializePublicKey(account.publicKey.bcsToBytes());
    expect(result).toBeInstanceOf(Ed25519PublicKey);
    expect((result as Ed25519PublicKey).toString()).toBe(account.publicKey.toString());
  });

  it("deserializes a Secp256k1 single-key public key as AnyPublicKey", () => {
    const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const result = deserializePublicKey(account.publicKey.bcsToBytes());
    expect(result).toBeInstanceOf(AnyPublicKey);
  });

  it("deserializes a MultiKey public key", () => {
    const a = Account.generate();
    const b = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const multiKey = new MultiKey({
      publicKeys: [a.publicKey, b.publicKey],
      signaturesRequired: 1,
    });
    const result = deserializePublicKey(multiKey.bcsToBytes());
    expect(result).toBeInstanceOf(MultiKey);
    expect((result as MultiKey).toString()).toBe(multiKey.toString());
  });

  it("throws when no key type can deserialize the input", () => {
    expect(() => deserializePublicKey(new Uint8Array([0xff, 0xff, 0xff, 0xff]))).toThrow(
      /Failed to deserialize public key/,
    );
  });
});

describe("deserializeSignature", () => {
  it("throws 'Multiple possible deserializations' when a raw 64-byte Ed25519 signature is ambiguous", () => {
    // A bare Ed25519 signature is byte-compatible with more than one signature
    // layout, so the generic deserializer detects the ambiguity and refuses.
    const account = Account.generate();
    const signature = account.sign(MESSAGE);
    expect(signature).toBeInstanceOf(Ed25519Signature);
    expect(() => deserializeSignature(signature.bcsToBytes())).toThrow(/Multiple possible deserializations found/);
  });

  it("deserializes a Secp256k1 single-key signature as AnySignature", () => {
    const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const signature = account.sign(MESSAGE);
    const result = deserializeSignature(signature.bcsToBytes());
    expect(result).toBeInstanceOf(AnySignature);
  });

  it("throws when no signature type can deserialize the input", () => {
    expect(() => deserializeSignature(new Uint8Array([0xff, 0xff, 0xff, 0xff]))).toThrow(
      /Failed to deserialize signature/,
    );
  });
});
