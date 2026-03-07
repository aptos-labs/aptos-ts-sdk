import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "../../../src/crypto/ed25519.js";
import { Secp256k1PublicKey, Secp256k1Signature } from "../../../src/crypto/secp256k1.js";
import { AnyPublicKey, AnySignature } from "../../../src/crypto/single-key.js";
import { AnyPublicKeyVariant } from "../../../src/crypto/types.js";

// Ensure keyless types are registered (imported via barrel)
import "../../../src/crypto/index.js";

const ed25519 = {
  privateKey: "ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0x9e653d56a09247570bb174a389e85b9226abd5c403ea6c504b386626a145158cd4efd66fc5e071c0e19538a96a05ddbda24d3c51e1e6a9dacc6bb1ce775cce07",
};

const singleSignerED25519 = {
  publicKey: "0xe425451a5dc888ac871976c3c724dec6118910e7d11d344b4b07a22cd94e8c2e",
  privateKey: "ed25519-priv-0xf508cbef4e0fe463204aab724a90791c9a9dbe60a53b4978bbddbc712b55f2fd",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0xc6f50f4e0cb1961f6f7b28be1a1d80e3ece240dfbb7bd8a8b03cc26bfd144fc176295d7c322c5bf3d9669d2ad49d8bdbfe77254b4a6393d8c49da04b40cee600",
};

describe("AnyPublicKey", () => {
  it("should wrap Ed25519 key with correct variant", () => {
    const innerKey = new Ed25519PublicKey(ed25519.publicKey);
    const anyKey = new AnyPublicKey(innerKey);
    expect(anyKey.variant).toBe(AnyPublicKeyVariant.Ed25519);
    expect(anyKey.publicKey).toBe(innerKey);
  });

  it("should wrap Secp256k1 key with correct variant", () => {
    const innerKey = new Secp256k1PublicKey(
      "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
    );
    const anyKey = new AnyPublicKey(innerKey);
    expect(anyKey.variant).toBe(AnyPublicKeyVariant.Secp256k1);
  });

  it("should verify Ed25519 signature via AnyPublicKey", () => {
    const innerKey = new Ed25519PublicKey(singleSignerED25519.publicKey);
    const anyKey = new AnyPublicKey(innerKey);
    const sig = new Ed25519Signature(singleSignerED25519.signatureHex);
    const anySig = new AnySignature(sig);
    expect(anyKey.verifySignature({ message: singleSignerED25519.messageEncoded, signature: anySig })).toBe(true);
  });

  it("should serialize and deserialize Ed25519 AnyPublicKey", () => {
    const innerKey = new Ed25519PublicKey(ed25519.publicKey);
    const anyKey = new AnyPublicKey(innerKey);
    const serializer = new Serializer();
    anyKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = AnyPublicKey.deserialize(deserializer);
    expect(deserialized.variant).toBe(AnyPublicKeyVariant.Ed25519);
    expect(deserialized.publicKey.toUint8Array()).toEqual(innerKey.toUint8Array());
  });

  it("should serialize and deserialize Secp256k1 AnyPublicKey", () => {
    const innerKey = new Secp256k1PublicKey(
      "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
    );
    const anyKey = new AnyPublicKey(innerKey);
    const serializer = new Serializer();
    anyKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = AnyPublicKey.deserialize(deserializer);
    expect(deserialized.variant).toBe(AnyPublicKeyVariant.Secp256k1);
  });
});

describe("AnySignature", () => {
  it("should wrap Ed25519 signature with correct variant", () => {
    const sig = new Ed25519Signature(ed25519.signatureHex);
    const anySig = new AnySignature(sig);
    expect(anySig.signature).toBe(sig);
  });

  it("should wrap Secp256k1 signature with correct variant", () => {
    const sig = new Secp256k1Signature(
      "0xd0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca",
    );
    const anySig = new AnySignature(sig);
    expect(anySig.signature).toBe(sig);
  });

  it("should serialize and deserialize Ed25519 AnySignature", () => {
    const sig = new Ed25519Signature(ed25519.signatureHex);
    const anySig = new AnySignature(sig);
    const serializer = new Serializer();
    anySig.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = AnySignature.deserialize(deserializer);
    expect(deserialized.signature.toUint8Array()).toEqual(sig.toUint8Array());
  });
});
