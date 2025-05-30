/* eslint-disable max-len */
// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  SigningSchemeInput,
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
import { AccountUtils } from "../../src/account/AccountUtils";

export function testAccountSerializationDeserialization(account: Account) {
  const bytes = AccountUtils.toBytes(account);
  const deserializedAccount = AccountUtils.fromBytes(bytes);
  expect(bytes).toEqual(AccountUtils.toBytes(deserializedAccount));
}

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
      testAccountSerializationDeserialization(legacyEdAccount);
      const accountAsHex = AccountUtils.toHexString(legacyEdAccount);
      expect(legacyEdAccount).toEqual(AccountUtils.ed25519AccountFromHex(accountAsHex));
    });
    it("SingleKey Ed25519 Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(singleSignerEdAccount);
      const accountAsHex = AccountUtils.toHexString(singleSignerEdAccount);
      expect(singleSignerEdAccount).toEqual(AccountUtils.singleKeyAccountFromHex(accountAsHex));
    });
    it("SingleKey Secp256k1 Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(secp256k1Account);
      const accountAsHex = AccountUtils.toHexString(secp256k1Account);
      expect(secp256k1Account).toEqual(AccountUtils.singleKeyAccountFromHex(accountAsHex));
    });
    it("Keyless Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccount);
      const accountAsHex = AccountUtils.toHexString(keylessAccount);
      expect(keylessAccount).toEqual(AccountUtils.keylessAccountFromHex(accountAsHex));
    });
    it("Keyless Account with verification key should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccountWithVerificationKey);
      const accountAsHex = AccountUtils.toHexString(keylessAccountWithVerificationKey);
      expect(keylessAccountWithVerificationKey).toEqual(AccountUtils.keylessAccountFromHex(accountAsHex));
    });
    it("FederatedKeyless Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(federatedKeylessAccount);
      const accountAsHex = AccountUtils.toHexString(federatedKeylessAccount);
      expect(federatedKeylessAccount).toEqual(AccountUtils.federatedKeylessAccountFromHex(accountAsHex));
    });
    it("MultiKey Account should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(multiKeyAccount);
      const accountAsHex = AccountUtils.toHexString(multiKeyAccount);
      expect(multiKeyAccount).toEqual(AccountUtils.multiKeyAccountFromHex(accountAsHex));
    });
    it("MultiKey Account with backup signer should serlialize and deserialize properly", () => {
      testAccountSerializationDeserialization(keylessAccountWithBackupSigner);
      const accountAsHex = AccountUtils.toHexString(keylessAccountWithBackupSigner);
      expect(keylessAccountWithBackupSigner).toEqual(AccountUtils.multiKeyAccountFromHex(accountAsHex));
    });
  });
});
