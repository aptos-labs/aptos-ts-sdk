// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../../src/bcs/index.js";
import { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "../../../../src/core/crypto/ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "../../../../src/core/crypto/ephemeral.js";
import { Secp256k1PrivateKey, Secp256k1Signature } from "../../../../src/core/crypto/secp256k1.js";
import { EphemeralPublicKeyVariant } from "../../../../src/types/index.js";

const TEST_PRIV = new Ed25519PrivateKey(new Uint8Array(32).fill(0x42));
const TEST_PUB = TEST_PRIV.publicKey();
const SECP_PUB = new Secp256k1PrivateKey(new Uint8Array(32).fill(1)).publicKey();

describe("EphemeralPublicKey", () => {
  it("accepts an Ed25519 inner key and exposes the Ed25519 variant", () => {
    const ek = new EphemeralPublicKey(TEST_PUB);
    expect(ek.variant).toBe(EphemeralPublicKeyVariant.Ed25519);
    expect(ek.publicKey).toBe(TEST_PUB);
  });

  it("rejects unsupported inner key types", () => {
    expect(() => new EphemeralPublicKey(SECP_PUB)).toThrow(/Unsupported key for EphemeralPublicKey/);
  });

  it("roundtrips via BCS serialize/deserialize", () => {
    const ek = new EphemeralPublicKey(TEST_PUB);
    const serializer = new Serializer();
    ek.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const back = EphemeralPublicKey.deserialize(new Deserializer(bytes));
    expect(back.variant).toBe(EphemeralPublicKeyVariant.Ed25519);
    expect(back.publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect((back.publicKey as Ed25519PublicKey).toUint8Array()).toEqual(TEST_PUB.toUint8Array());
  });

  it("throws on deserialize when the variant index is unknown", () => {
    // Encode ULEB128 variant index = 99, which is not a valid EphemeralPublicKeyVariant.
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(99);
    const d = new Deserializer(serializer.toUint8Array());
    expect(() => EphemeralPublicKey.deserialize(d)).toThrow(/Unknown variant index for EphemeralPublicKey/);
  });

  it("delegates verifySignature to the inner Ed25519 key", () => {
    const message = "0xdeadbeef";
    const innerSig = TEST_PRIV.sign(message);
    const ek = new EphemeralPublicKey(TEST_PUB);
    expect(ek.verifySignature({ message, signature: new EphemeralSignature(innerSig) })).toBe(true);
  });

  it("verifySignatureAsync resolves to the synchronous result", async () => {
    const message = "0xdeadbeef";
    const innerSig = TEST_PRIV.sign(message);
    const ek = new EphemeralPublicKey(TEST_PUB);
    // aptosConfig is unused for Ed25519 verification; cast through any to satisfy the type.
    const ok = await ek.verifySignatureAsync({
      aptosConfig: {} as never,
      message,
      signature: new EphemeralSignature(innerSig),
    });
    expect(ok).toBe(true);
  });

  it("isPublicKey is a type-narrowing identity guard", () => {
    const ek = new EphemeralPublicKey(TEST_PUB);
    expect(EphemeralPublicKey.isPublicKey(ek)).toBe(true);
    expect(EphemeralPublicKey.isPublicKey(TEST_PUB)).toBe(false);
  });
});

describe("EphemeralSignature", () => {
  it("accepts an Ed25519Signature", () => {
    const sig = new Ed25519Signature(new Uint8Array(64).fill(1));
    const ek = new EphemeralSignature(sig);
    expect(ek.signature).toBe(sig);
  });

  it("rejects unsupported inner signature types", () => {
    const secpSig = new Secp256k1Signature(new Uint8Array(64).fill(1));
    expect(() => new EphemeralSignature(secpSig)).toThrow(/Unsupported signature for EphemeralSignature/);
  });

  it("roundtrips via BCS serialize/deserialize", () => {
    const sig = new Ed25519Signature(new Uint8Array(64).fill(0xab));
    const ek = new EphemeralSignature(sig);
    const serializer = new Serializer();
    ek.serialize(serializer);
    const back = EphemeralSignature.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(back.signature).toBeInstanceOf(Ed25519Signature);
    expect((back.signature as Ed25519Signature).toUint8Array()).toEqual(sig.toUint8Array());
  });

  it("throws on deserialize when the variant index is unknown", () => {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(99);
    const d = new Deserializer(serializer.toUint8Array());
    expect(() => EphemeralSignature.deserialize(d)).toThrow(/Unknown variant index for EphemeralSignature/);
  });

  it("fromHex deserializes a hex-encoded ephemeral signature", () => {
    const sig = new Ed25519Signature(new Uint8Array(64).fill(0xcd));
    const ek = new EphemeralSignature(sig);
    const serializer = new Serializer();
    ek.serialize(serializer);
    const hex = `0x${Buffer.from(serializer.toUint8Array()).toString("hex")}`;
    // The SDK runs in environments without Buffer; we use it here for test-side
    // hex encoding only. The runtime behavior under test is fromHex.
    const back = EphemeralSignature.fromHex(hex);
    expect((back.signature as Ed25519Signature).toUint8Array()).toEqual(sig.toUint8Array());
  });
});
