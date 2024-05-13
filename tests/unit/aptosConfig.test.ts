// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AptosConfig,
  AptosSettings,
  Network,
  NetworkToFaucetAPI,
  NetworkToNodeAPI,
  NetworkToIndexerAPI,
  AptosApiType,
} from "../../src";

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
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.TESTNET]);
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.TESTNET]);
  });

  test("it should set urls based on mainnet", async () => {
    const settings: AptosSettings = {
      network: Network.MAINNET,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("mainnet");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.MAINNET]);
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.MAINNET]);
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
});
