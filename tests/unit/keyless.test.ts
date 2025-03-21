// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { keylessTestConfig, keylessTestObject } from "./helper";
import { Deserializer, Hex, KeylessPublicKey, KeylessSignature, MoveJWK } from "../../src";

describe("KeylessPublicKey", () => {
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
    const jwk = MoveJWK.deserialize(new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.jwk)));

    // Verify with correct signed message
    expect(
      publicKey.verifySignature({ message: hexMsg.toUint8Array(), signature, jwk, keylessConfig: keylessTestConfig }),
    ).toBe(true);
  });
});
