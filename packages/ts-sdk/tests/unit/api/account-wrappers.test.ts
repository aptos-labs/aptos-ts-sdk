// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Thin-wrapper coverage for src/api/account.ts — each public method forwards
 * to internal/account (or view) with aptosConfig / indexer waits plumbed in.
 */

import { beforeEach, afterEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account as AccountModule } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";
import { ProcessorType } from "../../../src/utils/const.js";

vi.mock("../../../src/internal/account.js", () => ({
  getInfo: vi.fn(),
  getModules: vi.fn(),
  getModulesPage: vi.fn(),
  getModule: vi.fn(),
  getTransactions: vi.fn(),
  getResources: vi.fn(),
  getResourcesPage: vi.fn(),
  getResource: vi.fn(),
  lookupOriginalAccountAddress: vi.fn(),
  getAccountTokensCount: vi.fn(),
  getAccountOwnedTokens: vi.fn(),
  getAccountOwnedTokensFromCollectionAddress: vi.fn(),
  getAccountCollectionsWithOwnedTokens: vi.fn(),
  getAccountTransactionsCount: vi.fn(),
  getAccountCoinsData: vi.fn(),
  getAccountCoinsCount: vi.fn(),
  getBalance: vi.fn(),
  getAccountOwnedObjects: vi.fn(),
  deriveAccountFromPrivateKey: vi.fn(),
  deriveOwnedAccountsFromSigner: vi.fn(),
  getAccountsForPublicKey: vi.fn(),
}));
vi.mock("../../../src/api/utils.js", () => ({
  waitForIndexerOnVersion: vi.fn(),
}));
vi.mock("../../../src/internal/view.js", () => ({
  view: vi.fn(),
}));

import { Account } from "../../../src/api/account.js";
import {
  getInfo,
  getModules,
  getModulesPage,
  getModule,
  getTransactions,
  getResources,
  getResourcesPage,
  getResource,
  lookupOriginalAccountAddress,
  getAccountTokensCount,
  getAccountOwnedTokens,
  getAccountOwnedTokensFromCollectionAddress,
  getAccountCollectionsWithOwnedTokens,
  getAccountTransactionsCount,
  getAccountCoinsData,
  getAccountCoinsCount,
  getBalance,
  getAccountOwnedObjects,
  deriveAccountFromPrivateKey,
  deriveOwnedAccountsFromSigner,
  getAccountsForPublicKey,
} from "../../../src/internal/account.js";
import { waitForIndexerOnVersion } from "../../../src/api/utils.js";
import { view } from "../../../src/internal/view.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { APTOS_COIN } from "../../../src/utils/const.js";

const config = new AptosConfig({ network: Network.LOCAL });
const api = new Account(config);
const ADDR = "0x1";
const FA_ADDR = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

const mockedWait = waitForIndexerOnVersion as MockedFunction<typeof waitForIndexerOnVersion>;
const mockedView = view as MockedFunction<typeof view>;

beforeEach(() => {
  vi.clearAllMocks();
  clearMemoizeCache();
  mockedWait.mockResolvedValue(undefined);
});

afterEach(() => {
  clearMemoizeCache();
});

