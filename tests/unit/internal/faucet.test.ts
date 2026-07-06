// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { AccountAddress } from "../../../src/core/index.js";
import { TransactionResponseType, type UserTransactionResponse } from "../../../src/types/index.js";

vi.mock("../../../src/client/index.js", () => ({
  postAptosFaucet: vi.fn(),
}));

vi.mock("../../../src/internal/transaction.js", () => ({
  waitForTransaction: vi.fn(),
}));

import { postAptosFaucet } from "../../../src/client/index.js";
import { waitForTransaction } from "../../../src/internal/transaction.js";
import { fundAccount } from "../../../src/internal/faucet.js";

const mockedPostFaucet = postAptosFaucet as MockedFunction<typeof postAptosFaucet>;
const mockedWaitForTxn = waitForTransaction as MockedFunction<typeof waitForTransaction>;

const ACCOUNT = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const TXN_HASH = "0xfaucethash";

const userTxn = (overrides: Partial<UserTransactionResponse> = {}): UserTransactionResponse =>
  ({
    type: TransactionResponseType.User,
    hash: TXN_HASH,
    version: "42",
    success: true,
    ...overrides,
  }) as UserTransactionResponse;

describe("internal/faucet.fundAccount", () => {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });

  beforeEach(() => {
    mockedPostFaucet.mockReset();
    mockedWaitForTxn.mockReset();
  });

  it("POSTs fund request and waits for the first returned txn hash", async () => {
    mockedPostFaucet.mockResolvedValue({ data: { txn_hashes: [TXN_HASH] } } as never);
    mockedWaitForTxn.mockResolvedValue(userTxn());

    const result = await fundAccount({
      aptosConfig,
      accountAddress: ACCOUNT,
      amount: 1_000_000,
    });

    expect(result.hash).toBe(TXN_HASH);
    expect(mockedPostFaucet).toHaveBeenCalledWith({
      aptosConfig,
      path: "fund",
      body: {
        address: AccountAddress.from(ACCOUNT).toString(),
        amount: 1_000_000,
      },
      originMethod: "fundAccount",
    });
    expect(mockedWaitForTxn).toHaveBeenCalledWith({
      aptosConfig,
      transactionHash: TXN_HASH,
      options: {
        timeoutSecs: expect.any(Number),
        checkSuccess: undefined,
      },
    });
  });

  it("forwards waitForTransaction options when supplied", async () => {
    mockedPostFaucet.mockResolvedValue({ data: { txn_hashes: [TXN_HASH] } } as never);
    mockedWaitForTxn.mockResolvedValue(userTxn());

    await fundAccount({
      aptosConfig,
      accountAddress: ACCOUNT,
      amount: 100,
      options: { timeoutSecs: 30, checkSuccess: false },
    });

    expect(mockedWaitForTxn).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { timeoutSecs: 30, checkSuccess: false },
      }),
    );
  });

  it("throws when waitForTransaction returns a non-user transaction", async () => {
    mockedPostFaucet.mockResolvedValue({ data: { txn_hashes: [TXN_HASH] } } as never);
    mockedWaitForTxn.mockResolvedValue({
      type: TransactionResponseType.Pending,
      hash: TXN_HASH,
    } as never);

    await expect(fundAccount({ aptosConfig, accountAddress: ACCOUNT, amount: 100 })).rejects.toThrow(
      `Unexpected transaction received for fund account: ${TransactionResponseType.Pending}`,
    );
  });
});
