// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { APTOS_COIN } from "../../../src/utils/const.js";
import { TypeTagAddress, TypeTagU64 } from "../../../src/transactions/index.js";

// Mock the one-layer-down dependency. transferCoinTransaction is a thin
// wrapper over generateTransaction; its job is purely to plumb arguments and
// supply the right ABI. Mocking generateTransaction lets us assert *exactly*
// what transferCoinTransaction passes downstream, which is the meaningful
// signal — the wrapper layer's own behavior.
vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { transferCoinTransaction } from "../../../src/internal/coin.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("internal/coin.transferCoinTransaction", () => {
  const sender = Account.generate();
  const recipient = Account.generate();
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });

  beforeEach(() => {
    mockedGenerateTransaction.mockReset();
    mockedGenerateTransaction.mockResolvedValue("SENTINEL_TXN" as never);
  });

  it("forwards aptosConfig and sender, returns whatever generateTransaction returns", async () => {
    const result = await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1234n,
    });

    // Pass-through return value.
    expect(result).toBe("SENTINEL_TXN");

    expect(mockedGenerateTransaction).toHaveBeenCalledTimes(1);
    const call = mockedGenerateTransaction.mock.calls[0][0];
    expect(call.aptosConfig).toBe(aptosConfig);
    expect(call.sender).toBe(sender.accountAddress);
  });

  it("targets 0x1::aptos_account::transfer_coins with the recipient + amount as positional args", async () => {
    await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1234n,
    });

    const data = mockedGenerateTransaction.mock.calls[0][0].data as {
      function: string;
      typeArguments: string[];
      functionArguments: unknown[];
    };
    expect(data.function).toBe("0x1::aptos_account::transfer_coins");
    expect(data.functionArguments).toEqual([recipient.accountAddress, 1234n]);
  });

  it("defaults the coin type to APTOS_COIN when coinType is omitted", async () => {
    await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1n,
    });

    const data = mockedGenerateTransaction.mock.calls[0][0].data as { typeArguments: string[] };
    expect(data.typeArguments).toEqual([APTOS_COIN]);
  });

  it("honors a custom coinType string when provided", async () => {
    const custom = "0xcafe::custom_coin::CustomCoin" as const;
    await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1n,
      coinType: custom,
    });

    const data = mockedGenerateTransaction.mock.calls[0][0].data as { typeArguments: string[] };
    expect(data.typeArguments).toEqual([custom]);
  });

  it("supplies a fixed ABI so the builder skips the remote-ABI fetch (saves a fullnode call)", async () => {
    await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1n,
    });

    const data = mockedGenerateTransaction.mock.calls[0][0].data as {
      abi?: { typeParameters: unknown[]; parameters: unknown[] };
    };
    expect(data.abi).toBeDefined();
    // 0x1::aptos_account::transfer_coins has one type parameter (the coin
    // type) and two value parameters (recipient: address, amount: u64).
    expect(data.abi!.typeParameters).toHaveLength(1);
    expect(data.abi!.parameters).toHaveLength(2);
    expect(data.abi!.parameters[0]).toBeInstanceOf(TypeTagAddress);
    expect(data.abi!.parameters[1]).toBeInstanceOf(TypeTagU64);
  });

  it("passes options through verbatim", async () => {
    const options = { maxGasAmount: 9_000, gasUnitPrice: 100 };
    await transferCoinTransaction({
      aptosConfig,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1n,
      options,
    });

    expect(mockedGenerateTransaction.mock.calls[0][0].options).toBe(options);
  });
});
