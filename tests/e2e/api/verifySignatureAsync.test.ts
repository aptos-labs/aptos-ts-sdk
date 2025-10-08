// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  AptosConfig,
  Ed25519PrivateKey,
  Groth16Zkp,
  KeylessAccount,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  MultiKey,
  MultiKeyAccount,
  Network,
  Secp256k1PrivateKey,
  SigningSchemeInput,
  ZeroKnowledgeSig,
  ZkProof,
  ZkpVariant,
} from "../../../src";

import {
  ed25519,
  EPHEMERAL_KEY_PAIR,
  keylessTestObject,
  secp256k1TestObject,
  singleSignerED25519,
} from "../../unit/helper";

describe("verifySignatureAsync", () => {
  // This can only run against a real network, so we'll make it devnet
  const aptosConfig = new AptosConfig({ network: Network.DEVNET });

  it("signs a message with single signer Secp256k1 scheme and verifies successfully", async () => {
    const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded, stringMessage } = secp256k1TestObject;
    const privateKey = new Secp256k1PrivateKey(privateKeyBytes);
    const accountAddress = AccountAddress.from(address);
    const secpAccount = Account.fromPrivateKey({ privateKey, address: accountAddress });
    // verifies an encoded message
    const signature1 = secpAccount.sign(messageEncoded);
    expect(signature1.signature.toString()).toEqual(signatureHex);
    expect(
      await secpAccount.verifySignatureAsync({ aptosConfig, message: messageEncoded, signature: signature1 }),
    ).toBeTruthy();
    // verifies a string message
    const signature2 = secpAccount.sign(stringMessage);
    expect(signature2.signature.toString()).toEqual(signatureHex);
    expect(
      await secpAccount.verifySignatureAsync({ aptosConfig, message: stringMessage, signature: signature2 }),
    ).toBeTruthy();
  });

  it("signs a message with single signer ed25519 scheme and verifies successfully", async () => {
    const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded } = singleSignerED25519;
    const privateKey = new Ed25519PrivateKey(privateKeyBytes);
    const accountAddress = AccountAddress.from(address);
    const edAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: false });
    const signature = edAccount.sign(messageEncoded);
    expect(signature.signature.toString()).toEqual(signatureHex);
    expect(await edAccount.verifySignatureAsync({ aptosConfig, message: messageEncoded, signature })).toBeTruthy();
  });
  describe("multikey", () => {
    const singleSignerED25519SenderAccount = Account.generate({
      scheme: SigningSchemeInput.Ed25519,
      legacy: false,
    });
    const legacyED25519SenderAccount = Account.generate();
    const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const keylessAccount = KeylessAccount.create({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      proof: keylessTestObject.proof,
    });
    const multiKey = new MultiKey({
      publicKeys: [
        singleSignerED25519SenderAccount.publicKey,
        legacyED25519SenderAccount.publicKey,
        singleSignerSecp256k1Account.publicKey,
        keylessAccount.publicKey,
      ],
      signaturesRequired: 2,
    });

    it("signs a message with a 2 of 4 multikey scheme and verifies successfully", async () => {
      const account = new MultiKeyAccount({
        multiKey,
        signers: [singleSignerSecp256k1Account, singleSignerED25519SenderAccount],
      });
      const message = "test message";
      const multiKeySig = account.sign(message);
      expect(await account.verifySignatureAsync({ aptosConfig, message, signature: multiKeySig })).toEqual(true);
    });

    // Skip b/c it started to fail, and need to separate keyless out
    it.skip("signs a message with a 2 of 4 multikey scheme with keyless account and verifies successfully", async () => {
      const account = new MultiKeyAccount({
        multiKey,
        signers: [singleSignerSecp256k1Account, keylessAccount],
      });
      const message = "test message";
      const multiKeySig = account.sign(message);
      expect(
        await account.verifySignatureAsync({
          aptosConfig,
          message,
          signature: multiKeySig,
          options: { throwErrorWithReason: true },
        }),
      ).toEqual(true);
    });

    it("signs a message with a 2 of 4 multikey scheme with keyless account and throws error with failure reason", async () => {
      const invalidProofKeylessAccount = KeylessAccount.create({
        jwt: keylessTestObject.JWT,
        pepper: keylessTestObject.pepper,
        ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
        proof: new ZeroKnowledgeSig({
          proof: new ZkProof(
            new Groth16Zkp({ a: new Uint8Array(32), b: new Uint8Array(64), c: new Uint8Array(32) }),
            ZkpVariant.Groth16,
          ),
          expHorizonSecs: 0,
        }),
      });
      const account = new MultiKeyAccount({
        multiKey,
        signers: [singleSignerSecp256k1Account, invalidProofKeylessAccount],
      });
      const message = "test message";
      const multiKeySig = account.sign(message);
      await expect(async () =>
        account.verifySignatureAsync({
          aptosConfig,
          message,
          signature: multiKeySig,
          options: { throwErrorWithReason: true },
        }),
      ).rejects.toThrow(/The proof verification failed/);
    });
  });

  describe("multiEd25519", () => {
    const ed25519PrivateKey1 = Ed25519PrivateKey.generate();
    const ed25519PrivateKey2 = Ed25519PrivateKey.generate();
    const ed25519PrivateKey3 = Ed25519PrivateKey.generate();
    const multiKey = new MultiEd25519PublicKey({
      publicKeys: [ed25519PrivateKey1.publicKey(), ed25519PrivateKey2.publicKey(), ed25519PrivateKey3.publicKey()],
      threshold: 2,
    });
    const message = "test message";

    it("signs a message with a 2 of 3 multiEd25519 scheme and verifies successfully", async () => {
      const account = new MultiEd25519Account({
        publicKey: multiKey,
        signers: [ed25519PrivateKey1, ed25519PrivateKey3],
      });
      const multiKeySig = account.sign(message);
      expect(await account.verifySignatureAsync({ aptosConfig, message, signature: multiKeySig })).toEqual(true);
    });

    it("signs a message with a 2 of 3 multiEd25519 scheme and verifies successfully with misordered signers", async () => {
      const account = new MultiEd25519Account({
        publicKey: multiKey,
        signers: [ed25519PrivateKey3, ed25519PrivateKey2],
      });
      const multiKeySig = account.sign(message);
      expect(await account.verifySignatureAsync({ aptosConfig, message, signature: multiKeySig })).toEqual(true);
    });

    test("constructing a multi ed25519 account with insufficient signers fails", async () => {
      expect(() => new MultiEd25519Account({ publicKey: multiKey, signers: [ed25519PrivateKey1] })).toThrow();
    });
  });

  it("signs a message with a legacy ed25519 scheme and verifies successfully", async () => {
    const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded, stringMessage } = ed25519;
    const privateKey = new Ed25519PrivateKey(privateKeyBytes);
    const accountAddress = AccountAddress.from(address);
    const legacyEdAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: true });
    // verifies an encoded message
    const signature1 = legacyEdAccount.sign(messageEncoded);
    expect(signature1.toString()).toEqual(signatureHex);
    expect(
      await legacyEdAccount.verifySignatureAsync({ aptosConfig, message: messageEncoded, signature: signature1 }),
    ).toBeTruthy();
    // verifies a string message
    const signature2 = legacyEdAccount.sign(stringMessage);
    expect(signature2.toString()).toEqual(signatureHex);
    expect(
      await legacyEdAccount.verifySignatureAsync({ aptosConfig, message: stringMessage, signature: signature2 }),
    ).toBeTruthy();
  });
});
