// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { p256 } from "@noble/curves/nist.js";
import { singleSignerSecp256r1 } from "./helper";
import {
  Deserializer,
  Hex,
  PrivateKey,
  PrivateKeyVariants,
  Secp256r1PrivateKey,
  Secp256r1PublicKey,
  Secp256r1Signature,
  Serializer,
} from "../../src";

/* eslint-disable max-len */
describe("Secp256r1PublicKey", () => {
  it("should create the instance correctly without error", () => {
    // Create from string
    const publicKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    expect(publicKey).toBeInstanceOf(Secp256r1PublicKey);
    expect(publicKey.toString()).toEqual(`0x${singleSignerSecp256r1.publicKey.replace("0x", "")}`);

    // Create from Uint8Array
    const hexUint8Array = p256.getPublicKey(p256.utils.randomPrivateKey(), false);
    const publicKey2 = new Secp256r1PublicKey(hexUint8Array);
    expect(publicKey2).toBeInstanceOf(Secp256r1PublicKey);
    expect(publicKey2.toUint8Array()).toEqual(hexUint8Array);
  });

  it("should work with compressed public keys", () => {
    const expectedPublicKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    const uncompressedPublicKey = Hex.fromHexInput(singleSignerSecp256r1.publicKey);
    expect(uncompressedPublicKey.toUint8Array().length).toEqual(65);

    const point = p256.ProjectivePoint.fromHex(uncompressedPublicKey.toUint8Array());
    const compressedPublicKey = point.toRawBytes(true);
    const compressedPublicKeyHex = Hex.fromHexInput(compressedPublicKey);
    expect(compressedPublicKey.length).toEqual(33);

    const publicKey1 = new Secp256r1PublicKey(compressedPublicKeyHex.toString());
    expect(publicKey1).toBeInstanceOf(Secp256r1PublicKey);
    // Note: compressed keys get expanded to uncompressed format internally
    expect(publicKey1.toUint8Array().length).toEqual(65);

    const publicKey2 = new Secp256r1PublicKey(compressedPublicKeyHex.toUint8Array());
    expect(publicKey2).toBeInstanceOf(Secp256r1PublicKey);
    expect(publicKey2.toUint8Array().length).toEqual(65);

    expect(publicKey1).toEqual(publicKey2);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Secp256r1PublicKey(invalidHexInput)).toThrowError(
      `PublicKey length should be ${Secp256r1PublicKey.LENGTH}`,
    );
  });

  it("should verify the signature correctly", () => {
    const pubKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    const signature = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);

    // Convert message to hex
    const hexMsg = Hex.fromHexString(singleSignerSecp256r1.messageEncoded);

    // Verify with correct signed message
    expect(pubKey.verifySignature({ message: hexMsg.toUint8Array(), signature })).toBe(true);

    // Verify with incorrect signed message
    const incorrectSignedMessage =
      "0xc5de9e40ac00b371cd83b1c197fa5b665b7449b33cd3cdd305bb78222e06a671a49625ab9aea8a039d4bb70e275768084d62b094bc1b31964f2357b7c1af7e0a";
    const invalidSignature = new Secp256r1Signature(incorrectSignedMessage);
    expect(
      pubKey.verifySignature({
        message: singleSignerSecp256r1.messageEncoded,
        signature: invalidSignature,
      }),
    ).toBe(false);
  });

  it("should serialize correctly", () => {
    const publicKey = new Secp256r1PublicKey(singleSignerSecp256r1.publicKey);
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const serialized = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expected = `0x41${singleSignerSecp256r1.publicKey.replace("0x", "")}`;
    expect(serialized).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const serializedPublicKeyStr = `0x41${singleSignerSecp256r1.publicKey.replace("0x", "")}`;
    const serializedPublicKey = Hex.fromHexString(serializedPublicKeyStr).toUint8Array();
    const deserializer = new Deserializer(serializedPublicKey);
    const publicKey = Secp256r1PublicKey.deserialize(deserializer);

    expect(publicKey.toString()).toEqual(`${singleSignerSecp256r1.publicKey}`);
  });
});

