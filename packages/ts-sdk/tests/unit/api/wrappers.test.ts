// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Shim tests for thin API wrapper classes. Each method forwards to an
 * internal function with `aptosConfig: this.config` spread in. Mocking the
 * internals makes the test fast and isolates the wrapper's arg plumbing.
 */

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";

vi.mock("../../../src/internal/coin.js", () => ({
  transferCoinTransaction: vi.fn(),
}));
vi.mock("../../../src/internal/object.js", () => ({
  getObjectDataByObjectAddress: vi.fn(),
}));
vi.mock("../../../src/internal/faucet.js", () => ({
  fundAccount: vi.fn(),
}));
vi.mock("../../../src/internal/transaction.js", () => ({
  waitForIndexer: vi.fn(),
}));
vi.mock("../../../src/api/utils.js", () => ({
  waitForIndexerOnVersion: vi.fn(),
}));

import { Coin } from "../../../src/api/coin.js";
import { AptosObject } from "../../../src/api/object.js";
import { Faucet } from "../../../src/api/faucet.js";
import { transferCoinTransaction } from "../../../src/internal/coin.js";
import { getObjectDataByObjectAddress } from "../../../src/internal/object.js";
import { fundAccount } from "../../../src/internal/faucet.js";
import { waitForIndexer } from "../../../src/internal/transaction.js";
import { waitForIndexerOnVersion } from "../../../src/api/utils.js";

const mockedTransferCoin = transferCoinTransaction as MockedFunction<typeof transferCoinTransaction>;
const mockedGetObjectData = getObjectDataByObjectAddress as MockedFunction<typeof getObjectDataByObjectAddress>;
const mockedFundAccount = fundAccount as MockedFunction<typeof fundAccount>;
const mockedWaitForIndexer = waitForIndexer as MockedFunction<typeof waitForIndexer>;
const mockedWaitForIndexerOnVersion = waitForIndexerOnVersion as MockedFunction<typeof waitForIndexerOnVersion>;

const config = new AptosConfig({ network: Network.LOCAL });

describe("api/Coin", () => {
  beforeEach(() => {
    mockedTransferCoin.mockReset();
    mockedTransferCoin.mockResolvedValue("TXN" as never);
  });

  it("constructor stores config", () => {
    const coin = new Coin(config);
    expect(coin.config).toBe(config);
  });

  it("transferCoinTransaction forwards every arg + aptosConfig and returns the internal result", async () => {
    const sender = Account.generate();
    const recipient = Account.generate();
    const coin = new Coin(config);

    const result = await coin.transferCoinTransaction({
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1234n,
      coinType: "0xcafe::custom::Coin",
    });

    expect(result).toBe("TXN");
    expect(mockedTransferCoin).toHaveBeenCalledWith({
      aptosConfig: config,
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 1234n,
      coinType: "0xcafe::custom::Coin",
    });
  });
});

describe("api/AptosObject", () => {
  beforeEach(() => {
    mockedGetObjectData.mockReset();
    mockedGetObjectData.mockResolvedValue({ object_address: "0x1" } as never);
    mockedWaitForIndexerOnVersion.mockReset();
    mockedWaitForIndexerOnVersion.mockResolvedValue(undefined as never);
  });

  it("constructor stores config", () => {
    expect(new AptosObject(config).config).toBe(config);
  });

  it("getObjectDataByObjectAddress waits for indexer first, then forwards args", async () => {
    const aptosObject = new AptosObject(config);

    await aptosObject.getObjectDataByObjectAddress({
      objectAddress: "0xabc",
      minimumLedgerVersion: 50n,
    });

    expect(mockedWaitForIndexerOnVersion).toHaveBeenCalledTimes(1);
    // waitForIndexerOnVersion is called before the actual fetch.
    expect(mockedWaitForIndexerOnVersion).toHaveBeenCalledBefore(mockedGetObjectData as never);

    expect(mockedGetObjectData).toHaveBeenCalledWith({
      aptosConfig: config,
      objectAddress: "0xabc",
      minimumLedgerVersion: 50n,
    });
  });
});

describe("api/Faucet", () => {
  const fundedTxn = (version: string) =>
    ({
      type: "user_transaction",
      hash: "0xabc",
      version,
      success: true,
    }) as never;

  beforeEach(() => {
    mockedFundAccount.mockReset();
    mockedWaitForIndexer.mockReset();
  });

  it("constructor stores config", () => {
    expect(new Faucet(config).config).toBe(config);
  });

  it("fundAccount waits for indexer by default (waitForIndexer undefined)", async () => {
    mockedFundAccount.mockResolvedValue(fundedTxn("100"));
    mockedWaitForIndexer.mockResolvedValue(undefined as never);
    const faucet = new Faucet(config);

    await faucet.fundAccount({ accountAddress: "0xabc", amount: 100 });

    expect(mockedWaitForIndexer).toHaveBeenCalledTimes(1);
    expect(mockedWaitForIndexer).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        minimumLedgerVersion: 100n,
      }),
    );
  });

  it("fundAccount waits for indexer when waitForIndexer is explicitly true", async () => {
    mockedFundAccount.mockResolvedValue(fundedTxn("100"));
    mockedWaitForIndexer.mockResolvedValue(undefined as never);
    const faucet = new Faucet(config);

    await faucet.fundAccount({ accountAddress: "0xabc", amount: 100, options: { waitForIndexer: true } });
    expect(mockedWaitForIndexer).toHaveBeenCalledTimes(1);
  });

  it("fundAccount skips waitForIndexer when explicitly set to false", async () => {
    mockedFundAccount.mockResolvedValue(fundedTxn("100"));
    const faucet = new Faucet(config);

    const result = await faucet.fundAccount({
      accountAddress: "0xabc",
      amount: 100,
      options: { waitForIndexer: false },
    });

    expect(mockedWaitForIndexer).not.toHaveBeenCalled();
    expect(result.hash).toBe("0xabc");
  });

  it("fundAccount returns the fund transaction unchanged", async () => {
    mockedFundAccount.mockResolvedValue(fundedTxn("7"));
    mockedWaitForIndexer.mockResolvedValue(undefined as never);
    const faucet = new Faucet(config);

    const result = await faucet.fundAccount({ accountAddress: "0xabc", amount: 100 });

    expect(result.version).toBe("7");
  });
});
