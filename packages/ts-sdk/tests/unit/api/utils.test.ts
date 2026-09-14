// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { ProcessorType } from "../../../src/utils/const.js";

vi.mock("../../../src/internal/transaction.js", () => ({
  waitForIndexer: vi.fn(),
}));

import { waitForIndexer } from "../../../src/internal/transaction.js";
import { waitForIndexerOnVersion } from "../../../src/api/utils.js";

const mockedWaitForIndexer = waitForIndexer as MockedFunction<typeof waitForIndexer>;

describe("api/utils.waitForIndexerOnVersion", () => {
  const config = new AptosConfig({ network: Network.LOCAL });

  beforeEach(() => {
    mockedWaitForIndexer.mockReset();
    mockedWaitForIndexer.mockResolvedValue(undefined);
  });

  it("delegates to waitForIndexer when minimumLedgerVersion is provided", async () => {
    await waitForIndexerOnVersion({
      config,
      minimumLedgerVersion: 500n,
      processorType: ProcessorType.DEFAULT,
    });

    expect(mockedWaitForIndexer).toHaveBeenCalledWith({
      aptosConfig: config,
      minimumLedgerVersion: 500n,
      processorType: ProcessorType.DEFAULT,
    });
  });

  it("is a no-op when minimumLedgerVersion is omitted", async () => {
    await waitForIndexerOnVersion({
      config,
      processorType: ProcessorType.ACCOUNT_TRANSACTIONS_PROCESSOR,
    });

    expect(mockedWaitForIndexer).not.toHaveBeenCalled();
  });
});
