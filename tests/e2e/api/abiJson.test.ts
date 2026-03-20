// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  generateModuleAbiJSON,
  generateEntryFunctionAbiJSON,
  generateViewFunctionAbiJSON,
  parseEntryFunctionAbiJSON,
  parseViewFunctionAbiJSON,
} from "../../../src";
import { getAptosClient } from "../helper";

describe("ABI JSON generation from on-chain state", () => {
  const { aptos, config } = getAptosClient();

  describe("generateModuleAbiJSON", () => {
    it("generates JSON for the 0x1::coin module", async () => {
      const moduleAbi = await generateModuleAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
      });

      expect(moduleAbi.address).toBe("0x1");
      expect(moduleAbi.name).toBe("coin");

      // coin::transfer is an entry function
      expect(moduleAbi.entryFunctions).toHaveProperty("transfer");
      const transfer = moduleAbi.entryFunctions.transfer;
      expect(transfer.typeParameters).toEqual([{ constraints: [] }]);
      expect(transfer.parameters).toContain("address");
      expect(transfer.parameters).toContain("u64");
      expect(transfer.signers).toBe(1);

      // coin::balance is a view function
      expect(moduleAbi.viewFunctions).toHaveProperty("balance");
      const balance = moduleAbi.viewFunctions.balance;
      expect(balance.typeParameters).toEqual([{ constraints: [] }]);
      expect(balance.parameters).toEqual(["address"]);
      expect(balance.returnTypes).toEqual(["u64"]);
    });

    it("generates JSON for the 0x1::aptos_account module", async () => {
      const moduleAbi = await generateModuleAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "aptos_account",
      });

      expect(moduleAbi.address).toBe("0x1");
      expect(moduleAbi.name).toBe("aptos_account");
      expect(moduleAbi.entryFunctions).toHaveProperty("transfer");
    });

    it("output is JSON serializable", async () => {
      const moduleAbi = await generateModuleAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
      });

      const json = JSON.stringify(moduleAbi);
      const parsed = JSON.parse(json);

      expect(parsed.address).toBe("0x1");
      expect(parsed.name).toBe("coin");
      expect(parsed.entryFunctions.transfer).toBeDefined();
      expect(parsed.viewFunctions.balance).toBeDefined();
    });

    it("throws for non-existent module", async () => {
      await expect(
        generateModuleAbiJSON({
          aptosConfig: config,
          accountAddress: "0x1",
          moduleName: "nonexistent_module_xyz",
        }),
      ).rejects.toThrow();
    });
  });

  describe("generateEntryFunctionAbiJSON", () => {
    it("generates JSON for coin::transfer", async () => {
      const abi = await generateEntryFunctionAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
        functionName: "transfer",
      });

      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters).toContain("address");
      expect(abi.parameters).toContain("u64");
      expect(abi.signers).toBe(1);
    });

    it("throws for a view-only function", async () => {
      await expect(
        generateEntryFunctionAbiJSON({
          aptosConfig: config,
          accountAddress: "0x1",
          moduleName: "coin",
          functionName: "balance",
        }),
      ).rejects.toThrow("not an entry function");
    });

    it("throws for a non-existent function", async () => {
      await expect(
        generateEntryFunctionAbiJSON({
          aptosConfig: config,
          accountAddress: "0x1",
          moduleName: "coin",
          functionName: "nonexistent_fn",
        }),
      ).rejects.toThrow("Could not find function");
    });
  });

  describe("generateViewFunctionAbiJSON", () => {
    it("generates JSON for coin::balance", async () => {
      const abi = await generateViewFunctionAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
        functionName: "balance",
      });

      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters).toEqual(["address"]);
      expect(abi.returnTypes).toEqual(["u64"]);
    });

    it("throws for an entry-only function", async () => {
      await expect(
        generateViewFunctionAbiJSON({
          aptosConfig: config,
          accountAddress: "0x1",
          moduleName: "coin",
          functionName: "transfer",
        }),
      ).rejects.toThrow("not a view function");
    });
  });

  describe("round-trip: generate then parse", () => {
    it("entry function ABI round-trips through JSON", async () => {
      const json = await generateEntryFunctionAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
        functionName: "transfer",
      });

      const serialized = JSON.stringify(json);
      const deserialized = JSON.parse(serialized);
      const abi = parseEntryFunctionAbiJSON(deserialized);

      expect(abi.signers).toBe(1);
      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters.length).toBeGreaterThan(0);
      expect(abi.parameters.map((p) => p.toString())).toContain("address");
      expect(abi.parameters.map((p) => p.toString())).toContain("u64");
    });

    it("view function ABI round-trips through JSON", async () => {
      const json = await generateViewFunctionAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
        functionName: "balance",
      });

      const serialized = JSON.stringify(json);
      const deserialized = JSON.parse(serialized);
      const abi = parseViewFunctionAbiJSON(deserialized);

      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters.map((p) => p.toString())).toEqual(["address"]);
      expect(abi.returnTypes.map((p) => p.toString())).toEqual(["u64"]);
    });

    it("module ABI round-trips all functions through JSON", async () => {
      const moduleAbi = await generateModuleAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
      });

      const serialized = JSON.stringify(moduleAbi);
      const deserialized = JSON.parse(serialized);

      for (const [_name, entryJson] of Object.entries(deserialized.entryFunctions)) {
        const abi = parseEntryFunctionAbiJSON(entryJson as any);
        expect(abi.typeParameters).toBeDefined();
        expect(abi.parameters).toBeDefined();
      }

      for (const [_name, viewJson] of Object.entries(deserialized.viewFunctions)) {
        const abi = parseViewFunctionAbiJSON(viewJson as any);
        expect(abi.typeParameters).toBeDefined();
        expect(abi.parameters).toBeDefined();
        expect(abi.returnTypes).toBeDefined();
      }
    });
  });

  describe("parsed ABI can be used with transaction builder", () => {
    it("parsed entry function ABI can build a transaction", async () => {
      const json = await generateEntryFunctionAbiJSON({
        aptosConfig: config,
        accountAddress: "0x1",
        moduleName: "coin",
        functionName: "transfer",
      });

      const abi = parseEntryFunctionAbiJSON(json);

      const alice = (await import("../../../src")).Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 1_000_000_000 });
      const bob = (await import("../../../src")).Account.generate();

      const txn = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [bob.accountAddress, 100],
          abi,
        },
      });

      expect(txn).toBeDefined();
      expect(txn.rawTransaction).toBeDefined();
    });
  });
});
