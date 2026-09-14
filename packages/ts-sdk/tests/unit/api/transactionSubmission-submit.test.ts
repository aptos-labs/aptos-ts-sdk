// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { Submit } from "../../../src/api/transactionSubmission/submit.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import {
  EntryFunction,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  submitTransaction: vi.fn(),
}));

vi.mock("../../../src/api/transactionSubmission/helpers.js", () => ({
  validateFeePayerDataOnSubmission: vi.fn(),
}));

import { submitTransaction } from "../../../src/internal/transactionSubmission.js";
import { validateFeePayerDataOnSubmission } from "../../../src/api/transactionSubmission/helpers.js";
import { PendingTransactionResponse } from "../../../src/types/index.js";

const mockSubmit = submitTransaction as MockedFunction<typeof submitTransaction>;
const mockValidate = validateFeePayerDataOnSubmission as MockedFunction<typeof validateFeePayerDataOnSubmission>;

function makeSimpleTransaction(): SimpleTransaction {
  const sender = Account.generate();
  const moduleId = new ModuleId(sender.accountAddress, new Identifier("coin"));
  const payload = new TransactionPayloadEntryFunction(new EntryFunction(moduleId, new Identifier("transfer"), [], []));
  const raw = new RawTransaction(sender.accountAddress, 1n, payload, 1000n, 100n, 9_999_999n, new ChainId(4));
  return new SimpleTransaction(raw);
}

describe("api/transactionSubmission.Submit", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const submit = new Submit(config);
  const sender = Account.generate();
  const transaction = makeSimpleTransaction();
  const senderAuthenticator = sender.signTransactionWithAuthenticator(transaction);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit.mockResolvedValue({ hash: "0xsubmit" } as PendingTransactionResponse);
  });

  it("simple validates fee payer data then delegates to submitTransaction", async () => {
    const feePayer = Account.generate();
    const feePayerAuthenticator = feePayer.signTransactionWithAuthenticator(transaction);

    const response = await submit.simple({
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
    });

    expect(response.hash).toBe("0xsubmit");
    expect(mockValidate).toHaveBeenCalledWith(config, {
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
    });
    expect(mockSubmit).toHaveBeenCalledWith({
      aptosConfig: config,
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
    });
  });

  it("multiAgent forwards additional signer authenticators to submitTransaction", async () => {
    const secondary = Account.generate();
    const secondaryAuthenticator = secondary.signTransactionWithAuthenticator(transaction);

    const response = await submit.multiAgent({
      transaction,
      senderAuthenticator,
      additionalSignersAuthenticators: [secondaryAuthenticator],
    });

    expect(response.hash).toBe("0xsubmit");
    expect(mockValidate).toHaveBeenCalledWith(config, {
      transaction,
      senderAuthenticator,
      additionalSignersAuthenticators: [secondaryAuthenticator],
    });
    expect(mockSubmit).toHaveBeenCalledWith({
      aptosConfig: config,
      transaction,
      senderAuthenticator,
      additionalSignersAuthenticators: [secondaryAuthenticator],
    });
  });
});
