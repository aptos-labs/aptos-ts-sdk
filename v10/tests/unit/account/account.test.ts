// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, test } from "vitest";
import { Ed25519Account } from "../../../src/account/ed25519-account.js";
import {
  accountFromDerivationPath,
  accountFromPrivateKey,
  authKey,
  generateAccount,
} from "../../../src/account/factory.js";
import { MultiEd25519Account } from "../../../src/account/multi-ed25519-account.js";
import { MultiKeyAccount } from "../../../src/account/multi-key-account.js";
import { SingleKeyAccount } from "../../../src/account/single-key-account.js";
// Import from core barrel to trigger auth key factory registration
import { AccountAddress, AuthenticationKey } from "../../../src/core/index.js";
import { Ed25519PrivateKey, Ed25519PublicKey } from "../../../src/crypto/ed25519.js";
import { MultiEd25519PublicKey } from "../../../src/crypto/multi-ed25519.js";
import { MultiKey } from "../../../src/crypto/multi-key.js";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "../../../src/crypto/secp256k1.js";
import { AnyPublicKey } from "../../../src/crypto/single-key.js";
import { SigningScheme, SigningSchemeInput } from "../../../src/crypto/types.js";

// ── Test fixtures ──

const ed25519 = {
  privateKey: "ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  address: "0x978c213990c4833df71548df7ce49d54c759d6b6d932de22b24d56060b7af2aa",
  messageEncoded: "68656c6c6f20776f726c64",
  stringMessage: "hello world",
  signatureHex:
    "0x9e653d56a09247570bb174a389e85b9226abd5c403ea6c504b386626a145158cd4efd66fc5e071c0e19538a96a05ddbda24d3c51e1e6a9dacc6bb1ce775cce07",
};

const singleSignerED25519 = {
  publicKey: "0xe425451a5dc888ac871976c3c724dec6118910e7d11d344b4b07a22cd94e8c2e",
  privateKey: "ed25519-priv-0xf508cbef4e0fe463204aab724a90791c9a9dbe60a53b4978bbddbc712b55f2fd",
  address: "0x5bdf77d5bf826c8c04273d4e7323f7bc4a85ee7ee34b37bd7458b7aed3639dd3",
  messageEncoded: "68656c6c6f20776f726c64",
  signatureHex:
    "0xc6f50f4e0cb1961f6f7b28be1a1d80e3ece240dfbb7bd8a8b03cc26bfd144fc176295d7c322c5bf3d9669d2ad49d8bdbfe77254b4a6393d8c49da04b40cee600",
};

const secp256k1TestObject = {
  privateKey: "secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e",
  publicKey:
    "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
  address: "0x5792c985bc96f436270bd2a3c692210b09c7febb8889345ceefdbae4bacfe498",
  messageEncoded: "68656c6c6f20776f726c64",
  stringMessage: "hello world",
  signatureHex:
    "0xd0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca",
};

const walletFixture = {
  address: "0x07968dab936c1bad187c60ce4082f307d030d780e91e694ae03aef16aba73f30",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/0'",
};

const ed25519WalletTestObject = {
  address: "0x28b829b524d7c24aa7fd8916573c814df766dae542f724e1cf8914536232c346",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/0'",
};

const secp256k1WalletTestObject = {
  address: "0x4b4aa8759fcef40ba49e999409eb73a98252f44f6612a4de2b23bad5c37b15a6",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0/0",
};

// ── Tests ──

