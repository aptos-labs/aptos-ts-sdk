// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { getTableItem, getTableItemsData, getTableItemsMetadata } from "../../../src/internal/table.js";
import { AptosApiError } from "../../../src/errors/index.js";

describe("internal/table (mocked client)", () => {
  describe("getTableItem", () => {
    it("POSTs to tables/<handle>/item with the request body and casts the result", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { id: "0x1", value: "42" } });

      const result = await getTableItem<{ id: string; value: string }>({
        aptosConfig: mock.config,
        handle: "0xHANDLE",
        data: { key_type: "address", value_type: "u64", key: "0xdead" },
        options: { ledgerVersion: 100 },
      });

      expect(result).toEqual({ id: "0x1", value: "42" });
      expect(mock.requests).toHaveLength(1);
      expectRequest(mock.requests[0], {
        method: "POST",
        originMethod: "getTableItem",
        urlIncludes: "tables/0xHANDLE/item",
        body: { key_type: "address", value_type: "u64", key: "0xdead" },
        params: { ledger_version: 100 },
      });
    });

    it("omits ledger_version (sets undefined) when options not provided", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: "anything" });

      await getTableItem({
        aptosConfig: mock.config,
        handle: "0xABC",
        data: { key_type: "u8", value_type: "u8", key: "1" },
      });

      expect(mock.requests[0]?.params).toEqual({ ledger_version: undefined });
    });

    it("propagates AptosApiError on a 404 from the fullnode", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 404, statusText: "Not Found", data: { message: "no such table" } });

      await expect(
        getTableItem({
          aptosConfig: mock.config,
          handle: "0xMISSING",
          data: { key_type: "u8", value_type: "u8", key: "0" },
        }),
      ).rejects.toBeInstanceOf(AptosApiError);
    });
  });

  describe("getTableItemsData", () => {
    it("sends the GraphQL query with all where/offset/limit/orderBy variables", async () => {
      const mock = createMockClient();
      const items = [{ key: "k1", decoded_key: "k1", decoded_value: "v1" }];
      mock.enqueue({ data: { data: { table_items: items } } });

      const where = { transaction_version: { _eq: "10" } };
      const orderBy = [{ transaction_version: "asc" as const }];
      const result = await getTableItemsData({
        aptosConfig: mock.config,
        options: { offset: 5, limit: 50, where, orderBy },
      });

      expect(result).toEqual(items);

      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables).toEqual({
        where_condition: where,
        offset: 5,
        limit: 50,
        order_by: orderBy,
      });
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getTableItemsData" });
    });

    it("passes undefined variables when no options supplied (still a valid GraphQL request)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { table_items: [] } } });

      const result = await getTableItemsData({ aptosConfig: mock.config });

      expect(result).toEqual([]);
      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables).toEqual({
        where_condition: undefined,
        offset: undefined,
        limit: undefined,
        order_by: undefined,
      });
    });
  });

  describe("getTableItemsMetadata", () => {
    it("unwraps data.table_metadatas from the indexer envelope", async () => {
      const mock = createMockClient();
      const metas = [{ handle: "0xH", key_type: "u8", value_type: "u8" }];
      mock.enqueue({ data: { data: { table_metadatas: metas } } });

      const result = await getTableItemsMetadata({
        aptosConfig: mock.config,
        options: { limit: 10 },
      });

      expect(result).toEqual(metas);
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getTableItemsMetadata" });
    });
  });
});
