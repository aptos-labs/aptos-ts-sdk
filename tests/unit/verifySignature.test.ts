// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AnyPublicKey,
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  MultiKey,
  MultiKeyAccount,
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  SigningSchemeInput,
} from "../../src/index.js";
import { verifySignature } from "../../src/core/crypto/verifySignature.js";
import { ed25519, secp256k1TestObject, singleSignerED25519 } from "./helper.js";

describe("verifySignature", () => {
  const message = "hello world";

  describe("Ed25519 (legacy)", () => {
    it("verifies a valid signature", () => {
      const publicKey = new Ed25519PublicKey(ed25519.publicKey);
      const signature = new Ed25519Signature(ed25519.signatureHex);
      expect(verifySignature({ message: ed25519.messageEncoded, signature, publicKey })).toBe(true);
    });

    it("rejects an invalid signature", () => {
      const publicKey = new Ed25519PublicKey(ed25519.publicKey);
      const wrongSig = new Ed25519Signature(
        "0xc5de9e40ac00b371cd83b1c197fa5b665b7449b33cd3cdd305bb78222e06a671a49625ab9aea8a039d4bb70e275768084d62b094bc1b31964f2357b7c1af7e0a",
      );
      expect(verifySignature({ message: ed25519.messageEncoded, signature: wrongSig, publicKey })).toBe(false);
    });

    it("rejects a message that was not signed", () => {
      const publicKey = new Ed25519PublicKey(ed25519.publicKey);
      const signature = new Ed25519Signature(ed25519.signatureHex);
      expect(verifySignature({ message: "wrong message", signature, publicKey })).toBe(false);
    });
  });

  describe("Ed25519 (SingleKey / AnyPublicKey)", () => {
    it("verifies a valid signature with AnySignature", () => {
      const privateKey = new Ed25519PrivateKey(singleSignerED25519.privateKey);
      const account = Account.fromPrivateKey({ privateKey, legacy: false });
      const signature = account.sign(message);
      expect(verifySignature({ message, signature, publicKey: account.publicKey })).toBe(true);
    });

    it("verifies a valid signature with raw Ed25519Signature auto-wrapped", () => {
      const privateKey = new Ed25519PrivateKey(singleSignerED25519.privateKey);
      const rawSignature = privateKey.sign(message);
      const publicKey = new AnyPublicKey(privateKey.publicKey());
      expect(verifySignature({ message, signature: rawSignature, publicKey })).toBe(true);
    });

    it("rejects an invalid message", () => {
      const privateKey = new Ed25519PrivateKey(singleSignerED25519.privateKey);
      const account = Account.fromPrivateKey({ privateKey, legacy: false });
      const signature = account.sign(message);
      expect(verifySignature({ message: "wrong message", signature, publicKey: account.publicKey })).toBe(false);
    });
  });

  describe("Secp256k1 (SingleKey / AnyPublicKey)", () => {
    it("verifies a valid signature", () => {
      const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
      const account = Account.fromPrivateKey({ privateKey });
      const signature = account.sign(message);
      expect(verifySignature({ message, signature, publicKey: account.publicKey })).toBe(true);
    });

    it("verifies a valid signature with raw Secp256k1Signature auto-wrapped", () => {
      const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
      const rawSignature = privateKey.sign(message);
      const publicKey = new AnyPublicKey(new Secp256k1PublicKey(secp256k1TestObject.publicKey));
      expect(verifySignature({ message, signature: rawSignature, publicKey })).toBe(true);
    });

    it("rejects a wrong message", () => {
      const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
      const account = Account.fromPrivateKey({ privateKey });
      const signature = account.sign(message);
      expect(verifySignature({ message: "other message", signature, publicKey: account.publicKey })).toBe(false);
    });
  });

  describe("MultiEd25519", () => {
    const privateKey1 = Ed25519PrivateKey.generate();
    const privateKey2 = Ed25519PrivateKey.generate();
    const privateKey3 = Ed25519PrivateKey.generate();
    const multiPublicKey = new MultiEd25519PublicKey({
      publicKeys: [privateKey1.publicKey(), privateKey2.publicKey(), privateKey3.publicKey()],
      threshold: 2,
    });

    it("verifies a valid multi-ed25519 signature", () => {
      const account = new MultiEd25519Account({
        publicKey: multiPublicKey,
        signers: [privateKey1, privateKey3],
      });
      const signature = account.sign(message);
      expect(verifySignature({ message, signature, publicKey: multiPublicKey })).toBe(true);
    });
  });

  describe("MultiKey", () => {
    const ed25519Account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
    const secp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const multiKey = new MultiKey({
      publicKeys: [ed25519Account.publicKey, secp256k1Account.publicKey],
      signaturesRequired: 2,
    });

    it("verifies a valid multi-key signature", () => {
      const account = new MultiKeyAccount({
        multiKey,
        signers: [ed25519Account, secp256k1Account],
      });
      const signature = account.sign(message);
      expect(verifySignature({ message, signature, publicKey: multiKey })).toBe(true);
    });
  });

  describe("cross-key-type verification", () => {
    it("returns false when signature does not match the public key", () => {
      const ed25519Key = Ed25519PrivateKey.generate();
      const otherKey = Ed25519PrivateKey.generate();
      const signature = ed25519Key.sign(message);
      expect(
        verifySignature({
          message,
          signature,
          publicKey: otherKey.publicKey(),
        }),
      ).toBe(false);
    });
  });
});
