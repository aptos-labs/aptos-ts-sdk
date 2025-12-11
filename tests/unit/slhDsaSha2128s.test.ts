// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Deserializer,
  Hex,
  PrivateKey,
  PrivateKeyVariants,
  Serializer,
  SlhDsaSha2128sKeyPair,
  SlhDsaSha2128sPrivateKey,
  SlhDsaSha2128sPublicKey,
  SlhDsaSha2128sSignature,
} from "../../src";

/* eslint-disable max-len */
describe("SlhDsaSha2128sPublicKey", () => {
  it("should create the instance correctly without error", () => {
    // Generate a key pair to get a valid public key
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const publicKeyBytes = keyPair.publicKey.toUint8Array();

    // Create from Uint8Array
    const publicKey = new SlhDsaSha2128sPublicKey(publicKeyBytes);
    expect(publicKey).toBeInstanceOf(SlhDsaSha2128sPublicKey);
    expect(publicKey.toUint8Array()).toEqual(publicKeyBytes);

    // Create from hex string
    const hexStr = Hex.fromHexInput(publicKeyBytes).toString();
    const publicKey2 = new SlhDsaSha2128sPublicKey(hexStr);
    expect(publicKey2).toBeInstanceOf(SlhDsaSha2128sPublicKey);
    expect(publicKey2.toUint8Array()).toEqual(publicKeyBytes);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = new Uint8Array(31); // Invalid length (should be 32)
    expect(() => new SlhDsaSha2128sPublicKey(invalidHexInput)).toThrowError(
      `PublicKey length should be ${SlhDsaSha2128sPublicKey.LENGTH}`,
    );
  });

  it("should verify the signature correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const pubKey = keyPair.publicKey;
    const message = new TextEncoder().encode("hello aptos");
    const signature = keyPair.privateKey.sign(message);

    // Verify with correct signed message
    expect(pubKey.verifySignature({ message, signature })).toBe(true);

    // Verify with incorrect signed message
    const wrongMessage = new TextEncoder().encode("wrong message");
    expect(pubKey.verifySignature({ message: wrongMessage, signature })).toBe(false);
  });

  it("should serialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const publicKey = keyPair.publicKey;
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const serialized = serializer.toUint8Array();
    expect(serialized.length).toBeGreaterThan(SlhDsaSha2128sPublicKey.LENGTH); // Includes length prefix
  });

  it("should deserialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const originalPublicKey = keyPair.publicKey;
    const serializer = new Serializer();
    originalPublicKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPublicKey = SlhDsaSha2128sPublicKey.deserialize(deserializer);

    expect(deserializedPublicKey.toUint8Array()).toEqual(originalPublicKey.toUint8Array());
  });

  it("should serialize and deserialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const publicKey = keyPair.publicKey;
    const serializer = new Serializer();
    publicKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPublicKey = SlhDsaSha2128sPublicKey.deserialize(deserializer);

    expect(deserializedPublicKey.toUint8Array()).toEqual(publicKey.toUint8Array());
  });
});

describe("SlhDsaSha2128sPrivateKey", () => {
  it("should create the instance correctly without error with AIP-80 compliant private key", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    expect(privateKey).toBeInstanceOf(SlhDsaSha2128sPrivateKey);
    expect(privateKey.toString()).toContain("slh-dsa-sha2-128s-priv-");
  });

  it("should create the instance correctly without error with non-AIP-80 compliant private key", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKeyHex = keyPair.privateKey.toHexString();
    const privateKey = new SlhDsaSha2128sPrivateKey(privateKeyHex, false);
    expect(privateKey).toBeInstanceOf(SlhDsaSha2128sPrivateKey);
    expect(privateKey.toHexString()).toEqual(privateKeyHex);
  });

  it("should create the instance correctly without error with Uint8Array private key", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKeyBytes = keyPair.privateKey.toUint8Array();
    const privateKey = new SlhDsaSha2128sPrivateKey(privateKeyBytes, false);
    expect(privateKey).toBeInstanceOf(SlhDsaSha2128sPrivateKey);
    expect(privateKey.toUint8Array()).toEqual(privateKeyBytes);
  });

  it("should print in AIP-80 format", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    expect(privateKey.toString()).toContain("slh-dsa-sha2-128s-priv-");
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = new Uint8Array(47); // Invalid length (should be 48)
    expect(() => new SlhDsaSha2128sPrivateKey(invalidHexInput, false)).toThrowError(
      `PrivateKey length should be ${SlhDsaSha2128sPrivateKey.LENGTH}`,
    );
  });

  it("should sign the message correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    const message = new TextEncoder().encode("hello aptos");
    const signature = privateKey.sign(message);

    expect(signature).toBeInstanceOf(SlhDsaSha2128sSignature);
    expect(signature.toUint8Array().length).toBe(SlhDsaSha2128sSignature.LENGTH);

    // Verify the signature
    const isValid = keyPair.publicKey.verifySignature({ message, signature });
    expect(isValid).toBe(true);
  });

  it("should serialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const serialized = serializer.toUint8Array();
    expect(serialized.length).toBeGreaterThan(SlhDsaSha2128sPrivateKey.LENGTH); // Includes length prefix
  });

  it("should deserialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const originalPrivateKey = keyPair.privateKey;
    const serializer = new Serializer();
    originalPrivateKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPrivateKey = SlhDsaSha2128sPrivateKey.deserialize(deserializer);

    expect(deserializedPrivateKey.toUint8Array()).toEqual(originalPrivateKey.toUint8Array());
  });

  it("should serialize and deserialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    const serializer = new Serializer();
    privateKey.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPrivateKey = SlhDsaSha2128sPrivateKey.deserialize(deserializer);

    expect(deserializedPrivateKey.toUint8Array()).toEqual(privateKey.toUint8Array());
  });

  it("should derive same public key from randomly-generated private key or from-bytes private key", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKeyBytes = keyPair.privateKey.toUint8Array();
    // Create a new private key instance
    const privateKey = new SlhDsaSha2128sPrivateKey(privateKeyBytes, false);
    // Public key should be derivable
    const derivedPublicKey = privateKey.publicKey();
    expect(derivedPublicKey).toBeInstanceOf(SlhDsaSha2128sPublicKey);
    expect(derivedPublicKey.toUint8Array()).toEqual(keyPair.publicKey.toUint8Array());
  });

  it("should get public key from private key", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKey = keyPair.privateKey;
    const publicKey = privateKey.publicKey();
    expect(publicKey).toBeInstanceOf(SlhDsaSha2128sPublicKey);
    expect(publicKey.toUint8Array()).toEqual(keyPair.publicKey.toUint8Array());
  });
});