describe("Secp256r1PrivateKey", () => {
  it("should create the instance correctly without error with AIP-80 compliant private key", () => {
    const privateKey2 = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    expect(privateKey2).toBeInstanceOf(Secp256r1PrivateKey);
    expect(privateKey2.toString()).toEqual(singleSignerSecp256r1.privateKey);
  });

  it("should create the instance correctly without error with hex private key", () => {
    const privateKeyHex = singleSignerSecp256r1.privateKey.replace("secp256r1-priv-", "");
    const privateKey = new Secp256r1PrivateKey(privateKeyHex, false);
    expect(privateKey).toBeInstanceOf(Secp256r1PrivateKey);
    expect(privateKey.toString()).toEqual(singleSignerSecp256r1.privateKey);
  });

  it("should create the instance correctly without error with Uint8Array private key", () => {
    // Create from Uint8Array
    const hexUint8Array = PrivateKey.parseHexInput(
      singleSignerSecp256r1.privateKey,
      PrivateKeyVariants.Secp256r1,
      false,
    ).toUint8Array();
    const privateKey3 = new Secp256r1PrivateKey(hexUint8Array);
    expect(privateKey3).toBeInstanceOf(Secp256r1PrivateKey);
    expect(privateKey3.toString()).toEqual(singleSignerSecp256r1.privateKey);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Secp256r1PrivateKey(invalidHexInput, false)).toThrowError(
      `PrivateKey length should be ${Secp256r1PrivateKey.LENGTH}`,
    );
  });

  it("should sign the message correctly", () => {
    const privateKey = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const signedMessage = privateKey.sign(singleSignerSecp256r1.messageEncoded);

    // Verify the signature is valid by checking if the public key can verify it
    const publicKey = privateKey.publicKey();
    expect(
      publicKey.verifySignature({
        message: singleSignerSecp256r1.messageEncoded,
        signature: signedMessage,
      }),
    ).toBe(true);
  });

  it("should generate the correct public key", () => {
    const privateKey = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const publicKey = privateKey.publicKey();
    expect(publicKey.toString()).toEqual(`${singleSignerSecp256r1.publicKey}`);
  });

  it("should serialize correctly", () => {
    const privateKey = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const received = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expectedHex = singleSignerSecp256r1.privateKey.replace("secp256r1-priv-", "");
    const expected = `0x20${expectedHex.replace("0x", "")}`;
    expect(received).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const privateKeyHex = singleSignerSecp256r1.privateKey.replace("secp256r1-priv-", "");
    const serializedPrivateKeyStr = `0x20${privateKeyHex.replace("0x", "")}`;
    const serializedPrivateKey = Hex.fromHexString(serializedPrivateKeyStr).toUint8Array();
    const deserializer = new Deserializer(serializedPrivateKey);
    const privateKey = Secp256r1PrivateKey.deserialize(deserializer);

    expect(privateKey.toString()).toEqual(singleSignerSecp256r1.privateKey);
  });

  it("should serialize and deserialize correctly", () => {
    const privateKey = new Secp256r1PrivateKey(singleSignerSecp256r1.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPrivateKey = Secp256r1PrivateKey.deserialize(deserializer);

    expect(deserializedPrivateKey.toString()).toEqual(privateKey.toString());
  });

  it("should generate a random private key", () => {
    const privateKey1 = Secp256r1PrivateKey.generate();
    const privateKey2 = Secp256r1PrivateKey.generate();

    expect(privateKey1).toBeInstanceOf(Secp256r1PrivateKey);
    expect(privateKey2).toBeInstanceOf(Secp256r1PrivateKey);
    expect(privateKey1.toString()).not.toEqual(privateKey2.toString());
  });
});

describe("Secp256r1Signature", () => {
  it("should create an instance correctly without error", () => {
    // Create from string
    const signatureStr = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);
    expect(signatureStr).toBeInstanceOf(Secp256r1Signature);
    expect(signatureStr.toString()).toEqual(singleSignerSecp256r1.signatureHex);

    // Create from Uint8Array
    const signatureValue = new Uint8Array(Secp256r1Signature.LENGTH);
    // Fill with valid signature data (this will be normalized)
    const validSigBytes = Hex.fromHexInput(singleSignerSecp256r1.signatureHex).toUint8Array();
    const signature = new Secp256r1Signature(validSigBytes);
    expect(signature).toBeInstanceOf(Secp256r1Signature);
  });

  it("should throw an error with invalid value length", () => {
    const invalidSignatureValue = new Uint8Array(Secp256r1Signature.LENGTH - 1); // Invalid length
    expect(() => new Secp256r1Signature(invalidSignatureValue)).toThrowError(
      `Signature length should be ${Secp256r1Signature.LENGTH}`,
    );
  });

  it("should serialize correctly", () => {
    const signature = new Secp256r1Signature(singleSignerSecp256r1.signatureHex);
    const serializer = new Serializer();
    signature.serialize(serializer);

    const received = Hex.fromHexInput(serializer.toUint8Array()).toString();
    const expected = `0x40${singleSignerSecp256r1.signatureHex.replace("0x", "")}`;
    expect(received).toEqual(expected);
  });

  it("should deserialize correctly", () => {
    const serializedSignature = `0x40${singleSignerSecp256r1.signatureHex.replace("0x", "")}`;
    const serializedSignatureUint8Array = Hex.fromHexString(serializedSignature).toUint8Array();
    const deserializer = new Deserializer(serializedSignatureUint8Array);
    const signature = Secp256r1Signature.deserialize(deserializer);

    expect(signature.toString()).toEqual(singleSignerSecp256r1.signatureHex);
  });
});
