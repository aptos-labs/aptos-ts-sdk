// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AptosConfig } from "../../../src/api/config.js";
import { Aptos } from "../../../src/compat/aptos.js";
import { Network } from "../../../src/core/network.js";

describe("Compat Aptos class", () => {
  it("accepts AptosConfig in constructor (v6 style)", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    expect(aptos.config).toBe(config);
    expect(aptos.config.network).toBe(Network.TESTNET);
  });

  it("accepts AptosSettings in constructor (v10 style)", () => {
    const aptos = new Aptos({ network: Network.TESTNET });
    expect(aptos.config.network).toBe(Network.TESTNET);
  });

  it("accepts no args (defaults to DEVNET)", () => {
    const aptos = new Aptos();
    expect(aptos.config.network).toBe(Network.DEVNET);
  });

  it("has v6-style flat methods", () => {
    const aptos = new Aptos({ network: Network.TESTNET });

    // General
    expect(typeof aptos.getLedgerInfo).toBe("function");
    expect(typeof aptos.getChainId).toBe("function");
    expect(typeof aptos.getGasPriceEstimation).toBe("function");
    expect(typeof aptos.getBlockByHeight).toBe("function");
    expect(typeof aptos.getBlockByVersion).toBe("function");
    expect(typeof aptos.view).toBe("function");

    // Account
    expect(typeof aptos.getAccountInfo).toBe("function");
    expect(typeof aptos.getAccountModules).toBe("function");
    expect(typeof aptos.getAccountModule).toBe("function");
    expect(typeof aptos.getAccountResource).toBe("function");
    expect(typeof aptos.getAccountResources).toBe("function");
    expect(typeof aptos.getAccountTransactions).toBe("function");

    // Transaction
    expect(typeof aptos.signTransaction).toBe("function");
    expect(typeof aptos.signAndSubmitTransaction).toBe("function");
    expect(typeof aptos.waitForTransaction).toBe("function");
    expect(typeof aptos.getTransactions).toBe("function");
    expect(typeof aptos.getTransactionByHash).toBe("function");
    expect(typeof aptos.getTransactionByVersion).toBe("function");
    expect(typeof aptos.getSigningMessage).toBe("function");

    // Faucet
    expect(typeof aptos.fundAccount).toBe("function");

    // Coin
    expect(typeof aptos.transferCoinTransaction).toBe("function");

    // Table
    expect(typeof aptos.getTableItem).toBe("function");
  });

  it("has v6-style transaction.build.simple()", () => {
    const aptos = new Aptos({ network: Network.TESTNET });
    expect(typeof aptos.transaction.build).toBe("object");
    expect(typeof aptos.transaction.build.simple).toBe("function");
  });

  it("still has v10 namespaced access", () => {
    const aptos = new Aptos({ network: Network.TESTNET });
    expect(typeof aptos.general.getLedgerInfo).toBe("function");
    expect(typeof aptos.account.getInfo).toBe("function");
    expect(typeof aptos.transaction.buildSimple).toBe("function");
    expect(typeof aptos.faucet.fund).toBe("function");
    expect(typeof aptos.coin.transferTransaction).toBe("function");
    expect(typeof aptos.table.getItem).toBe("function");
  });
});

describe("Compat barrel exports", () => {
  it("re-exports Aptos class from compat/index", async () => {
    const { Aptos: CompatAptos } = await import("../../../src/compat/index.js");
    expect(CompatAptos).toBeDefined();
    const aptos = new CompatAptos({ network: Network.TESTNET });
    expect(aptos.config.network).toBe(Network.TESTNET);
  });

  it("re-exports AptosConfig from compat/index", async () => {
    const { AptosConfig: CompatConfig } = await import("../../../src/compat/index.js");
    expect(CompatConfig).toBeDefined();
    const config = new CompatConfig({ network: Network.LOCAL });
    expect(config.network).toBe(Network.LOCAL);
  });

  it("re-exports Network from compat/index", async () => {
    const { Network: CompatNetwork } = await import("../../../src/compat/index.js");
    expect(CompatNetwork).toBeDefined();
    expect(CompatNetwork.TESTNET).toBe("testnet");
  });

  it("re-exports core types from compat/index", async () => {
    const { AccountAddress, Hex } = await import("../../../src/compat/index.js");
    expect(AccountAddress).toBeDefined();
    expect(Hex).toBeDefined();
  });

  it("re-exports account factory from compat/index", async () => {
    const { generateAccount, accountFromPrivateKey } = await import("../../../src/compat/index.js");
    expect(generateAccount).toBeDefined();
    expect(accountFromPrivateKey).toBeDefined();
  });

  it("re-exports standalone API functions from compat/index", async () => {
    const { getLedgerInfo, getChainId, getAccountInfo, buildSimpleTransaction, fundAccount, getTableItem } =
      await import("../../../src/compat/index.js");
    expect(typeof getLedgerInfo).toBe("function");
    expect(typeof getChainId).toBe("function");
    expect(typeof getAccountInfo).toBe("function");
    expect(typeof buildSimpleTransaction).toBe("function");
    expect(typeof fundAccount).toBe("function");
    expect(typeof getTableItem).toBe("function");
  });
});

describe("Compat CJS wrapper", () => {
  it("CJS wrapper loads via require() and exposes the same exports", async () => {
    // Use createRequire to test the .cjs wrapper from ESM.
    // The wrapper lives in dist/ so we test against the built output.
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const cjsMod = require("../../../dist/esm/compat/index.cjs");
    expect(cjsMod.Aptos).toBeDefined();
    expect(cjsMod.Network).toBeDefined();
    expect(typeof cjsMod.Aptos).toBe("function");
    expect(cjsMod.Network.TESTNET).toBe("testnet");
  });
});
