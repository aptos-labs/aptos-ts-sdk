// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import { Account } from "../../src/account/Account.js";
import { MultiKeyAccount } from "../../src/account/MultiKeyAccount.js";
import { MultiKey } from "../../src/core/crypto/multiKey.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";
import { AccountAuthenticatorMultiKey } from "../../src/transactions/authenticator/account.js";
import { AccountAddress } from "../../src/core/index.js";
import { ChainId } from "../../src/transactions/instances/chainId.js";
import { Identifier } from "../../src/transactions/instances/identifier.js";
import { ModuleId } from "../../src/transactions/instances/moduleId.js";
import { EntryFunction, TransactionPayloadEntryFunction } from "../../src/transactions/instances/transactionPayload.js";
import { RawTransaction } from "../../src/transactions/instances/rawTransaction.js";
import { SimpleTransaction } from "../../src/transactions/instances/simpleTransaction.js";
import { KeylessAccount } from "../../src/account/KeylessAccount.js";
import { keylessTestObject } from "./helper.js";

const MESSAGE = "cafefeed";

function makeSimpleTransaction(): SimpleTransaction {
  const sender = AccountAddress.ONE;
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  const entry = new EntryFunction(moduleId, new Identifier("transfer"), [], []);
  const payload = new TransactionPayloadEntryFunction(entry);
  const raw = new RawTransaction(sender, 0n, payload, 1000n, 100n, 999999n, new ChainId(4));
  return new SimpleTransaction(raw);
}

function buildAccount() {
  const signer1 = Account.generate();
  const signer2 = Account.generate();
  const signer3 = Account.generate();
  const publicKeys = [signer1.publicKey, signer2.publicKey, signer3.publicKey];
  const multiKey = new MultiKey({ publicKeys, signaturesRequired: 2 });
  const account = MultiKeyAccount.fromPublicKeysAndSigners({
    publicKeys,
    signaturesRequired: 2,
    signers: [signer1, signer2],
  });
  return { signer1, signer2, signer3, multiKey, account };
}

describe("MultiKeyAccount", () => {
  it("throws when more signers are provided than signaturesRequired", () => {
    const { multiKey, signer1, signer2, signer3 } = buildAccount();

    expect(() => new MultiKeyAccount({ multiKey, signers: [signer1, signer2, signer3] })).toThrow(
      /More signers provided than required/,
    );
  });

  it("isMultiKeySigner identifies MultiKeyAccount instances", () => {
    const { account } = buildAccount();
    expect(MultiKeyAccount.isMultiKeySigner(account)).toBe(true);
    expect(MultiKeyAccount.isMultiKeySigner(Account.generate())).toBe(false);
  });

  it("signWithAuthenticator returns an AccountAuthenticatorMultiKey", () => {
    const { account } = buildAccount();
    const authenticator = account.signWithAuthenticator(MESSAGE);
    expect(authenticator).toBeInstanceOf(AccountAuthenticatorMultiKey);
    expect(authenticator.public_keys).toBe(account.publicKey);
    expect(account.verifySignature({ message: MESSAGE, signature: authenticator.signatures })).toBe(true);
  });

  it("signTransactionWithAuthenticator signs the transaction bytes", () => {
    const { account } = buildAccount();
    const transaction = makeSimpleTransaction();
    const authenticator = account.signTransactionWithAuthenticator(transaction);
    expect(authenticator).toBeInstanceOf(AccountAuthenticatorMultiKey);
    expect(authenticator.signatures.signatures).toHaveLength(2);
  });

  it("signTransaction aggregates signatures from each signer", () => {
    const { account } = buildAccount();
    const transaction = makeSimpleTransaction();
    const signature = account.signTransaction(transaction);
    expect(signature.signatures).toHaveLength(2);
    expect(signature.bitmap).toEqual(account.signaturesBitmap);
  });

  it("verifySignatureAsync delegates to the MultiKey public key", async () => {
    const { account } = buildAccount();
    const signature = account.sign(MESSAGE);
    const config = new AptosConfig({ network: Network.LOCAL });

    await expect(account.verifySignatureAsync({ aptosConfig: config, message: MESSAGE, signature })).resolves.toBe(
      true,
    );
  });

  it("waitForProofFetch and checkKeylessAccountValidity forward to keyless signers", async () => {
    const edSigner = Account.generate();
    const keylessSigner = KeylessAccount.create({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
      proof: keylessTestObject.proof,
    });
    const waitSpy = vi.spyOn(keylessSigner, "waitForProofFetch").mockResolvedValue(undefined);
    const validitySpy = vi.spyOn(keylessSigner, "checkKeylessAccountValidity").mockResolvedValue(undefined);
    const publicKeys = [keylessSigner.publicKey, edSigner.publicKey];
    const multiKey = new MultiKey({ publicKeys, signaturesRequired: 2 });
    const account = new MultiKeyAccount({ multiKey, signers: [keylessSigner, edSigner] });

    await account.waitForProofFetch();
    await account.checkKeylessAccountValidity(new AptosConfig({ network: Network.LOCAL }));

    expect(waitSpy).toHaveBeenCalledTimes(1);
    expect(validitySpy).toHaveBeenCalledTimes(1);
  });
});
