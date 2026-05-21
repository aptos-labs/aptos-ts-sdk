// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import {
  getLedgerInfo,
  getProcessorStatuses,
  getProcessorStatus,
  getIndexerLastSuccessVersion,
  queryIndexer,
} from "../../../src/internal/general.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { ProcessorType } from "../../../src/utils/const.js";
import { AptosApiError } from "../../../src/errors/index.js";
import type { LedgerInfo } from "../../../src/types/index.js";

const ledgerInfoFixture = (): LedgerInfo => ({
  chain_id: 4,
  epoch: "42",
  ledger_version: "12345",
  oldest_ledger_version: "1",
  ledger_timestamp: "1700000000",
  node_role: "full_node",
  oldest_block_height: "0",
  block_height: "987",
  git_hash: "deadbeef",
});

describe("internal/general (mocked client)", () => {
  beforeEach(() => {
    // Ledger info is memoized by network; flush so each test starts clean.
    clearMemoizeCache();
  });

  afterEach(() => {
    clearMemoizeCache();
  });

  describe("getLedgerInfo", () => {
    it("issues a GET to the fullnode root and returns the parsed LedgerInfo", async () => {
      const mock = createMockClient();
      const expected = ledgerInfoFixture();
      mock.enqueue({ data: expected });

      const result = await getLedgerInfo({ aptosConfig: mock.config });

      // Parsed result half
      expect(result).toEqual(expected);
      expect(result.chain_id).toBe(4);
      expect(result.ledger_version).toBe("12345");

      // Outgoing request half — both halves are required by the meaningful-assertion rules.
      expect(mock.requests).toHaveLength(1);
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getLedgerInfo",
        // path "" + base URL with no trailing slash → URL ends with a stray "/" via aptosRequest
        urlIncludes: "/v1",
      });
    });

    it("memoizes within the TTL — a second call does NOT hit the client", async () => {
      const mock = createMockClient();
      mock.setDefault({ data: ledgerInfoFixture() });

      const first = await getLedgerInfo({ aptosConfig: mock.config });
      const second = await getLedgerInfo({ aptosConfig: mock.config });

      expect(first).toEqual(second);
      expect(mock.requests).toHaveLength(1);
    });

    it("propagates AptosApiError on a fullnode 4xx (status mapped through aptosRequest)", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 404, statusText: "Not Found", data: { message: "not found" } });

      await expect(getLedgerInfo({ aptosConfig: mock.config })).rejects.toBeInstanceOf(AptosApiError);
      expect(mock.requests).toHaveLength(1);
    });
  });

  describe("queryIndexer", () => {
    it("POSTs the GraphQL body to the indexer and unwraps the data envelope", async () => {
      const mock = createMockClient();
      const variables = { limit: 5 };
      const inner = { user_transactions: [{ version: "1" }] };
      // Indexer responses are wrapped in { data: ... } — aptosRequest unwraps for INDEXER apiType.
      mock.enqueue({ data: { data: inner } });

      const result = await queryIndexer<typeof inner>({
        aptosConfig: mock.config,
        query: { query: "query Top($limit: Int!) { user_transactions { version } }", variables },
        originMethod: "smokeTest",
      });

      expect(result).toEqual(inner);

      expect(mock.requests).toHaveLength(1);
      expectRequest(mock.requests[0], {
        method: "POST",
        originMethod: "smokeTest",
        body: { query: expect.stringContaining("user_transactions"), variables },
      });
    });

    it("throws AptosApiError when the indexer returns a GraphQL errors[] envelope", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { errors: [{ message: "bad query" }], data: null },
      });

      await expect(
        queryIndexer({
          aptosConfig: mock.config,
          query: { query: "query { x }" },
        }),
      ).rejects.toBeInstanceOf(AptosApiError);
    });
  });

  describe("getProcessorStatuses + getIndexerLastSuccessVersion + getProcessorStatus", () => {
    it("returns the processor_status array from the indexer", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { processor_status: [{ processor: "default_processor", last_success_version: "999" }] } },
      });

      const statuses = await getProcessorStatuses({ aptosConfig: mock.config });

      expect(statuses).toHaveLength(1);
      expect(statuses[0].processor).toBe("default_processor");
      expect(statuses[0].last_success_version).toBe("999");
      expectRequest(mock.requests[0], { method: "POST", originMethod: "getProcessorStatuses" });
    });

    it("getIndexerLastSuccessVersion coerces the version string to bigint", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: {
          data: { processor_status: [{ processor: "default_processor", last_success_version: "1000000000000" }] },
        },
      });

      const version = await getIndexerLastSuccessVersion({ aptosConfig: mock.config });

      expect(version).toBe(1_000_000_000_000n);
      expect(typeof version).toBe("bigint");
    });

    it("getProcessorStatus passes a where_condition with the processor type", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { processor_status: [{ processor: ProcessorType.DEFAULT, last_success_version: "5" }] } },
      });

      const status = await getProcessorStatus({
        aptosConfig: mock.config,
        processorType: ProcessorType.DEFAULT,
      });

      expect(status.processor).toBe(ProcessorType.DEFAULT);
      expect(status.last_success_version).toBe("5");

      const body = mock.requests[0]?.body as { variables?: { where_condition?: unknown } };
      expect(body.variables?.where_condition).toEqual({
        processor: { _eq: ProcessorType.DEFAULT },
      });
    });
  });
});
