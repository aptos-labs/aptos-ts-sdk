// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * REST + pagination coverage for src/internal/account.ts functions that
 * delegate to getAptosFullNode / paginateWithCursor / paginateWithObfuscatedCursor.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { AccountAddress } from "../../../src/core/index.js";
import {
  getInfo,
  getModules,
  getModulesPage,
  getModule,
  getTransactions,
  getResources,
  getResourcesPage,
} from "../../../src/internal/account.js";

const ACCOUNT = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const long = (a: string) => AccountAddress.from(a).toStringLong();

describe("internal/account — REST queries", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  describe("getInfo", () => {
    it("GETs accounts/<addr> and returns account data", async () => {
      const mock = createMockClient();
      const accountData = { sequence_number: "7", authentication_key: "0x1" };
      mock.enqueue({ data: accountData });

      const result = await getInfo({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(result).toEqual(accountData);
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getInfo",
        urlIncludes: `/accounts/${AccountAddress.from(ACCOUNT).toString()}`,
      });
    });
  });

  describe("getModules", () => {
    it("returns modules from a single page when no cursor is present", async () => {
      const mock = createMockClient();
      const row = { bytecode: "0x01", abi: { address: "0x1", name: "m1" } };
      mock.enqueue({ data: [row] });

      const modules = await getModules({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(modules).toEqual([row]);
      expect(mock.requests[0]?.params).toMatchObject({ limit: 1000 });
    });

    it("forwards custom limit in the request params", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: [] });

      await getModules({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { ledgerVersion: 42, limit: 5 },
      });

      expect(mock.requests[0]?.params).toMatchObject({ limit: 5 });
    });
  });

  describe("getModulesPage", () => {
    it("returns modules and cursor from a single page", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: [{ bytecode: "0xab", abi: { address: "0x1", name: "mod" } }],
        headers: { "x-aptos-cursor": "next-cursor" },
      });

      const { modules, cursor } = await getModulesPage({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { cursor: "start-here", limit: 10, ledgerVersion: 5 },
      });

      expect(modules).toHaveLength(1);
      expect(cursor).toBe("next-cursor");
      expect(mock.requests[0]?.params).toMatchObject({ start: "start-here", limit: 10 });
    });
  });

  describe("getModule", () => {
    it("GETs accounts/<addr>/module/<name> and returns the module bytecode", async () => {
      const mock = createMockClient();
      const module = { bytecode: "0xdead", abi: { address: "0x1", name: "coin" } };
      mock.enqueue({ data: module });

      const result = await getModule({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        moduleName: "coin",
      });

      expect(result).toEqual(module);
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getModule",
        urlIncludes: "/module/coin",
      });
    });

    it("forwards ledger_version when supplied (bypasses memoization)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { bytecode: "0x1", abi: { address: "0x1", name: "x" } } });

      await getModule({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        moduleName: "x",
        options: { ledgerVersion: 99 },
      });

      expect(mock.requests[0]?.params).toEqual({ ledger_version: 99 });
    });
  });

  describe("getTransactions", () => {
    it("paginates account transactions via cursor header", async () => {
      const mock = createMockClient();
      mock.setResponder((req) => {
        const start = (req.params as { start?: string })?.start;
        if (!start) {
          return {
            data: [{ version: "1", hash: "0xa" }],
            headers: { "x-aptos-cursor": "page2" },
          };
        }
        return { data: [{ version: "2", hash: "0xb" }], headers: {} };
      });

      const txns = await getTransactions({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { limit: 1 },
      });

      expect(txns).toHaveLength(2);
      expect(mock.requests).toHaveLength(2);
    });
  });

  describe("getResources", () => {
    it("paginates resources with default limit 999", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: [{ type: "0x1::account::Account", data: {} }] });

      const resources = await getResources({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(resources).toHaveLength(1);
      expect(mock.requests[0]?.params).toEqual({ ledger_version: undefined, limit: 999, start: undefined });
    });
  });

  describe("getResourcesPage", () => {
    it("returns resources and cursor from a single page", async () => {
      const mock = createMockClient();
      const row = { type: "0x1::coin::CoinStore", data: { coin: { value: 1 } } };
      mock.enqueue({ data: [row], headers: { "x-aptos-cursor": "more" } });

      const { resources, cursor } = await getResourcesPage({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { limit: 50 },
      });

      expect(resources).toEqual([row]);
      expect(cursor).toBe("more");
      expect(mock.requests[0]?.url ?? "").toContain(long(ACCOUNT));
    });
  });
});
