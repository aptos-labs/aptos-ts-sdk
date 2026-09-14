// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../../src/bcs/index.js";
import { FederatedKeylessPublicKey } from "../../../../src/core/crypto/federatedKeyless.js";
import { KeylessPublicKey, KeylessSignature } from "../../../../src/core/crypto/keyless.js";
import { AccountAddress } from "../../../../src/core/accountAddress.js";
import { FederatedKeylessAccount } from "../../../../src/account/FederatedKeylessAccount.js";
import { Hex } from "../../../../src/core/hex.js";
import { keylessTestConfig, keylessTestObject } from "../../helper.js";

const jwkAddress = AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000face");

describe("FederatedKeylessPublicKey", () => {
  it("fromJwtAndPepper derives a federated public key distinct from plain keyless", () => {
    const pk = FederatedKeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });

    expect(pk.jwkAddress.toString()).toBe(jwkAddress.toString());
    expect(pk.keylessPublicKey.toString()).toBe(keylessTestObject.publicKey);
    expect(pk.toString()).not.toBe(keylessTestObject.publicKey);
    expect(pk.authKey().toString()).not.toBe(
      new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment).authKey().toString(),
    );
  });

  it("BCS round-trips through serialize and deserialize", () => {
    const original = FederatedKeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
    const serializer = new Serializer();
    original.serialize(serializer);
    const restored = FederatedKeylessPublicKey.deserialize(new Deserializer(serializer.toUint8Array()));

    expect(restored.jwkAddress.toString()).toBe(original.jwkAddress.toString());
    expect(restored.keylessPublicKey.toString()).toBe(original.keylessPublicKey.toString());
  });

  it("verifySignature returns true for a valid fixture signature", () => {
    const pk = FederatedKeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
    const signature = KeylessSignature.deserialize(
      new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
    );

    const ok = pk.verifySignature({
      message: Hex.hexInputToUint8Array(keylessTestObject.messageEncoded),
      signature,
      jwk: keylessTestObject.jwk,
      keylessConfig: keylessTestConfig,
    });

    expect(ok).toBe(true);
  });

  it("verifySignature returns false for an invalid message", () => {
    const pk = FederatedKeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
    const signature = KeylessSignature.deserialize(
      new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
    );

    expect(
      pk.verifySignature({
        message: "wrong",
        signature,
        jwk: keylessTestObject.jwk,
        keylessConfig: keylessTestConfig,
      }),
    ).toBe(false);
  });

  it("isInstance and isPublicKey discriminate federated keys", () => {
    const pk = FederatedKeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
    expect(FederatedKeylessPublicKey.isInstance(pk)).toBe(true);
    expect(FederatedKeylessPublicKey.isPublicKey(pk)).toBe(true);
    expect(
      FederatedKeylessPublicKey.isInstance(new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment)),
    ).toBe(false);
  });

  it("create builds a key from explicit JWT fields", () => {
    const pk = FederatedKeylessPublicKey.create({
      iss: keylessTestObject.iss,
      uidKey: "sub",
      uidVal: "test-user-0",
      aud: "test-keyless-dapp",
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
    expect(pk.keylessPublicKey.toString()).toBe(keylessTestObject.publicKey);
  });

  it("fromBytes round-trips a federated keyless account", () => {
    const account = FederatedKeylessAccount.create({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
      proof: keylessTestObject.proof,
      jwkAddress,
    });
    const restored = FederatedKeylessAccount.fromBytes(account.bcsToBytes());
    expect(restored.publicKey.jwkAddress.toString()).toBe(jwkAddress.toString());
    expect(restored.publicKey.toString()).toBe(account.publicKey.toString());
  });

  it("create rejects providing both verificationKey and verificationKeyHash", () => {
    const verificationKeyHash = keylessTestConfig.verificationKey.hash();
    expect(() =>
      FederatedKeylessAccount.create({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
        ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
        proof: keylessTestObject.proof,
        jwkAddress,
        verificationKey: keylessTestConfig.verificationKey,
        verificationKeyHash,
      }),
    ).toThrow("Cannot provide both verificationKey and verificationKeyHash");
  });
});
