// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";
import { AptosApiType } from "../../src/utils/const.js";

vi.mock("../../src/client/core.js", () => ({
  aptosRequest: vi.fn(),
}));

import { aptosRequest } from "../../src/client/core.js";
import {
  postAptosFaucet,
  postAptosIndexer,
  postAptosPepperService,
  postAptosProvingService,
} from "../../src/client/post.js";

const mockRequest = aptosRequest as MockedFunction<typeof aptosRequest>;

describe("client/post helpers", () => {
  const aptosConfig = new AptosConfig({
    network: Network.LOCAL,
    clientConfig: { API_KEY: "secret-key", HEADERS: { "x-client": "1" } },
    faucetConfig: { HEADERS: { "x-faucet": "2" } },
    indexerConfig: { HEADERS: { "x-indexer": "3" } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      url: "http://example.com",
      headers: {},
    });
  });

  it("postAptosFaucet strips API_KEY from client config before posting", async () => {
    await postAptosFaucet({
      aptosConfig,
      originMethod: "fundAccount",
      path: "fund",
      body: { amount: 1 },
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        originMethod: "fundAccount",
        path: "fund",
        overrides: expect.objectContaining({
          HEADERS: { "x-client": "1", "x-faucet": "2" },
        }),
      }),
      expect.anything(),
      AptosApiType.FAUCET,
    );
    const overrides = mockRequest.mock.calls[0][0].overrides as { API_KEY?: string };
    expect(overrides.API_KEY).toBeUndefined();
  });

  it("postAptosIndexer merges indexer and client headers", async () => {
    await postAptosIndexer({
      aptosConfig,
      originMethod: "queryIndexer",
      path: "",
      body: { query: "{ __typename }" },
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        overrides: expect.objectContaining({
          HEADERS: { "x-client": "1", "x-indexer": "3" },
        }),
      }),
      expect.anything(),
      AptosApiType.INDEXER,
    );
  });

  it("postAptosPepperService targets the pepper API type", async () => {
    await postAptosPepperService({
      aptosConfig,
      originMethod: "getPepper",
      path: "fetch",
      body: {},
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ originMethod: "getPepper", path: "fetch" }),
      expect.anything(),
      AptosApiType.PEPPER,
    );
  });

  it("postAptosProvingService targets the prover API type", async () => {
    await postAptosProvingService({
      aptosConfig,
      originMethod: "getProof",
      path: "prove",
      body: {},
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ originMethod: "getProof", path: "prove" }),
      expect.anything(),
      AptosApiType.PROVER,
    );
  });
});
