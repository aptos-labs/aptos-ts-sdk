// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { secp256k1 } from "@noble/curves/secp256k1";
import { secp256k1TestObject, secp256k1WalletTestObject } from "./helper";
import {
  Deserializer,
  Hex,
  PrivateKey,
  PrivateKeyVariants,
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  Secp256k1Signature,
  Serializer,
} from "../../src";

/* eslint-disable max-len */
describe("Secp256k1PublicKey", () => {
  it("should create the instance correctly without error", () => {
    // Create from string
    const publicKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    expect(publicKey).toBeInstanceOf(Secp256k1PublicKey);
    expect(publicKey.toString()).toEqual(secp256k1TestObject.publicKey);

    // // Create from Uint8Array
    const hexUint8Array = secp256k1.getPublicKey(secp256k1.utils.randomPrivateKey(), false);
    const publicKey2 = new Secp256k1PublicKey(hexUint8Array);
    expect(publicKey2).toBeInstanceOf(Secp256k1PublicKey);
    expect(publicKey2.toUint8Array()).toEqual(hexUint8Array);
  });

  it("should work with compressed public keys", () => {
    const expectedPublicKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const uncompressedPublicKey = Hex.fromHexInput(secp256k1TestObject.publicKey);
    expect(uncompressedPublicKey.toUint8Array().length).toEqual(65);

    const point = secp256k1.ProjectivePoint.fromHex(uncompressedPublicKey.toUint8Array());
    const compressedPublicKey = point.toRawBytes(true);
    const compressedPublicKeyHex = Hex.fromHexInput(compressedPublicKey);
    expect(compressedPublicKey.length).toEqual(33);

    const publicKey1 = new Secp256k1PublicKey(compressedPublicKeyHex.toString());
    expect(publicKey1).toBeInstanceOf(Secp256k1PublicKey);
    expect(publicKey1).toEqual(expectedPublicKey);

    const publicKey2 = new Secp256k1PublicKey(compressedPublicKeyHex.toUint8Array());
    expect(publicKey2).toBeInstanceOf(Secp256k1PublicKey);
    expect(publicKey2).toEqual(expectedPublicKey);

    expect(publicKey1).toEqual(publicKey2);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Secp256k1PublicKey(invalidHexInput)).toThrowError(
      `PublicKey length should be ${Secp256k1PublicKey.LENGTH}`,
    );
  });

  it("should verify the signature correctly", () => {
    const pubKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const signature = new Secp256k1Signature(secp256k1TestObject.signatureHex);

    // Convert message to hex
    const hexMsg = Hex.fromHexString(secp256k1TestObject.messageEncoded);

    // Verify with correct signed message
    expect(pubKey.verifySignature({ message: hexMsg.toUint8Array(), signature })).toBe(true);

    // Verify with incorrect signed message
    const incorrectSignedMessage =
      "0xc5de9e40ac00b371cd83b1c197fa5b665b7449b33cd3cdd305bb78222e06a671a49625ab9aea8a039d4bb70e275768084d62b094bc1b31964f2357b7c1af7e0a";
    const invalidSignature = new Secp256k1Signature(incorrectSignedMessage);
    expect(
      pubKey.verifySignature({
        message: secp256k1TestObject.messageEncoded,
        signature: invalidSignature,
      }),
    ).toBe(false);
  });

  it("should serialize correctly", () => {
    const publicKey = new Secp256k1PublicKey(secp256k1TestObject.publicKey);
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const serialized = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expected =
      "0x4104acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea";
    expect(serialized).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const serializedPublicKeyStr =
      "0x4104acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea";
    const serializedPublicKey = Hex.fromHexString(serializedPublicKeyStr).toUint8Array();
    const deserializer = new Deserializer(serializedPublicKey);
    const publicKey = Secp256k1PublicKey.deserialize(deserializer);

    expect(publicKey.toString()).toEqual(secp256k1TestObject.publicKey);
  });
});

