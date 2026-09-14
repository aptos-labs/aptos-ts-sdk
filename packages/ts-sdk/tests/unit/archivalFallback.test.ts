// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { type MockInstance, vi } from "vitest";
import { AptosApiError, AptosConfig, ClientRequest, ClientResponse, Network } from "../../src";
import { aptosRequest } from "../../src/client/core";
import { AptosApiType } from "../../src/utils/const";

const NODE_URL = "https://api.testnet.aptoslabs.com/v1";
const ARCHIVAL_URL = "https://archive.testnet.staging.aptoslabs.com/v1";
const PATH = "blocks/by_height/1";

const prunedBody = (archivalEndpoint?: string) => ({
  error_code: "block_pruned",
  message: "Ledger version(1) has been pruned",
  hint: "The requested data has been pruned from this node. Retry your request against the archival endpoint to access full history.",
  oldest_ledger_version: "10255283755",
  ...(archivalEndpoint === undefined ? {} : { archival_endpoint: archivalEndpoint }),
});

type RecordedRequest = ClientRequest<any> & { headers: Record<string, any> };

/** A transport stub that answers per request and records what was put on the wire. */
function stubClient(responder: (request: ClientRequest<any>) => Partial<ClientResponse<any>> | Error) {
  const requests: RecordedRequest[] = [];
  const client = {
    provider: async <Req, Res>(request: ClientRequest<Req>): Promise<ClientResponse<Res>> => {
      requests.push({ ...request, headers: request.headers ?? {} });
      const result = responder(request);
      if (result instanceof Error) {
        throw result;
      }
      return { status: 200, statusText: "OK", data: undefined as Res, headers: {}, ...result } as ClientResponse<Res>;
    },
  };
  return { client, requests };
}

/** A transport that returns a pruning 410 from the node and the given response from the archival endpoint. */
function stubPrunedNode(archival: Partial<ClientResponse<any>> | Error, archivalEndpoint = ARCHIVAL_URL) {
  return stubClient((request) =>
    request.url.startsWith(NODE_URL)
      ? { status: 410, statusText: "Gone", data: prunedBody(archivalEndpoint) }
      : archival,
  );
}

function makeRequest(config: AptosConfig, overrides?: ClientRequest<any>["overrides"]) {
  return aptosRequest<{}, any>(
    { url: NODE_URL, method: "GET", path: PATH, originMethod: "getBlockByHeight", overrides },
    config,
    AptosApiType.FULLNODE,
  );
}

