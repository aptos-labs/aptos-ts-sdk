// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Coverage for the simpler queries in src/internal/transaction.ts.
 * waitForTransaction has its own dedicated test (waitForTransactionRace.test.ts).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { AptosApiError } from "../../../src/errors/index.js";
import {
  getGasPriceEstimation,
  getTransactionByVersion,
  getTransactionByHash,
  isTransactionPending,
  longWaitForTransaction,
  getBlockByVersion,
  getBlockByHeight,
} from "../../../src/internal/transaction.js";
import { TransactionResponseType, type TransactionResponse } from "../../../src/types/index.js";

const gasEstimate = (
  overrides: Partial<{
    gas_estimate: number;
    deprioritized_gas_estimate: number;
    prioritized_gas_estimate: number;
  }> = {},
) => ({
  gas_estimate: 100,
  deprioritized_gas_estimate: 50,
  prioritized_gas_estimate: 200,
  ...overrides,
});

const userTxn = (overrides: Partial<TransactionResponse> = {}): TransactionResponse =>
  ({
    type: TransactionResponseType.User,
    hash: "0xabc",
    version: "42",
    sender: "0x1",
    sequence_number: "0",
    success: true,
    vm_status: "Executed successfully",
    ...overrides,
  }) as unknown as TransactionResponse;

describe("internal/transaction — basic queries", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  describe("getGasPriceEstimation", () => {
    it("returns the parsed estimate and memoizes per network", async () => {
      const mock = createMockClient();
      mock.setDefault({ data: gasEstimate() });

      const first = await getGasPriceEstimation({ aptosConfig: mock.config });
      const second = await getGasPriceEstimation({ aptosConfig: mock.config });

      expect(first.gas_estimate).toBe(100);
      expect(second).toEqual(first);
      // 5-minute memoize → only one HTTP call.
      expect(mock.requests).toHaveLength(1);
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getGasPriceEstimation",
        urlIncludes: "/estimate_gas_price",
      });
    });

    it("propagates AptosApiError on a 5xx response", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 503, statusText: "Service Unavailable", data: {} });

      await expect(getGasPriceEstimation({ aptosConfig: mock.config })).rejects.toBeInstanceOf(AptosApiError);
    });
  });

  describe("getTransactionByVersion", () => {
    it("GETs transactions/by_version/<v> and returns the parsed body", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: userTxn({ version: "100" }) });

      const result = await getTransactionByVersion({ aptosConfig: mock.config, ledgerVersion: 100 });

      expect(result.version).toBe("100");
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getTransactionByVersion",
        urlIncludes: "transactions/by_version/100",
      });
    });
  });

  describe("getTransactionByHash", () => {
    it("GETs transactions/by_hash/<hash> and returns the parsed body", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: userTxn() });

      const result = await getTransactionByHash({ aptosConfig: mock.config, transactionHash: "0xabc" });

      expect(result.hash).toBe("0xabc");
      expectRequest(mock.requests[0], {
        method: "GET",
        urlIncludes: "transactions/by_hash/0xabc",
      });
    });
  });

  describe("isTransactionPending", () => {
    it("returns true when the response type is Pending", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { type: TransactionResponseType.Pending, hash: "0xabc" } });

      const pending = await isTransactionPending({ aptosConfig: mock.config, transactionHash: "0xabc" });
      expect(pending).toBe(true);
    });

    it("returns false when the response type is committed (User)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: userTxn() });

      const pending = await isTransactionPending({ aptosConfig: mock.config, transactionHash: "0xabc" });
      expect(pending).toBe(false);
    });

    it("returns true on 404 (treats not-yet-indexed as pending)", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 404, statusText: "Not Found", data: {} });

      const pending = await isTransactionPending({ aptosConfig: mock.config, transactionHash: "0xabc" });
      expect(pending).toBe(true);
    });

    it("rethrows on non-404 errors", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 500, statusText: "Server Error", data: {} });

      await expect(isTransactionPending({ aptosConfig: mock.config, transactionHash: "0xabc" })).rejects.toBeInstanceOf(
        AptosApiError,
      );
    });
  });

  describe("longWaitForTransaction", () => {
    it("GETs transactions/wait_by_hash/<hash> and returns the parsed body", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: userTxn({ hash: "0xfeed" }) });

      const result = await longWaitForTransaction({ aptosConfig: mock.config, transactionHash: "0xfeed" });

      expect(result.hash).toBe("0xfeed");
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "longWaitForTransaction",
        urlIncludes: "transactions/wait_by_hash/0xfeed",
      });
    });
  });

  describe("getBlockByVersion / getBlockByHeight", () => {
    const blockResponse = {
      block_height: "10",
      block_hash: "0xbb",
      block_timestamp: "0",
      first_version: "100",
      last_version: "105",
      transactions: undefined,
    };

    it("getBlockByVersion: GETs blocks/by_version/<v> with with_transactions param", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: blockResponse });

      const result = await getBlockByVersion({ aptosConfig: mock.config, ledgerVersion: 100 });

      expect(result.block_height).toBe("10");
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getBlockByVersion",
        urlIncludes: "blocks/by_version/100",
      });
      expect(mock.requests[0]?.params).toEqual({ with_transactions: undefined });
    });

    it("getBlockByHeight: GETs blocks/by_height/<h>", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { ...blockResponse, block_height: "7" } });

      const result = await getBlockByHeight({ aptosConfig: mock.config, blockHeight: 7 });

      expect(result.block_height).toBe("7");
      expectRequest(mock.requests[0], {
        method: "GET",
        urlIncludes: "blocks/by_height/7",
      });
    });

    it("withTransactions: true forwards as a boolean URL param", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { ...blockResponse, transactions: [userTxn({ version: "100" })] } });

      await getBlockByVersion({
        aptosConfig: mock.config,
        ledgerVersion: 100,
        options: { withTransactions: true },
      });

      expect(mock.requests[0]?.params).toEqual({ with_transactions: true });
    });
  });
});
