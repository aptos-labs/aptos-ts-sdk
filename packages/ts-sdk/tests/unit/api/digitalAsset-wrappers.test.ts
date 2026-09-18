// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Thin-wrapper coverage for src/api/digitalAsset.ts query + transaction methods.
 */

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { ProcessorType } from "../../../src/utils/const.js";

vi.mock("../../../src/internal/digitalAsset.js", () => ({
  getCollectionData: vi.fn(),
  getCollectionDataByCreatorAddressAndCollectionName: vi.fn(),
  getCollectionDataByCreatorAddress: vi.fn(),
  getCollectionDataByCollectionId: vi.fn(),
  getCollectionId: vi.fn(),
  getDigitalAssetData: vi.fn(),
  getCurrentDigitalAssetOwnership: vi.fn(),
  getOwnedDigitalAssets: vi.fn(),
  getDigitalAssetActivity: vi.fn(),
  createCollectionTransaction: vi.fn(),
  mintDigitalAssetTransaction: vi.fn(),
  transferDigitalAssetTransaction: vi.fn(),
  mintSoulBoundTransaction: vi.fn(),
  burnDigitalAssetTransaction: vi.fn(),
  freezeDigitalAssetTransferTransaction: vi.fn(),
  unfreezeDigitalAssetTransferTransaction: vi.fn(),
  setDigitalAssetDescriptionTransaction: vi.fn(),
  setDigitalAssetNameTransaction: vi.fn(),
  setDigitalAssetURITransaction: vi.fn(),
  addDigitalAssetPropertyTransaction: vi.fn(),
  removeDigitalAssetPropertyTransaction: vi.fn(),
  updateDigitalAssetPropertyTransaction: vi.fn(),
  addDigitalAssetTypedPropertyTransaction: vi.fn(),
  updateDigitalAssetTypedPropertyTransaction: vi.fn(),
}));
vi.mock("../../../src/api/utils.js", () => ({
  waitForIndexerOnVersion: vi.fn(),
}));

import { DigitalAsset } from "../../../src/api/digitalAsset.js";
import {
  getCollectionData,
  getCollectionDataByCreatorAddressAndCollectionName,
  getCollectionDataByCreatorAddress,
  getCollectionDataByCollectionId,
  getCollectionId,
  getDigitalAssetData,
  getCurrentDigitalAssetOwnership,
  getOwnedDigitalAssets,
  getDigitalAssetActivity,
  createCollectionTransaction,
  mintDigitalAssetTransaction,
  transferDigitalAssetTransaction,
  mintSoulBoundTransaction,
  burnDigitalAssetTransaction,
  freezeDigitalAssetTransferTransaction,
  unfreezeDigitalAssetTransferTransaction,
  setDigitalAssetDescriptionTransaction,
  setDigitalAssetNameTransaction,
  setDigitalAssetURITransaction,
  addDigitalAssetPropertyTransaction,
  removeDigitalAssetPropertyTransaction,
  updateDigitalAssetPropertyTransaction,
  addDigitalAssetTypedPropertyTransaction,
  updateDigitalAssetTypedPropertyTransaction,
} from "../../../src/internal/digitalAsset.js";
import { waitForIndexerOnVersion } from "../../../src/api/utils.js";

const config = new AptosConfig({ network: Network.LOCAL });
const api = new DigitalAsset(config);
const sender = Account.generate();
const CREATOR = "0x1";
const COLLECTION = "my-collection";
const TOKEN = Account.generate().accountAddress;
const SENTINEL = "TXN" as never;

const mockedWait = waitForIndexerOnVersion as MockedFunction<typeof waitForIndexerOnVersion>;

beforeEach(() => {
  vi.clearAllMocks();
  mockedWait.mockResolvedValue(undefined);
  for (const fn of [
    createCollectionTransaction,
    mintDigitalAssetTransaction,
    transferDigitalAssetTransaction,
    mintSoulBoundTransaction,
    burnDigitalAssetTransaction,
    freezeDigitalAssetTransferTransaction,
    unfreezeDigitalAssetTransferTransaction,
    setDigitalAssetDescriptionTransaction,
    setDigitalAssetNameTransaction,
    setDigitalAssetURITransaction,
    addDigitalAssetPropertyTransaction,
    removeDigitalAssetPropertyTransaction,
    updateDigitalAssetPropertyTransaction,
    addDigitalAssetTypedPropertyTransaction,
    updateDigitalAssetTypedPropertyTransaction,
  ]) {
    (fn as MockedFunction<typeof fn>).mockResolvedValue(SENTINEL);
  }
});

