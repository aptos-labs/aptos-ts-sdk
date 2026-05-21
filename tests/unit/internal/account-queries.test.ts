// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Indexer + REST query coverage for src/internal/account.ts. Excludes the
 * transaction-builder wrappers (rotateAuthKey*) and the
 * deriveAccountFromPrivateKey path; those need a richer mock and live in a
 * separate file.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { AccountAddress } from "../../../src/core/index.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { AptosApiError } from "../../../src/errors/index.js";
import {
  getResource,
  getResourceFallible,
  getAccountTokensCount,
  getAccountOwnedTokens,
  getAccountTransactionsCount,
  getAccountCoinsData,
  getAccountCoinsCount,
  getBalance,
  getAccountOwnedObjects,
  fetchAndCacheAuthKeyForAddress,
} from "../../../src/internal/account.js";

const ACCOUNT = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const long = (a: string) => AccountAddress.from(a).toStringLong();

describe("internal/account — REST queries", () => {
  describe("getResource", () => {
    it("GETs accounts/<addr>/resource/<type> and returns the inner data field", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { type: "0x1::coin::CoinStore", data: { value: 100 } } });

      const result = await getResource<{ value: number }>({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      });

      expect(result).toEqual({ value: 100 });
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getResource",
        urlIncludes: "/accounts/",
      });
      expect(mock.requests[0]?.url ?? "").toContain("0x1::coin::CoinStore");
    });

    it("forwards ledger_version when supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { type: "x", data: {} } });

      await getResource({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        resourceType: "0x1::account::Account",
        options: { ledgerVersion: 999 },
      });

      expect(mock.requests[0]?.params).toEqual({ ledger_version: 999 });
    });
  });

  describe("getResourceFallible", () => {
    it("returns null on a 404 with error_code='resource_not_found'", async () => {
      const mock = createMockClient();
      mock.enqueue({
        status: 404,
        statusText: "Not Found",
        data: { message: "resource not found", error_code: "resource_not_found" },
      });

      const result = await getResourceFallible({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        resourceType: "0x1::coin::CoinStore",
      });
      expect(result).toBeNull();
    });

    it("rethrows when 404 has a different error_code (not the resource_not_found sentinel)", async () => {
      const mock = createMockClient();
      mock.enqueue({
        status: 404,
        statusText: "Not Found",
        data: { message: "account not found", error_code: "account_not_found" },
      });

      await expect(
        getResourceFallible({
          aptosConfig: mock.config,
          accountAddress: ACCOUNT,
          resourceType: "0x1::coin::CoinStore",
        }),
      ).rejects.toBeInstanceOf(AptosApiError);
    });

    it("rethrows on 5xx", async () => {
      const mock = createMockClient();
      mock.enqueue({ status: 500, statusText: "Server Error", data: {} });

      await expect(
        getResourceFallible({
          aptosConfig: mock.config,
          accountAddress: ACCOUNT,
          resourceType: "0x1::coin::CoinStore",
        }),
      ).rejects.toBeInstanceOf(AptosApiError);
    });
  });

  describe("getBalance", () => {
    it("parses the numeric body via parseInt(toString(), 10)", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: "12345" });

      const balance = await getBalance({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        asset: "0x1::aptos_coin::AptosCoin",
      });

      expect(balance).toBe(12345);
      expect(typeof balance).toBe("number");
      expectRequest(mock.requests[0], {
        method: "GET",
        originMethod: "getBalance",
        urlIncludes: "/balance/",
      });
    });

    it("accepts an FA metadata-address string asset", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: 7 });

      const balance = await getBalance({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        asset: AccountAddress.A,
      });

      expect(balance).toBe(7);
    });
  });
});

