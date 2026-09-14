// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import {
  getAptosFullNode,
  getAptosPepperService,
  paginateWithCursor,
  paginateWithObfuscatedCursor,
  getPageWithObfuscatedCursor,
} from "../../../src/client/get.js";

describe("client/get helpers (mocked client)", () => {
  it("getAptosFullNode issues a GET against the fullnode base URL", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: { chain_id: 4 } });

    const response = await getAptosFullNode<{}, { chain_id: number }>({
      aptosConfig: mock.config,
      originMethod: "getLedgerInfo",
      path: "",
    });

    expect(response.data.chain_id).toBe(4);
    expectRequest(mock.requests[0], {
      method: "GET",
      originMethod: "getLedgerInfo",
    });
  });

  it("getAptosPepperService issues a GET against the pepper service URL", async () => {
    const mock = createMockClient({
      network: Network.TESTNET,
      pepper: "https://pepper.example.com",
    });
    mock.enqueue({ data: { ok: true } });

    const response = await getAptosPepperService<{}, { ok: boolean }>({
      aptosConfig: mock.config,
      originMethod: "pepperHealth",
      path: "health",
    });

    expect(response.data.ok).toBe(true);
    expect(mock.requests[0]?.url).toContain("pepper.example.com");
  });

  it("paginateWithCursor concatenates pages until the cursor header is absent", async () => {
    const mock = createMockClient();
    const seenStarts: Array<string | undefined> = [];
    mock.setResponder((req) => {
      seenStarts.push((req.params as { start?: string })?.start);
      const start = (req.params as { start?: string })?.start;
      if (!start) {
        return {
          data: [{ version: "1" }],
          headers: { "x-aptos-cursor": "page2" },
        };
      }
      return {
        data: [{ version: "2" }],
        headers: {},
      };
    });

    const rows = await paginateWithCursor<{}, Array<{ version: string }>>({
      aptosConfig: mock.config,
      originMethod: "getTransactions",
      path: "transactions",
      params: { limit: 1 },
    });

    expect(rows).toEqual([{ version: "1" }, { version: "2" }]);
    expect(mock.requests).toHaveLength(2);
    expect(seenStarts).toEqual([undefined, "page2"]);
  });

  it("getPageWithObfuscatedCursor maps cursor/limit params to start/limit", async () => {
    const mock = createMockClient();
    mock.enqueue({
      data: [{ version: "9" }],
      headers: { "x-aptos-cursor": "next" },
    });

    const { response, cursor } = await getPageWithObfuscatedCursor<{}, Array<{ version: string }>>({
      aptosConfig: mock.config,
      originMethod: "getTransactions",
      path: "transactions",
      params: { cursor: "abc", limit: 25 },
    });

    expect(response.data).toEqual([{ version: "9" }]);
    expect(cursor).toBe("next");
    expect(mock.requests[0]?.params).toEqual({ start: "abc", limit: 25 });
  });

  it("paginateWithObfuscatedCursor stops early when total limit is satisfied", async () => {
    const mock = createMockClient();
    let call = 0;
    mock.setResponder(() => {
      call += 1;
      return {
        data: [{ version: String(call) }],
        headers: call === 1 ? { "x-aptos-cursor": "more" } : {},
      };
    });

    const rows = await paginateWithObfuscatedCursor<{}, Array<{ version: string }>>({
      aptosConfig: mock.config,
      originMethod: "getTransactions",
      path: "transactions",
      params: { limit: 1 },
    });

    expect(rows).toEqual([{ version: "1" }]);
    expect(mock.requests).toHaveLength(1);
  });
});
