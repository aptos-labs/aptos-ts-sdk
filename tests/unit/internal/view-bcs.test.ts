// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { view } from "../../../src/internal/view.js";

describe("internal/view.view (BCS payload)", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  it("serializes a view-function payload and POSTs BCS bytes to /view", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url?.includes("/module/")) {
        return {
          data: {
            abi: {
              address: "0x1",
              name: "chain_id",
              friends: [],
              exposed_functions: [
                {
                  name: "get",
                  visibility: "public",
                  is_entry: false,
                  is_view: true,
                  generic_type_params: [],
                  params: [],
                  return: ["u8"],
                },
              ],
              structs: [],
            },
          },
        };
      }
      return { data: [4] };
    });

    const result = await view<[string]>({
      aptosConfig: mock.config,
      payload: { function: "0x1::chain_id::get" },
      options: { ledgerVersion: 100 },
    });

    expect(result).toEqual([4]);
    const viewReq = mock.requests.find((r) => r.url?.includes("/view"));
    expect(viewReq).toBeDefined();
    expectRequest(viewReq, {
      method: "POST",
      originMethod: "view",
      params: { ledger_version: 100 },
    });
    expect(viewReq?.body).toBeInstanceOf(Uint8Array);
    expect((viewReq?.body as Uint8Array).length).toBeGreaterThan(0);
  });
});
