// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
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

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  signTransaction: vi.fn(),
}));

import { signTransaction } from "../../../src/internal/transactionSubmission.js";
import { Sign } from "../../../src/api/transactionSubmission/sign.js";

const mockedSignTransaction = signTransaction as MockedFunction<typeof signTransaction>;

function makeSimpleTransaction(feePayer?: AccountAddress): SimpleTransaction {
  const sender = AccountAddress.ONE;
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  const entry = new EntryFunction(moduleId, new Identifier("transfer"), [], []);
  const payload = new TransactionPayloadEntryFunction(entry);
  const raw = new RawTransaction(sender, 0n, payload, 1000n, 100n, 999999n, new ChainId(4));
  return new SimpleTransaction(raw, feePayer);
}

describe("api/transactionSubmission/Sign", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const signer = Account.generate();
  const authenticator = new AccountAuthenticatorEd25519(signer.publicKey, signer.sign(new Uint8Array(32)));

  beforeEach(() => {
    mockedSignTransaction.mockReset();
    mockedSignTransaction.mockReturnValue(authenticator);
  });

  it("constructor stores config", () => {
    expect(new Sign(config).config).toBe(config);
  });

  it("transaction forwards signer and transaction to signTransaction", () => {
    const sign = new Sign(config);
    const transaction = makeSimpleTransaction();

    const result = sign.transaction({ signer, transaction });

    expect(result).toBe(authenticator);
    expect(mockedSignTransaction).toHaveBeenCalledWith({ signer, transaction });
  });

  it("transactionAsFeePayer sets feePayerAddress to the signer and signs", () => {
    const sign = new Sign(config);
    const sponsor = Account.generate();
    const transaction = makeSimpleTransaction(sponsor.accountAddress);

    const result = sign.transactionAsFeePayer({ signer: sponsor, transaction });

    expect(result).toBe(authenticator);
    expect(transaction.feePayerAddress?.toString()).toBe(sponsor.accountAddress.toString());
    expect(mockedSignTransaction).toHaveBeenCalledWith({ signer: sponsor, transaction });
  });

  it("transactionAsFeePayer throws when the transaction has no fee payer slot", () => {
    const sign = new Sign(config);
    const transaction = makeSimpleTransaction();

    expect(() => sign.transactionAsFeePayer({ signer, transaction })).toThrow(
      `Transaction ${transaction} is not a Fee Payer transaction`,
    );
  });
});