describe("SlhDsaSha2128sSignature", () => {
  it("should create an instance correctly without error", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const message = new TextEncoder().encode("hello aptos");
    const signature = keyPair.privateKey.sign(message);

    expect(signature).toBeInstanceOf(SlhDsaSha2128sSignature);
    expect(signature.toUint8Array().length).toBe(SlhDsaSha2128sSignature.LENGTH);
  });

  it("should throw an error with invalid value length", () => {
    const invalidSignatureValue = new Uint8Array(SlhDsaSha2128sSignature.LENGTH - 1); // Invalid length
    expect(() => new SlhDsaSha2128sSignature(invalidSignatureValue)).toThrowError(
      `Signature length should be ${SlhDsaSha2128sSignature.LENGTH}`,
    );
  });

  it("should serialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const message = new TextEncoder().encode("hello aptos");
    const signature = keyPair.privateKey.sign(message);
    const serializer = new Serializer();
    signature.serialize(serializer);

    const serialized = serializer.toUint8Array();
    expect(serialized.length).toBeGreaterThan(SlhDsaSha2128sSignature.LENGTH); // Includes length prefix
  });

  it("should deserialize correctly", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const message = new TextEncoder().encode("hello aptos");
    const originalSignature = keyPair.privateKey.sign(message);
    const serializer = new Serializer();
    originalSignature.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedSignature = SlhDsaSha2128sSignature.deserialize(deserializer);

    expect(deserializedSignature.toUint8Array()).toEqual(originalSignature.toUint8Array());
  });
});

describe("SlhDsaSha2128sKeyPair", () => {
  it("should generate a valid key pair", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    expect(keyPair.privateKey).toBeInstanceOf(SlhDsaSha2128sPrivateKey);
    expect(keyPair.publicKey).toBeInstanceOf(SlhDsaSha2128sPublicKey);
    expect(keyPair.privateKey.toUint8Array().length).toBe(SlhDsaSha2128sPrivateKey.LENGTH);
    expect(keyPair.publicKey.toUint8Array().length).toBe(SlhDsaSha2128sPublicKey.LENGTH);
  });

  it("should allow signing and verification", () => {
    const keyPair = SlhDsaSha2128sKeyPair.generate();
    const message = new TextEncoder().encode("test message");
    const signature = keyPair.privateKey.sign(message);
    const isValid = keyPair.publicKey.verifySignature({ message, signature });
    expect(isValid).toBe(true);
  });

  it("should create key pair from existing keys", () => {
    const originalKeyPair = SlhDsaSha2128sKeyPair.generate();
    const privateKeyBytes = originalKeyPair.privateKey.toUint8Array();
    const publicKeyBytes = originalKeyPair.publicKey.toUint8Array();

    const privateKey = new SlhDsaSha2128sPrivateKey(privateKeyBytes, false);
    const publicKey = new SlhDsaSha2128sPublicKey(publicKeyBytes);
    const keyPair = new SlhDsaSha2128sKeyPair(privateKey, publicKey);

    expect(keyPair.privateKey).toBe(privateKey);
    expect(keyPair.publicKey).toBe(publicKey);
    // Verify the derived public key matches
    const derivedPublicKey = privateKey.publicKey();
    expect(derivedPublicKey.toUint8Array()).toEqual(publicKey.toUint8Array());
  });
});
