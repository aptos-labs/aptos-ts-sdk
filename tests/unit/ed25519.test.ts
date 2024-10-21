// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Deserializer,
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  Hex,
  isCanonicalEd25519Signature,
  Serializer,
} from "../../src";
import { ed25519, wallet } from "./helper";

describe("Ed25519PublicKey", () => {
  it("should create the instance correctly without error", () => {
    // Create from string
    const hexStr = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const publicKey = new Ed25519PublicKey(hexStr);
    expect(publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect(publicKey.toString()).toEqual(hexStr);

    // Create from Uint8Array
    const hexUint8Array = new Uint8Array([
      1, 35, 69, 103, 137, 171, 205, 239, 1, 35, 69, 103, 137, 171, 205, 239, 1, 35, 69, 103, 137, 171, 205, 239, 1, 35,
      69, 103, 137, 171, 205, 239,
    ]);
    const publicKey2 = new Ed25519PublicKey(hexUint8Array);
    expect(publicKey2).toBeInstanceOf(Ed25519PublicKey);
    expect(publicKey2.toUint8Array()).toEqual(hexUint8Array);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Ed25519PublicKey(invalidHexInput)).toThrowError(
      `PublicKey length should be ${Ed25519PublicKey.LENGTH}`,
    );
  });

  it("should verify the signature correctly", () => {
    const pubKey = new Ed25519PublicKey(ed25519.publicKey);
    const signature = new Ed25519Signature(ed25519.signatureHex);

    // Verify with correct signed message
    expect(pubKey.verifySignature({ message: ed25519.messageEncoded, signature })).toBe(true);

    // Verify with incorrect signed message
    const incorrectSignedMessage =
      // eslint-disable-next-line max-len
      "0xc5de9e40ac00b371cd83b1c197fa5b665b7449b33cd3cdd305bb78222e06a671a49625ab9aea8a039d4bb70e275768084d62b094bc1b31964f2357b7c1af7e0a";
    const invalidSignature = new Ed25519Signature(incorrectSignedMessage);
    expect(
      pubKey.verifySignature({
        message: ed25519.messageEncoded,
        signature: invalidSignature,
      }),
    ).toBe(false);
  });

  it("should fail malleable signatures", () => {
    // Here we make a signature exactly with the L
    const signature = new Ed25519Signature(
      // eslint-disable-next-line max-len
      "0x0000000000000000000000000000000000000000000000000000000000000000edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010",
    );
    expect(isCanonicalEd25519Signature(signature)).toBe(false);

    // We now check with L + 1
    const signature2 = new Ed25519Signature(
      // eslint-disable-next-line max-len
      "0x0000000000000000000000000000000000000000000000000000000000000000edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000011",
    );
    expect(isCanonicalEd25519Signature(signature2)).toBe(false);
  });

  it("should serialize correctly", () => {
    const publicKey = new Ed25519PublicKey(ed25519.publicKey);
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const expectedUint8Array = new Uint8Array([
      32, 222, 25, 229, 209, 136, 12, 172, 135, 213, 116, 132, 206, 158, 210, 232, 76, 240, 249, 89, 159, 18, 231, 204,
      58, 82, 228, 231, 101, 122, 118, 63, 44,
    ]);
    expect(serializer.toUint8Array()).toEqual(expectedUint8Array);
  });

  it("should deserialize correctly", () => {
    const serializedPublicKey = new Uint8Array([
      32, 222, 25, 229, 209, 136, 12, 172, 135, 213, 116, 132, 206, 158, 210, 232, 76, 240, 249, 89, 159, 18, 231, 204,
      58, 82, 228, 231, 101, 122, 118, 63, 44,
    ]);
    const deserializer = new Deserializer(serializedPublicKey);
    const publicKey = Ed25519PublicKey.deserialize(deserializer);

    expect(publicKey.toString()).toEqual(ed25519.publicKey);
  });

  it("should serialize and deserialize correctly", () => {
    const hexInput = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const publicKey = new Ed25519PublicKey(hexInput);
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPublicKey = Ed25519PublicKey.deserialize(deserializer);

    expect(deserializedPublicKey).toEqual(publicKey);
  });
});

