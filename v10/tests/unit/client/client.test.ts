// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";
import { aptosRequest } from "../../../src/client/aptos-request.js";
import { get, paginateWithCursor } from "../../../src/client/get.js";
import { post } from "../../../src/client/post.js";
import type { Client } from "../../../src/client/types.js";
import { AptosApiType, MimeType } from "../../../src/client/types.js";
import { AptosApiError } from "../../../src/core/errors.js";

// Mock @aptos-labs/aptos-client — aptosRequest delegates to this
vi.mock("@aptos-labs/aptos-client", () => ({
  jsonRequest: vi.fn(),
  bcsRequest: vi.fn(),
}));

import { bcsRequest, jsonRequest } from "@aptos-labs/aptos-client";

const mockClient = vi.mocked(jsonRequest);
const mockBcsClient = vi.mocked(bcsRequest);

/** Build a mock AptosClientResponse for JSON calls. */
function mockJsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return { status, statusText: status === 200 ? "OK" : "Error", data, headers };
}

// ── aptosRequest ──

describe("aptosRequest", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("makes a GET request and parses JSON response", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ chain_id: 4 }));

    const result = await aptosRequest<{ chain_id: number }>(
      { url: "http://localhost:8080/v1", method: "GET", path: "" },
      AptosApiType.FULLNODE,
    );

    expect(result.status).toBe(200);
    expect(result.data.chain_id).toBe(4);
  });

  it("includes SDK headers", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE);

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.headers["x-aptos-client"]).toMatch(/^aptos-typescript-sdk\//);
    expect(requestArg.headers["content-type"]).toBe(MimeType.JSON);
    expect(requestArg.headers.accept).toBe(MimeType.JSON);
  });

  it("includes origin method header when provided", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "GET", path: "", originMethod: "getBalance" },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.headers["x-aptos-typescript-sdk-origin-method"]).toBe("getBalance");
  });

  it("passes params to aptos-client for query string handling", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "GET", path: "accounts", params: { limit: "25", start: "0" } },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.url).toBe("http://localhost:8080/v1/accounts");
    expect(requestArg.params).toEqual({ limit: "25", start: "0" });
  });

  it("filters out undefined param values", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      {
        url: "http://localhost:8080/v1",
        method: "GET",
        path: "accounts",
        params: { limit: "25", start: undefined },
      },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.params).toEqual({ limit: "25" });
  });

  it("sends POST body to aptos-client", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      { url: "http://localhost:8080/v1", method: "POST", path: "transactions", body: { sender: "0x1" } },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.method).toBe("POST");
    expect(requestArg.body).toEqual({ sender: "0x1" });
  });

  it("throws AptosApiError on 401", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ message: "Unauthorized" }, 401));

    await expect(
      aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE),
    ).rejects.toThrow(AptosApiError);
  });

  it("throws AptosApiError on non-2xx status", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ message: "Not found" }, 404));

    await expect(
      aptosRequest({ url: "http://localhost:8080/v1", method: "GET", path: "" }, AptosApiType.FULLNODE),
    ).rejects.toThrow(AptosApiError);
  });

  it("throws on indexer errors", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ errors: [{ message: "bad query" }] }));

    await expect(
      aptosRequest({ url: "http://localhost:8090/v1/graphql", method: "POST", path: "" }, AptosApiType.INDEXER),
    ).rejects.toThrow(AptosApiError);
  });

  it("unwraps indexer data wrapper", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ data: { account: { balance: 100 } } }));

    const result = await aptosRequest<{ account: { balance: number } }>(
      { url: "http://localhost:8090/v1/graphql", method: "POST", path: "" },
      AptosApiType.INDEXER,
    );

    expect(result.data).toEqual({ account: { balance: 100 } });
  });

  it("handles BCS response via bcsRequest", async () => {
    const bcsData = new Uint8Array([1, 2, 3, 4]);
    mockBcsClient.mockResolvedValueOnce({
      status: 200,
      statusText: "OK",
      data: Buffer.from(bcsData),
      headers: {},
    });

    const result = await aptosRequest<Uint8Array>(
      { url: "http://localhost:8080/v1", method: "GET", path: "", acceptType: MimeType.BCS },
      AptosApiType.FULLNODE,
    );

    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data).toEqual(bcsData);
    expect(mockBcsClient).toHaveBeenCalledTimes(1);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it("merges custom headers from overrides", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      {
        url: "http://localhost:8080/v1",
        method: "GET",
        path: "",
        overrides: { HEADERS: { "x-custom": "value" }, API_KEY: "test-key" },
      },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.headers["x-custom"]).toBe("value");
    expect(requestArg.headers.Authorization).toBe("Bearer test-key");
  });

  it("prefers AUTH_TOKEN over API_KEY", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({}));

    await aptosRequest(
      {
        url: "http://localhost:8080/v1",
        method: "GET",
        path: "",
        overrides: { AUTH_TOKEN: "my-token", API_KEY: "my-key" },
      },
      AptosApiType.FULLNODE,
    );

    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.headers.Authorization).toBe("Bearer my-token");
  });
});

