import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { Secp256r1PrivateKey, Secp256r1PublicKey, Secp256r1Signature } from "../../../src/crypto/secp256r1.js";

const singleSignerSecp256r1 = {
  publicKey:
    "0x046c761075b12769e9d0cc9995706275352e1bfb8e0085420625aa9cf849e6d62c2c140f0b3b7c53faf78c16648343966d769ccbc8f2fd14bb2c38f6befb91c77b",
  privateKey: "secp256r1-priv-0xa814fde3edc91aedf78c0e75bacbcf5e479cd4b27746961cfa1dc8e9b0e4481c",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0x4fc4bc5f8ed851aec68c64499fa56360b11ea0c8b73fe3f93279e97b700582e55cb9e2ada7ae38951c2bc33d7755529fffc6201504180405c7960715ae0d4ff5",
};

describe("Secp256r1PublicKey", () => {
  it("should create from uncompressed hex (65 bytes)", () => {
    const pubKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    expect(pubKey.toUint8Array().length).toBe(Secp256r1PublicKey.LENGTH);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256r1PublicKey("0x0123456789abcdef")).toThrow("PublicKey length should be");
  });

  it("should verify signature correctly", () => {
    const pubKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    const signature = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);
    expect(pubKey.verifySignature({ message: singleSignerSecp256r1.messageEncoded, signature })).toBe(true);
  });

  it("should serialize and deserialize correctly", () => {
    const pubKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    const serializer = new Serializer();
    pubKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Secp256r1PublicKey.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(pubKey.toUint8Array());
  });
});

describe("Secp256r1PrivateKey", () => {
  it("should create from AIP-80 string", () => {
    const key = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    expect(key.toString()).toEqual(singleSignerSecp256r1.privateKey);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256r1PrivateKey("0x0123")).toThrow("PrivateKey length should be");
  });

  it("should sign and verify round-trip", () => {
    const key = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const sig = key.sign(singleSignerSecp256r1.messageEncoded);
    const pubKey = key.publicKey();
    expect(pubKey.verifySignature({ message: singleSignerSecp256r1.messageEncoded, signature: sig })).toBe(true);
  });

  it("should derive the correct public key", () => {
    const key = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const pubKey = key.publicKey();
    expect(pubKey.toUint8Array()).toEqual(new Secp256r1PublicKey(singleSignerSecp256r1.publicKey).toUint8Array());
  });

  it("should generate a random key", () => {
    const key1 = Secp256r1PrivateKey.generate();
    const key2 = Secp256r1PrivateKey.generate();
    expect(key1.toUint8Array().length).toBe(Secp256r1PrivateKey.LENGTH);
    expect(key1.toString()).not.toEqual(key2.toString());
  });
});

describe("Secp256r1Signature", () => {
  it("should create from hex and normalize S", () => {
    const sig = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);
    expect(sig.toUint8Array().length).toBe(Secp256r1Signature.LENGTH);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256r1Signature(new Uint8Array(32))).toThrow("Signature length should be");
  });

  it("should serialize and deserialize correctly", () => {
    const sig = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);
    const serializer = new Serializer();
    sig.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Secp256r1Signature.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(sig.toUint8Array());
  });
});
