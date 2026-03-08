import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import {
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  isCanonicalEd25519Signature,
} from "../../../src/crypto/ed25519.js";
import { Hex } from "../../../src/hex/index.js";

const ed25519 = {
  privateKey: "ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  privateKeyHex: "0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0x9e653d56a09247570bb174a389e85b9226abd5c403ea6c504b386626a145158cd4efd66fc5e071c0e19538a96a05ddbda24d3c51e1e6a9dacc6bb1ce775cce07",
};

const wallet = {
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/0'",
  privateKey: "ed25519-priv-0x5d996aa76b3212142792d9130796cd2e11e3c445a93118c08414df4f66bc60ec",
  publicKey: "0xea526ba1710343d953461ff68641f1b7df5f23b9042ffa2d2a798d3adb3f3d6c",
};

describe("Ed25519PublicKey", () => {
  it("should create from hex string", () => {
    const hexStr = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const publicKey = new Ed25519PublicKey(hexStr);
    expect(publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect(publicKey.toString()).toEqual(hexStr);
  });

  it("should create from Uint8Array", () => {
    const bytes = new Uint8Array([
      1, 35, 69, 103, 137, 171, 205, 239, 1, 35, 69, 103, 137, 171, 205, 239, 1, 35, 69, 103, 137, 171, 205, 239, 1, 35,
      69, 103, 137, 171, 205, 239,
    ]);
    const publicKey = new Ed25519PublicKey(bytes);
    expect(publicKey.toUint8Array()).toEqual(bytes);
  });

  it("should throw on invalid length", () => {
    expect(() => new Ed25519PublicKey("0123456789abcdef")).toThrowError(
      `PublicKey length should be ${Ed25519PublicKey.LENGTH}`,
    );
  });

  it("should verify signature correctly", () => {
    const pubKey = new Ed25519PublicKey(ed25519.publicKey);
    const signature = new Ed25519Signature(ed25519.signatureHex);
    expect(pubKey.verifySignature({ message: ed25519.messageEncoded, signature })).toBe(true);
  });

  it("should reject incorrect signature", () => {
    const pubKey = new Ed25519PublicKey(ed25519.publicKey);
    const badSig = new Ed25519Signature(
      "0xc5de9e40ac00b371cd83b1c197fa5b665b7449b33cd3cdd305bb78222e06a671a49625ab9aea8a039d4bb70e275768084d62b094bc1b31964f2357b7c1af7e0a",
    );
    expect(pubKey.verifySignature({ message: ed25519.messageEncoded, signature: badSig })).toBe(false);
  });

  it("should serialize and deserialize correctly", () => {
    const publicKey = new Ed25519PublicKey(ed25519.publicKey);
    const serializer = new Serializer();
    publicKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Ed25519PublicKey.deserialize(deserializer);
    expect(deserialized.toString()).toEqual(ed25519.publicKey);
  });
});

describe("Ed25519PrivateKey", () => {
  it("should create from AIP-80 compliant string", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey, false);
    expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey.toString()).toEqual(ed25519.privateKey);
  });

  it("should create from raw hex string", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKeyHex, false);
    expect(privateKey.toString()).toEqual(ed25519.privateKey);
  });

  it("should create from Uint8Array", () => {
    const bytes = new Uint8Array([
      197, 51, 140, 210, 81, 194, 45, 170, 140, 156, 156, 201, 79, 73, 140, 200, 165, 199, 225, 210, 231, 82, 135, 165,
      221, 169, 16, 150, 254, 100, 239, 165,
    ]);
    const privateKey = new Ed25519PrivateKey(bytes, false);
    expect(privateKey.toHexString()).toEqual(Hex.fromHexInput(bytes).toString());
  });

  it("should throw on invalid length", () => {
    expect(() => new Ed25519PrivateKey("0123456789abcdef", false)).toThrowError(
      `PrivateKey length should be ${Ed25519PrivateKey.LENGTH}`,
    );
  });

  it("should sign correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const signature = privateKey.sign(ed25519.messageEncoded);
    expect(signature.toString()).toEqual(ed25519.signatureHex);
  });

  it("should derive the correct public key", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const publicKey = privateKey.publicKey();
    expect(publicKey.toString()).toEqual(ed25519.publicKey);
  });

  it("should generate a random key", () => {
    const key1 = Ed25519PrivateKey.generate();
    const key2 = Ed25519PrivateKey.generate();
    expect(key1.toUint8Array().length).toBe(Ed25519PrivateKey.LENGTH);
    expect(key1.toString()).not.toEqual(key2.toString());
  });

  it("should derive from path and mnemonic", () => {
    const key = Ed25519PrivateKey.fromDerivationPath(wallet.path, wallet.mnemonic);
    expect(key.toString()).toEqual(wallet.privateKey);
  });

  it("should reject invalid derivation path", () => {
    expect(() => Ed25519PrivateKey.fromDerivationPath("1234", wallet.mnemonic)).toThrow("Invalid derivation path");
  });

  it("should serialize and deserialize correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Ed25519PrivateKey.deserialize(deserializer);
    expect(deserialized.toString()).toEqual(ed25519.privateKey);
  });

  it("should clear key material", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    expect(privateKey.isCleared()).toBe(false);
    privateKey.clear();
    expect(privateKey.isCleared()).toBe(true);
    expect(() => privateKey.sign(ed25519.messageEncoded)).toThrow("cleared from memory");
  });
});

describe("Ed25519Signature", () => {
  it("should create from hex string", () => {
    const sig = new Ed25519Signature(ed25519.signatureHex);
    expect(sig).toBeInstanceOf(Ed25519Signature);
    expect(sig.toString()).toEqual(ed25519.signatureHex);
  });

  it("should throw on invalid length", () => {
    expect(() => new Ed25519Signature(new Uint8Array(63))).toThrowError(
      `Signature length should be ${Ed25519Signature.LENGTH}`,
    );
  });

  it("should serialize and deserialize correctly", () => {
    const sig = new Ed25519Signature(ed25519.signatureHex);
    const serializer = new Serializer();
    sig.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Ed25519Signature.deserialize(deserializer);
    expect(deserialized.toString()).toEqual(ed25519.signatureHex);
  });
});

describe("isCanonicalEd25519Signature", () => {
  it("should reject malleable signatures at L", () => {
    const sig = new Ed25519Signature(
      "0x0000000000000000000000000000000000000000000000000000000000000000edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010",
    );
    expect(isCanonicalEd25519Signature(sig)).toBe(false);
  });

  it("should reject malleable signatures above L", () => {
    const sig = new Ed25519Signature(
      "0x0000000000000000000000000000000000000000000000000000000000000000edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000011",
    );
    expect(isCanonicalEd25519Signature(sig)).toBe(false);
  });
});
