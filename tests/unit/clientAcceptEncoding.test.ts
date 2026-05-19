// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { request } from "../../src/client/core.js";
import type { Client, ClientRequest, ClientResponse } from "../../src/types/index.js";

// Build a fake Client that records the headers it was asked to send,
// then returns a benign success response.
function makeRecordingClient() {
  const calls: Array<ClientRequest<unknown>> = [];
  const client: Client = {
    async provider<Req, Res>(req: ClientRequest<Req>): Promise<ClientResponse<Res>> {
      calls.push(req as ClientRequest<unknown>);
      return {
        status: 200,
        statusText: "OK",
        data: {} as Res,
        headers: {},
        config: {} as ClientResponse<Res>["config"],
        request: undefined,
      } as ClientResponse<Res>;
    },
  };
  return { client, calls };
}

describe("request() — accept-encoding default (Bug 2 workaround)", () => {
  test("sends accept-encoding: identity by default", async () => {
    const { client, calls } = makeRecordingClient();

    await request(
      {
        url: "https://example.test/v1/foo",
        method: "GET",
        originMethod: "test",
      },
      client,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].headers).toBeDefined();
    expect((calls[0].headers as Record<string, string>)["accept-encoding"]).toBe("identity");
  });

  test("user-supplied accept-encoding via overrides.HEADERS takes precedence", async () => {
    const { client, calls } = makeRecordingClient();

    await request(
      {
        url: "https://example.test/v1/foo",
        method: "GET",
        originMethod: "test",
        overrides: { HEADERS: { "accept-encoding": "br, gzip" } },
      },
      client,
    );

    expect((calls[0].headers as Record<string, string>)["accept-encoding"]).toBe("br, gzip");
  });

  test("SDK-controlled headers (x-aptos-client, content-type) still win over user overrides", async () => {
    // Sanity check that introducing the new default didn't disturb the existing
    // "SDK headers override user headers" precedence for unrelated headers.
    const { client, calls } = makeRecordingClient();

    await request(
      {
        url: "https://example.test/v1/foo",
        method: "POST",
        originMethod: "test",
        overrides: {
          HEADERS: {
            "x-aptos-client": "should-be-ignored",
            "content-type": "text/plain",
          },
        },
      },
      client,
    );

    const headers = calls[0].headers as Record<string, string>;
    expect(headers["x-aptos-client"]).toMatch(/aptos-typescript-sdk\//);
    expect(headers["content-type"]).toBe("application/json");
  });
});
