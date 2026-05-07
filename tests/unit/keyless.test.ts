// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { keylessTestConfig, keylessTestObject } from "./helper";
import { Deserializer, Hex, KeylessAccount, KeylessPublicKey, KeylessSignature } from "../../src";

describe("Keyless", () => {
  describe("keylessPublicKey", () => {
    it("should create the instance correctly without error", () => {
      // Create from inputs
      const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
      expect(publicKey).toBeInstanceOf(KeylessPublicKey);
      expect(publicKey.toString()).toEqual(keylessTestObject.publicKey);

      // Create from JWT and pepper
      const publicKey2 = KeylessPublicKey.fromJwtAndPepper({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
      });
      expect(publicKey2).toBeInstanceOf(KeylessPublicKey);
      expect(publicKey2.toString()).toEqual(keylessTestObject.publicKey);
    });

    it("should verify the signature correctly", () => {
      const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
      const signature = KeylessSignature.deserialize(
        new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
      );

      // Convert message to hex
      const hexMsg = Hex.fromHexString(keylessTestObject.messageEncoded);

      // Verify with correct signed message
      expect(
        publicKey.verifySignature({
          message: hexMsg.toUint8Array(),
          signature,
          jwk: keylessTestObject.jwk,
          keylessConfig: keylessTestConfig,
        }),
      ).toBe(true);
    });
  });

  describe("keylessAccount", () => {
    it("should sign and verify a message correctly", () => {
      const account = KeylessAccount.create({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
        ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
        proof: keylessTestObject.proof,
      });
      const message = "hello";
      const signature = account.sign(message);
      expect(signature).toBeInstanceOf(KeylessSignature);
      expect(
        account.publicKey.verifySignature({
          message,
          signature,
          jwk: keylessTestObject.jwk,
          keylessConfig: keylessTestConfig,
        }),
      ).toBe(true);
      expect(
        account.verifySignature({
          message,
          signature,
          jwk: keylessTestObject.jwk,
          keylessConfig: keylessTestConfig,
        }),
      ).toBe(true);
    });
  });
});
