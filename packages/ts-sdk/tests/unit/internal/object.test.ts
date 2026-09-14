// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { getObjectData, getObjectDataByObjectAddress } from "../../../src/internal/object.js";
import { AccountAddress } from "../../../src/core/index.js";

const OBJECT_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

describe("internal/object (mocked indexer)", () => {
  describe("getObjectData", () => {
    it("forwards pagination + where + orderBy into GraphQL variables and returns current_objects", async () => {
      const mock = createMockClient();
      const rows = [{ object_address: OBJECT_ADDRESS, owner_address: "0x1", is_deleted: false }];
      mock.enqueue({ data: { data: { current_objects: rows } } });

      const where = { is_deleted: { _eq: false } };
      const orderBy = [{ object_address: "asc" as const }];
      const result = await getObjectData({
        aptosConfig: mock.config,
        options: { offset: 0, limit: 25, where, orderBy },
      });

      expect(result).toEqual(rows);

      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables).toEqual({
        where_condition: where,
        offset: 0,
        limit: 25,
        order_by: orderBy,
      });
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getObjectData" });
    });

    it("sends undefined variables when no options supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_objects: [] } } });

      await getObjectData({ aptosConfig: mock.config });

      const body = mock.requests[0]?.body as { variables: Record<string, unknown> };
      expect(body.variables).toEqual({
        where_condition: undefined,
        offset: undefined,
        limit: undefined,
        order_by: undefined,
      });
    });
  });

  describe("getObjectDataByObjectAddress", () => {
    it("normalizes the object address to long form and uses it as the where_condition", async () => {
      const mock = createMockClient();
      const row = { object_address: OBJECT_ADDRESS, owner_address: "0x2", is_deleted: false };
      mock.enqueue({ data: { data: { current_objects: [row] } } });

      const result = await getObjectDataByObjectAddress({
        aptosConfig: mock.config,
        objectAddress: OBJECT_ADDRESS,
      });

      expect(result).toEqual(row);

      const body = mock.requests[0]?.body as {
        variables: { where_condition: { object_address: { _eq: string } } };
      };
      expect(body.variables.where_condition.object_address._eq).toBe(
        AccountAddress.from(OBJECT_ADDRESS).toStringLong(),
      );
    });

    it("returns undefined-shaped first element when indexer returns no rows", async () => {
      // Note: the implementation returns rows[0] without a length guard, so
      // an empty result returns undefined. This test pins that behavior so a
      // future change to add a guard is caught as an intentional API change.
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_objects: [] } } });

      const result = await getObjectDataByObjectAddress({
        aptosConfig: mock.config,
        objectAddress: OBJECT_ADDRESS,
      });

      expect(result).toBeUndefined();
    });
  });
});
