import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { Secp256k1PrivateKey, Secp256k1PublicKey, Secp256k1Signature } from "../../../src/crypto/secp256k1.js";

const secp256k1TestObject = {
  privateKey: "secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e",
  privateKeyHex: "0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e",
  publicKey:
    "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0xd0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca",
};

const secp256k1Wallet = {
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0/0",
  privateKey: "secp256k1-priv-0x1eec55afc2f72c4ab7b46c84d761739035ac420a2b6b22cef3411adaf91ce1f7",
  publicKey:
    "0x04913871f1d6cb7b867e8671cf63cf7b4c43819539fa0074ff933434bf20bab825b335535251f720fff72fd8b567e414af84aacf2f26ec804562081f2e0b0c9478",
};

describe("Secp256k1PublicKey", () => {
  it("should create from uncompressed hex (65 bytes)", () => {
    const pubKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    expect(pubKey).toBeInstanceOf(Secp256k1PublicKey);
    expect(pubKey.toUint8Array().length).toBe(Secp256k1PublicKey.LENGTH);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256k1PublicKey("0x0123456789abcdef")).toThrow("PublicKey length should be");
  });

  it("should verify signature correctly", () => {
    const pubKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const signature = new Secp256k1Signature(secp256k1TestObject.signatureHex);
    expect(pubKey.verifySignature({ message: secp256k1TestObject.messageEncoded, signature })).toBe(true);
  });

  it("should reject incorrect signature", () => {
    const pubKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const badSig = new Secp256k1Signature(new Uint8Array(64));
    expect(pubKey.verifySignature({ message: secp256k1TestObject.messageEncoded, signature: badSig })).toBe(false);
  });

  it("should serialize and deserialize correctly", () => {
    const pubKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const serializer = new Serializer();
    pubKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Secp256k1PublicKey.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(pubKey.toUint8Array());
  });
});

describe("Secp256k1PrivateKey", () => {
  it("should create from AIP-80 string", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKey, false);
    expect(key).toBeInstanceOf(Secp256k1PrivateKey);
    expect(key.toString()).toEqual(secp256k1TestObject.privateKey);
  });

  it("should create from raw hex", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKeyHex, false);
    expect(key.toString()).toEqual(secp256k1TestObject.privateKey);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256k1PrivateKey("0x0123", false)).toThrow("PrivateKey length should be");
  });

  it("should sign correctly", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const sig = key.sign(secp256k1TestObject.messageEncoded);
    expect(sig.toString()).toEqual(secp256k1TestObject.signatureHex);
  });

  it("should derive the correct public key", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const pubKey = key.publicKey();
    expect(pubKey.toUint8Array()).toEqual(new Secp256k1PublicKey(secp256k1TestObject.publicKey).toUint8Array());
  });

  it("should generate a random key", () => {
    const key1 = Secp256k1PrivateKey.generate();
    const key2 = Secp256k1PrivateKey.generate();
    expect(key1.toUint8Array().length).toBe(Secp256k1PrivateKey.LENGTH);
    expect(key1.toString()).not.toEqual(key2.toString());
  });

  it("should derive from path and mnemonic", () => {
    const key = Secp256k1PrivateKey.fromDerivationPath(secp256k1Wallet.path, secp256k1Wallet.mnemonic);
    expect(key.toString()).toEqual(secp256k1Wallet.privateKey);
  });

  it("should reject invalid derivation path", () => {
    expect(() => Secp256k1PrivateKey.fromDerivationPath("bad/path", secp256k1Wallet.mnemonic)).toThrow(
      "Invalid derivation path",
    );
  });

  it("should clear key material", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    expect(key.isCleared()).toBe(false);
    key.clear();
    expect(key.isCleared()).toBe(true);
    expect(() => key.sign(secp256k1TestObject.messageEncoded)).toThrow("cleared from memory");
  });

  it("should serialize and deserialize correctly", () => {
    const key = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const serializer = new Serializer();
    key.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Secp256k1PrivateKey.deserialize(deserializer);
    expect(deserialized.toString()).toEqual(secp256k1TestObject.privateKey);
  });
});

describe("Secp256k1Signature", () => {
  it("should create from hex string", () => {
    const sig = new Secp256k1Signature(secp256k1TestObject.signatureHex);
    expect(sig.toUint8Array().length).toBe(Secp256k1Signature.LENGTH);
  });

  it("should throw on invalid length", () => {
    expect(() => new Secp256k1Signature(new Uint8Array(32))).toThrow("Signature length should be");
  });

  it("should serialize and deserialize correctly", () => {
    const sig = new Secp256k1Signature(secp256k1TestObject.signatureHex);
    const serializer = new Serializer();
    sig.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Secp256k1Signature.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(sig.toUint8Array());
  });
});
