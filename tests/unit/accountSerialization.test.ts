/* eslint-disable max-len */
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  SigningSchemeInput,
  Ed25519Account,
  SingleKeyAccount,
  MultiKeyAccount,
  KeylessAccount,
  FederatedKeylessAccount,
  EphemeralKeyPair,
  ZeroKnowledgeSig,
  ZkProof,
  Groth16Zkp,
  ZkpVariant,
  Groth16VerificationKey,
} from "../../src";

import { testAccountSerializationDeserialization } from "./helper";

describe("Account Serialization", () => {
  const proof = new ZeroKnowledgeSig({
    proof: new ZkProof(
      new Groth16Zkp({ a: new Uint8Array(32), b: new Uint8Array(64), c: new Uint8Array(32) }),
      ZkpVariant.Groth16,
    ),
    expHorizonSecs: 0,
  });
  const verificationKey = new Groth16VerificationKey({
    alphaG1: new Uint8Array(32),
    betaG2: new Uint8Array(64),
    deltaG2: new Uint8Array(64),
    gammaAbcG1: [new Uint8Array(32), new Uint8Array(32)],
    gammaG2: new Uint8Array(64),
  });
  const jwt =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0IiwiYXVkIjoidGVzdC1hdWQiLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzMxMjE0NTIxLCJleHAiOjE3MzEyMTgxMjF9.jZeCpYDDWx0pW_WcBpg8b0NzDWCABvH3lSmmmub8BBg";

  const legacyEdAccount = Account.generate();
  const singleSignerEdAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const secp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const keylessAccount = KeylessAccount.create({
    proof,
    ephemeralKeyPair: EphemeralKeyPair.generate(),
    pepper: new Uint8Array(31),
    jwt,
  });
  const keylessAccountWithVerificationKey = KeylessAccount.create({
    proof,
    ephemeralKeyPair: EphemeralKeyPair.generate(),
    pepper: new Uint8Array(31),
    jwt,
    verificationKey,
  });
  const federatedKeylessAccount = FederatedKeylessAccount.create({
    ephemeralKeyPair: EphemeralKeyPair.generate(),
    pepper: new Uint8Array(31),
    jwt,
    jwkAddress: Account.generate().accountAddress,
    proof,
  });
  const multiKeyAccount = MultiKeyAccount.fromPublicKeysAndSigners({
    publicKeys: [singleSignerEdAccount.publicKey, secp256k1Account.publicKey, Account.generate().publicKey],
    signaturesRequired: 2,
    signers: [singleSignerEdAccount, secp256k1Account],
  });
  const keylessAccountWithBackupSigner = MultiKeyAccount.fromPublicKeysAndSigners({
    publicKeys: [keylessAccount.publicKey, Account.generate().publicKey],
    signaturesRequired: 1,
    signers: [keylessAccount],
  });

  describe("serialize", () => {
    it("legacy Ed25519 Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(legacyEdAccount, Ed25519Account);
      testAccountSerializationDeserialization(legacyEdAccount, Account);
    });
    it("SingleKey Ed25519 Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(singleSignerEdAccount, SingleKeyAccount);
      testAccountSerializationDeserialization(singleSignerEdAccount, Account);
    });
    it("SingleKey Secp256k1 Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(secp256k1Account, SingleKeyAccount);
      testAccountSerializationDeserialization(secp256k1Account, Account);
    });
    it("Keyless Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccount, KeylessAccount);
      testAccountSerializationDeserialization(keylessAccount, Account);
    });
    it("Keyless Account with verification key should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccountWithVerificationKey, KeylessAccount);
      testAccountSerializationDeserialization(keylessAccountWithVerificationKey, Account);
    });
    it("FederatedKeyless Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(federatedKeylessAccount, FederatedKeylessAccount);
      testAccountSerializationDeserialization(federatedKeylessAccount, Account);
    });
    it("MultiKey Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(multiKeyAccount, MultiKeyAccount);
      testAccountSerializationDeserialization(multiKeyAccount, Account);
    });
    it("MultiKey Account with backup signer should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccountWithBackupSigner, MultiKeyAccount);
      testAccountSerializationDeserialization(keylessAccountWithBackupSigner, Account);
    });
  });
});
