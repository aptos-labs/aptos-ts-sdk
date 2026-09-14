// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { TypeTagAddress, TypeTagU64, TypeTagStruct } from "../../../src/transactions/index.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import {
  getFungibleAssetMetadata,
  getFungibleAssetActivities,
  getCurrentFungibleAssetBalances,
  transferFungibleAsset,
  transferFungibleAssetBetweenStores,
} from "../../../src/internal/fungibleAsset.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("internal/fungibleAsset", () => {
  describe("indexer queries", () => {
    it("getFungibleAssetMetadata: forwards where/limit/offset into GraphQL variables", async () => {
      const mock = createMockClient();
      const rows = [{ asset_type: "0x1::aptos_coin::AptosCoin", name: "Aptos", symbol: "APT" }];
      mock.enqueue({ data: { data: { fungible_asset_metadata: rows } } });

      const where = { name: { _eq: "Aptos" } };
      const result = await getFungibleAssetMetadata({
        aptosConfig: mock.config,
        options: { where, limit: 25, offset: 0 },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables).toEqual({ where_condition: where, limit: 25, offset: 0 });
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getFungibleAssetMetadata" });
    });

    it("getFungibleAssetActivities: returns the activities array", async () => {
      const mock = createMockClient();
      const rows = [{ transaction_version: "1", amount: "100" }];
      mock.enqueue({ data: { data: { fungible_asset_activities: rows } } });

      const result = await getFungibleAssetActivities({ aptosConfig: mock.config });

      expect(result).toEqual(rows);
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getFungibleAssetActivities" });
    });

    it("getCurrentFungibleAssetBalances: returns the balances array", async () => {
      const mock = createMockClient();
      const rows = [{ owner_address: "0x1", amount: "500", asset_type: "0x1::aptos_coin::AptosCoin" }];
      mock.enqueue({ data: { data: { current_fungible_asset_balances: rows } } });

      const result = await getCurrentFungibleAssetBalances({
        aptosConfig: mock.config,
        options: { limit: 1 },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables.limit).toBe(1);
    });
  });

  describe("transaction wrappers", () => {
    const sender = Account.generate();
    const recipient = Account.generate();
    const metadata = Account.generate().accountAddress;
    const aptosConfig = new AptosConfig({ network: Network.LOCAL });

    beforeEach(() => {
      mockedGenerateTransaction.mockReset();
      mockedGenerateTransaction.mockResolvedValue("SENTINEL" as never);
    });

    it("transferFungibleAsset: targets primary_fungible_store::transfer with the metadata address + recipient + amount", async () => {
      await transferFungibleAsset({
        aptosConfig,
        sender,
        fungibleAssetMetadataAddress: metadata,
        recipient: recipient.accountAddress,
        amount: 100n,
      });

      const call = mockedGenerateTransaction.mock.calls[0][0];
      // Sender is reduced to its address — the wrapper does this destructuring.
      expect(call.sender).toBe(sender.accountAddress);
      const data = call.data as {
        function: string;
        typeArguments: string[];
        functionArguments: unknown[];
        abi: { parameters: unknown[] };
      };
      expect(data.function).toBe("0x1::primary_fungible_store::transfer");
      expect(data.typeArguments).toEqual(["0x1::fungible_asset::Metadata"]);
      expect(data.functionArguments).toEqual([metadata, recipient.accountAddress, 100n]);
      // ABI shape: object<T> + address + u64. parseTypeTag returns a
      // TypeTagStruct for 0x1::object::Object.
      expect(data.abi.parameters).toHaveLength(3);
      expect(data.abi.parameters[0]).toBeInstanceOf(TypeTagStruct);
      expect(data.abi.parameters[1]).toBeInstanceOf(TypeTagAddress);
      expect(data.abi.parameters[2]).toBeInstanceOf(TypeTagU64);
    });

    it("transferFungibleAssetBetweenStores: targets dispatchable_fungible_asset::transfer with the FungibleStore generic", async () => {
      const fromStore = Account.generate().accountAddress;
      const toStore = Account.generate().accountAddress;

      await transferFungibleAssetBetweenStores({
        aptosConfig,
        sender,
        fromStore,
        toStore,
        amount: 5n,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        typeArguments: string[];
        functionArguments: unknown[];
      };
      expect(data.function).toBe("0x1::dispatchable_fungible_asset::transfer");
      expect(data.typeArguments).toEqual(["0x1::fungible_asset::FungibleStore"]);
      expect(data.functionArguments).toEqual([fromStore, toStore, 5n]);
    });

    it("both transfers share the same faTransferAbi reference (no duplicated ABI shape)", async () => {
      await transferFungibleAsset({
        aptosConfig,
        sender,
        fungibleAssetMetadataAddress: metadata,
        recipient: recipient.accountAddress,
        amount: 1n,
      });
      await transferFungibleAssetBetweenStores({
        aptosConfig,
        sender,
        fromStore: Account.generate().accountAddress,
        toStore: Account.generate().accountAddress,
        amount: 1n,
      });

      const abi1 = (mockedGenerateTransaction.mock.calls[0][0].data as { abi: unknown }).abi;
      const abi2 = (mockedGenerateTransaction.mock.calls[1][0].data as { abi: unknown }).abi;
      // Identity check — both call sites pin to the same module-level constant.
      expect(abi1).toBe(abi2);
    });
  });
});