describe("PrivateKey", () => {
  it("should create the instance correctly without error with AIP-80 compliant private key", () => {
    const privateKey2 = new Ed25519PrivateKey(ed25519.privateKey, false);
    expect(privateKey2).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey2.toAIP80String()).toEqual(ed25519.privateKey);
  });

  it("should create the instance correctly without error with non-AIP-80 compliant private key", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey, false);
    expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey.toAIP80String()).toEqual(ed25519.privateKey);
  });

  it("should create the instance correctly without error with Uint8Array private key", () => {
    const hexUint8Array = new Uint8Array([
      197, 51, 140, 210, 81, 194, 45, 170, 140, 156, 156, 201, 79, 73, 140, 200, 165, 199, 225, 210, 231, 82, 135, 165,
      221, 169, 16, 150, 254, 100, 239, 165,
    ]);
    const privateKey3 = new Ed25519PrivateKey(hexUint8Array, false);
    expect(privateKey3).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey3.toHexString()).toEqual(Hex.fromHexInput(hexUint8Array).toString());
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new Ed25519PrivateKey(invalidHexInput, false)).toThrowError(
      `PrivateKey length should be ${Ed25519PrivateKey.LENGTH}`,
    );
  });

  it("should sign the message correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const signedMessage = privateKey.sign(ed25519.messageEncoded);
    expect(signedMessage.toString()).toEqual(ed25519.signatureHex);
  });

  it("should serialize correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const expectedUint8Array = new Uint8Array([
      32, 197, 51, 140, 210, 81, 194, 45, 170, 140, 156, 156, 201, 79, 73, 140, 200, 165, 199, 225, 210, 231, 82, 135,
      165, 221, 169, 16, 150, 254, 100, 239, 165,
    ]);
    expect(serializer.toUint8Array()).toEqual(expectedUint8Array);
  });

  it("should deserialize correctly", () => {
    const serializedPrivateKey = new Uint8Array([
      32, 197, 51, 140, 210, 81, 194, 45, 170, 140, 156, 156, 201, 79, 73, 140, 200, 165, 199, 225, 210, 231, 82, 135,
      165, 221, 169, 16, 150, 254, 100, 239, 165,
    ]);
    const deserializer = new Deserializer(serializedPrivateKey);
    const privateKey = Ed25519PrivateKey.deserialize(deserializer);

    expect(privateKey.toAIP80String()).toEqual(ed25519.privateKey);
  });

  it("should serialize and deserialize correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPrivateKey = Ed25519PrivateKey.deserialize(deserializer);

    expect(deserializedPrivateKey.toString()).toEqual(privateKey.toString());
  });

  it("should generate a random private key correctly", () => {
    // Make sure it generate new PrivateKey successfully
    const privateKey = Ed25519PrivateKey.generate();
    expect(privateKey).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey.toUint8Array().length).toEqual(Ed25519PrivateKey.LENGTH);

    // Make sure it generate different private keys
    const anotherPrivateKey = Ed25519PrivateKey.generate();
    expect(anotherPrivateKey.toString()).not.toEqual(privateKey.toString());
  });

  it("should derive the public key correctly", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const publicKey = privateKey.publicKey();
    expect(publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect(publicKey.toString()).toEqual(ed25519.publicKey);
  });

  it("should prevent an invalid bip44 path ", () => {
    const { mnemonic } = wallet;
    const path = "1234";
    expect(() => Ed25519PrivateKey.fromDerivationPath(path, mnemonic)).toThrow("Invalid derivation path");
  });

  it("should derive from path and mnemonic", () => {
    const { mnemonic, path, privateKey } = wallet;
    const key = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
    expect(key).toBeInstanceOf(Ed25519PrivateKey);
    expect(privateKey).toEqual(key.toAIP80String());
  });
});

describe("Signature", () => {
  it("should create an instance correctly without error", () => {
    // Create from string
    const signatureStr = new Ed25519Signature(ed25519.signatureHex);
    expect(signatureStr).toBeInstanceOf(Ed25519Signature);
    expect(signatureStr.toString()).toEqual(ed25519.signatureHex);

    // Create from Uint8Array
    const signatureValue = new Uint8Array(Ed25519Signature.LENGTH);
    const signature = new Ed25519Signature(signatureValue);
    expect(signature).toBeInstanceOf(Ed25519Signature);
    expect(signature.toUint8Array()).toEqual(signatureValue);
  });

  it("should throw an error with invalid value length", () => {
    const invalidSignatureValue = new Uint8Array(Ed25519Signature.LENGTH - 1); // Invalid length
    expect(() => new Ed25519Signature(invalidSignatureValue)).toThrowError(
      `Signature length should be ${Ed25519Signature.LENGTH}`,
    );
  });

  it("should serialize correctly", () => {
    const signature = new Ed25519Signature(ed25519.signatureHex);
    const serializer = new Serializer();
    signature.serialize(serializer);
    const expectedUint8Array = new Uint8Array([
      64, 158, 101, 61, 86, 160, 146, 71, 87, 11, 177, 116, 163, 137, 232, 91, 146, 38, 171, 213, 196, 3, 234, 108, 80,
      75, 56, 102, 38, 161, 69, 21, 140, 212, 239, 214, 111, 197, 224, 113, 192, 225, 149, 56, 169, 106, 5, 221, 189,
      162, 77, 60, 81, 225, 230, 169, 218, 204, 107, 177, 206, 119, 92, 206, 7,
    ]);
    expect(serializer.toUint8Array()).toEqual(expectedUint8Array);
  });

  it("should deserialize correctly", () => {
    const serializedSignature = new Uint8Array([
      64, 158, 101, 61, 86, 160, 146, 71, 87, 11, 177, 116, 163, 137, 232, 91, 146, 38, 171, 213, 196, 3, 234, 108, 80,
      75, 56, 102, 38, 161, 69, 21, 140, 212, 239, 214, 111, 197, 224, 113, 192, 225, 149, 56, 169, 106, 5, 221, 189,
      162, 77, 60, 81, 225, 230, 169, 218, 204, 107, 177, 206, 119, 92, 206, 7,
    ]);
    const deserializer = new Deserializer(serializedSignature);
    const signature = Ed25519Signature.deserialize(deserializer);

    expect(signature.toString()).toEqual(ed25519.signatureHex);
  });

  it("should serialize and deserialize correctly", () => {
    const signatureValue = new Uint8Array(Ed25519Signature.LENGTH);
    const signature = new Ed25519Signature(signatureValue);
    const serializer = new Serializer();
    signature.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedSignature = Ed25519Signature.deserialize(deserializer);

    expect(deserializedSignature.toUint8Array()).toEqual(signature.toUint8Array());
  });
});
