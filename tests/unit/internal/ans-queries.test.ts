// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers the read/query and registration paths in `src/internal/ans.ts` that
// the existing `ans.test.ts` (pure helpers) and `ans-transactions.test.ts`
// (transaction wrappers) leave untested:
//   - view-backed reads: getOwnerAddress, getExpiration, getPrimaryName,
//     getTargetAddress, getANSGracePeriod
//   - indexer-backed reads: getName, getAccountNames, getAccountDomains,
//     getAccountSubdomains, getDomainSubdomains
//   - registerName (domain + subdomain branches and their validation errors)
//   - getRouterAddress failure on a network without an ANS deployment
//
// `view` is mocked so we control the on-chain result and assert the exact view
// payload (function + arguments) without a module-ABI round-trip;
// `generateTransaction` is mocked so registration tests assert the entry
// function arguments; `queryIndexer` runs for real against a recording mock
// client so indexer tests assert the GraphQL variables AND the parsed result.

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { AccountAddress } from "../../../src/core/index.js";
import { ExpirationStatus } from "../../../src/types/index.js";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";

vi.mock("../../../src/internal/view.js", () => ({
  view: vi.fn(),
}));
vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { view } from "../../../src/internal/view.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";
import {
  getOwnerAddress,
  getExpiration,
  getPrimaryName,
  getTargetAddress,
  getANSGracePeriod,
  getName,
  getAccountNames,
  getAccountDomains,
  getAccountSubdomains,
  getDomainSubdomains,
  registerName,
} from "../../../src/internal/ans.js";

const mockedView = view as MockedFunction<typeof view>;
const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

const GRACE_SECONDS = 30 * 24 * 60 * 60;
// 30 minutes in the future, in seconds (the contract works in epoch seconds for get_expiration).
const FUTURE_EXPIRATION_SECONDS = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 365) / 1000);

const config = new AptosConfig({ network: Network.MAINNET });

const some = (value: unknown) => ({ vec: [value] });
const none = () => ({ vec: [] });

// Route `view` results by the function being called so each ANS read gets a
// realistic on-chain shape. Individual tests override as needed.
function defaultViewRouter(payload: { function: string }) {
  if (payload.function.endsWith("::config::reregistration_grace_sec")) {
    return [GRACE_SECONDS];
  }
  if (payload.function.endsWith("::router::get_expiration")) {
    return [FUTURE_EXPIRATION_SECONDS];
  }
  return [none()];
}

function rawName(overrides: Record<string, any> = {}) {
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().replace("Z", "");
  return {
    domain: "alice",
    subdomain: null,
    token_standard: "v2",
    is_primary: true,
    owner_address: AccountAddress.ONE.toString(),
    registered_address: AccountAddress.ONE.toString(),
    expiration_timestamp: future,
    domain_expiration_timestamp: future,
    subdomain_expiration_policy: 0,
    ...overrides,
  };
}

beforeEach(() => {
  mockedView.mockReset();
  mockedView.mockImplementation(async ({ payload }: any) => defaultViewRouter(payload) as any);
  mockedGenerateTransaction.mockReset();
  mockedGenerateTransaction.mockResolvedValue("SENTINEL_TXN" as never);
});

