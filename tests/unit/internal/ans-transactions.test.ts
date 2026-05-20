// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Coverage for the transaction-builder wrappers in internal/ans.ts that
 * don't depend on view function calls. generateTransaction is vi.mock'd so
 * each test asserts the exact entry-function arguments the wrapper passes
 * downstream.
 */

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { setPrimaryName, setTargetAddress, clearTargetAddress, renewDomain } from "../../../src/internal/ans.js";
import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

// MAINNET has an ANS router; use it so getRouterAddress() resolves.
const aptosConfig = new AptosConfig({ network: Network.MAINNET });
const sender = Account.generate();
const target = Account.generate();

describe("internal/ans transaction wrappers", () => {
  beforeEach(() => {
    mockedGenerateTransaction.mockReset();
    mockedGenerateTransaction.mockResolvedValue("SENTINEL_TXN" as never);
  });

  describe("setPrimaryName", () => {
    it("calls router::set_primary_name with the parsed domain + subdomain when a name is provided", async () => {
      const result = await setPrimaryName({
        aptosConfig,
        sender: sender.accountAddress,
        name: "bob.alice",
      });

      expect(result.transaction).toBe("SENTINEL_TXN");
      expect(result.data.function).toMatch(/::router::set_primary_name$/);
      expect(result.data.functionArguments).toEqual(["alice", "bob"]);
    });

    it("calls router::clear_primary_name with no args when name is omitted", async () => {
      const result = await setPrimaryName({
        aptosConfig,
        sender: sender.accountAddress,
      });

      expect(result.data.function).toMatch(/::router::clear_primary_name$/);
      expect(result.data.functionArguments).toEqual([]);
    });

    it("forwards options through to generateTransaction", async () => {
      const options = { maxGasAmount: 5000 };
      await setPrimaryName({ aptosConfig, sender: sender.accountAddress, name: "alice", options });

      expect(mockedGenerateTransaction.mock.calls[0][0].options).toBe(options);
    });
  });

  describe("setTargetAddress", () => {
    it("passes [domainName, subdomainName, address] for a subdomain name", async () => {
      const result = await setTargetAddress({
        aptosConfig,
        sender: sender.accountAddress,
        name: "bob.alice",
        address: target.accountAddress,
      });

      expect(result.data.function).toMatch(/::router::set_target_addr$/);
      expect(result.data.functionArguments).toEqual(["alice", "bob", target.accountAddress]);
    });

    it("passes [domainName, undefined, address] for a bare domain", async () => {
      const result = await setTargetAddress({
        aptosConfig,
        sender: sender.accountAddress,
        name: "alice",
        address: target.accountAddress,
      });

      expect(result.data.functionArguments).toEqual(["alice", undefined, target.accountAddress]);
    });
  });

  describe("clearTargetAddress", () => {
    it("passes [domainName, subdomainName] for a subdomain name", async () => {
      const result = await clearTargetAddress({
        aptosConfig,
        sender: sender.accountAddress,
        name: "bob.alice",
      });

      expect(result.data.function).toMatch(/::router::clear_target_addr$/);
      expect(result.data.functionArguments).toEqual(["alice", "bob"]);
    });

    it("passes [domainName, null] (explicit null, not undefined) for a bare domain", async () => {
      const result = await clearTargetAddress({
        aptosConfig,
        sender: sender.accountAddress,
        name: "alice",
      });

      // Note the explicit `?? null` in the source — bare domains get null, not undefined.
      expect(result.data.functionArguments).toEqual(["alice", null]);
    });
  });

  describe("renewDomain", () => {
    it("targets router::renew_domain with the domain name + 1 year in seconds", async () => {
      const result = await renewDomain({
        aptosConfig,
        sender: sender.accountAddress,
        name: "alice",
      });

      expect(result.data.function).toMatch(/::router::renew_domain$/);
      // 1 year = 31_536_000 seconds.
      expect(result.data.functionArguments).toEqual(["alice", 31_536_000]);
    });

    it("rejects renewals for subdomains", async () => {
      await expect(
        renewDomain({
          aptosConfig,
          sender: sender.accountAddress,
          name: "bob.alice",
        }),
      ).rejects.toThrow(/Subdomains cannot be renewed/);

      expect(mockedGenerateTransaction).not.toHaveBeenCalled();
    });

    it("rejects multi-year renewals (only 1 year is supported on chain)", async () => {
      await expect(
        renewDomain({
          aptosConfig,
          sender: sender.accountAddress,
          name: "alice",
          years: 2 as never,
        }),
      ).rejects.toThrow(/only 1 year renewals are supported/);
    });
  });
});
