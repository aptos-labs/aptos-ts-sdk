// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Shim tests for Staking, Table, and FungibleAsset API wrappers. Each
 * test mocks the internal function and asserts the wrapper forwards args
 * plus `aptosConfig: this.config`. waitForIndexerOnVersion is mocked so
 * the indexer-wait step is verified to fire before the data fetch.
 */

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";

vi.mock("../../../src/internal/staking.js", () => ({
  getNumberOfDelegators: vi.fn(),
  getNumberOfDelegatorsForAllPools: vi.fn(),
  getDelegatedStakingActivities: vi.fn(),
}));
vi.mock("../../../src/internal/table.js", () => ({
  getTableItem: vi.fn(),
  getTableItemsData: vi.fn(),
  getTableItemsMetadata: vi.fn(),
}));
vi.mock("../../../src/internal/fungibleAsset.js", () => ({
  getFungibleAssetMetadata: vi.fn(),
  getFungibleAssetActivities: vi.fn(),
  getCurrentFungibleAssetBalances: vi.fn(),
  transferFungibleAsset: vi.fn(),
}));
vi.mock("../../../src/api/utils.js", () => ({
  waitForIndexerOnVersion: vi.fn(),
}));

import { Staking } from "../../../src/api/staking.js";
import { Table } from "../../../src/api/table.js";
import { FungibleAsset } from "../../../src/api/fungibleAsset.js";
import {
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
  getDelegatedStakingActivities,
} from "../../../src/internal/staking.js";
import { getTableItem, getTableItemsData, getTableItemsMetadata } from "../../../src/internal/table.js";
import {
  getFungibleAssetMetadata,
  getFungibleAssetActivities,
  getCurrentFungibleAssetBalances,
  transferFungibleAsset,
} from "../../../src/internal/fungibleAsset.js";
import { waitForIndexerOnVersion } from "../../../src/api/utils.js";

const config = new AptosConfig({ network: Network.LOCAL });

const m = {
  getNumberOfDelegators: getNumberOfDelegators as MockedFunction<typeof getNumberOfDelegators>,
  getNumberOfDelegatorsForAllPools: getNumberOfDelegatorsForAllPools as MockedFunction<
    typeof getNumberOfDelegatorsForAllPools
  >,
  getDelegatedStakingActivities: getDelegatedStakingActivities as MockedFunction<typeof getDelegatedStakingActivities>,
  getTableItem: getTableItem as MockedFunction<typeof getTableItem>,
  getTableItemsData: getTableItemsData as MockedFunction<typeof getTableItemsData>,
  getTableItemsMetadata: getTableItemsMetadata as MockedFunction<typeof getTableItemsMetadata>,
  getFungibleAssetMetadata: getFungibleAssetMetadata as MockedFunction<typeof getFungibleAssetMetadata>,
  getFungibleAssetActivities: getFungibleAssetActivities as MockedFunction<typeof getFungibleAssetActivities>,
  getCurrentFungibleAssetBalances: getCurrentFungibleAssetBalances as MockedFunction<
    typeof getCurrentFungibleAssetBalances
  >,
  transferFungibleAsset: transferFungibleAsset as MockedFunction<typeof transferFungibleAsset>,
  waitForIndexerOnVersion: waitForIndexerOnVersion as MockedFunction<typeof waitForIndexerOnVersion>,
};

beforeEach(() => {
  Object.values(m).forEach((mm) => mm.mockReset());
  m.waitForIndexerOnVersion.mockResolvedValue(undefined as never);
});