describe("internal/ans view-backed reads", () => {
  it("getOwnerAddress returns the unwrapped owner or undefined", async () => {
    mockedView.mockResolvedValueOnce([some(AccountAddress.TWO.toString())] as any);
    const owner = await getOwnerAddress({ aptosConfig: config, name: "bob.alice" });
    expect(owner?.toString()).toBe(AccountAddress.TWO.toString());

    const call = mockedView.mock.calls[0][0] as any;
    expect(call.payload.function).toMatch(/::router::get_owner_addr$/);
    expect(call.payload.functionArguments).toEqual(["alice", "bob"]);

    mockedView.mockResolvedValueOnce([none()] as any);
    expect(await getOwnerAddress({ aptosConfig: config, name: "alice" })).toBeUndefined();
  });

  it("getExpiration multiplies seconds to ms, and returns undefined when view throws", async () => {
    mockedView.mockResolvedValueOnce([1000] as any);
    expect(await getExpiration({ aptosConfig: config, name: "alice" })).toBe(1_000_000);

    mockedView.mockRejectedValueOnce(new Error("name not found"));
    expect(await getExpiration({ aptosConfig: config, name: "ghost" })).toBeUndefined();
  });

  it("getPrimaryName joins subdomain.domain, or returns undefined with no domain", async () => {
    mockedView.mockResolvedValueOnce([some("bob"), some("alice")] as any);
    expect(await getPrimaryName({ aptosConfig: config, address: AccountAddress.ONE })).toBe("bob.alice");

    mockedView.mockResolvedValueOnce([some("alice"), some("alice")] as any);
    expect(await getPrimaryName({ aptosConfig: config, address: AccountAddress.ONE })).toBe("alice.alice");

    mockedView.mockResolvedValueOnce([none(), none()] as any);
    expect(await getPrimaryName({ aptosConfig: config, address: AccountAddress.ONE })).toBeUndefined();
  });

  it("getTargetAddress returns the unwrapped target or undefined", async () => {
    mockedView.mockResolvedValueOnce([some(AccountAddress.TWO.toString())] as any);
    const target = await getTargetAddress({ aptosConfig: config, name: "alice" });
    expect(target?.toString()).toBe(AccountAddress.TWO.toString());

    mockedView.mockResolvedValueOnce([none()] as any);
    expect(await getTargetAddress({ aptosConfig: config, name: "alice" })).toBeUndefined();
  });

  it("getANSGracePeriod returns the seconds reported by the contract", async () => {
    mockedView.mockResolvedValueOnce([GRACE_SECONDS] as any);
    expect(await getANSGracePeriod({ aptosConfig: config })).toBe(GRACE_SECONDS);
  });

  it("getRouterAddress throws on networks without an ANS deployment", async () => {
    const custom = new AptosConfig({ network: Network.CUSTOM, fullnode: "http://localhost/v1" });
    await expect(getOwnerAddress({ aptosConfig: custom, name: "alice" })).rejects.toThrow(
      "The ANS contract is not deployed to custom",
    );
  });
});

describe("internal/ans indexer-backed reads", () => {
  function enqueueNames(mock: ReturnType<typeof createMockClient>, names: any[], total = names.length) {
    mock.enqueue({
      data: {
        data: {
          current_aptos_names: names,
          current_aptos_names_aggregate: { aggregate: { count: total } },
        },
      },
    });
  }

  it("getName returns a sanitized name when found and undefined otherwise", async () => {
    const mock = createMockClient();
    enqueueNames(mock, [rawName()]);

    const result = await getName({ aptosConfig: mock.config, name: "alice" });
    expect(result?.domain).toBe("alice");
    expect(result?.expiration_status).toBe(ExpirationStatus.Active);
    // ISO timestamp gets a trailing Z appended by sanitizeANSName.
    expect(result?.expiration_timestamp.endsWith("Z")).toBe(true);

    const body = mock.requests[0]?.body as { variables?: { where_condition?: any; limit?: number } };
    expect(body.variables?.where_condition).toEqual({ domain: { _eq: "alice" }, subdomain: { _eq: "" } });
    expect(body.variables?.limit).toBe(1);

    const empty = createMockClient();
    enqueueNames(empty, []);
    expect(await getName({ aptosConfig: empty.config, name: "ghost" })).toBeUndefined();
  });

  it("getAccountNames filters by owner_address and returns names + total", async () => {
    const mock = createMockClient();
    enqueueNames(mock, [rawName(), rawName({ domain: "bob" })], 2);

    const { names, total } = await getAccountNames({
      aptosConfig: mock.config,
      accountAddress: AccountAddress.ONE,
      options: { limit: 10, offset: 0 },
    });

    expect(names).toHaveLength(2);
    expect(total).toBe(2);
    const where = (mock.requests[0]?.body as any).variables.where_condition;
    expect(where.owner_address).toEqual({ _eq: AccountAddress.ONE.toString() });
    expect(typeof where.expiration_timestamp._gte).toBe("string");
  });

  it("getAccountDomains constrains subdomain to the empty string", async () => {
    const mock = createMockClient();
    enqueueNames(mock, [rawName()]);

    await getAccountDomains({ aptosConfig: mock.config, accountAddress: AccountAddress.ONE });
    const where = (mock.requests[0]?.body as any).variables.where_condition;
    expect(where.subdomain).toEqual({ _eq: "" });
    expect(where.owner_address).toEqual({ _eq: AccountAddress.ONE.toString() });
  });

  it("getAccountSubdomains constrains subdomain to non-empty", async () => {
    const mock = createMockClient();
    enqueueNames(mock, [rawName({ subdomain: "bob" })]);

    const { names } = await getAccountSubdomains({ aptosConfig: mock.config, accountAddress: AccountAddress.ONE });
    expect(names[0].subdomain).toBe("bob");
    const where = (mock.requests[0]?.body as any).variables.where_condition;
    expect(where.subdomain).toEqual({ _neq: "" });
  });

  it("getDomainSubdomains queries by domain and non-empty subdomain", async () => {
    const mock = createMockClient();
    enqueueNames(mock, [rawName({ subdomain: "bob" })]);

    await getDomainSubdomains({ aptosConfig: mock.config, domain: "alice" });
    const where = (mock.requests[0]?.body as any).variables.where_condition;
    expect(where.domain).toEqual({ _eq: "alice" });
    expect(where.subdomain).toEqual({ _neq: "" });
  });

  it("merges caller-supplied where conditions into the indexer query", async () => {
    const mock = createMockClient();
    enqueueNames(mock, []);
    await getAccountNames({
      aptosConfig: mock.config,
      accountAddress: AccountAddress.ONE,
      options: { where: { token_standard: { _eq: "v2" } } },
    });
    const where = (mock.requests[0]?.body as any).variables.where_condition;
    expect(where.token_standard).toEqual({ _eq: "v2" });
  });
});

