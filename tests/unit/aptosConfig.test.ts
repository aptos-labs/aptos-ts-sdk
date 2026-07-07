// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AptosConfig,
  AptosSettings,
  Network,
  NetworkToFaucetAPI,
  NetworkToNodeAPI,
  NetworkToIndexerAPI,
  NetworkToPepperAPI,
  NetworkToProverAPI,
  AptosApiType,
} from "../../src/index.js";

describe("aptos config", () => {
  test("it should set urls based on a local network", async () => {
    const settings: AptosSettings = {
      network: Network.LOCAL,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("local");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.LOCAL]);
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.LOCAL]);
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.LOCAL]);
  });

  test("it should set urls based on testnet", async () => {
    const settings: AptosSettings = {
      network: Network.TESTNET,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("testnet");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.TESTNET]);
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toThrow();
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.TESTNET]);
  });

  test("it should set urls based on mainnet", async () => {
    const settings: AptosSettings = {
      network: Network.MAINNET,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("mainnet");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.MAINNET]);
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toThrow();
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.MAINNET]);
  });

  test("it should have undefined urls when network is custom and no urls provided", async () => {
    const settings: AptosSettings = {
      network: Network.CUSTOM,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toBe("custom");
    expect(aptosConfig.fullnode).toBeUndefined();
    expect(aptosConfig.faucet).toBeUndefined();
    expect(aptosConfig.indexer).toBeUndefined();
  });

  test("getRequestUrl should throw when network is custom and no urls provided", async () => {
    const settings: AptosSettings = {
      network: Network.CUSTOM,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toBe("custom");
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FULLNODE)).toThrow();
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toThrow();
    expect(() => aptosConfig.getRequestUrl(AptosApiType.INDEXER)).toThrow();
  });

  test("it should set urls when network is custom and urls provided", async () => {
    const settings: AptosSettings = {
      network: Network.CUSTOM,
      fullnode: "my-fullnode-url",
      faucet: "my-faucet-url",
      indexer: "my-indexer-url",
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toBe("custom");
    expect(aptosConfig.fullnode).toBe("my-fullnode-url");
    expect(aptosConfig.faucet).toBe("my-faucet-url");
    expect(aptosConfig.indexer).toBe("my-indexer-url");
  });

  test("it sets the correct configs", () => {
    const aptosConfig = new AptosConfig({
      clientConfig: {
        HEADERS: { clientConfig: "header" },
        API_KEY: "api-key",
      },
      faucetConfig: { HEADERS: { faucet: "header" }, AUTH_TOKEN: "auth-token" },
      indexerConfig: { HEADERS: { indexer: "header" } },
      fullnodeConfig: { HEADERS: { fullnode: "header" } },
    });

    expect(aptosConfig.clientConfig?.HEADERS).toStrictEqual({ clientConfig: "header" });
    expect(aptosConfig.clientConfig?.API_KEY).toStrictEqual("api-key");
    expect(aptosConfig.faucetConfig).toStrictEqual({ HEADERS: { faucet: "header" }, AUTH_TOKEN: "auth-token" });
    expect(aptosConfig.indexerConfig).toStrictEqual({ HEADERS: { indexer: "header" } });
    expect(aptosConfig.fullnodeConfig).toStrictEqual({ HEADERS: { fullnode: "header" } });
  });

  test("it resolves pepper and prover URLs for known networks", () => {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    expect(aptosConfig.getRequestUrl(AptosApiType.PEPPER)).toBe(NetworkToPepperAPI[Network.TESTNET]);
    expect(aptosConfig.getRequestUrl(AptosApiType.PROVER)).toBe(NetworkToProverAPI[Network.TESTNET]);
    expect(aptosConfig.isPepperServiceRequest(NetworkToPepperAPI[Network.TESTNET])).toBe(true);
    expect(aptosConfig.isProverServiceRequest(NetworkToProverAPI[Network.TESTNET])).toBe(true);
    expect(aptosConfig.isPepperServiceRequest("https://unknown.example")).toBe(false);
  });

  test("custom network requires explicit pepper and prover URLs", () => {
    const aptosConfig = new AptosConfig({ network: Network.CUSTOM });
    expect(() => aptosConfig.getRequestUrl(AptosApiType.PEPPER)).toThrow(/custom pepper service url/);
    expect(() => aptosConfig.getRequestUrl(AptosApiType.PROVER)).toThrow(/custom prover service url/);

    const withServices = new AptosConfig({
      network: Network.CUSTOM,
      pepper: "https://pepper.custom",
      prover: "https://prover.custom",
    });
    expect(withServices.getRequestUrl(AptosApiType.PEPPER)).toBe("https://pepper.custom");
    expect(withServices.getRequestUrl(AptosApiType.PROVER)).toBe("https://prover.custom");
  });

  test("getRequestUrl throws for unsupported api types", () => {
    const aptosConfig = new AptosConfig({ network: Network.LOCAL });
    expect(() => aptosConfig.getRequestUrl("unknown" as AptosApiType)).toThrow(/apiType unknown is not supported/);
  });
});
