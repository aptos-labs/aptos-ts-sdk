import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "../../../src/crypto/ed25519.js";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../../../src/crypto/multi-ed25519.js";

const multiEd25519PkTestObject = {
  public_keys: [
    "b9c6ee1630ef3e711144a648db06bbb2284f7274cfbee53ffcee503cc1a49200",
    "aef3f4a4b8eca1dfc343361bf8e436bd42de9259c04b8314eb8e2054dd6e82ab",
    "8a5762e21ac1cdb3870442c77b4c3af58c7cedb8779d0270e6d4f1e2f7367d74",
  ],
  threshold: 2,
  bytesInStringWithoutPrefix:
    "b9c6ee1630ef3e711144a648db06bbb2284f7274cfbee53ffcee503cc1a49200aef3f4a4b8eca1dfc343361bf8e436bd42de9259c04b8314eb8e2054dd6e82ab8a5762e21ac1cdb3870442c77b4c3af58c7cedb8779d0270e6d4f1e2f7367d7402",
};

const multiEd25519SigTestObject = {
  signatures: [
    "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a8805",
    "2ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102",
  ],
  bitmap: "c0000000",
};

describe("MultiEd25519PublicKey", () => {
  it("should create with valid public keys and threshold", () => {
    const pubKeys = multiEd25519PkTestObject.public_keys.map((k) => new Ed25519PublicKey(`0x${k}`));
    const multiKey = new MultiEd25519PublicKey({ publicKeys: pubKeys, threshold: multiEd25519PkTestObject.threshold });
    expect(multiKey.publicKeys.length).toBe(3);
    expect(multiKey.threshold).toBe(2);
  });

  it("should produce correct bytes representation", () => {
    const pubKeys = multiEd25519PkTestObject.public_keys.map((k) => new Ed25519PublicKey(`0x${k}`));
    const multiKey = new MultiEd25519PublicKey({ publicKeys: pubKeys, threshold: multiEd25519PkTestObject.threshold });
    const expected = `0x${multiEd25519PkTestObject.bytesInStringWithoutPrefix}`;
    const actual = `0x${Buffer.from(multiKey.toUint8Array()).toString("hex")}`;
    expect(actual).toEqual(expected);
  });

  it("should throw if too few keys", () => {
    const pubKey = new Ed25519PublicKey(`0x${multiEd25519PkTestObject.public_keys[0]}`);
    expect(() => new MultiEd25519PublicKey({ publicKeys: [pubKey], threshold: 1 })).toThrow("Must have between");
  });

  it("should throw if threshold exceeds key count", () => {
    const pubKeys = multiEd25519PkTestObject.public_keys.map((k) => new Ed25519PublicKey(`0x${k}`));
    expect(() => new MultiEd25519PublicKey({ publicKeys: pubKeys, threshold: 4 })).toThrow("Threshold must be between");
  });

  it("should serialize and deserialize correctly", () => {
    const pubKeys = multiEd25519PkTestObject.public_keys.map((k) => new Ed25519PublicKey(`0x${k}`));
    const multiKey = new MultiEd25519PublicKey({ publicKeys: pubKeys, threshold: multiEd25519PkTestObject.threshold });
    const serializer = new Serializer();
    multiKey.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = MultiEd25519PublicKey.deserialize(deserializer);
    expect(deserialized.threshold).toBe(multiKey.threshold);
    expect(deserialized.publicKeys.length).toBe(multiKey.publicKeys.length);
  });
});

describe("MultiEd25519Signature", () => {
  it("should create with signatures and bitmap", () => {
    const sigs = multiEd25519SigTestObject.signatures.map((s) => new Ed25519Signature(`0x${s}`));
    const bitmap = new Uint8Array([0xc0, 0x00, 0x00, 0x00]);
    const multiSig = new MultiEd25519Signature({ signatures: sigs, bitmap });
    expect(multiSig.signatures.length).toBe(2);
    expect(multiSig.bitmap).toEqual(bitmap);
  });

  it("should create bitmap from bit indices", () => {
    const bitmap = MultiEd25519Signature.createBitmap({ bits: [0, 1] });
    expect(bitmap).toEqual(new Uint8Array([0xc0, 0x00, 0x00, 0x00]));
  });

  it("should throw on duplicate bitmap bits", () => {
    expect(() => MultiEd25519Signature.createBitmap({ bits: [0, 0] })).toThrow("Duplicate bits");
  });

  it("should throw on unsorted bitmap bits", () => {
    expect(() => MultiEd25519Signature.createBitmap({ bits: [1, 0] })).toThrow("sorted in ascending order");
  });

  it("should throw on bit >= MAX_SIGNATURES_SUPPORTED", () => {
    expect(() => MultiEd25519Signature.createBitmap({ bits: [32] })).toThrow("Cannot have a signature larger than");
  });

  it("should serialize and deserialize correctly", () => {
    const sigs = multiEd25519SigTestObject.signatures.map((s) => new Ed25519Signature(`0x${s}`));
    const bitmap = new Uint8Array([0xc0, 0x00, 0x00, 0x00]);
    const multiSig = new MultiEd25519Signature({ signatures: sigs, bitmap });
    const serializer = new Serializer();
    multiSig.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = MultiEd25519Signature.deserialize(deserializer);
    expect(deserialized.signatures.length).toBe(2);
    expect(deserialized.bitmap).toEqual(bitmap);
  });
});
