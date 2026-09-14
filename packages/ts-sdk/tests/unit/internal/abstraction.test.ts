// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { TypeTagAddress, TypeTagStruct } from "../../../src/transactions/index.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import {
  addAuthenticationFunctionTransaction,
  removeAuthenticationFunctionTransaction,
  removeDispatchableAuthenticatorTransaction,
} from "../../../src/internal/abstraction.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("internal/abstraction (auth-function wrappers)", () => {
  const sender = Account.generate();
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });

  beforeEach(() => {
    mockedGenerateTransaction.mockReset();
    mockedGenerateTransaction.mockResolvedValue("SENTINEL" as never);
  });

  describe("addAuthenticationFunctionTransaction", () => {
    it("splits the MoveFunctionId into (moduleAddress, moduleName, functionName) positional args", async () => {
      await addAuthenticationFunctionTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        authenticationFunction: "0xcafe::auth_mod::my_auth_fn",
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        functionArguments: unknown[];
        abi: { parameters: unknown[] };
      };
      expect(data.function).toBe("0x1::account_abstraction::add_authentication_function");
      // getFunctionParts is a string split — moduleAddress is passed through
      // verbatim, not normalized. Downstream `generateTransaction` is what
      // turns it into an AccountAddress. Pinning the verbatim string here
      // means a future change that adds address normalization would be
      // caught as an intentional behavior shift.
      expect(data.functionArguments[0]).toBe("0xcafe");
      expect(data.functionArguments[1]).toBe("auth_mod");
      expect(data.functionArguments[2]).toBe("my_auth_fn");

      // ABI shape: address + 2 * string structs (matches the Move signature
      // (address, String, String)).
      expect(data.abi.parameters).toHaveLength(3);
      expect(data.abi.parameters[0]).toBeInstanceOf(TypeTagAddress);
      expect(data.abi.parameters[1]).toBeInstanceOf(TypeTagStruct);
      expect(data.abi.parameters[2]).toBeInstanceOf(TypeTagStruct);
    });
  });

  describe("removeAuthenticationFunctionTransaction", () => {
    it("targets the matching remove_authentication_function entry with the same arg layout", async () => {
      await removeAuthenticationFunctionTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        authenticationFunction: "0x1::built_in::any_authenticator",
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        functionArguments: unknown[];
      };
      expect(data.function).toBe("0x1::account_abstraction::remove_authentication_function");
      expect(data.functionArguments[1]).toBe("built_in");
      expect(data.functionArguments[2]).toBe("any_authenticator");
    });
  });

  describe("removeDispatchableAuthenticatorTransaction", () => {
    it("calls remove_authenticator with no type or function arguments", async () => {
      await removeDispatchableAuthenticatorTransaction({
        aptosConfig,
        sender: sender.accountAddress,
      });

      const data = mockedGenerateTransaction.mock.calls[0][0].data as {
        function: string;
        functionArguments: unknown[];
        typeArguments: unknown[];
        abi: { parameters: unknown[]; typeParameters: unknown[] };
      };
      expect(data.function).toBe("0x1::account_abstraction::remove_authenticator");
      expect(data.functionArguments).toEqual([]);
      expect(data.typeArguments).toEqual([]);
      expect(data.abi.parameters).toEqual([]);
      expect(data.abi.typeParameters).toEqual([]);
    });
  });
});