describe("internal/account — indexer queries", () => {
  describe("getAccountTokensCount", () => {
    it("returns aggregate.count when present", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { current_token_ownerships_v2_aggregate: { aggregate: { count: 3 } } } },
      });

      const count = await getAccountTokensCount({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(count).toBe(3);

      const body = mock.requests[0]?.body as {
        variables: { where_condition: { owner_address: { _eq: string }; amount: { _gt: number } } };
      };
      expect(body.variables.where_condition.owner_address._eq).toBe(long(ACCOUNT));
      expect(body.variables.where_condition.amount._gt).toBe(0);
    });

    it("returns 0 when aggregate is null (cjs-friendly fallback)", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { current_token_ownerships_v2_aggregate: { aggregate: null } } },
      });

      const count = await getAccountTokensCount({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(count).toBe(0);
    });
  });

  describe("getAccountOwnedTokens", () => {
    it("forwards tokenStandard filter when supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_token_ownerships_v2: [] } } });

      await getAccountOwnedTokens({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { tokenStandard: "v1", limit: 5 },
      });

      const body = mock.requests[0]?.body as {
        variables: {
          where_condition: { token_standard?: { _eq: string }; amount: { _gt: number } };
          limit: number;
        };
      };
      expect(body.variables.where_condition.token_standard).toEqual({ _eq: "v1" });
      expect(body.variables.where_condition.amount._gt).toBe(0);
      expect(body.variables.limit).toBe(5);
    });

    it("omits token_standard when not supplied", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { data: { current_token_ownerships_v2: [] } } });

      await getAccountOwnedTokens({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      const body = mock.requests[0]?.body as {
        variables: { where_condition: Record<string, unknown> };
      };
      expect(body.variables.where_condition.token_standard).toBeUndefined();
    });
  });

  describe("getAccountTransactionsCount", () => {
    it("sends the address as a top-level variable (not in where_condition)", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { account_transactions_aggregate: { aggregate: { count: 17 } } } },
      });

      const count = await getAccountTransactionsCount({ aptosConfig: mock.config, accountAddress: ACCOUNT });

      expect(count).toBe(17);
      const body = mock.requests[0]?.body as { variables: { address: string } };
      expect(body.variables.address).toBe(long(ACCOUNT));
    });

    it("returns 0 when aggregate is missing", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { account_transactions_aggregate: { aggregate: null } } },
      });

      const count = await getAccountTransactionsCount({ aptosConfig: mock.config, accountAddress: ACCOUNT });
      expect(count).toBe(0);
    });
  });

  describe("getAccountCoinsData", () => {
    it("normalizes the owner_address and merges options.where", async () => {
      const mock = createMockClient();
      const rows = [{ asset_type: "0x1::aptos_coin::AptosCoin", amount: 50 }];
      mock.enqueue({ data: { data: { current_fungible_asset_balances: rows } } });

      const result = await getAccountCoinsData({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { where: { asset_type: { _eq: "0x1::aptos_coin::AptosCoin" } }, limit: 10 },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as {
        variables: { where_condition: { owner_address: { _eq: string }; asset_type?: unknown } };
      };
      expect(body.variables.where_condition.owner_address._eq).toBe(long(ACCOUNT));
      expect(body.variables.where_condition.asset_type).toEqual({ _eq: "0x1::aptos_coin::AptosCoin" });
    });
  });

  describe("getAccountCoinsCount", () => {
    it("returns the count when aggregate is present", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { current_fungible_asset_balances_aggregate: { aggregate: { count: 4 } } } },
      });

      const count = await getAccountCoinsCount({ aptosConfig: mock.config, accountAddress: ACCOUNT });
      expect(count).toBe(4);
    });

    it("throws (not returns 0) when aggregate is missing — opposite of the cjs fallback pattern", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: { data: { current_fungible_asset_balances_aggregate: { aggregate: null } } },
      });

      await expect(getAccountCoinsCount({ aptosConfig: mock.config, accountAddress: ACCOUNT })).rejects.toThrow(
        /Failed to get the count of account coins/,
      );
    });
  });

  describe("getAccountOwnedObjects", () => {
    it("filters by owner_address (long form) and forwards pagination/orderBy", async () => {
      const mock = createMockClient();
      const rows = [{ object_address: ACCOUNT, owner_address: ACCOUNT, is_deleted: false }];
      mock.enqueue({ data: { data: { current_objects: rows } } });

      const result = await getAccountOwnedObjects({
        aptosConfig: mock.config,
        accountAddress: ACCOUNT,
        options: { limit: 1, offset: 0 },
      });

      expect(result).toEqual(rows);
      const body = mock.requests[0]?.body as {
        variables: { where_condition: { owner_address: { _eq: string } } };
      };
      expect(body.variables.where_condition.owner_address._eq).toBe(long(ACCOUNT));
    });
  });
});

describe("internal/account.fetchAndCacheAuthKeyForAddress", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  it("fetches the account info and wraps authentication_key in AuthenticationKey", async () => {
    const mock = createMockClient();
    // 32 bytes hex
    const authKeyHex = "0xaa".padEnd(66, "a");
    mock.enqueue({ data: { sequence_number: "0", authentication_key: authKeyHex } });

    const key = await fetchAndCacheAuthKeyForAddress({ aptosConfig: mock.config, accountAddress: ACCOUNT });

    expect(key.toString()).toBe(authKeyHex);
    expectRequest(mock.requests[0], { method: "GET", urlIncludes: AccountAddress.from(ACCOUNT).toString() });
  });

  it("falls back to address bytes when the account does not exist (account_not_found 404)", async () => {
    const mock = createMockClient();
    mock.enqueue({
      status: 404,
      statusText: "Not Found",
      data: { message: "account not found", error_code: "account_not_found" },
    });

    const key = await fetchAndCacheAuthKeyForAddress({ aptosConfig: mock.config, accountAddress: ACCOUNT });

    expect(key.toString()).toBe(AccountAddress.from(ACCOUNT).toString());
  });

  it("rethrows on non-account_not_found errors", async () => {
    const mock = createMockClient();
    mock.enqueue({
      status: 500,
      statusText: "Server Error",
      data: { message: "boom" },
    });

    await expect(
      fetchAndCacheAuthKeyForAddress({ aptosConfig: mock.config, accountAddress: ACCOUNT }),
    ).rejects.toBeInstanceOf(AptosApiError);
  });

  it("caches per (fullnode/network, address) — second call does not hit the client", async () => {
    const mock = createMockClient();
    const authKeyHex = "0xbb".padEnd(66, "b");
    mock.setDefault({ data: { sequence_number: "0", authentication_key: authKeyHex } });

    const first = await fetchAndCacheAuthKeyForAddress({ aptosConfig: mock.config, accountAddress: ACCOUNT });
    const second = await fetchAndCacheAuthKeyForAddress({ aptosConfig: mock.config, accountAddress: ACCOUNT });

    expect(first.toString()).toBe(second.toString());
    expect(mock.requests).toHaveLength(1);
  });
});
