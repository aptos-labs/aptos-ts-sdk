// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  CedraConfig,
  CedraSettings,
  Network,
  NetworkToFaucetAPI,
  NetworkToNodeAPI,
  NetworkToIndexerAPI,
  CedraApiType,
} from "../../src";

describe("cedra config", () => {
  test("it should set urls based on a local network", async () => {
    const settings: CedraSettings = {
      network: Network.TESTNET,
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toEqual("local");
    expect(cedraConfig.getRequestUrl(CedraApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.TESTNET]);
    expect(cedraConfig.getRequestUrl(CedraApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.TESTNET]);
    expect(cedraConfig.getRequestUrl(CedraApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.TESTNET]);
  });

  test("it should set urls based on testnet", async () => {
    const settings: CedraSettings = {
      network: Network.TESTNET,
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toEqual("testnet");
    expect(cedraConfig.getRequestUrl(CedraApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.TESTNET]);
    expect(() => cedraConfig.getRequestUrl(CedraApiType.FAUCET)).toThrow();
    expect(cedraConfig.getRequestUrl(CedraApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.TESTNET]);
  });

  test("it should set urls based on mainnet", async () => {
    const settings: CedraSettings = {
      network: Network.MAINNET,
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toEqual("mainnet");
    expect(cedraConfig.getRequestUrl(CedraApiType.FULLNODE)).toBe(NetworkToNodeAPI[Network.MAINNET]);
    expect(() => cedraConfig.getRequestUrl(CedraApiType.FAUCET)).toThrow();
    expect(cedraConfig.getRequestUrl(CedraApiType.INDEXER)).toBe(NetworkToIndexerAPI[Network.MAINNET]);
  });

  test("it should have undefined urls when network is custom and no urls provided", async () => {
    const settings: CedraSettings = {
      network: Network.CUSTOM,
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toBe("custom");
    expect(cedraConfig.fullnode).toBeUndefined();
    expect(cedraConfig.faucet).toBeUndefined();
    expect(cedraConfig.indexer).toBeUndefined();
  });

  test("getRequestUrl should throw when network is custom and no urls provided", async () => {
    const settings: CedraSettings = {
      network: Network.CUSTOM,
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toBe("custom");
    expect(() => cedraConfig.getRequestUrl(CedraApiType.FULLNODE)).toThrow();
    expect(() => cedraConfig.getRequestUrl(CedraApiType.FAUCET)).toThrow();
    expect(() => cedraConfig.getRequestUrl(CedraApiType.INDEXER)).toThrow();
  });

  test("it should set urls when network is custom and urls provided", async () => {
    const settings: CedraSettings = {
      network: Network.CUSTOM,
      fullnode: "my-fullnode-url",
      faucet: "my-faucet-url",
      indexer: "my-indexer-url",
    };
    const cedraConfig = new CedraConfig(settings);
    expect(cedraConfig.network).toBe("custom");
    expect(cedraConfig.fullnode).toBe("my-fullnode-url");
    expect(cedraConfig.faucet).toBe("my-faucet-url");
    expect(cedraConfig.indexer).toBe("my-indexer-url");
  });

  test("it sets the correct configs", () => {
    const cedraConfig = new CedraConfig({
      clientConfig: {
        HEADERS: { clientConfig: "header" },
        API_KEY: "api-key",
      },
      faucetConfig: { HEADERS: { faucet: "header" }, AUTH_TOKEN: "auth-token" },
      indexerConfig: { HEADERS: { indexer: "header" } },
      fullnodeConfig: { HEADERS: { fullnode: "header" } },
    });

    expect(cedraConfig.clientConfig?.HEADERS).toStrictEqual({ clientConfig: "header" });
    expect(cedraConfig.clientConfig?.API_KEY).toStrictEqual("api-key");
    expect(cedraConfig.faucetConfig).toStrictEqual({ HEADERS: { faucet: "header" }, AUTH_TOKEN: "auth-token" });
    expect(cedraConfig.indexerConfig).toStrictEqual({ HEADERS: { indexer: "header" } });
    expect(cedraConfig.fullnodeConfig).toStrictEqual({ HEADERS: { fullnode: "header" } });
  });
});
