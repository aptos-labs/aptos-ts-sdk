// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import {
  getDigitalAssetData,
  getCurrentDigitalAssetOwnership,
  getOwnedDigitalAssets,
  getDigitalAssetActivity,
  getCollectionData,
  getCollectionDataByCreatorAddressAndCollectionName,
  getCollectionDataByCreatorAddress,
  getCollectionDataByCollectionId,
  getCollectionId,
} from "../../../src/internal/digitalAsset.js";
import { AccountAddress } from "../../../src/core/index.js";

const TOKEN = "0x1111111111111111111111111111111111111111111111111111111111111111";
const OWNER = "0x2222222222222222222222222222222222222222222222222222222222222222";
const CREATOR = "0x3333333333333333333333333333333333333333333333333333333333333333";
const COLLECTION = "0x4444444444444444444444444444444444444444444444444444444444444444";

const long = (addr: string) => AccountAddress.from(addr).toStringLong();

describe("internal/digitalAsset — indexer queries (mocked)", () => {
  describe("getDigitalAssetData", () => {
    it("filters by token_data_id (long form) and returns the first current_token_datas_v2 row", async () => {
      const mock = createMockClient();
      const row = { token_data_id: TOKEN, token_name: "Test" };
      mock.enqueue({ data: { data: { current_token_datas_v2: [row] } } });

      const result = await getDigitalAssetData({ aptosConfig: mock.config, digitalAssetAddress: TOKEN });

      expect(result).toEqual(row);
      const body = mock.requests[0]?.body as {
        variables: { where_condition: { token_data_id: { _eq: string } } };
      };
      expect(body.variables.where_condition.token_data_id._eq).toBe(long(TOKEN));
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getDigitalAssetData" });
    });
  });

  describe("getCurrentDigitalAssetOwnership", () => {
    it("filters by token_data_id + amount > 0", async () => {
      const mock = createMockClient();
      const row = { token_data_id: TOKEN, amount: "1", owner_address: OWNER };
      mock.enqueue({ data: { data: { current_token_ownerships_v2: [row] } } });

      const result = await getCurrentDigitalAssetOwnership({
        aptosConfig: mock.config,
        digitalAssetAddress: TOKEN,
      });

      expect(result).toEqual(row);
      const body = mock.requests[0]?.body as {
        variables: { where_condition: { token_data_id: { _eq: string }; amount: { _gt: number } } };
      };
      expect(body.variables.where_condition.token_data_id._eq).toBe(long(TOKEN));
      expect(body.variables.where_condition.amount._gt).toBe(0);
    });
  });

  describe("getOwnedDigitalAssets", () => {
    it("filters by owner_address + amount > 0 and forwards pagination/orderBy", async () => {
      const mock = createMockClient();
      const rows = [{ token_data_id: TOKEN, owner_address: OWNER, amount: "1" }];
      mock.enqueue({ data: { data: { current_token_ownerships_v2: rows } } });

      const result = await getOwnedDigitalAssets({
        aptosConfig: mock.config,
        ownerAddress: OWNER,
        options: { offset: 10, limit: 5 },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect((body.variables.where_condition as { owner_address: { _eq: string } }).owner_address._eq).toBe(
        long(OWNER),
      );
      expect(body.variables.offset).toBe(10);
      expect(body.variables.limit).toBe(5);
    });
  });

  describe("getDigitalAssetActivity", () => {
    it("filters by token_data_id and returns token_activities_v2", async () => {
      const mock = createMockClient();
      const rows = [{ transaction_version: "100", token_data_id: TOKEN }];
      mock.enqueue({ data: { data: { token_activities_v2: rows } } });

      const result = await getDigitalAssetActivity({
        aptosConfig: mock.config,
        digitalAssetAddress: TOKEN,
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as {
        variables: { where_condition: { token_data_id: { _eq: string } } };
      };
      expect(body.variables.where_condition.token_data_id._eq).toBe(long(TOKEN));
    });
  });

  describe("getCollectionData", () => {
    it("adds token_standard filter when tokenStandard option is supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_collections_v2: [{ collection_id: COLLECTION }] } } });

      await getCollectionData({
        aptosConfig: mock.config,
        options: { where: { collection_name: { _eq: "x" } }, tokenStandard: "v1" },
      });

      const body = mock.requests[0]?.body as {
        variables: { where_condition: { token_standard?: { _eq: string } } };
      };
      expect(body.variables.where_condition.token_standard).toEqual({ _eq: "v1" });
    });

    it("returns the first current_collections_v2 element", async () => {
      const mock = createMockClient();
      const row = { collection_id: COLLECTION, name: "My NFTs" };
      mock.enqueue({ data: { data: { current_collections_v2: [row, { collection_id: "other" }] } } });

      const result = await getCollectionData({
        aptosConfig: mock.config,
        options: { where: { collection_id: { _eq: COLLECTION } } },
      });
      expect(result).toEqual(row);
    });
  });

  describe("getCollectionDataByCreatorAddressAndCollectionName", () => {
    it("builds a where with collection_name + creator_address (long form)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_collections_v2: [{ collection_id: COLLECTION }] } } });

      await getCollectionDataByCreatorAddressAndCollectionName({
        aptosConfig: mock.config,
        creatorAddress: CREATOR,
        collectionName: "Test",
      });

      const body = mock.requests[0]?.body as {
        variables: { where_condition: { collection_name: { _eq: string }; creator_address: { _eq: string } } };
      };
      expect(body.variables.where_condition.collection_name._eq).toBe("Test");
      expect(body.variables.where_condition.creator_address._eq).toBe(long(CREATOR));
    });
  });

  describe("getCollectionDataByCreatorAddress", () => {
    it("filters only by creator_address when no name is supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_collections_v2: [{ collection_id: COLLECTION }] } } });

      await getCollectionDataByCreatorAddress({ aptosConfig: mock.config, creatorAddress: CREATOR });

      const body = mock.requests[0]?.body as {
        variables: { where_condition: Record<string, unknown> };
      };
      expect(body.variables.where_condition).toEqual({ creator_address: { _eq: long(CREATOR) } });
    });
  });

  describe("getCollectionDataByCollectionId", () => {
    it("filters by collection_id (long form)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_collections_v2: [{ collection_id: COLLECTION }] } } });

      await getCollectionDataByCollectionId({ aptosConfig: mock.config, collectionId: COLLECTION });

      const body = mock.requests[0]?.body as {
        variables: { where_condition: { collection_id: { _eq: string } } };
      };
      expect(body.variables.where_condition.collection_id._eq).toBe(long(COLLECTION));
    });
  });

  describe("getCollectionId", () => {
    it("returns the collection_id string from the resolved collection", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_collections_v2: [{ collection_id: COLLECTION }] } } });

      const id = await getCollectionId({
        aptosConfig: mock.config,
        creatorAddress: CREATOR,
        collectionName: "Test",
      });

      expect(id).toBe(COLLECTION);
    });
  });
});