describe("api/DigitalAsset", () => {
  it("constructor stores config", () => {
    expect(api.config).toBe(config);
  });

  it("getCollectionData waits for token processor and builds where clause", async () => {
    (getCollectionData as MockedFunction<typeof getCollectionData>).mockResolvedValue([] as never);
    await api.getCollectionData({
      creatorAddress: CREATOR,
      collectionName: COLLECTION,
      minimumLedgerVersion: 5n,
      options: { tokenStandard: "v2" },
    });
    expect(mockedWait).toHaveBeenCalledWith({
      config,
      minimumLedgerVersion: 5n,
      processorType: ProcessorType.TOKEN_V2_PROCESSOR,
    });
    expect(getCollectionData).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        options: expect.objectContaining({
          where: expect.objectContaining({
            collection_name: { _eq: COLLECTION },
            token_standard: { _eq: "v2" },
          }),
        }),
      }),
    );
  });

  it("getCollectionDataByCreatorAddressAndCollectionName forwards args", async () => {
    (
      getCollectionDataByCreatorAddressAndCollectionName as MockedFunction<
        typeof getCollectionDataByCreatorAddressAndCollectionName
      >
    ).mockResolvedValue({} as never);
    await api.getCollectionDataByCreatorAddressAndCollectionName({
      creatorAddress: CREATOR,
      collectionName: COLLECTION,
    });
    expect(getCollectionDataByCreatorAddressAndCollectionName).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, creatorAddress: CREATOR, collectionName: COLLECTION }),
    );
  });

  it("getCollectionDataByCreatorAddress forwards args", async () => {
    (getCollectionDataByCreatorAddress as MockedFunction<typeof getCollectionDataByCreatorAddress>).mockResolvedValue(
      [] as never,
    );
    await api.getCollectionDataByCreatorAddress({ creatorAddress: CREATOR });
    expect(getCollectionDataByCreatorAddress).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, creatorAddress: CREATOR }),
    );
  });

  it("getCollectionDataByCollectionId forwards args", async () => {
    (getCollectionDataByCollectionId as MockedFunction<typeof getCollectionDataByCollectionId>).mockResolvedValue(
      {} as never,
    );
    await api.getCollectionDataByCollectionId({ collectionId: "0xabc" });
    expect(getCollectionDataByCollectionId).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, collectionId: "0xabc" }),
    );
  });

  it("getCollectionId forwards args", async () => {
    (getCollectionId as MockedFunction<typeof getCollectionId>).mockResolvedValue("0xID" as never);
    expect(await api.getCollectionId({ creatorAddress: CREATOR, collectionName: COLLECTION })).toBe("0xID");
  });

  it("getDigitalAssetData forwards args after indexer wait", async () => {
    (getDigitalAssetData as MockedFunction<typeof getDigitalAssetData>).mockResolvedValue({} as never);
    await api.getDigitalAssetData({ digitalAssetAddress: TOKEN });
    expect(getDigitalAssetData).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, digitalAssetAddress: TOKEN }),
    );
  });

  it("getCurrentDigitalAssetOwnership forwards args", async () => {
    (getCurrentDigitalAssetOwnership as MockedFunction<typeof getCurrentDigitalAssetOwnership>).mockResolvedValue(
      {} as never,
    );
    await api.getCurrentDigitalAssetOwnership({ digitalAssetAddress: TOKEN });
    expect(getCurrentDigitalAssetOwnership).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, digitalAssetAddress: TOKEN }),
    );
  });

  it("getOwnedDigitalAssets forwards args", async () => {
    (getOwnedDigitalAssets as MockedFunction<typeof getOwnedDigitalAssets>).mockResolvedValue([] as never);
    await api.getOwnedDigitalAssets({ ownerAddress: CREATOR });
    expect(getOwnedDigitalAssets).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, ownerAddress: CREATOR }),
    );
  });

  it("getDigitalAssetActivity forwards args", async () => {
    (getDigitalAssetActivity as MockedFunction<typeof getDigitalAssetActivity>).mockResolvedValue([] as never);
    await api.getDigitalAssetActivity({ digitalAssetAddress: TOKEN });
    expect(getDigitalAssetActivity).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, digitalAssetAddress: TOKEN }),
    );
  });

  it("createCollectionTransaction forwards sender + options", async () => {
    const options = { description: "desc", name: COLLECTION, uri: "https://x" };
    const result = await api.createCollectionTransaction({ sender, options, withFeePayer: true });
    expect(result).toBe(SENTINEL);
    expect(createCollectionTransaction).toHaveBeenCalledWith({
      aptosConfig: config,
      sender,
      options,
      withFeePayer: true,
    });
  });

  it("mintDigitalAssetTransaction forwards args", async () => {
    await api.mintDigitalAssetTransaction({
      sender,
      collection: COLLECTION,
      description: "d",
      name: "n",
      uri: "u",
      withFeePayer: true,
    });
    expect(mintDigitalAssetTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, sender, collection: COLLECTION, withFeePayer: true }),
    );
  });

  it("transferDigitalAssetTransaction forwards args", async () => {
    const recipient = Account.generate();
    await api.transferDigitalAssetTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      recipient: recipient.accountAddress,
      withFeePayer: true,
    });
    expect(transferDigitalAssetTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        sender,
        digitalAssetAddress: TOKEN,
        recipient: recipient.accountAddress,
        withFeePayer: true,
      }),
    );
  });

  it("mintSoulBoundTransaction forwards args", async () => {
    await api.mintSoulBoundTransaction({
      sender,
      collection: COLLECTION,
      description: "d",
      name: "n",
      uri: "u",
      recipient: CREATOR,
      withFeePayer: true,
    });
    expect(mintSoulBoundTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, sender, withFeePayer: true }),
    );
  });

  it("burnDigitalAssetTransaction forwards args", async () => {
    await api.burnDigitalAssetTransaction({ sender, digitalAssetAddress: TOKEN, withFeePayer: true });
    expect(burnDigitalAssetTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, sender, digitalAssetAddress: TOKEN, withFeePayer: true }),
    );
  });

  it("freezeDigitalAssetTransaferTransaction forwards args (typo preserved in API)", async () => {
    await api.freezeDigitalAssetTransaferTransaction({ sender, digitalAssetAddress: TOKEN, withFeePayer: true });
    expect(freezeDigitalAssetTransferTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, sender, digitalAssetAddress: TOKEN, withFeePayer: true }),
    );
  });

  it("unfreezeDigitalAssetTransaferTransaction forwards args", async () => {
    await api.unfreezeDigitalAssetTransaferTransaction({ sender, digitalAssetAddress: TOKEN, withFeePayer: true });
    expect(unfreezeDigitalAssetTransferTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, sender, withFeePayer: true }),
    );
  });

  it("setDigitalAssetDescriptionTransaction forwards args", async () => {
    await api.setDigitalAssetDescriptionTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      description: "new",
      withFeePayer: true,
    });
    expect(setDigitalAssetDescriptionTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, description: "new", withFeePayer: true }),
    );
  });

  it("setDigitalAssetNameTransaction forwards args", async () => {
    await api.setDigitalAssetNameTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      name: "new",
      withFeePayer: true,
    });
    expect(setDigitalAssetNameTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, name: "new", withFeePayer: true }),
    );
  });

  it("setDigitalAssetURITransaction forwards args", async () => {
    await api.setDigitalAssetURITransaction({
      sender,
      digitalAssetAddress: TOKEN,
      uri: "https://new",
      withFeePayer: true,
    });
    expect(setDigitalAssetURITransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, uri: "https://new", withFeePayer: true }),
    );
  });

  it("addDigitalAssetPropertyTransaction forwards args", async () => {
    await api.addDigitalAssetPropertyTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      propertyKey: "k",
      propertyType: "STRING",
      propertyValue: "v",
      withFeePayer: true,
    });
    expect(addDigitalAssetPropertyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, propertyKey: "k", withFeePayer: true }),
    );
  });

  it("removeDigitalAssetPropertyTransaction forwards args", async () => {
    await api.removeDigitalAssetPropertyTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      propertyKey: "k",
      withFeePayer: true,
    });
    expect(removeDigitalAssetPropertyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, propertyKey: "k", withFeePayer: true }),
    );
  });

  it("updateDigitalAssetPropertyTransaction forwards args", async () => {
    await api.updateDigitalAssetPropertyTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      propertyKey: "k",
      propertyType: "STRING",
      propertyValue: "v2",
      withFeePayer: true,
    });
    expect(updateDigitalAssetPropertyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, propertyValue: "v2", withFeePayer: true }),
    );
  });

  it("addDigitalAssetTypedPropertyTransaction forwards args", async () => {
    await api.addDigitalAssetTypedPropertyTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      propertyKey: "k",
      propertyType: "u64",
      propertyValue: 1,
      withFeePayer: true,
    });
    expect(addDigitalAssetTypedPropertyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, propertyType: "u64", withFeePayer: true }),
    );
  });

  it("updateDigitalAssetTypedPropertyTransaction forwards args", async () => {
    await api.updateDigitalAssetTypedPropertyTransaction({
      sender,
      digitalAssetAddress: TOKEN,
      propertyKey: "k",
      propertyType: "u64",
      propertyValue: 2,
      withFeePayer: true,
    });
    expect(updateDigitalAssetTypedPropertyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, propertyValue: 2, withFeePayer: true }),
    );
  });
});
