// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { keylessTestConfig, keylessTestObject } from "./helper";
import {
  Deserializer,
  Hex,
  KeylessAccount,
  KeylessPublicKey,
  KeylessSignature,
  verifyKeylessSignatureWithJwkAndConfig,
} from "../../src";

describe("Keyless", () => {
  describe("keylessPublicKey", () => {
    it("should create the instance correctly without error", async () => {
      const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
      expect(publicKey).toBeInstanceOf(KeylessPublicKey);
      expect(publicKey.toString()).toEqual(keylessTestObject.publicKey);

      const publicKey2 = await KeylessPublicKey.fromJwtAndPepper({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
      });
      expect(publicKey2).toBeInstanceOf(KeylessPublicKey);
      expect(publicKey2.toString()).toEqual(keylessTestObject.publicKey);
    });

    it("should verify the signature correctly", async () => {
      const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
      const signature = KeylessSignature.deserialize(
        new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
      );

      const hexMsg = Hex.fromHexString(keylessTestObject.messageEncoded);

      await expect(
        verifyKeylessSignatureWithJwkAndConfig({
          publicKey,
          message: hexMsg.toUint8Array(),
          signature,
          jwk: keylessTestObject.jwk,
          keylessConfig: keylessTestConfig,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("keylessAccount", () => {
    it("should sign and verify a message correctly", async () => {
      const account = KeylessAccount.create({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
        ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
        proof: keylessTestObject.proof,
      });
      const message = "hello";
      const signature = account.sign(message);
      expect(signature).toBeInstanceOf(KeylessSignature);

      await expect(
        verifyKeylessSignatureWithJwkAndConfig({
          publicKey: account.publicKey,
          message,
          signature,
          jwk: keylessTestObject.jwk,
          keylessConfig: keylessTestConfig,
        }),
      ).resolves.not.toThrow();
    });
  });
});