describe("Secp256k1PrivateKey", () => {
  it("should create the instance correctly without error with AIP-80 compliant private key", () => {
    const privateKey2 = new Secp256k1PrivateKey(secp256k1TestObject.privateKey, false);
    expect(privateKey2).toBeInstanceOf(Secp256k1PrivateKey);
    expect(privateKey2.toAIP80String()).toEqual(secp256k1TestObject.privateKey);
  });

  it("should create the instance correctly without error with non-AIP-80 compliant private key", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKeyHex, false);
    expect(privateKey).toBeInstanceOf(Secp256k1PrivateKey);
    expect(privateKey.toAIP80String()).toEqual(secp256k1TestObject.privateKey);
  });

  it("should create the instance correctly without error with Uint8Array private key", () => {
    // Create from Uint8Array
    const hexUint8Array = PrivateKey.parseHexInput(
      secp256k1TestObject.privateKey,
      PrivateKeyVariants.Secp256k1,
      false,
    ).toUint8Array();
    const privateKey3 = new Secp256k1PrivateKey(hexUint8Array, false);
    expect(privateKey3).toBeInstanceOf(Secp256k1PrivateKey);
    expect(privateKey3.toHexString()).toEqual(Hex.fromHexInput(hexUint8Array).toString());
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Secp256k1PrivateKey(invalidHexInput, false)).toThrowError(
      `PrivateKey length should be ${Secp256k1PrivateKey.LENGTH}`,
    );
  });

  it("should sign the message correctly", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const signedMessage = privateKey.sign(secp256k1TestObject.messageEncoded);
    expect(signedMessage.toString()).toEqual(secp256k1TestObject.signatureHex);
  });

  it("should serialize correctly", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const received = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expected = "0x20d107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e";
    expect(received).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const serializedPrivateKeyStr = "0x20d107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e";
    const serializedPrivateKey = Hex.fromHexString(serializedPrivateKeyStr).toUint8Array();
    const deserializer = new Deserializer(serializedPrivateKey);
    const privateKey = Secp256k1PrivateKey.deserialize(deserializer);

    expect(privateKey.toAIP80String()).toEqual(secp256k1TestObject.privateKey);
  });

  it("should serialize and deserialize correctly", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPrivateKey = Secp256k1PrivateKey.deserialize(deserializer);

    expect(deserializedPrivateKey.toString()).toEqual(privateKey.toString());
  });

  it("should prevent an invalid bip44 path ", () => {
    const { mnemonic } = secp256k1WalletTestObject;
    const path = "1234";
    expect(() => Secp256k1PrivateKey.fromDerivationPath(path, mnemonic)).toThrow("Invalid derivation path");
  });

  it("should derive from path and mnemonic", () => {
    const { mnemonic, path, privateKey } = secp256k1WalletTestObject;
    const key = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
    expect(key).toBeInstanceOf(Secp256k1PrivateKey);
    expect(key.toAIP80String()).toEqual(privateKey);
  });
});

describe("Secp256k1Signature", () => {
  it("should create an instance correctly without error", () => {
    // Create from string
    const signatureStr = new Secp256k1Signature(secp256k1TestObject.signatureHex);
    expect(signatureStr).toBeInstanceOf(Secp256k1Signature);
    expect(signatureStr.toString()).toEqual(secp256k1TestObject.signatureHex);

    // Create from Uint8Array
    const signatureValue = new Uint8Array(Secp256k1Signature.LENGTH);
    const signature = new Secp256k1Signature(signatureValue);
    expect(signature).toBeInstanceOf(Secp256k1Signature);
    expect(signature.toUint8Array()).toEqual(signatureValue);
  });

  it("should throw an error with invalid value length", () => {
    const invalidSignatureValue = new Uint8Array(Secp256k1Signature.LENGTH - 1); // Invalid length
    expect(() => new Secp256k1Signature(invalidSignatureValue)).toThrowError(
      `Signature length should be ${Secp256k1Signature.LENGTH}`,
    );
  });

  it("should serialize correctly", () => {
    const signature = new Secp256k1Signature(secp256k1TestObject.signatureHex);
    const serializer = new Serializer();
    signature.serialize(serializer);

    const received = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expected =
      "0x40d0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca";
    expect(received).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const serializedSignature =
      "0x40d0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca";
    const serializedSignatureUint8Array = Hex.fromHexString(serializedSignature).toUint8Array();
    const deserializer = new Deserializer(serializedSignatureUint8Array);
    const signature = Secp256k1Signature.deserialize(deserializer);

    expect(signature.toString()).toEqual(secp256k1TestObject.signatureHex);
  });
});
