// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";

vi.mock("../../../src/internal/abstraction.js", () => ({
  addAuthenticationFunctionTransaction: vi.fn(),
  removeAuthenticationFunctionTransaction: vi.fn(),
  removeDispatchableAuthenticatorTransaction: vi.fn(),
}));
vi.mock("../../../src/internal/view.js", () => ({
  view: vi.fn(),
}));

import {
  addAuthenticationFunctionTransaction,
  removeAuthenticationFunctionTransaction,
  removeDispatchableAuthenticatorTransaction,
} from "../../../src/internal/abstraction.js";
import { view } from "../../../src/internal/view.js";
import { AccountAbstraction } from "../../../src/api/account/abstraction.js";

const mockedAdd = addAuthenticationFunctionTransaction as MockedFunction<typeof addAuthenticationFunctionTransaction>;
const mockedRemove = removeAuthenticationFunctionTransaction as MockedFunction<
  typeof removeAuthenticationFunctionTransaction
>;
const mockedRemoveDispatchable = removeDispatchableAuthenticatorTransaction as MockedFunction<
  typeof removeDispatchableAuthenticatorTransaction
>;
const mockedView = view as MockedFunction<typeof view>;

const config = new AptosConfig({ network: Network.LOCAL });
const sender = Account.generate();
const AUTH_FN = "0x1::permissioned_delegation::authenticate";

describe("api/account/AccountAbstraction", () => {
  beforeEach(() => {
    mockedAdd.mockReset();
    mockedRemove.mockReset();
    mockedRemoveDispatchable.mockReset();
    mockedView.mockReset();
    mockedAdd.mockResolvedValue("ADD_TXN" as never);
    mockedRemove.mockResolvedValue("REMOVE_TXN" as never);
    mockedRemoveDispatchable.mockResolvedValue("REMOVE_AUTH_TXN" as never);
  });

  it("constructor stores config", () => {
    expect(new AccountAbstraction(config).config).toBe(config);
  });

  it("addAuthenticationFunctionTransaction forwards aptosConfig and sender", async () => {
    const abstraction = new AccountAbstraction(config);

    const result = await abstraction.addAuthenticationFunctionTransaction({
      accountAddress: sender.accountAddress,
      authenticationFunction: AUTH_FN,
    });

    expect(result).toBe("ADD_TXN");
    expect(mockedAdd).toHaveBeenCalledWith({
      aptosConfig: config,
      authenticationFunction: AUTH_FN,
      sender: sender.accountAddress,
      options: undefined,
    });
  });

  it("getAuthenticationFunction returns undefined when the on-chain vec is empty", async () => {
    mockedView.mockResolvedValue([{ vec: [] }] as never);
    const abstraction = new AccountAbstraction(config);

    const result = await abstraction.getAuthenticationFunction({
      accountAddress: sender.accountAddress,
    });

    expect(result).toBeUndefined();
    expect(mockedView).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        payload: expect.objectContaining({
          function: "0x1::account_abstraction::dispatchable_authenticator",
          functionArguments: [sender.accountAddress],
        }),
      }),
    );
  });

  it("getAuthenticationFunction maps Move function info into structured parts", async () => {
    mockedView.mockResolvedValue([
      {
        vec: [
          [
            {
              module_address: "0x1",
              module_name: "permissioned_delegation",
              function_name: "authenticate",
            },
          ],
        ],
      },
    ] as never);
    const abstraction = new AccountAbstraction(config);

    const result = await abstraction.getAuthenticationFunction({
      accountAddress: sender.accountAddress,
    });

    expect(result).toEqual([
      {
        moduleAddress: AccountAddress.ONE,
        moduleName: "permissioned_delegation",
        functionName: "authenticate",
      },
    ]);
  });

  it("isAccountAbstractionEnabled returns true when the auth function is registered", async () => {
    mockedView.mockResolvedValue([
      {
        vec: [
          [
            {
              module_address: "0x1",
              module_name: "permissioned_delegation",
              function_name: "authenticate",
            },
          ],
        ],
      },
    ] as never);
    const abstraction = new AccountAbstraction(config);

    const enabled = await abstraction.isAccountAbstractionEnabled({
      accountAddress: sender.accountAddress,
      authenticationFunction: AUTH_FN,
    });

    expect(enabled).toBe(true);
  });

  it("disableAccountAbstractionTransaction removes a specific function when provided", async () => {
    const abstraction = new AccountAbstraction(config);

    const result = await abstraction.disableAccountAbstractionTransaction({
      accountAddress: sender.accountAddress,
      authenticationFunction: AUTH_FN,
    });

    expect(result).toBe("REMOVE_TXN");
    expect(mockedRemove).toHaveBeenCalledWith({
      aptosConfig: config,
      sender: sender.accountAddress,
      authenticationFunction: AUTH_FN,
      options: undefined,
    });
    expect(mockedRemoveDispatchable).not.toHaveBeenCalled();
  });

  it("disableAccountAbstractionTransaction removes the dispatchable authenticator when no function is given", async () => {
    const abstraction = new AccountAbstraction(config);

    const result = await abstraction.disableAccountAbstractionTransaction({
      accountAddress: sender.accountAddress,
    });

    expect(result).toBe("REMOVE_AUTH_TXN");
    expect(mockedRemoveDispatchable).toHaveBeenCalledWith({
      aptosConfig: config,
      sender: sender.accountAddress,
      options: undefined,
    });
  });
});
