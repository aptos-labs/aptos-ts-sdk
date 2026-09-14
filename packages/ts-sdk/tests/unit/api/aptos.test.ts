// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests for the top-level Aptos client class — sub-module lazy
 * initialization, getter idempotence, mixin propagation, and
 * setIgnoreTransactionSubmitter forwarding.
 */

import { describe, expect, it } from "vitest";
import { Aptos } from "../../../src/api/aptos.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/api/account.js";
import { Coin } from "../../../src/api/coin.js";
import { Faucet } from "../../../src/api/faucet.js";
import { Staking } from "../../../src/api/staking.js";
import { Transaction } from "../../../src/api/transaction.js";
import { Table } from "../../../src/api/table.js";
import { Keyless } from "../../../src/api/keyless.js";
import { AptosObject } from "../../../src/api/object.js";
import { General } from "../../../src/api/general.js";
import { DigitalAsset } from "../../../src/api/digitalAsset.js";
import { FungibleAsset } from "../../../src/api/fungibleAsset.js";
import { ANS } from "../../../src/api/ans.js";

const config = new AptosConfig({ network: Network.LOCAL });

describe("api/Aptos", () => {
  describe("constructor", () => {
    it("uses the supplied AptosConfig", () => {
      const aptos = new Aptos(config);
      expect(aptos.config).toBe(config);
    });

    it("creates a default config when none is supplied", () => {
      const aptos = new Aptos();
      expect(aptos.config).toBeInstanceOf(AptosConfig);
    });
  });

  describe("sub-module getters", () => {
    it.each([
      ["account", Account],
      ["coin", Coin],
      ["faucet", Faucet],
      ["staking", Staking],
      ["transaction", Transaction],
      ["table", Table],
      ["keyless", Keyless],
      ["object", AptosObject],
      ["general", General],
      ["digitalAsset", DigitalAsset],
      ["fungibleAsset", FungibleAsset],
      ["ans", ANS],
    ])("aptos.%s returns an instance of the matching sub-module class", (key, Klass) => {
      const aptos = new Aptos(config);
      const value = (aptos as unknown as Record<string, unknown>)[key];
      expect(value).toBeInstanceOf(Klass);
    });

    it("each sub-module getter is memoized — repeated access returns the same instance", () => {
      const aptos = new Aptos(config);
      expect(aptos.coin).toBe(aptos.coin);
      expect(aptos.faucet).toBe(aptos.faucet);
      expect(aptos.general).toBe(aptos.general);
    });

    it("each sub-module receives the parent's config", () => {
      const aptos = new Aptos(config);
      expect(aptos.coin.config).toBe(config);
      expect(aptos.general.config).toBe(config);
      expect(aptos.faucet.config).toBe(config);
    });
  });

  describe("mixin: methods are accessible directly on Aptos", () => {
    it("aptos.getLedgerInfo (from General) is callable", () => {
      const aptos = new Aptos(config);
      // The mixin shim makes general's methods callable directly on aptos.
      expect(typeof (aptos as unknown as { getLedgerInfo: unknown }).getLedgerInfo).toBe("function");
    });

    it("aptos.transferCoinTransaction (from Coin) is callable", () => {
      const aptos = new Aptos(config);
      expect(typeof (aptos as unknown as { transferCoinTransaction: unknown }).transferCoinTransaction).toBe(
        "function",
      );
    });
  });

  describe("setIgnoreTransactionSubmitter", () => {
    it("forwards true to AptosConfig.setIgnoreTransactionSubmitter", () => {
      // The config method is only reachable when a plugin is configured; we
      // can verify the call by spying on the config instance.
      const cfg = new AptosConfig({
        network: Network.LOCAL,
        pluginSettings: { TRANSACTION_SUBMITTER: {} as never },
      });
      const aptos = new Aptos(cfg);

      // Before: not ignored.
      aptos.setIgnoreTransactionSubmitter(true);
      // After ignore=true the getter returns undefined.
      expect(cfg.getTransactionSubmitter()).toBeUndefined();

      aptos.setIgnoreTransactionSubmitter(false);
      expect(cfg.getTransactionSubmitter()).toBeDefined();
    });
  });
});