// ── get / post helpers ──

describe("get helper", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to aptosRequest with GET method", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ ledger_version: "1" }));

    const result = await get<{ ledger_version: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "",
      originMethod: "getLedgerInfo",
    });

    expect(result.data.ledger_version).toBe("1");
    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.method).toBe("GET");
  });
});

describe("post helper", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to aptosRequest with POST method", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse({ hash: "0xabc" }));

    const result = await post<{ hash: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "transactions",
      originMethod: "submitTransaction",
      body: { sender: "0x1" },
    });

    expect(result.data.hash).toBe("0xabc");
    const requestArg = mockClient.mock.calls[0][0];
    expect(requestArg.method).toBe("POST");
  });
});

// ── paginateWithCursor ──

describe("paginateWithCursor", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all pages until no cursor", async () => {
    // Page 1: has cursor
    mockClient.mockResolvedValueOnce({
      status: 200,
      statusText: "OK",
      data: [{ id: 1 }, { id: 2 }],
      headers: { "x-aptos-cursor": "cursor_abc" },
    });
    // Page 2: no cursor
    mockClient.mockResolvedValueOnce(mockJsonResponse([{ id: 3 }]));

    const results = await paginateWithCursor<Array<{ id: number }>>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "accounts",
      originMethod: "getAccounts",
    });

    expect(results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  it("returns single page when no cursor", async () => {
    mockClient.mockResolvedValueOnce(mockJsonResponse([{ id: 1 }]));

    const results = await paginateWithCursor<Array<{ id: number }>>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "accounts",
      originMethod: "getAccounts",
    });

    expect(results).toEqual([{ id: 1 }]);
    expect(mockClient).toHaveBeenCalledTimes(1);
  });
});

// ── Custom client ──

describe("custom Client", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses custom client.sendRequest instead of jsonRequest/bcsRequest", async () => {
    const customClient: Client = {
      sendRequest: vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        data: { custom: true },
        headers: {},
      }),
    };

    const result = await aptosRequest<{ custom: boolean }>(
      { url: "http://localhost:8080/v1", method: "GET", path: "" },
      AptosApiType.FULLNODE,
      customClient,
    );

    expect(result.data).toEqual({ custom: true });
    expect(customClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient).not.toHaveBeenCalled();
    expect(mockBcsClient).not.toHaveBeenCalled();
  });

  it("forwards custom client through get helper", async () => {
    const customClient: Client = {
      sendRequest: vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        data: { via: "get" },
        headers: {},
      }),
    };

    const result = await get<{ via: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "",
      originMethod: "test",
      client: customClient,
    });

    expect(result.data).toEqual({ via: "get" });
    expect(customClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it("forwards custom client through post helper", async () => {
    const customClient: Client = {
      sendRequest: vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        data: { via: "post" },
        headers: {},
      }),
    };

    const result = await post<{ via: string }>({
      url: "http://localhost:8080/v1",
      apiType: AptosApiType.FULLNODE,
      path: "transactions",
      originMethod: "test",
      body: { sender: "0x1" },
      client: customClient,
    });

    expect(result.data).toEqual({ via: "post" });
    expect(customClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient).not.toHaveBeenCalled();
  });
});