describe("generateAccount", () => {
  it("creates a legacy Ed25519 account by default", () => {
    const account = generateAccount();
    expect(account).toBeInstanceOf(Ed25519Account);
    expect(account.publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect(account.signingScheme).toEqual(SigningScheme.Ed25519);
  });

  it("creates a SingleKey Ed25519 account when legacy=false", () => {
    const account = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false });
    expect(account).toBeInstanceOf(SingleKeyAccount);
    expect(account.publicKey).toBeInstanceOf(AnyPublicKey);
    expect(account.signingScheme).toEqual(SigningScheme.SingleKey);
  });

  it("creates a SingleKey Secp256k1 account", () => {
    const account = generateAccount({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    expect(account).toBeInstanceOf(SingleKeyAccount);
    expect(account.publicKey).toBeInstanceOf(AnyPublicKey);
    expect(account.signingScheme).toEqual(SigningScheme.SingleKey);
  });
});

describe("accountFromPrivateKey", () => {
  it("derives correct legacy Ed25519 account", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const account = accountFromPrivateKey({ privateKey });
    expect(account).toBeInstanceOf(Ed25519Account);
    expect(account.publicKey).toBeInstanceOf(Ed25519PublicKey);
    expect(account.publicKey.toString()).toEqual(new Ed25519PublicKey(ed25519.publicKey).toString());
    expect(account.accountAddress.toString()).toEqual(ed25519.address);
  });

  it("derives correct legacy Ed25519 account with explicit address", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const address = AccountAddress.from(ed25519.address);
    const account = accountFromPrivateKey({ privateKey, address, legacy: true });
    expect(account).toBeInstanceOf(Ed25519Account);
    expect(account.accountAddress.toString()).toEqual(ed25519.address);
  });

  it("derives correct SingleKey Ed25519 account when legacy=false", () => {
    const privateKey = new Ed25519PrivateKey(singleSignerED25519.privateKey);
    const account = accountFromPrivateKey({ privateKey, legacy: false });
    expect(account).toBeInstanceOf(SingleKeyAccount);
    expect(account.publicKey).toBeInstanceOf(AnyPublicKey);
    expect(account.accountAddress.toString()).toEqual(singleSignerED25519.address);
  });

  it("derives correct SingleKey Secp256k1 account", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const account = accountFromPrivateKey({ privateKey });
    expect(account).toBeInstanceOf(SingleKeyAccount);
    expect(account.publicKey).toBeInstanceOf(AnyPublicKey);
    expect((account.publicKey as AnyPublicKey).publicKey).toBeInstanceOf(Secp256k1PublicKey);
    expect(account.accountAddress.toString()).toEqual(secp256k1TestObject.address);
  });
});

describe("accountFromDerivationPath", () => {
  it("derives legacy Ed25519 account from mnemonic", () => {
    const account = accountFromDerivationPath({
      path: walletFixture.path,
      mnemonic: walletFixture.mnemonic,
      scheme: SigningSchemeInput.Ed25519,
    });
    expect(account.accountAddress.toString()).toEqual(walletFixture.address);
  });

  it("derives SingleKey Ed25519 account from mnemonic", () => {
    const account = accountFromDerivationPath({
      path: ed25519WalletTestObject.path,
      mnemonic: ed25519WalletTestObject.mnemonic,
      scheme: SigningSchemeInput.Ed25519,
      legacy: false,
    });
    expect(account.accountAddress.toString()).toEqual(ed25519WalletTestObject.address);
  });

  it("derives SingleKey Secp256k1 account from mnemonic", () => {
    const account = accountFromDerivationPath({
      path: secp256k1WalletTestObject.path,
      mnemonic: secp256k1WalletTestObject.mnemonic,
      scheme: SigningSchemeInput.Secp256k1Ecdsa,
    });
    expect(account.accountAddress.toString()).toEqual(secp256k1WalletTestObject.address);
  });
});

