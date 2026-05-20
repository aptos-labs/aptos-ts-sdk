// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { expect } from "vitest";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";
import type { AptosSettings, Client, ClientRequest, ClientResponse } from "../../src/types/index.js";

export type RecordedRequest = ClientRequest<unknown>;

export type MockResponse<Res = unknown> = {
  status?: number;
  statusText?: string;
  data: Res;
  headers?: Record<string, string>;
};

type Responder = (req: RecordedRequest) => MockResponse<unknown> | Promise<MockResponse<unknown>>;

export interface MockClient {
  config: AptosConfig;
  client: Client;
  requests: RecordedRequest[];
  /** Queue a single response for the next request. */
  enqueue<Res>(response: MockResponse<Res>): void;
  /** Set a default response used when the queue is empty. */
  setDefault<Res>(response: MockResponse<Res>): void;
  /** Replace the responder with a function — useful for routing per URL/body. */
  setResponder(responder: Responder): void;
  /** Throw a network-style error on the next request (rejects the Promise). */
  enqueueError(err: Error): void;
  /** Reset queued/default responses and recorded requests. */
  reset(): void;
}

const DEFAULT_RESPONSE: MockResponse<unknown> = {
  status: 200,
  statusText: "OK",
  data: {},
  headers: {},
};

/**
 * Build a mocked AptosConfig whose underlying Client records every request and
 * returns canned responses. Designed for unit tests that need to assert both
 * the *outgoing request shape* (URL/method/body/headers/params) and the
 * *parsed result* coming back through src/client/core.ts. Hitting both halves
 * is required by the meaningful-assertion rules in the coverage design doc.
 *
 * Usage:
 *   const mock = createMockClient({ network: Network.LOCAL });
 *   mock.enqueue({ data: { sequence_number: "7" } });
 *   const result = await someInternalFn(mock.config, ...);
 *   expectRequest(mock.requests[0], { method: "GET", urlIncludes: "/accounts/" });
 *   expect(result.sequence_number).toBe("7");
 */
export function createMockClient(settings: AptosSettings = { network: Network.LOCAL }): MockClient {
  const requests: RecordedRequest[] = [];
  const queue: Array<MockResponse<unknown> | { __error: Error }> = [];
  let defaultResponse: MockResponse<unknown> = { ...DEFAULT_RESPONSE };
  let responder: Responder | undefined;

  const client: Client = {
    async provider<Req, Res>(request: ClientRequest<Req>): Promise<ClientResponse<Res>> {
      requests.push(request as RecordedRequest);

      if (responder) {
        const r = await responder(request as RecordedRequest);
        return materialize<Res>(r);
      }

      const next = queue.shift();
      if (next && "__error" in next) {
        throw next.__error;
      }
      const r = (next as MockResponse<unknown> | undefined) ?? defaultResponse;
      return materialize<Res>(r);
    },
  };

  const config = new AptosConfig({ ...settings, client });

  return {
    config,
    client,
    requests,
    enqueue<Res>(response: MockResponse<Res>) {
      queue.push(response);
    },
    setDefault<Res>(response: MockResponse<Res>) {
      defaultResponse = response;
    },
    setResponder(fn: Responder) {
      responder = fn;
    },
    enqueueError(err: Error) {
      queue.push({ __error: err });
    },
    reset() {
      requests.length = 0;
      queue.length = 0;
      defaultResponse = { ...DEFAULT_RESPONSE };
      responder = undefined;
    },
  };
}

function materialize<Res>(r: MockResponse<unknown>): ClientResponse<Res> {
  return {
    status: r.status ?? 200,
    statusText: r.statusText ?? "OK",
    data: r.data as Res,
    headers: r.headers ?? {},
    config: undefined,
    request: undefined,
  };
}

export interface RequestExpectation {
  method?: "GET" | "POST";
  url?: string;
  urlIncludes?: string | RegExp;
  originMethod?: string;
  contentType?: string;
  body?: unknown;
  params?: unknown;
  headerIncludes?: Record<string, string | RegExp>;
}

/**
 * Assert that a recorded request matches the expectation. Use alongside the
 * mocked client's `requests` array so every test verifies the outgoing shape
 * in addition to the parsed return value.
 */
export function expectRequest(actual: RecordedRequest | undefined, expected: RequestExpectation): void {
  expect(actual, "no request recorded at this index").toBeDefined();
  const req = actual!;

  if (expected.method !== undefined) {
    expect(req.method).toBe(expected.method);
  }
  if (expected.url !== undefined) {
    expect(req.url).toBe(expected.url);
  }
  if (expected.urlIncludes !== undefined) {
    if (expected.urlIncludes instanceof RegExp) {
      expect(req.url).toMatch(expected.urlIncludes);
    } else {
      expect(req.url).toContain(expected.urlIncludes);
    }
  }
  if (expected.originMethod !== undefined) {
    // aptosRequest folds `originMethod` into the
    // `x-aptos-typescript-sdk-origin-method` header before reaching the
    // Client.provider call, so that's what we have to verify here.
    const header = req.headers?.["x-aptos-typescript-sdk-origin-method"];
    expect(String(header)).toBe(expected.originMethod);
  }
  if (expected.contentType !== undefined) {
    expect(req.contentType).toBe(expected.contentType);
  }
  if (expected.body !== undefined) {
    expect(req.body).toEqual(expected.body);
  }
  if (expected.params !== undefined) {
    expect(req.params).toEqual(expected.params);
  }
  if (expected.headerIncludes !== undefined) {
    for (const [key, val] of Object.entries(expected.headerIncludes)) {
      const headerVal = req.headers?.[key];
      if (val instanceof RegExp) {
        expect(String(headerVal)).toMatch(val);
      } else {
        expect(String(headerVal)).toBe(val);
      }
    }
  }
}
