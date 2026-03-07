// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AptosConfig, createConfig } from "../../../src/api/config.js";
import { AptosApiType } from "../../../src/core/constants.js";
import { Network } from "../../../src/core/network.js";

describe("AptosConfig", () => {
  it("defaults to devnet", () => {
    const config = new AptosConfig();
    expect(config.network).toBe(Network.DEVNET);
  });

  it("accepts custom network", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    expect(config.network).toBe(Network.TESTNET);
  });

  it("throws when custom endpoints provided without network", () => {
    expect(() => new AptosConfig({ fullnode: "http://localhost:8080/v1" })).toThrow(
      "Custom endpoints require a network",
    );
  });

  it("accepts custom endpoints with a network", () => {
    const config = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: "http://localhost:8080/v1",
    });
    expect(config.getRequestUrl(AptosApiType.FULLNODE)).toBe("http://localhost:8080/v1");
  });

  it("resolves fullnode URL from network", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const url = config.getRequestUrl(AptosApiType.FULLNODE);
    expect(url).toContain("testnet");
  });

  it("resolves indexer URL from network", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const url = config.getRequestUrl(AptosApiType.INDEXER);
    expect(url).toContain("testnet");
    expect(url).toContain("graphql");
  });

  it("resolves faucet URL for devnet", () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const url = config.getRequestUrl(AptosApiType.FAUCET);
    expect(url).toContain("faucet");
  });

  it("throws when requesting testnet faucet", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    expect(() => config.getRequestUrl(AptosApiType.FAUCET)).toThrow("no way to programmatically mint testnet APT");
  });

  it("throws when requesting mainnet faucet", () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    expect(() => config.getRequestUrl(AptosApiType.FAUCET)).toThrow("no mainnet faucet");
  });

  it("throws when custom network without endpoint", () => {
    const config = new AptosConfig({ network: Network.CUSTOM, fullnode: "http://custom.com" });
    expect(() => config.getRequestUrl(AptosApiType.INDEXER)).toThrow("custom indexer url");
  });

  it("resolves pepper and prover URLs", () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    expect(config.getRequestUrl(AptosApiType.PEPPER)).toContain("pepper");
    expect(config.getRequestUrl(AptosApiType.PROVER)).toContain("prover");
  });

  it("uses default gas and expiry", () => {
    const config = new AptosConfig();
    expect(config.defaultMaxGasAmount).toBe(200000);
    expect(config.defaultTxnExpSecFromNow).toBe(20);
  });

  it("allows custom gas and expiry", () => {
    const config = new AptosConfig({ defaultMaxGasAmount: 500000, defaultTxnExpSecFromNow: 60 });
    expect(config.defaultMaxGasAmount).toBe(500000);
    expect(config.defaultTxnExpSecFromNow).toBe(60);
  });

  it("merges fullnode config with headers", () => {
    const config = new AptosConfig({
      network: Network.TESTNET,
      clientConfig: { HEADERS: { "x-global": "1" }, API_KEY: "key" },
      fullnodeConfig: { HEADERS: { "x-fullnode": "2" } },
    });
    const merged = config.getMergedFullnodeConfig({ HEADERS: { "x-override": "3" } });
    expect(merged.HEADERS).toEqual({
      "x-global": "1",
      "x-fullnode": "2",
      "x-override": "3",
    });
    expect(merged.API_KEY).toBe("key");
  });

  it("strips API_KEY from faucet config", () => {
    const config = new AptosConfig({
      network: Network.DEVNET,
      clientConfig: { API_KEY: "should-be-removed", HEADERS: { "x-global": "1" } },
    });
    const merged = config.getMergedFaucetConfig();
    expect(merged.API_KEY).toBeUndefined();
    expect(merged.HEADERS).toEqual({ "x-global": "1" });
  });
});

describe("createConfig", () => {
  it("creates AptosConfig instance", () => {
    const config = createConfig({ network: Network.TESTNET });
    expect(config).toBeInstanceOf(AptosConfig);
    expect(config.network).toBe(Network.TESTNET);
  });

  it("defaults when no args", () => {
    const config = createConfig();
    expect(config.network).toBe(Network.DEVNET);
  });
});
