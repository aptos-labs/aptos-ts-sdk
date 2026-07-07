// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import {
  EntryFunction,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { AccountAuthenticatorEd25519 } from "../../../src/transactions/authenticator/account.js";
import { validateFeePayerDataOnSubmission } from "../../../src/api/transactionSubmission/helpers.js";

function makeFeePayerTransaction(): SimpleTransaction {
  const sender = AccountAddress.ONE;
  const feePayer = Account.generate().accountAddress;
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  const entry = new EntryFunction(moduleId, new Identifier("transfer"), [], []);
  const payload = new TransactionPayloadEntryFunction(entry);
  const raw = new RawTransaction(sender, 0n, payload, 1000n, 100n, 999999n, new ChainId(4));
  return new SimpleTransaction(raw, feePayer);
}

describe("validateFeePayerDataOnSubmission", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const senderAuthenticator = new AccountAuthenticatorEd25519(
    Account.generate().publicKey,
    Account.generate().sign(new Uint8Array(32)),
  );

  it("throws when a fee payer transaction is submitted without a fee payer authenticator", () => {
    const transaction = makeFeePayerTransaction();

    expect(() =>
      validateFeePayerDataOnSubmission(config, {
        transaction,
        senderAuthenticator,
      }),
    ).toThrow("You are submitting a Fee Payer transaction but missing the feePayerAuthenticator");
  });

  it("allows fee payer transactions when the fee payer authenticator is present", () => {
    const transaction = makeFeePayerTransaction();
    const feePayerAuthenticator = new AccountAuthenticatorEd25519(
      Account.generate().publicKey,
      Account.generate().sign(new Uint8Array(32)),
    );

    expect(() =>
      validateFeePayerDataOnSubmission(config, {
        transaction,
        senderAuthenticator,
        feePayerAuthenticator,
      }),
    ).not.toThrow();
  });

  it("skips validation when aptosConfig defines a custom transaction submitter", () => {
    const customConfig = new AptosConfig({
      network: Network.LOCAL,
      pluginSettings: { TRANSACTION_SUBMITTER: async () => ({ hash: "0x1" }) as never },
    });
    const transaction = makeFeePayerTransaction();

    expect(() =>
      validateFeePayerDataOnSubmission(customConfig, {
        transaction,
        senderAuthenticator,
      }),
    ).not.toThrow();
  });

  it("skips validation when args include a per-request transaction submitter", () => {
    const transaction = makeFeePayerTransaction();

    expect(() =>
      validateFeePayerDataOnSubmission(config, {
        transaction,
        senderAuthenticator,
        transactionSubmitter: async () => ({ hash: "0x1" }) as never,
      }),
    ).not.toThrow();
  });
});
