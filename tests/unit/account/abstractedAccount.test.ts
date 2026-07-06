// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AbstractedAccount } from "../../../src/account/AbstractedAccount.js";
import { Ed25519Account } from "../../../src/account/Ed25519Account.js";
import { AccountAddress } from "../../../src/core/index.js";
import { AbstractSignature } from "../../../src/core/crypto/abstraction.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import {
  EntryFunction,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { AccountAuthenticatorAbstraction } from "../../../src/transactions/authenticator/account.js";

const AUTH_FN = "0x1::permissioned_delegation::authenticate";

function makeSimpleTransaction(sender: AccountAddress): SimpleTransaction {
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  const entry = new EntryFunction(moduleId, new Identifier("transfer"), [], []);
  const payload = new TransactionPayloadEntryFunction(entry);
  const raw = new RawTransaction(sender, 0n, payload, 1000n, 100n, 999999n, new ChainId(4));
  return new SimpleTransaction(raw);
}

describe("account/AbstractedAccount", () => {
  it("rejects an invalid authentication function at construction", () => {
    expect(
      () =>
        new AbstractedAccount({
          accountAddress: AccountAddress.ONE,
          authenticationFunction: "not-a-move-function-id",
          signer: () => new Uint8Array(),
        }),
    ).toThrow("Invalid authentication function not-a-move-function-id passed into AbstractedAccount");
  });

  it("fromPermissionedSigner wraps an Ed25519 signer with the built-in auth function", () => {
    const ed25519 = Ed25519Account.generate();
    const abstracted = AbstractedAccount.fromPermissionedSigner({ signer: ed25519 });

    expect(abstracted.authenticationFunction).toBe(AUTH_FN);
    expect(abstracted.accountAddress.toString()).toBe(ed25519.accountAddress.toString());
    expect(abstracted.publicKey.accountAddress.toString()).toBe(ed25519.accountAddress.toString());
  });

  it("sign returns an AbstractSignature produced by the signer closure", () => {
    const digest = new Uint8Array([9, 9, 9]);
    const account = new AbstractedAccount({
      accountAddress: AccountAddress.ONE,
      authenticationFunction: AUTH_FN,
      signer: () => digest,
    });

    const signature = account.sign(digest);
    expect(signature).toBeInstanceOf(AbstractSignature);
    expect(Array.from(signature.value)).toEqual(Array.from(digest));
  });

  it("setSigner replaces the signing closure", () => {
    const account = new AbstractedAccount({
      accountAddress: AccountAddress.ONE,
      authenticationFunction: AUTH_FN,
      signer: () => new Uint8Array([1]),
    });

    account.setSigner(() => "0x02");
    expect(Array.from(account.sign(new Uint8Array()).value)).toEqual([2]);
  });

  it("signTransactionWithAuthenticator returns an abstraction authenticator", () => {
    const ed25519 = Ed25519Account.generate();
    const abstracted = AbstractedAccount.fromPermissionedSigner({ signer: ed25519 });
    const txn = makeSimpleTransaction(abstracted.accountAddress);

    const authenticator = abstracted.signTransactionWithAuthenticator(txn);

    expect(authenticator).toBeInstanceOf(AccountAuthenticatorAbstraction);
    expect(authenticator.functionInfo).toBe(AUTH_FN);
    expect(authenticator.signingMessageDigest.toString()).toMatch(/^0x[0-9a-f]+$/);
    expect(authenticator.abstractionSignature).toBeInstanceOf(Uint8Array);
    expect(authenticator.abstractionSignature.length).toBeGreaterThan(0);
  });
});