describe("sign and verify", () => {
  it("signs and verifies with legacy Ed25519", () => {
    const privateKey = new Ed25519PrivateKey(ed25519.privateKey);
    const account = accountFromPrivateKey({ privateKey, legacy: true }) as Ed25519Account;
    const signature = account.sign(ed25519.messageEncoded);
    expect(signature.toString()).toEqual(ed25519.signatureHex);
    expect(account.verifySignature({ message: ed25519.messageEncoded, signature })).toBe(true);
  });

  it("signs and verifies with SingleKey Ed25519", () => {
    const privateKey = new Ed25519PrivateKey(singleSignerED25519.privateKey);
    const account = accountFromPrivateKey({ privateKey, legacy: false }) as SingleKeyAccount;
    const signature = account.sign(singleSignerED25519.messageEncoded);
    expect(signature.signature.toString()).toEqual(singleSignerED25519.signatureHex);
    expect(account.verifySignature({ message: singleSignerED25519.messageEncoded, signature })).toBe(true);
  });

  it("signs and verifies with SingleKey Secp256k1", () => {
    const privateKey = new Secp256k1PrivateKey(secp256k1TestObject.privateKey);
    const account = accountFromPrivateKey({ privateKey }) as SingleKeyAccount;
    const signature = account.sign(secp256k1TestObject.messageEncoded);
    expect(signature.signature.toString()).toEqual(secp256k1TestObject.signatureHex);
    expect(account.verifySignature({ message: secp256k1TestObject.messageEncoded, signature })).toBe(true);
  });

  describe("MultiKey", () => {
    const signer1 = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false }) as SingleKeyAccount;
    const signer2 = generateAccount({ scheme: SigningSchemeInput.Secp256k1Ecdsa }) as SingleKeyAccount;
    const signer3 = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false }) as SingleKeyAccount;

    const multiKey = new MultiKey({
      publicKeys: [signer1.publicKey, signer2.publicKey, signer3.publicKey],
      signaturesRequired: 2,
    });

    it("signs and verifies with 2-of-3 MultiKey", () => {
      const account = new MultiKeyAccount({
        multiKey,
        signers: [signer1, signer2],
      });
      const message = "test message";
      const signature = account.sign(message);
      expect(account.verifySignature({ message, signature })).toBe(true);
    });

    test("throws on insufficient signers", () => {
      expect(() => new MultiKeyAccount({ multiKey, signers: [signer1] })).toThrow();
    });

    test("throws on too many signers", () => {
      expect(() => new MultiKeyAccount({ multiKey, signers: [signer1, signer2, signer3] })).toThrow();
    });
  });

  describe("MultiEd25519", () => {
    const pk1 = Ed25519PrivateKey.generate();
    const pk2 = Ed25519PrivateKey.generate();
    const pk3 = Ed25519PrivateKey.generate();

    const multiKey = new MultiEd25519PublicKey({
      publicKeys: [pk1.publicKey(), pk2.publicKey(), pk3.publicKey()],
      threshold: 2,
    });

    it("signs and verifies with 2-of-3 MultiEd25519", () => {
      const account = new MultiEd25519Account({
        publicKey: multiKey,
        signers: [pk1, pk3],
      });
      const message = "test message";
      const signature = account.sign(message);
      expect(account.verifySignature({ message, signature })).toBe(true);
    });

    it("signs and verifies with misordered signers", () => {
      const account = new MultiEd25519Account({
        publicKey: multiKey,
        signers: [pk3, pk2],
      });
      const message = "test message";
      const signature = account.sign(message);
      expect(account.verifySignature({ message, signature })).toBe(true);
    });

    test("throws on insufficient signers", () => {
      expect(() => new MultiEd25519Account({ publicKey: multiKey, signers: [pk1] })).toThrow();
    });
  });
});

describe("authKey", () => {
  it("derives correct address from Ed25519 public key", () => {
    const publicKey = new Ed25519PublicKey(ed25519.publicKey);
    const key = authKey({ publicKey });
    expect(key.derivedAddress().toString()).toBe(ed25519.address);
  });

  it("derives correct address from AuthenticationKey.fromPublicKey", () => {
    const publicKey = new Ed25519PublicKey(ed25519.publicKey);
    const key = AuthenticationKey.fromPublicKey({ publicKey });
    expect(key.derivedAddress().toString()).toBe(ed25519.address);
  });
});
