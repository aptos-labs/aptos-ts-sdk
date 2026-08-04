// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { AccountAddress } from "../../../src/core/index.js";
import { AuthenticationKey } from "../../../src/core/authenticationKey.js";
import { AptosApiError } from "../../../src/errors/index.js";
import { lookupOriginalAccountAddress, isAccountExist } from "../../../src/internal/account.js";

const AUTH_KEY = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ORIGINAL = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("internal/account.lookupOriginalAccountAddress", () => {
  it("returns the mapped original address when the auth-key table entry exists", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url.includes("/resource/")) {
        return {
          data: {
            type: "0x1::account::OriginatingAddress",
            data: { address_map: { handle: "0xTABLE" } },
          },
        };
      }
      if (req.url.includes("/tables/")) {
        return { data: ORIGINAL };
      }
      throw new Error(`unexpected request: ${req.url}`);
    });

    const result = await lookupOriginalAccountAddress({
      aptosConfig: mock.config,
      authenticationKey: AUTH_KEY,
    });

    expect(result.toString()).toBe(AccountAddress.from(ORIGINAL).toString());
    expect(mock.requests).toHaveLength(2);
    expectRequest(mock.requests[1], {
      method: "POST",
      originMethod: "getTableItem",
      urlIncludes: "tables/0xTABLE/item",
      body: {
        key: AccountAddress.from(AUTH_KEY).toString(),
        key_type: "address",
        value_type: "address",
      },
    });
  });

  it("returns the auth key address when the table entry is missing (table_item_not_found)", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url.includes("/resource/")) {
        return {
          data: {
            type: "0x1::account::OriginatingAddress",
            data: { address_map: { handle: "0xTABLE" } },
          },
        };
      }
      return {
        status: 404,
        statusText: "Not Found",
        data: { message: "not found", error_code: "table_item_not_found" },
      };
    });

    const result = await lookupOriginalAccountAddress({
      aptosConfig: mock.config,
      authenticationKey: AUTH_KEY,
    });

    expect(result.toString()).toBe(AccountAddress.from(AUTH_KEY).toString());
  });

  it("rethrows non-table_item_not_found errors from getTableItem", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url.includes("/resource/")) {
        return {
          data: {
            type: "0x1::account::OriginatingAddress",
            data: { address_map: { handle: "0xTABLE" } },
          },
        };
      }
      return { status: 500, statusText: "Server Error", data: { message: "boom" } };
    });

    await expect(
      lookupOriginalAccountAddress({ aptosConfig: mock.config, authenticationKey: AUTH_KEY }),
    ).rejects.toBeInstanceOf(AptosApiError);
  });
});

describe("internal/account.isAccountExist", () => {
  it("returns true when the account resource exists", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url.includes("/resource/0x1::account::OriginatingAddress")) {
        return {
          data: {
            type: "0x1::account::OriginatingAddress",
            data: { address_map: { handle: "0xTABLE" } },
          },
        };
      }
      if (req.url.includes("/tables/")) {
        return { data: AUTH_KEY };
      }
      if (req.url.includes("/resource/0x1::account::Account")) {
        return {
          data: {
            type: "0x1::account::Account",
            data: { authentication_key: AUTH_KEY, sequence_number: "1" },
          },
        };
      }
      if (req.body && typeof req.body === "object" && "query" in (req.body as object)) {
        return { data: { data: { current_objects: [] } } };
      }
      throw new Error(`unexpected: ${req.url}`);
    });

    const authKey = new AuthenticationKey({ data: AUTH_KEY });
    const exists = await isAccountExist({ aptosConfig: mock.config, authKey });

    expect(exists).toBe(true);
  });

  it("returns false when neither account resource nor owned objects exist", async () => {
    const mock = createMockClient();
    mock.setResponder((req) => {
      if (req.url.includes("/resource/0x1::account::OriginatingAddress")) {
        return {
          data: {
            type: "0x1::account::OriginatingAddress",
            data: { address_map: { handle: "0xTABLE" } },
          },
        };
      }
      if (req.url.includes("/tables/")) {
        return {
          status: 404,
          statusText: "Not Found",
          data: { message: "not found", error_code: "table_item_not_found" },
        };
      }
      if (req.url.includes("/resource/0x1::account::Account")) {
        return {
          status: 404,
          statusText: "Not Found",
          data: { message: "resource not found", error_code: "resource_not_found" },
        };
      }
      if (req.body && typeof req.body === "object" && "query" in (req.body as object)) {
        return { data: { data: { current_objects: [] } } };
      }
      throw new Error(`unexpected: ${req.url}`);
    });

    const authKey = new AuthenticationKey({ data: AUTH_KEY });
    const exists = await isAccountExist({ aptosConfig: mock.config, authKey });

    expect(exists).toBe(false);
  });
});
