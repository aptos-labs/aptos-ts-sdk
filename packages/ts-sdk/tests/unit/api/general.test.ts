// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Shim tests for the General API class. Each public method forwards to
 * internal/* with `aptosConfig: this.config` spread in. We mock the internals
 * so the test isolates the wrapper's argument plumbing; if a future change
 * drops `args` or fails to inject config, the test will catch it.
 */

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { ProcessorType } from "../../../src/utils/const.js";

vi.mock("../../../src/internal/general.js", () => ({
  getChainTopUserTransactions: vi.fn(),
  getIndexerLastSuccessVersion: vi.fn(),
  getLedgerInfo: vi.fn(),
  getProcessorStatus: vi.fn(),
  queryIndexer: vi.fn(),
}));
vi.mock("../../../src/internal/transaction.js", () => ({
  getBlockByHeight: vi.fn(),
  getBlockByVersion: vi.fn(),
}));
vi.mock("../../../src/internal/view.js", () => ({
  view: vi.fn(),
  viewJson: vi.fn(),
}));

import { General } from "../../../src/api/general.js";
import {
  getChainTopUserTransactions,
  getIndexerLastSuccessVersion,
  getLedgerInfo,
  getProcessorStatus,
  queryIndexer,
} from "../../../src/internal/general.js";
import { getBlockByHeight, getBlockByVersion } from "../../../src/internal/transaction.js";
import { view, viewJson } from "../../../src/internal/view.js";

const mocked = {
  getChainTopUserTransactions: getChainTopUserTransactions as MockedFunction<typeof getChainTopUserTransactions>,
  getIndexerLastSuccessVersion: getIndexerLastSuccessVersion as MockedFunction<typeof getIndexerLastSuccessVersion>,
  getLedgerInfo: getLedgerInfo as MockedFunction<typeof getLedgerInfo>,
  getProcessorStatus: getProcessorStatus as MockedFunction<typeof getProcessorStatus>,
  queryIndexer: queryIndexer as MockedFunction<typeof queryIndexer>,
  getBlockByHeight: getBlockByHeight as MockedFunction<typeof getBlockByHeight>,
  getBlockByVersion: getBlockByVersion as MockedFunction<typeof getBlockByVersion>,
  view: view as MockedFunction<typeof view>,
  viewJson: viewJson as MockedFunction<typeof viewJson>,
};

const config = new AptosConfig({ network: Network.LOCAL });

describe("api/general (General)", () => {
  let api: General;

  beforeEach(() => {
    api = new General(config);
    Object.values(mocked).forEach((m) => m.mockReset());
  });

  it("constructor stores the AptosConfig as readonly `config`", () => {
    expect(api.config).toBe(config);
  });

  it("getLedgerInfo forwards aptosConfig and returns the internal result", async () => {
    mocked.getLedgerInfo.mockResolvedValue({ chain_id: 4 } as never);
    const result = await api.getLedgerInfo();
    expect(result.chain_id).toBe(4);
    expect(mocked.getLedgerInfo).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("getChainId resolves from the LedgerInfo result", async () => {
    mocked.getLedgerInfo.mockResolvedValue({ chain_id: 42 } as never);
    expect(await api.getChainId()).toBe(42);
  });

  it("getBlockByVersion forwards ledgerVersion + options + aptosConfig", async () => {
    mocked.getBlockByVersion.mockResolvedValue({ block_height: "10" } as never);
    await api.getBlockByVersion({ ledgerVersion: 100, options: { withTransactions: true } });

    expect(mocked.getBlockByVersion).toHaveBeenCalledWith({
      aptosConfig: config,
      ledgerVersion: 100,
      options: { withTransactions: true },
    });
  });

  it("getBlockByHeight forwards blockHeight + options + aptosConfig", async () => {
    mocked.getBlockByHeight.mockResolvedValue({ block_height: "7" } as never);
    await api.getBlockByHeight({ blockHeight: 7 });

    expect(mocked.getBlockByHeight).toHaveBeenCalledWith({
      aptosConfig: config,
      blockHeight: 7,
    });
  });

  it("view forwards payload + options + aptosConfig", async () => {
    mocked.view.mockResolvedValue(["7"] as never);
    const payload = { function: "0x1::coin::balance" as const, typeArguments: [], functionArguments: [] };
    const result = await api.view({ payload });

    expect(result).toEqual(["7"]);
    expect(mocked.view).toHaveBeenCalledWith({ aptosConfig: config, payload });
  });

  it("viewJson forwards payload + options + aptosConfig", async () => {
    mocked.viewJson.mockResolvedValue(["x"] as never);
    const payload = { function: "0x1::chain_id::get" };
    await api.viewJson({ payload, options: { ledgerVersion: 1 } });

    expect(mocked.viewJson).toHaveBeenCalledWith({
      aptosConfig: config,
      payload,
      options: { ledgerVersion: 1 },
    });
  });

  it("getChainTopUserTransactions forwards limit + aptosConfig", async () => {
    mocked.getChainTopUserTransactions.mockResolvedValue([] as never);
    await api.getChainTopUserTransactions({ limit: 5 });

    expect(mocked.getChainTopUserTransactions).toHaveBeenCalledWith({ aptosConfig: config, limit: 5 });
  });

  it("queryIndexer forwards query + aptosConfig", async () => {
    mocked.queryIndexer.mockResolvedValue({ ok: true } as never);
    const query = { query: "query M { x }" };
    await api.queryIndexer({ query });

    expect(mocked.queryIndexer).toHaveBeenCalledWith({ aptosConfig: config, query });
  });

  it("getIndexerLastSuccessVersion forwards only aptosConfig", async () => {
    mocked.getIndexerLastSuccessVersion.mockResolvedValue(1n);
    expect(await api.getIndexerLastSuccessVersion()).toBe(1n);
    expect(mocked.getIndexerLastSuccessVersion).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("getProcessorStatus forwards processorType + aptosConfig", async () => {
    mocked.getProcessorStatus.mockResolvedValue({} as never);
    await api.getProcessorStatus(ProcessorType.DEFAULT);

    expect(mocked.getProcessorStatus).toHaveBeenCalledWith({
      aptosConfig: config,
      processorType: ProcessorType.DEFAULT,
    });
  });
});
