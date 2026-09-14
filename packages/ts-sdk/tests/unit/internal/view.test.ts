// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { viewJson } from "../../../src/internal/view.js";
import { AptosApiError } from "../../../src/errors/index.js";

describe("internal/view.viewJson (mocked client)", () => {
  it("POSTs the JSON view payload and returns the array of MoveValues", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: ["7"] });

    const result = await viewJson<[string]>({
      aptosConfig: mock.config,
      payload: {
        function: "0x1::coin::balance",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: ["0xdead"],
      },
    });

    expect(result).toEqual(["7"]);
    expect(mock.requests).toHaveLength(1);
    expectRequest(mock.requests[0], {
      method: "POST",
      originMethod: "viewJson",
      urlIncludes: "/view",
      body: {
        function: "0x1::coin::balance",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: ["0xdead"],
      },
    });
  });

  it("defaults type_arguments and arguments to empty arrays when omitted", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: [] });

    await viewJson({
      aptosConfig: mock.config,
      payload: { function: "0x1::chain_id::get" },
    });

    expect(mock.requests[0]?.body).toEqual({
      function: "0x1::chain_id::get",
      type_arguments: [],
      arguments: [],
    });
  });

  it("forwards ledgerVersion as a query param when supplied", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: [] });

    await viewJson({
      aptosConfig: mock.config,
      payload: { function: "0x1::chain_id::get" },
      options: { ledgerVersion: 123 },
    });

    expect(mock.requests[0]?.params).toEqual({ ledger_version: 123 });
  });

  it("sends ledger_version: undefined when options are not supplied", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: [] });

    await viewJson({
      aptosConfig: mock.config,
      payload: { function: "0x1::chain_id::get" },
    });

    expect(mock.requests[0]?.params).toEqual({ ledger_version: undefined });
  });

  it("throws AptosApiError on a fullnode 4xx response", async () => {
    const mock = createMockClient();
    mock.enqueue({ status: 400, statusText: "Bad Request", data: { message: "bad function" } });

    await expect(
      viewJson({
        aptosConfig: mock.config,
        payload: { function: "0x1::does_not::exist" },
      }),
    ).rejects.toBeInstanceOf(AptosApiError);
  });
});
