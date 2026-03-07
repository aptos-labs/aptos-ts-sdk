// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aptosRequest } from "../../../src/client/aptos-request.js";
import { get, paginateWithCursor } from "../../../src/client/get.js";
import { post } from "../../../src/client/post.js";
import { AptosApiType, MimeType } from "../../../src/client/types.js";
import { AptosApiError } from "../../../src/core/errors.js";

// ── aptosRequest ──

describe("aptosRequest", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("makes a GET request and parses JSON response", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ chain_id: 4 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await aptosRequest<{ chain_id: number }>(
      { url: "http://localhost:8080/v1", method: "GET", path: "" },
      AptosApiType.FULLNODE,
    );

    expect(result.status).toBe(200);
    expect(result.data.chain_id).toBe(4);
  });

  it("includes SDK headers", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE);

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-aptos-client"]).toMatch(/^aptos-typescript-sdk\//);
    expect(headers["content-type"]).toBe(MimeType.JSON);
    expect(headers.accept).toBe(MimeType.JSON);
  });

  it("includes origin method header when provided", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "GET", path: "", originMethod: "getBalance" },
      AptosApiType.FULLNODE,
    );

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-aptos-typescript-sdk-origin-method"]).toBe("getBalance");
  });

  it("builds query string from params", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "GET", path: "accounts", params: { limit: "25", start: "0" } },
      AptosApiType.FULLNODE,
    );

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://localhost:8080/v1/accounts?limit=25&start=0");
  });

  it("sends POST body as JSON", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "POST", path: "transactions", body: { sender: "0x1" } },
      AptosApiType.FULLNODE,
    );

    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"sender":"0x1"}');
  });

  it("throws AptosApiError on 401", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE),
    ).rejects.toThrow(AptosApiError);
  });

  it("throws AptosApiError on non-2xx status", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE),
    ).rejects.toThrow(AptosApiError);
  });

  it("throws on indexer errors", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ message: "bad query" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      aptosRequest({ url: "http://localhost:8090/v1/graphql", method: "POST", path: "" }, AptosApiType.INDEXER),
    ).rejects.toThrow(AptosApiError);
  });

  it("unwraps indexer data wrapper", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { account: { balance: 100 } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await aptosRequest<{ account: { balance: number } }>(
      { url: "http://localhost:8090/v1/graphql", method: "POST", path: "" },
      AptosApiType.INDEXER,
    );

    expect(result.data).toEqual({ account: { balance: 100 } });
  });

  it("handles BCS response", async () => {
    const bcsData = new Uint8Array([1, 2, 3, 4]);
    fetchSpy.mockResolvedValueOnce(
      new Response(bcsData, {
        status: 200,
        headers: { "content-type": "application/x-bcs" },
      }),
    );

    const result = await aptosRequest<Uint8Array>(
      { url: "http://localhost:8080/v1", method: "GET", path: "", acceptType: MimeType.BCS },
      AptosApiType.FULLNODE,
    );

    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data).toEqual(bcsData);
  });

  it("merges custom headers from overrides", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest(
      {
        url: "http://localhost:8080/v1",
        method: "GET",
        path: "",
        overrides: { HEADERS: { "x-custom": "value" }, API_KEY: "test-key" },
      },
      AptosApiType.FULLNODE,
    );

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-custom"]).toBe("value");
    expect(headers.Authorization).toBe("Bearer test-key");
  });

  it("prefers AUTH_TOKEN over API_KEY", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );

    await aptosRequest(
      {
        url: "http://localhost:8080/v1",
        method: "GET",
        path: "",
        overrides: { AUTH_TOKEN: "my-token", API_KEY: "my-key" },
      },
      AptosApiType.FULLNODE,
    );

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer my-token");
  });
});

// ── get / post helpers ──

describe("get helper", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("delegates to aptosRequest with GET method", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ledger_version: "1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await get<{ ledger_version: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "",
      originMethod: "getLedgerInfo",
    });

    expect(result.data.ledger_version).toBe("1");
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("GET");
  });
});

describe("post helper", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("delegates to aptosRequest with POST method", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ hash: "0xabc" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await post<{ hash: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "transactions",
      originMethod: "submitTransaction",
      body: { sender: "0x1" },
    });

    expect(result.data.hash).toBe("0xabc");
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("POST");
  });
});

// ── paginateWithCursor ──

describe("paginateWithCursor", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("fetches all pages until no cursor", async () => {
    // Page 1: has cursor
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), {
        status: 200,
        headers: { "content-type": "application/json", "x-aptos-cursor": "cursor_abc" },
      }),
    );
    // Page 2: no cursor
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 3 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const results = await paginateWithCursor<Array<{ id: number }>>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "accounts",
      originMethod: "getAccounts",
    });

    expect(results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("returns single page when no cursor", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const results = await paginateWithCursor<Array<{ id: number }>>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "accounts",
      originMethod: "getAccounts",
    });

    expect(results).toEqual([{ id: 1 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
