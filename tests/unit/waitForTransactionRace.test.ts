// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, type MockedFunction } from "vitest";
import { waitForTransaction, WaitForTransactionError, FailedTransactionError } from "../../src/internal/transaction.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";
import { TransactionResponseType, type TransactionResponse } from "../../src/types/index.js";
import { getAptosFullNode } from "../../src/client/index.js";

vi.mock("../../src/client", () => ({
  getAptosFullNode: vi.fn(),
}));

const mockedFetch = getAptosFullNode as unknown as MockedFunction<typeof getAptosFullNode>;

// A "settled" committed transaction: type === User and success/vm_status populated.
const settledTxn = (overrides: Partial<TransactionResponse> = {}): TransactionResponse =>
  ({
    type: TransactionResponseType.User,
    hash: "0xabc",
    version: "1",
    success: true,
    vm_status: "Executed successfully",
    sender: "0x1",
    sequence_number: "0",
    max_gas_amount: "200000",
    gas_unit_price: "100",
    gas_used: "10",
    expiration_timestamp_secs: "9999999999",
    payload: { type: "entry_function_payload" },
    events: [],
    changes: [],
    timestamp: "0",
    ...overrides,
  }) as unknown as TransactionResponse;

// Partial: type committed but the execution result hasn't been filled in.
// Mirrors the real-world devnet race we're guarding against.
const unsettledTxn = (): TransactionResponse =>
  ({
    type: TransactionResponseType.User,
    hash: "0xabc",
    // success and vm_status intentionally absent.
  }) as unknown as TransactionResponse;

const pendingTxn = (): TransactionResponse =>
  ({
    type: TransactionResponseType.Pending,
    hash: "0xabc",
  }) as unknown as TransactionResponse;

describe("waitForTransaction — indexer-lag race (Bug 1)", () => {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });
  const transactionHash = "0xabc";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("keeps polling when initial response is unsettled, then returns once populated", async () => {
    // 1st call (initial fetch): unsettled — type=User but success undefined.
    // 2nd call (polling loop): unsettled again.
    // 3rd call (polling loop): fully populated success=true.
    // longWaitForTransaction is not called because the initial fetch is not pending.
    mockedFetch
      .mockResolvedValueOnce({ data: unsettledTxn() } as any)
      .mockResolvedValueOnce({ data: unsettledTxn() } as any)
      .mockResolvedValueOnce({ data: settledTxn() } as any);

    const res = await waitForTransaction({
      aptosConfig,
      transactionHash,
      options: { timeoutSecs: 10 },
    });

    expect(res.type).toBe(TransactionResponseType.User);
    expect((res as { success: boolean }).success).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  test("real on-chain failure still throws FailedTransactionError", async () => {
    mockedFetch.mockResolvedValueOnce({
      data: settledTxn({ success: false, vm_status: "MOVE_ABORT" } as Partial<TransactionResponse>),
    } as any);

    await expect(
      waitForTransaction({ aptosConfig, transactionHash, options: { timeoutSecs: 5 } }),
    ).rejects.toBeInstanceOf(FailedTransactionError);
  });

  test("perpetually-unsettled response throws WaitForTransactionError with indexing-timeout message, not FailedTransactionError", async () => {
    // Every call returns an unsettled response — we never see success populated.
    mockedFetch.mockResolvedValue({ data: unsettledTxn() } as any);

    const err = await waitForTransaction({
      aptosConfig,
      transactionHash,
      options: { timeoutSecs: 1 },
    }).catch((e) => e);

    expect(err).toBeInstanceOf(WaitForTransactionError);
    expect(err).not.toBeInstanceOf(FailedTransactionError);
    expect(err.message).toMatch(/did not finish indexing/);
  });

  test("pending response routes through longWaitForTransaction and resolves once populated", async () => {
    // Initial fetch returns pending → triggers longWaitForTransaction (mocked as 2nd call) →
    // still pending → polling loop returns settled.
    mockedFetch
      .mockResolvedValueOnce({ data: pendingTxn() } as any)
      .mockResolvedValueOnce({ data: pendingTxn() } as any)
      .mockResolvedValueOnce({ data: settledTxn() } as any);

    const res = await waitForTransaction({
      aptosConfig,
      transactionHash,
      options: { timeoutSecs: 10 },
    });

    expect((res as { success: boolean }).success).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(3);
    // The long-wait path uses transactions/wait_by_hash; the initial and poll use transactions/by_hash.
    const paths = mockedFetch.mock.calls.map((c) => (c[0] as { path: string }).path);
    expect(paths[0]).toMatch(/transactions\/by_hash/);
    expect(paths[1]).toMatch(/transactions\/wait_by_hash/);
    expect(paths[2]).toMatch(/transactions\/by_hash/);
  });

  test("checkSuccess=false returns the settled response without throwing on success=false", async () => {
    mockedFetch.mockResolvedValueOnce({
      data: settledTxn({ success: false, vm_status: "MOVE_ABORT" } as Partial<TransactionResponse>),
    } as any);

    const res = await waitForTransaction({
      aptosConfig,
      transactionHash,
      options: { timeoutSecs: 5, checkSuccess: false },
    });

    expect((res as { success: boolean }).success).toBe(false);
  });
});