describe("archival fallback", () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("retries a pruned request against the advertised archival endpoint and returns the result", async () => {
    const { client, requests } = stubPrunedNode({ status: 200, data: { block_height: "1" } });
    const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

    const response = await makeRequest(config);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ block_height: "1" });
    expect(response.url).toBe(`${ARCHIVAL_URL}/${PATH}`);
    expect(requests.map((r) => r.url)).toEqual([`${NODE_URL}/${PATH}`, `${ARCHIVAL_URL}/${PATH}`]);
  });

  it("preserves method, body, content type, params and headers on the retry", async () => {
    const { client, requests } = stubPrunedNode({ status: 200, data: [] });
    const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

    await aptosRequest<{}, any>(
      {
        url: NODE_URL,
        method: "POST",
        path: "view",
        body: { function: "0x1::coin::balance" },
        contentType: "application/json",
        params: { ledger_version: "1" },
        overrides: { API_KEY: "secret-key", HEADERS: { "x-custom": "kept" } },
      },
      config,
      AptosApiType.FULLNODE,
    );

    const [original, retry] = requests;
    expect(retry.method).toBe("POST");
    expect(retry.body).toEqual(original.body);
    expect(retry.params).toEqual(original.params);
    expect(retry.headers["content-type"]).toBe("application/json");
    expect(retry.headers["x-custom"]).toBe("kept");
    expect(retry.headers.Authorization).toBe("Bearer secret-key");
  });

  it("retries exactly once and never chains when the archival endpoint is also pruned", async () => {
    const { client, requests } = stubClient(() => ({
      status: 410,
      statusText: "Gone",
      data: prunedBody(ARCHIVAL_URL),
    }));
    const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

    await expect(makeRequest(config)).rejects.toThrow(AptosApiError);
    expect(requests).toHaveLength(2);
  });

  describe("credential forwarding", () => {
    it("drops credentials when the archival endpoint is on a different site", async () => {
      const { client, requests } = stubPrunedNode({ status: 200, data: {} }, "https://archive.example.com/v1");
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      await makeRequest(config, {
        API_KEY: "secret-key",
        AUTH_TOKEN: "secret-token",
        HEADERS: { Authorization: "Bearer header-key", Cookie: "session=1", "x-custom": "kept" },
      });

      const retryHeaders = requests[1].headers;
      expect(retryHeaders.Authorization).toBeUndefined();
      expect(retryHeaders.Cookie).toBeUndefined();
      expect(retryHeaders["x-custom"]).toBe("kept");
      expect(JSON.stringify(retryHeaders)).not.toContain("secret");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain("https://archive.example.com/v1");
    });

    it("does not warn when there were no credentials to drop", async () => {
      const { client } = stubPrunedNode({ status: 200, data: {} }, "https://archive.example.com/v1");
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      await makeRequest(config, { HEADERS: { "x-custom": "kept" } });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("endpoints that are not retried", () => {
    it.each([
      ["the field is absent", undefined],
      ["the endpoint is not a valid absolute URL", "not-a-url"],
      ["the endpoint is not http(s)", "ftp://archive.testnet.aptoslabs.com/v1"],
      ["the endpoint downgrades https to plaintext", "http://archive.testnet.aptoslabs.com/v1"],
    ])("throws the original error when %s", async (_label, archivalEndpoint) => {
      const { client, requests } = stubClient(() => ({
        status: 410,
        statusText: "Gone",
        data: prunedBody(archivalEndpoint),
      }));
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      const error = await makeRequest(config).catch((e) => e);

      expect(error).toBeInstanceOf(AptosApiError);
      expect(error.status).toBe(410);
      expect(error.url).toBe(`${NODE_URL}/${PATH}`);
      expect(requests).toHaveLength(1);
    });

    it("is not applied to non-fullnode requests", async () => {
      const { client, requests } = stubPrunedNode({ status: 200, data: {} });
      const config = new AptosConfig({ network: Network.TESTNET, pepper: NODE_URL, client });

      await expect(
        aptosRequest<{}, any>({ url: NODE_URL, method: "GET", path: PATH }, config, AptosApiType.PEPPER),
      ).rejects.toThrow(AptosApiError);
      expect(requests).toHaveLength(1);
    });

    it("is not applied when archivalFallback is disabled", async () => {
      const { client, requests } = stubPrunedNode({ status: 200, data: {} });
      const config = new AptosConfig({
        network: Network.TESTNET,
        fullnode: NODE_URL,
        client,
        archivalFallback: false,
      });

      await expect(makeRequest(config)).rejects.toThrow(AptosApiError);
      expect(requests).toHaveLength(1);
    });

    it("is not applied to non-410 failures", async () => {
      const { client, requests } = stubClient(() => ({
        status: 404,
        statusText: "Not Found",
        data: { error_code: "block_not_found", message: "not found", archival_endpoint: ARCHIVAL_URL },
      }));
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      await expect(makeRequest(config)).rejects.toThrow(AptosApiError);
      expect(requests).toHaveLength(1);
    });
  });

  describe("when the retry itself fails", () => {
    it("surfaces the archival error when the archival endpoint returns a failure", async () => {
      const { client } = stubPrunedNode({ status: 404, statusText: "Not Found", data: { message: "gone forever" } });
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      const error = await makeRequest(config).catch((e) => e);

      expect(error).toBeInstanceOf(AptosApiError);
      expect(error.status).toBe(404);
      expect(error.url).toBe(`${ARCHIVAL_URL}/${PATH}`);
    });

    it("surfaces the original pruning error when the archival endpoint is unreachable", async () => {
      const { client } = stubPrunedNode(new Error("ENOTFOUND"));
      const config = new AptosConfig({ network: Network.TESTNET, fullnode: NODE_URL, client });

      const error = await makeRequest(config).catch((e) => e);

      expect(error).toBeInstanceOf(AptosApiError);
      expect(error.status).toBe(410);
      expect(error.url).toBe(`${NODE_URL}/${PATH}`);
      expect(error.message).toContain("block_pruned");
    });
  });
});
