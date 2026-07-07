// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { AptosApiType } from "../../../src/utils/const.js";
import { AptosApiError } from "../../../src/errors/index.js";
import { aptosRequest, request } from "../../../src/client/core.js";
import type { Client } from "../../../src/types/index.js";

describe("client/core request helpers", () => {
  const provider = vi.fn();
  const client = { provider } as unknown as Client;
  const aptosConfig = new AptosConfig({ network: Network.LOCAL, client: { provider } });

  beforeEach(() => {
    provider.mockReset();
  });

  it("request attaches AUTH_TOKEN as a bearer header", async () => {
    provider.mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {},
      headers: {},
      config: {},
      request: {},
    });

    await request(
      {
        url: "https://example.com/v1",
        method: "GET",
        originMethod: "testAuthToken",
        overrides: { AUTH_TOKEN: "auth-token" },
      },
      client,
    );

    expect(provider).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer auth-token",
        }),
      }),
    );
  });

  it("request prefers API_KEY over AUTH_TOKEN when both are provided", async () => {
    provider.mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {},
      headers: {},
      config: {},
      request: {},
    });

    await request(
      {
        url: "https://example.com/v1",
        method: "GET",
        originMethod: "testAuth",
        overrides: { AUTH_TOKEN: "auth-token", API_KEY: "api-key" },
      },
      client,
    );

    expect(provider).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer api-key",
        }),
      }),
    );
  });

  it("aptosRequest throws AptosApiError on 401 responses", async () => {
    provider.mockResolvedValue({
      status: 401,
      statusText: "Unauthorized",
      data: { message: "bad key" },
      headers: {},
      config: {},
      request: {},
    });

    await expect(
      aptosRequest(
        { url: "https://example.com/v1", method: "GET", originMethod: "unauthorized", path: "" },
        aptosConfig,
        AptosApiType.FULLNODE,
      ),
    ).rejects.toBeInstanceOf(AptosApiError);
  });

  it("aptosRequest throws AptosApiError for pepper service 4xx responses", async () => {
    provider.mockResolvedValue({
      status: 400,
      statusText: "Bad Request",
      data: { message: "bad pepper request" },
      headers: {},
      config: {},
      request: {},
    });

    await expect(
      aptosRequest(
        { url: "https://pepper.example/v0", method: "POST", originMethod: "getPepper", path: "fetch" },
        aptosConfig,
        AptosApiType.PEPPER,
      ),
    ).rejects.toBeInstanceOf(AptosApiError);
  });

  it("aptosRequest throws AptosApiError for prover service 4xx responses", async () => {
    provider.mockResolvedValue({
      status: 500,
      statusText: "Internal Server Error",
      data: { message: "prover down" },
      headers: {},
      config: {},
      request: {},
    });

    await expect(
      aptosRequest(
        { url: "https://prover.example/v0", method: "POST", originMethod: "getProof", path: "prove" },
        aptosConfig,
        AptosApiType.PROVER,
      ),
    ).rejects.toBeInstanceOf(AptosApiError);
  });
});
