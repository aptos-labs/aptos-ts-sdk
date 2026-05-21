// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";

vi.mock("../../../src/internal/account.js", () => ({
  getInfo: vi.fn(),
}));

import { AccountSequenceNumber } from "../../../src/transactions/management/accountSequenceNumber.js";
import { getInfo } from "../../../src/internal/account.js";

const mockedGetInfo = getInfo as MockedFunction<typeof getInfo>;

function makeAsn(
  account: Account,
  opts: Partial<{ maxWaitTime: number; maximumInFlight: number; sleepTime: number }> = {},
) {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });
  return new AccountSequenceNumber(
    aptosConfig,
    account,
    opts.maxWaitTime ?? 30,
    opts.maximumInFlight ?? 100,
    opts.sleepTime ?? 10,
  );
}

const accountInfo = (sequence_number: string) =>
  ({
    sequence_number,
    authentication_key: "0xaa",
  }) as never;

describe("AccountSequenceNumber", () => {
  const account = Account.generate();

  beforeEach(() => {
    mockedGetInfo.mockReset();
  });

  describe("initialize", () => {
    it("primes both currentNumber and lastUncommittedNumber from the on-chain sequence_number", async () => {
      mockedGetInfo.mockResolvedValueOnce(accountInfo("5"));
      const asn = makeAsn(account);

      await asn.initialize();

      expect(asn.currentNumber).toBe(5n);
      expect(asn.lastUncommittedNumber).toBe(5n);
      expect(mockedGetInfo).toHaveBeenCalledTimes(1);
      expect(mockedGetInfo).toHaveBeenCalledWith(expect.objectContaining({ accountAddress: account.accountAddress }));
    });
  });

  describe("update", () => {
    it("refreshes only lastUncommittedNumber and returns it", async () => {
      mockedGetInfo.mockResolvedValueOnce(accountInfo("7"));
      const asn = makeAsn(account);
      asn.currentNumber = 9n;
      asn.lastUncommittedNumber = 6n;

      const updated = await asn.update();

      expect(updated).toBe(7n);
      expect(asn.lastUncommittedNumber).toBe(7n);
      // currentNumber was NOT touched by update.
      expect(asn.currentNumber).toBe(9n);
    });
  });

  describe("nextSequenceNumber", () => {
    it("initializes on first call and returns the on-chain number, incrementing currentNumber", async () => {
      mockedGetInfo.mockResolvedValueOnce(accountInfo("10"));
      const asn = makeAsn(account);

      const next = await asn.nextSequenceNumber();

      expect(next).toBe(10n);
      expect(asn.currentNumber).toBe(11n);
      expect(asn.lastUncommittedNumber).toBe(10n);
      expect(mockedGetInfo).toHaveBeenCalledTimes(1);
    });

    it("returns sequential numbers without re-fetching when under the in-flight cap", async () => {
      mockedGetInfo.mockResolvedValueOnce(accountInfo("100"));
      // High in-flight cap means we won't hit the update/sleep loop.
      const asn = makeAsn(account, { maximumInFlight: 100 });

      const a = await asn.nextSequenceNumber();
      const b = await asn.nextSequenceNumber();
      const c = await asn.nextSequenceNumber();

      expect([a, b, c]).toEqual([100n, 101n, 102n]);
      // Only the initial fetch — subsequent calls stay local.
      expect(mockedGetInfo).toHaveBeenCalledTimes(1);
    });

    it("calls update() to refresh lastUncommittedNumber when in-flight cap is hit", async () => {
      // initialize: returns 0. The first 3 nextSequenceNumber calls take 0,1,2.
      // On the 4th call, currentNumber (3) - lastUncommittedNumber (0) == 3 ==
      // maximumInFlight, so update() is invoked. Have update() report seq=3
      // so we exit the while loop immediately and proceed.
      mockedGetInfo.mockResolvedValueOnce(accountInfo("0"));
      mockedGetInfo.mockResolvedValueOnce(accountInfo("3"));

      const asn = makeAsn(account, { maximumInFlight: 3, sleepTime: 1, maxWaitTime: 30 });

      const results: Array<bigint | null> = [];
      for (let i = 0; i < 4; i += 1) {
        results.push(await asn.nextSequenceNumber());
      }

      expect(results).toEqual([0n, 1n, 2n, 3n]);
      expect(mockedGetInfo).toHaveBeenCalledTimes(2);
    });
  });

  describe("synchronize", () => {
    it("returns immediately when lastUncommittedNumber already equals currentNumber", async () => {
      const asn = makeAsn(account);
      asn.currentNumber = 5n;
      asn.lastUncommittedNumber = 5n;

      await asn.synchronize();

      expect(mockedGetInfo).not.toHaveBeenCalled();
    });

    it("polls update() until lastUncommittedNumber catches up to currentNumber", async () => {
      // currentNumber stays at 5; updates climb 3 → 4 → 5.
      mockedGetInfo
        .mockResolvedValueOnce(accountInfo("3"))
        .mockResolvedValueOnce(accountInfo("4"))
        .mockResolvedValueOnce(accountInfo("5"));

      const asn = makeAsn(account, { sleepTime: 1, maxWaitTime: 30 });
      asn.currentNumber = 5n;
      asn.lastUncommittedNumber = 0n;

      await asn.synchronize();

      expect(asn.lastUncommittedNumber).toBe(5n);
      expect(mockedGetInfo).toHaveBeenCalledTimes(3);
    });
  });
});