describe("api/Account", () => {
  it("constructor stores config and exposes abstraction", () => {
    expect(api.config).toBe(config);
    expect(api.abstraction.config).toBe(config);
  });

  it("getAccountInfo forwards aptosConfig", async () => {
    (getInfo as MockedFunction<typeof getInfo>).mockResolvedValue({ sequence_number: "0" } as never);
    const result = await api.getAccountInfo({ accountAddress: ADDR });
    expect(result.sequence_number).toBe("0");
    expect(getInfo).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountModules forwards args", async () => {
    (getModules as MockedFunction<typeof getModules>).mockResolvedValue([] as never);
    await api.getAccountModules({ accountAddress: ADDR, options: { limit: 3 } });
    expect(getModules).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR, options: { limit: 3 } });
  });

  it("getAccountModulesPage forwards args", async () => {
    (getModulesPage as MockedFunction<typeof getModulesPage>).mockResolvedValue({ modules: [], cursor: undefined });
    await api.getAccountModulesPage({ accountAddress: ADDR });
    expect(getModulesPage).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountModule forwards args", async () => {
    (getModule as MockedFunction<typeof getModule>).mockResolvedValue({} as never);
    await api.getAccountModule({ accountAddress: ADDR, moduleName: "coin" });
    expect(getModule).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR, moduleName: "coin" });
  });

  it("getAccountTransactions forwards args", async () => {
    (getTransactions as MockedFunction<typeof getTransactions>).mockResolvedValue([] as never);
    await api.getAccountTransactions({ accountAddress: ADDR });
    expect(getTransactions).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountResources forwards args", async () => {
    (getResources as MockedFunction<typeof getResources>).mockResolvedValue([] as never);
    await api.getAccountResources({ accountAddress: ADDR });
    expect(getResources).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountResourcesPage forwards args", async () => {
    (getResourcesPage as MockedFunction<typeof getResourcesPage>).mockResolvedValue({
      resources: [],
      cursor: undefined,
    });
    await api.getAccountResourcesPage({ accountAddress: ADDR });
    expect(getResourcesPage).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountResource forwards args", async () => {
    (getResource as MockedFunction<typeof getResource>).mockResolvedValue({ x: 1 } as never);
    const result = await api.getAccountResource<{ x: number }>({
      accountAddress: ADDR,
      resourceType: "0x1::account::Account",
    });
    expect(result).toEqual({ x: 1 });
    expect(getResource).toHaveBeenCalledWith({
      aptosConfig: config,
      accountAddress: ADDR,
      resourceType: "0x1::account::Account",
    });
  });

  it("lookupOriginalAccountAddress forwards args", async () => {
    (lookupOriginalAccountAddress as MockedFunction<typeof lookupOriginalAccountAddress>).mockResolvedValue(
      AccountAddress.A,
    );
    const result = await api.lookupOriginalAccountAddress({ authenticationKey: ADDR });
    expect(result).toBe(AccountAddress.A);
    expect(lookupOriginalAccountAddress).toHaveBeenCalledWith({ aptosConfig: config, authenticationKey: ADDR });
  });

  it("getAccountTokensCount waits for indexer then forwards", async () => {
    (getAccountTokensCount as MockedFunction<typeof getAccountTokensCount>).mockResolvedValue(5);
    const count = await api.getAccountTokensCount({ accountAddress: ADDR, minimumLedgerVersion: 10n });
    expect(count).toBe(5);
    expect(mockedWait).toHaveBeenCalledWith({
      config,
      minimumLedgerVersion: 10n,
      processorType: ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR,
    });
    expect(getAccountTokensCount).toHaveBeenCalledWith({
      aptosConfig: config,
      accountAddress: ADDR,
      minimumLedgerVersion: 10n,
    });
  });

  it("getAccountOwnedTokens waits for indexer then forwards", async () => {
    (getAccountOwnedTokens as MockedFunction<typeof getAccountOwnedTokens>).mockResolvedValue([] as never);
    await api.getAccountOwnedTokens({ accountAddress: ADDR });
    expect(mockedWait).toHaveBeenCalled();
    expect(getAccountOwnedTokens).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountOwnedTokensFromCollectionAddress waits for indexer then forwards", async () => {
    (
      getAccountOwnedTokensFromCollectionAddress as MockedFunction<typeof getAccountOwnedTokensFromCollectionAddress>
    ).mockResolvedValue([] as never);
    await api.getAccountOwnedTokensFromCollectionAddress({
      accountAddress: ADDR,
      collectionAddress: "0x2",
    });
    expect(getAccountOwnedTokensFromCollectionAddress).toHaveBeenCalledWith({
      aptosConfig: config,
      accountAddress: ADDR,
      collectionAddress: "0x2",
    });
  });

  it("getAccountCollectionsWithOwnedTokens waits for indexer then forwards", async () => {
    (
      getAccountCollectionsWithOwnedTokens as MockedFunction<typeof getAccountCollectionsWithOwnedTokens>
    ).mockResolvedValue([] as never);
    await api.getAccountCollectionsWithOwnedTokens({ accountAddress: ADDR });
    expect(getAccountCollectionsWithOwnedTokens).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountTransactionsCount waits for indexer then forwards", async () => {
    (getAccountTransactionsCount as MockedFunction<typeof getAccountTransactionsCount>).mockResolvedValue(1);
    expect(await api.getAccountTransactionsCount({ accountAddress: ADDR })).toBe(1);
    expect(getAccountTransactionsCount).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountCoinsData waits for indexer then forwards", async () => {
    (getAccountCoinsData as MockedFunction<typeof getAccountCoinsData>).mockResolvedValue([] as never);
    await api.getAccountCoinsData({ accountAddress: ADDR });
    expect(getAccountCoinsData).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("getAccountCoinsCount waits for indexer then forwards", async () => {
    (getAccountCoinsCount as MockedFunction<typeof getAccountCoinsCount>).mockResolvedValue(2);
    expect(await api.getAccountCoinsCount({ accountAddress: ADDR })).toBe(2);
  });

  it("getAccountAPTAmount delegates to getAccountCoinAmount with APT constants", async () => {
    mockedView.mockResolvedValue(["100"] as never);
    const amount = await api.getAccountAPTAmount({ accountAddress: ADDR });
    expect(amount).toBe(100);
    expect(mockedView).toHaveBeenCalled();
  });

  it("getAccountCoinAmount uses view for coin balance when coinType is known", async () => {
    mockedView.mockResolvedValue(["42"] as never);
    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      coinType: "0x1::aptos_coin::AptosCoin",
    });
    expect(amount).toBe(42);
    expect(mockedView).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        payload: expect.objectContaining({ function: "0x1::coin::balance" }),
      }),
    );
  });

  it("getAccountCoinAmount resolves paired coin type from faMetadataAddress then queries coin::balance", async () => {
    mockedView
      .mockResolvedValueOnce([
        {
          vec: [
            {
              account_address: "0x1",
              module_name: "0x6170746f735f636f696e",
              struct_name: "0x4170746f73436f696e",
            },
          ],
        },
      ] as never)
      .mockResolvedValueOnce(["55"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      faMetadataAddress: FA_ADDR,
    });

    expect(amount).toBe(55);
    expect(mockedView).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        payload: expect.objectContaining({ function: "0x1::coin::paired_coin" }),
      }),
    );
    expect(mockedView).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        payload: expect.objectContaining({ function: "0x1::coin::balance" }),
      }),
    );
  });

  it("getAccountCoinAmount uses primary_fungible_store::balance when no coin mapping exists", async () => {
    mockedView.mockResolvedValueOnce([{ vec: [] }] as never).mockResolvedValueOnce(["12"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      faMetadataAddress: FA_ADDR,
    });

    expect(amount).toBe(12);
    expect(mockedView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ function: "0x1::primary_fungible_store::balance" }),
      }),
    );
  });

  it("getAccountCoinAmount maps 0xA fa metadata to APTOS_COIN for balance lookup", async () => {
    mockedView.mockResolvedValueOnce([{ vec: [] }] as never).mockResolvedValueOnce(["99"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      faMetadataAddress: AccountAddress.A,
    });

    expect(amount).toBe(99);
    expect(mockedView).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          function: "0x1::coin::balance",
          typeArguments: [APTOS_COIN],
        }),
      }),
    );
  });

  it("getAccountCoinAmount derives FA metadata from a non-APT coin type", async () => {
    mockedView.mockResolvedValue(["33"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      coinType: "0xface::coin::FakeCoin",
    });

    expect(amount).toBe(33);
    expect(mockedView).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          function: "0x1::coin::balance",
          typeArguments: ["0xface::coin::FakeCoin"],
        }),
      }),
    );
  });

  it("getAccountCoinAmount ignores non-struct paired_coin entries", async () => {
    mockedView
      .mockResolvedValueOnce([{ vec: ["0x1::aptos_coin::AptosCoin"] }] as never)
      .mockResolvedValueOnce(["6"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      faMetadataAddress: FA_ADDR,
    });

    expect(amount).toBe(6);
    expect(mockedView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ function: "0x1::primary_fungible_store::balance" }),
      }),
    );
  });

  it("getAccountCoinAmount falls back to FA balance when paired_coin lookup fails", async () => {
    mockedView.mockRejectedValueOnce(new Error("paired coin view failed")).mockResolvedValueOnce(["8"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      faMetadataAddress: FA_ADDR,
    });

    expect(amount).toBe(8);
    expect(mockedView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ function: "0x1::primary_fungible_store::balance" }),
      }),
    );
  });

  it("getAccountCoinAmount forwards both coinType and faMetadataAddress to the balance view", async () => {
    mockedView.mockResolvedValue(["77"] as never);

    const amount = await api.getAccountCoinAmount({
      accountAddress: ADDR,
      coinType: APTOS_COIN,
      faMetadataAddress: FA_ADDR,
    });

    expect(amount).toBe(77);
    expect(mockedView).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          function: "0x1::coin::balance",
          typeArguments: [APTOS_COIN],
        }),
      }),
    );
  });

  it("getAccountCoinAmount throws when neither coinType nor faMetadataAddress is provided", async () => {
    await expect(api.getAccountCoinAmount({ accountAddress: ADDR })).rejects.toThrow(
      /Either coinType, faMetadataAddress, or both must be provided/,
    );
  });

  it("getBalance forwards to internal getBalance", async () => {
    (getBalance as MockedFunction<typeof getBalance>).mockResolvedValue(9);
    expect(await api.getBalance({ accountAddress: ADDR, asset: "0x1::aptos_coin::AptosCoin" })).toBe(9);
    expect(getBalance).toHaveBeenCalledWith({
      aptosConfig: config,
      accountAddress: ADDR,
      asset: "0x1::aptos_coin::AptosCoin",
    });
  });

  it("getAccountOwnedObjects waits for default processor then forwards", async () => {
    (getAccountOwnedObjects as MockedFunction<typeof getAccountOwnedObjects>).mockResolvedValue([] as never);
    await api.getAccountOwnedObjects({ accountAddress: ADDR });
    expect(mockedWait).toHaveBeenCalledWith(expect.objectContaining({ processorType: ProcessorType.DEFAULT }));
    expect(getAccountOwnedObjects).toHaveBeenCalledWith({ aptosConfig: config, accountAddress: ADDR });
  });

  it("deriveAccountFromPrivateKey waits for indexer twice then forwards", async () => {
    const account = AccountModule.generate();
    (deriveAccountFromPrivateKey as MockedFunction<typeof deriveAccountFromPrivateKey>).mockResolvedValue(account);
    const pk = account.privateKey;
    const result = await api.deriveAccountFromPrivateKey({ privateKey: pk });
    expect(result).toBe(account);
    expect(mockedWait).toHaveBeenCalledTimes(2);
    expect(deriveAccountFromPrivateKey).toHaveBeenCalledWith({ aptosConfig: config, privateKey: pk });
  });

  it("deriveOwnedAccountsFromSigner waits for indexer twice then forwards", async () => {
    const account = AccountModule.generate();
    (deriveOwnedAccountsFromSigner as MockedFunction<typeof deriveOwnedAccountsFromSigner>).mockResolvedValue([
      account,
    ]);
    const result = await api.deriveOwnedAccountsFromSigner({ signer: account });
    expect(result).toEqual([account]);
    expect(deriveOwnedAccountsFromSigner).toHaveBeenCalledWith({ aptosConfig: config, signer: account });
  });

  it("getAccountsForPublicKey waits for indexer twice then forwards", async () => {
    (getAccountsForPublicKey as MockedFunction<typeof getAccountsForPublicKey>).mockResolvedValue([] as never);
    await api.getAccountsForPublicKey({ publicKey: AccountModule.generate().publicKey });
    expect(getAccountsForPublicKey).toHaveBeenCalledWith(expect.objectContaining({ aptosConfig: config }));
  });
});