describe("api/Staking", () => {
  const staking = new Staking(config);
  const POOL = Account.generate().accountAddress;
  const DELEGATOR = Account.generate().accountAddress;

  it("constructor stores config", () => {
    expect(staking.config).toBe(config);
  });

  it("getNumberOfDelegators waits for indexer then forwards args", async () => {
    m.getNumberOfDelegators.mockResolvedValue(3);

    const result = await staking.getNumberOfDelegators({ poolAddress: POOL, minimumLedgerVersion: 1n });

    expect(result).toBe(3);
    expect(m.waitForIndexerOnVersion).toHaveBeenCalledBefore(m.getNumberOfDelegators as never);
    expect(m.getNumberOfDelegators).toHaveBeenCalledWith({
      aptosConfig: config,
      poolAddress: POOL,
      minimumLedgerVersion: 1n,
    });
  });

  it("getNumberOfDelegatorsForAllPools accepts no args (the all-undefined branch)", async () => {
    m.getNumberOfDelegatorsForAllPools.mockResolvedValue([] as never);

    await staking.getNumberOfDelegatorsForAllPools();

    expect(m.waitForIndexerOnVersion).toHaveBeenCalledTimes(1);
    expect(m.getNumberOfDelegatorsForAllPools).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("getDelegatedStakingActivities forwards delegator + pool addresses", async () => {
    m.getDelegatedStakingActivities.mockResolvedValue([] as never);

    await staking.getDelegatedStakingActivities({ delegatorAddress: DELEGATOR, poolAddress: POOL });

    expect(m.getDelegatedStakingActivities).toHaveBeenCalledWith({
      aptosConfig: config,
      delegatorAddress: DELEGATOR,
      poolAddress: POOL,
    });
  });
});

describe("api/Table", () => {
  const table = new Table(config);

  it("getTableItem forwards args directly (no indexer wait — fullnode call)", async () => {
    m.getTableItem.mockResolvedValue({ value: 1 } as never);

    await table.getTableItem<{ value: number }>({
      handle: "0xH",
      data: { key_type: "u64", value_type: "u64", key: "1" },
    });

    // Unlike getTableItemsData / getTableItemsMetadata which hit the indexer,
    // getTableItem goes straight to the fullnode REST endpoint and therefore
    // does NOT wait for indexer sync.
    expect(m.waitForIndexerOnVersion).not.toHaveBeenCalled();
    expect(m.getTableItem).toHaveBeenCalledWith({
      aptosConfig: config,
      handle: "0xH",
      data: { key_type: "u64", value_type: "u64", key: "1" },
    });
  });

  it("getTableItemsData forwards options + aptosConfig", async () => {
    m.getTableItemsData.mockResolvedValue([] as never);

    await table.getTableItemsData({ options: { limit: 10 } });

    expect(m.getTableItemsData).toHaveBeenCalledWith({
      aptosConfig: config,
      options: { limit: 10 },
    });
  });

  it("getTableItemsMetadata forwards options + aptosConfig", async () => {
    m.getTableItemsMetadata.mockResolvedValue([] as never);

    await table.getTableItemsMetadata({ options: { limit: 5 } });

    expect(m.getTableItemsMetadata).toHaveBeenCalledWith({
      aptosConfig: config,
      options: { limit: 5 },
    });
  });
});

describe("api/FungibleAsset", () => {
  const fa = new FungibleAsset(config);

  it("getFungibleAssetMetadata: indexer wait + arg forwarding", async () => {
    m.getFungibleAssetMetadata.mockResolvedValue([] as never);

    await fa.getFungibleAssetMetadata({ minimumLedgerVersion: 1n });

    expect(m.waitForIndexerOnVersion).toHaveBeenCalledTimes(1);
    expect(m.getFungibleAssetMetadata).toHaveBeenCalledWith({
      aptosConfig: config,
      minimumLedgerVersion: 1n,
    });
  });

  it("getFungibleAssetActivities forwards args", async () => {
    m.getFungibleAssetActivities.mockResolvedValue([] as never);

    await fa.getFungibleAssetActivities({});

    expect(m.getFungibleAssetActivities).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("getCurrentFungibleAssetBalances forwards args", async () => {
    m.getCurrentFungibleAssetBalances.mockResolvedValue([] as never);

    await fa.getCurrentFungibleAssetBalances({});

    expect(m.getCurrentFungibleAssetBalances).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("transferFungibleAssetTransaction forwards args (no indexer wait — pure builder)", async () => {
    m.transferFungibleAsset.mockResolvedValue("TXN" as never);

    const sender = Account.generate();
    const recipient = Account.generate().accountAddress;
    const metadata = Account.generate().accountAddress;

    const result = await fa.transferFungibleAsset({
      sender,
      fungibleAssetMetadataAddress: metadata,
      recipient,
      amount: 100n,
    });

    expect(result).toBe("TXN");
    expect(m.transferFungibleAsset).toHaveBeenCalledWith({
      aptosConfig: config,
      sender,
      fungibleAssetMetadataAddress: metadata,
      recipient,
      amount: 100n,
    });
    // This wrapper is a pure transaction builder — no waitForIndexerOnVersion
    // call is expected.
    expect(m.waitForIndexerOnVersion).not.toHaveBeenCalled();
  });
});
