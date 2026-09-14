// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import {
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
  getDelegatedStakingActivities,
} from "../../../src/internal/staking.js";
import { AccountAddress } from "../../../src/core/index.js";

const POOL = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const DELEGATOR = "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

describe("internal/staking (mocked indexer)", () => {
  describe("getNumberOfDelegators", () => {
    it("returns the count when the indexer has a row for the pool", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { num_active_delegator_per_pool: [{ num_active_delegator: 7, pool_address: POOL }] } },
      });

      const count = await getNumberOfDelegators({ aptosConfig: mock.config, poolAddress: POOL });

      expect(count).toBe(7);

      const body = mock.requests[0]?.body as { variables: { where_condition: { pool_address: { _eq: string } } } };
      // Pool address is normalized to long form before being sent to the indexer.
      expect(body.variables.where_condition.pool_address._eq).toBe(AccountAddress.from(POOL).toStringLong());
    });

    it("returns 0 when the indexer returns an empty row set (the cjs-friendly fallback path)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { num_active_delegator_per_pool: [] } } });

      const count = await getNumberOfDelegators({ aptosConfig: mock.config, poolAddress: POOL });

      expect(count).toBe(0);
    });
  });

  describe("getNumberOfDelegatorsForAllPools", () => {
    it("forwards the orderBy option into GraphQL variables and returns the array", async () => {
      const mock = createMockClient();
      const rows = [
        { num_active_delegator: 3, pool_address: POOL },
        { num_active_delegator: 1, pool_address: DELEGATOR },
      ];
      mock.enqueue({ data: { data: { num_active_delegator_per_pool: rows } } });

      const orderBy = [{ num_active_delegator: "desc" as const }];
      const result = await getNumberOfDelegatorsForAllPools({
        aptosConfig: mock.config,
        options: { orderBy },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as { variables: { order_by: unknown } };
      expect(body.variables.order_by).toEqual(orderBy);
    });

    it("passes order_by: undefined when options are omitted", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { num_active_delegator_per_pool: [] } } });

      await getNumberOfDelegatorsForAllPools({ aptosConfig: mock.config });

      const body = mock.requests[0]?.body as { variables: { order_by: unknown } };
      expect(body.variables.order_by).toBeUndefined();
    });
  });

  describe("getDelegatedStakingActivities", () => {
    it("normalizes both delegator and pool addresses to long form before sending", async () => {
      const mock = createMockClient();
      const activities = [{ amount: "100", event_type: "stake", transaction_version: "5" }];
      mock.enqueue({ data: { data: { delegated_staking_activities: activities } } });

      const result = await getDelegatedStakingActivities({
        aptosConfig: mock.config,
        delegatorAddress: DELEGATOR,
        poolAddress: POOL,
      });

      expect(result).toEqual(activities);
      const body = mock.requests[0]?.body as {
        variables: { delegatorAddress: string; poolAddress: string };
      };
      expect(body.variables.delegatorAddress).toBe(AccountAddress.from(DELEGATOR).toStringLong());
      expect(body.variables.poolAddress).toBe(AccountAddress.from(POOL).toStringLong());
      expectRequest(mock.requests[0], { method: "POST" });
    });
  });
});