describe("internal/ans registerName", () => {
  const sender = AccountAddress.ONE;

  it("registers a domain via router::register_domain (1 year)", async () => {
    const result = await registerName({
      aptosConfig: config,
      sender,
      name: "alice",
      expiration: { policy: "domain" },
    });

    expect(result.transaction).toBe("SENTINEL_TXN");
    expect(result.data.function).toMatch(/::router::register_domain$/);
    expect(result.data.functionArguments[0]).toBe("alice");
    expect(result.data.functionArguments[1]).toBe(31_536_000);
  });

  it("rejects multi-year domain registration", async () => {
    await expect(
      registerName({
        aptosConfig: config,
        sender,
        name: "alice",
        expiration: { policy: "domain", years: 2 as never },
      }),
    ).rejects.toThrow("names can only be registered for 1 year at a time");
  });

  it("rejects a subdomain name without a subdomain expiration policy", async () => {
    await expect(
      registerName({
        aptosConfig: config,
        sender,
        name: "bob.alice",
        expiration: { policy: "domain" },
      }),
    ).rejects.toThrow("Subdomains must have an expiration policy");
  });

  it("rejects a subdomain policy when no subdomain is present in the name", async () => {
    await expect(
      registerName({
        aptosConfig: config,
        sender,
        name: "alice",
        expiration: { policy: "subdomain:follow-domain" },
      }),
    ).rejects.toThrow("Policy is set to subdomain:follow-domain but no subdomain was provided");
  });

  it("registers an independent subdomain via router::register_subdomain", async () => {
    const expirationDate = (FUTURE_EXPIRATION_SECONDS - 100) * 1000;
    const result = await registerName({
      aptosConfig: config,
      sender,
      name: "bob.alice",
      expiration: { policy: "subdomain:independent", expirationDate },
      transferable: true,
    });

    expect(result.data.function).toMatch(/::router::register_subdomain$/);
    expect(result.data.functionArguments[0]).toBe("alice");
    expect(result.data.functionArguments[1]).toBe("bob");
    // follow-domain flag is 0 for independent, transferable flips to true
    expect(result.data.functionArguments[3]).toBe(0);
    expect(result.data.functionArguments[4]).toBe(true);
  });

  it("throws when the parent domain does not exist", async () => {
    mockedView.mockImplementation(async ({ payload }: any) => {
      if (payload.function.endsWith("::router::get_expiration")) {
        throw new Error("no such domain");
      }
      return defaultViewRouter(payload) as any;
    });

    await expect(
      registerName({
        aptosConfig: config,
        sender,
        name: "bob.alice",
        expiration: { policy: "subdomain:follow-domain" },
      }),
    ).rejects.toThrow("The domain does not exist");
  });

  it("throws when the subdomain expiration exceeds the domain expiration", async () => {
    const expirationDate = (FUTURE_EXPIRATION_SECONDS + 1_000_000) * 1000;
    await expect(
      registerName({
        aptosConfig: config,
        sender,
        name: "bob.alice",
        expiration: { policy: "subdomain:independent", expirationDate },
      }),
    ).rejects.toThrow("subdomain expiration time cannot be greater than the domain expiration time");
  });
});
