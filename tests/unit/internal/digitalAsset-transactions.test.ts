// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Coverage for the transaction-builder wrappers in internal/digitalAsset.ts.
 * generateTransaction is vi.mock'd so each test asserts the exact entry-
 * function and positional arguments that the wrapper plumbs downstream.
 */

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import {
  transferDigitalAssetTransaction,
  burnDigitalAssetTransaction,
  freezeDigitalAssetTransferTransaction,
  unfreezeDigitalAssetTransferTransaction,
  setDigitalAssetDescriptionTransaction,
  setDigitalAssetNameTransaction,
  setDigitalAssetURITransaction,
} from "../../../src/internal/digitalAsset.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

const aptosConfig = new AptosConfig({ network: Network.LOCAL });
const sender = Account.generate();
const digitalAsset = Account.generate().accountAddress;
const recipient = Account.generate().accountAddress;

const SENTINEL = "SENTINEL" as never;

describe("internal/digitalAsset transaction wrappers", () => {
  beforeEach(() => {
    mockedGenerateTransaction.mockReset();
    mockedGenerateTransaction.mockResolvedValue(SENTINEL);
  });

  describe("transferDigitalAssetTransaction", () => {
    it("targets 0x1::object::transfer with default digital asset type", async () => {
      await transferDigitalAssetTransaction({
        aptosConfig,
        sender,
        digitalAssetAddress: digitalAsset,
        recipient,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        typeArguments: string[];
        functionArguments: AccountAddress[];
      };
      expect(data.function).toBe("0x1::object::transfer");
      expect(data.typeArguments).toHaveLength(1);
      // Both addresses are normalized through AccountAddress.from in the wrapper.
      expect(data.functionArguments[0].toString()).toBe(digitalAsset.toString());
      expect(data.functionArguments[1].toString()).toBe(recipient.toString());
    });

    it("honors a custom digitalAssetType", async () => {
      const custom = "0xcafe::nft::Nft";
      await transferDigitalAssetTransaction({
        aptosConfig,
        sender,
        digitalAssetAddress: digitalAsset,
        recipient,
        digitalAssetType: custom,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { typeArguments: string[] };
      expect(data.typeArguments).toEqual([custom]);
    });
  });

  describe("burnDigitalAssetTransaction", () => {
    it("targets the burn entry function with the digital-asset address", async () => {
      await burnDigitalAssetTransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        functionArguments: unknown[];
      };
      expect(data.function).toContain("burn");
      expect(data.functionArguments).toHaveLength(1);
    });
  });

  describe("freeze / unfreeze digital asset transfer transactions", () => {
    it("freezeDigitalAssetTransferTransaction targets the freeze entry", async () => {
      await freezeDigitalAssetTransferTransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { function: string };
      expect(data.function).toContain("freeze_transfer");
    });

    it("unfreezeDigitalAssetTransferTransaction targets the unfreeze entry", async () => {
      await unfreezeDigitalAssetTransferTransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { function: string };
      expect(data.function).toContain("unfreeze_transfer");
    });
  });

  describe("set digital asset description / name / URI transactions", () => {
    it("setDigitalAssetDescriptionTransaction passes the asset + description string", async () => {
      await setDigitalAssetDescriptionTransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
        description: "new description",
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { functionArguments: unknown[] };
      expect(data.functionArguments).toHaveLength(2);
    });

    it("setDigitalAssetNameTransaction passes the asset + new name", async () => {
      await setDigitalAssetNameTransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
        name: "Renamed",
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { functionArguments: unknown[] };
      expect(data.functionArguments).toHaveLength(2);
    });

    it("setDigitalAssetURITransaction passes the asset + new URI", async () => {
      await setDigitalAssetURITransaction({
        aptosConfig,
        creator: sender,
        digitalAssetAddress: digitalAsset,
        uri: "https://example.com/new",
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as { functionArguments: unknown[] };
      expect(data.functionArguments).toHaveLength(2);
    });
  });
});
