// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  SigningScheme as AuthenticationKeyScheme,
  SigningSchemeInput,
  AnyPublicKey,
  Ed25519Account,
  SingleKeyAccount,
  MultiKey,
  MultiKeyAccount,
  MultiEd25519PublicKey,
  KeylessAccount,
} from "../../src";
import { MultiEd25519Account } from "../../src/account/MultiEd25519Account";

import {
  ed25519,
  secp256k1TestObject,
  secp256k1WalletTestObject,
  singleSignerED25519,
  wallet,
  Ed25519WalletTestObject,
  keylessTestObject,
  EPHEMERAL_KEY_PAIR,
} from "./helper";

describe("Account", () => {
  describe("generate", () => {
    it("should create an instance of Account with a legacy ED25519 when nothing is specified", () => {
      // Account with Legacy Ed25519 scheme
      const edAccount = Account.generate();
      expect(edAccount).toBeInstanceOf(Ed25519Account);
      expect(edAccount.publicKey).toBeInstanceOf(Ed25519PublicKey);
      expect(edAccount.signingScheme).toEqual(AuthenticationKeyScheme.Ed25519);
    });
    it("should create an instance of Account with a Single Sender ED25519 when scheme and legacy specified", () => {
      // Account with SingleKey Ed25519 scheme
      const edAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
      expect(edAccount).toBeInstanceOf(SingleKeyAccount);
      expect(edAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect(edAccount.signingScheme).toEqual(AuthenticationKeyScheme.SingleKey);
    });
    it("should create an instance of Account when Secp256k1 scheme is specified", () => {
      // Account with SingleKey Secp256k1 scheme
      const secpAccount = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
      expect(secpAccount).toBeInstanceOf(SingleKeyAccount);
      expect(secpAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect(secpAccount.signingScheme).toEqual(AuthenticationKeyScheme.SingleKey);
    });
  });
  describe("fromPrivateKeyAndAddress", () => {
    it("derives the correct account from a legacy ed25519 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = ed25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const newAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: true });
      expect(newAccount).toBeInstanceOf(Ed25519Account);
      expect(newAccount.publicKey).toBeInstanceOf(Ed25519PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Ed25519PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.toString()).toEqual(new Ed25519PublicKey(publicKey).toString());
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("derives the correct account from a single signer ed25519 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = singleSignerED25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const newAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: false });
      expect(newAccount).toBeInstanceOf(SingleKeyAccount);
      expect(newAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect(newAccount.publicKey.publicKey).toBeInstanceOf(Ed25519PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Ed25519PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.publicKey.toString()).toEqual(publicKey);
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("derives the correct account from a single signer secp256k1 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = secp256k1TestObject;
      const privateKey = new Secp256k1PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const newAccount = Account.fromPrivateKey({ privateKey, address: accountAddress });
      expect(newAccount).toBeInstanceOf(SingleKeyAccount);
      expect(newAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect(newAccount.publicKey.publicKey).toBeInstanceOf(Secp256k1PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Secp256k1PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.publicKey.toString()).toEqual(publicKey);
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });
  });

  describe("fromPrivateKey", () => {
    it("derives the correct account from a legacy ed25519 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = ed25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const newAccount = Account.fromPrivateKey({ privateKey });
      expect(newAccount).toBeInstanceOf(Ed25519Account);
      expect(newAccount.publicKey).toBeInstanceOf(Ed25519PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Ed25519PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.toString()).toEqual(new Ed25519PublicKey(publicKey).toString());
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("derives the correct account from a single signer ed25519 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = singleSignerED25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const newAccount = Account.fromPrivateKey({ privateKey, legacy: false });
      expect(newAccount).toBeInstanceOf(SingleKeyAccount);
      expect(newAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect((newAccount.publicKey as AnyPublicKey).publicKey).toBeInstanceOf(Ed25519PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Ed25519PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.publicKey.toString()).toEqual(new Ed25519PublicKey(publicKey).toString());
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("derives the correct account from a single signer secp256k1 private key", () => {
      const { privateKey: privateKeyBytes, publicKey, address } = secp256k1TestObject;
      const privateKey = new Secp256k1PrivateKey(privateKeyBytes);
      const newAccount = Account.fromPrivateKey({ privateKey });
      expect(newAccount).toBeInstanceOf(SingleKeyAccount);
      expect(newAccount.publicKey).toBeInstanceOf(AnyPublicKey);
      expect((newAccount.publicKey as AnyPublicKey).publicKey).toBeInstanceOf(Secp256k1PublicKey);
      expect(newAccount.privateKey).toBeInstanceOf(Secp256k1PrivateKey);
      expect(newAccount.privateKey.toString()).toEqual(privateKey.toString());
      expect(newAccount.publicKey.publicKey.toString()).toEqual(new Secp256k1PublicKey(publicKey).toString());
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });
  });
  describe("fromDerivationPath", () => {
    it("should create a new account from bip44 path and mnemonics with legacy Ed25519", async () => {
      const { mnemonic, address, path } = wallet;
      const newAccount = Account.fromDerivationPath({
        path,
        mnemonic,
        scheme: SigningSchemeInput.Ed25519,
      });
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("should create a new account from bip44 path and mnemonics with single signer Ed25519", async () => {
      const { mnemonic, address, path } = Ed25519WalletTestObject;
      const newAccount = Account.fromDerivationPath({
        path,
        mnemonic,
        scheme: SigningSchemeInput.Ed25519,
        legacy: false,
      });
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });

    it("should create a new account from bip44 path and mnemonics with single signer secp256k1", () => {
      const { mnemonic, address, path } = secp256k1WalletTestObject;
      const newAccount = Account.fromDerivationPath({
        path,
        mnemonic,
        scheme: SigningSchemeInput.Secp256k1Ecdsa,
      });
      expect(newAccount.accountAddress.toString()).toEqual(address);
    });
  });

  describe("sign and verify", () => {
    it("signs a message with single signer Secp256k1 scheme and verifies successfully", () => {
      const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded, stringMessage } = secp256k1TestObject;
      const privateKey = new Secp256k1PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const secpAccount = Account.fromPrivateKey({ privateKey, address: accountAddress });
      // verifies an encoded message
      const signature1 = secpAccount.sign(messageEncoded);
      expect(signature1.signature.toString()).toEqual(signatureHex);
      expect(secpAccount.verifySignature({ message: messageEncoded, signature: signature1 })).toBeTruthy();
      // verifies a string message
      const signature2 = secpAccount.sign(stringMessage);
      expect(signature2.signature.toString()).toEqual(signatureHex);
      expect(secpAccount.verifySignature({ message: stringMessage, signature: signature2 })).toBeTruthy();
    });

    it("signs a message with single signer ed25519 scheme and verifies successfully", () => {
      const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded } = singleSignerED25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const edAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: false });
      const signature = edAccount.sign(messageEncoded);
      expect(signature.signature.toString()).toEqual(signatureHex);
      expect(edAccount.verifySignature({ message: messageEncoded, signature })).toBeTruthy();
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

      it("signs a message with a 2 of 4 multikey scheme and verifies successfully", () => {
        const account = new MultiKeyAccount({
          multiKey,
          signers: [singleSignerSecp256k1Account, singleSignerED25519SenderAccount],
        });
        const message = "test message";
        const multiKeySig = account.sign(message);
        expect(account.verifySignature({ message, signature: multiKeySig })).toEqual(true);
      });

      it("signs a message with a 2 of 4 multikey scheme with keyless account and throws an error indicating that verifySignatureAsync should be used", () => {
        const account = new MultiKeyAccount({
          multiKey,
          signers: [singleSignerSecp256k1Account, keylessAccount],
        });
        const message = "test message";
        const multiKeySig = account.sign(message);
        expect(() => account.verifySignature({ message, signature: multiKeySig })).toThrow("Use verifySignatureAsync");
      });

      it("signs a message with a 2 of 4 multikey scheme and verifies successfully with misordered signers", () => {
        const account = new MultiKeyAccount({
          multiKey,
          signers: [singleSignerSecp256k1Account, singleSignerED25519SenderAccount],
        });
        const message = "test message";
        const multiKeySig = account.sign(message);
        expect(account.verifySignature({ message, signature: multiKeySig })).toEqual(true);
      });

      test("constructing a multi key account with insufficient signers fails", async () => {
        expect(() => new MultiKeyAccount({ multiKey, signers: [singleSignerED25519SenderAccount] })).toThrow();
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

      it("signs a message with a 2 of 3 multiEd25519 scheme and verifies successfully", () => {
        const account = new MultiEd25519Account({
          publicKey: multiKey,
          signers: [ed25519PrivateKey1, ed25519PrivateKey3],
        });
        const multiKeySig = account.sign(message);
        expect(account.verifySignature({ message, signature: multiKeySig })).toEqual(true);
      });

      it("signs a message with a 2 of 3 multiEd25519 scheme and verifies successfully with misordered signers", () => {
        const account = new MultiEd25519Account({
          publicKey: multiKey,
          signers: [ed25519PrivateKey3, ed25519PrivateKey2],
        });
        const multiKeySig = account.sign(message);
        expect(account.verifySignature({ message, signature: multiKeySig })).toEqual(true);
      });

      test("constructing a multi ed25519 account with insufficient signers fails", async () => {
        expect(() => new MultiEd25519Account({ publicKey: multiKey, signers: [ed25519PrivateKey1] })).toThrow();
      });
    });

    it("signs a message with a legacy ed25519 scheme and verifies successfully", () => {
      const { privateKey: privateKeyBytes, address, signatureHex, messageEncoded, stringMessage } = ed25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const accountAddress = AccountAddress.from(address);
      const legacyEdAccount = Account.fromPrivateKey({ privateKey, address: accountAddress, legacy: true });
      // verifies an encoded message
      const signature1 = legacyEdAccount.sign(messageEncoded);
      expect(signature1.toString()).toEqual(signatureHex);
      expect(legacyEdAccount.verifySignature({ message: messageEncoded, signature: signature1 })).toBeTruthy();
      // verifies a string message
      const signature2 = legacyEdAccount.sign(stringMessage);
      expect(signature2.toString()).toEqual(signatureHex);
      expect(legacyEdAccount.verifySignature({ message: stringMessage, signature: signature2 })).toBeTruthy();
    });
  });

  it("should return the authentication key for a public key", () => {
    const { publicKey: publicKeyBytes, address } = ed25519;
    const publicKey = new Ed25519PublicKey(publicKeyBytes);
    const authKey = publicKey.authKey();
    expect(authKey.derivedAddress().toString()).toBe(address);
  });
});
