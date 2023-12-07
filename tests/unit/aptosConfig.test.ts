// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AptosApiType,
  AptosConfig,
  AptosSettings,
  Network,
  NetworkToFaucetAPI,
  NetworkToIndexerV1API,
  NetworkToNodeV1API,
} from "../../src";

describe("aptos config", () => {
  test("it should set urls based on a local network", async () => {
    const settings: AptosSettings = {
      network: Network.LOCAL,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("local");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE_V1)).toBe(NetworkToNodeV1API[Network.LOCAL]);
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.LOCAL]);
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER_V1)).toBe(NetworkToIndexerV1API[Network.LOCAL]);
  });

  test("it should set urls based on a given network", async () => {
    const settings: AptosSettings = {
      network: Network.TESTNET,
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.network).toEqual("testnet");
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE_V1)).toBe(NetworkToNodeV1API[Network.TESTNET]);
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe(NetworkToFaucetAPI[Network.TESTNET]);
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER_V1)).toBe(NetworkToIndexerV1API[Network.TESTNET]);
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
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FULLNODE_V1)).toThrow();
    expect(() => aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toThrow();
    expect(() => aptosConfig.getRequestUrl(AptosApiType.INDEXER_V1)).toThrow();
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

  test("custom URLs will add /v1 and /v1/graphql", async () => {
    const settings: AptosSettings = {
      network: Network.CUSTOM,
      fullnode: "https://my-fullnode.com",
      faucet: "https://my-faucet.com",
      indexer: "https://my-indexer.com",
    };
    const aptosConfig = new AptosConfig(settings);
    expect(aptosConfig.getRequestUrl(AptosApiType.FULLNODE_V1)).toBe("https://my-fullnode.com/v1");
    expect(aptosConfig.getRequestUrl(AptosApiType.FAUCET)).toBe("https://my-faucet.com");
    expect(aptosConfig.getRequestUrl(AptosApiType.INDEXER_V1)).toBe("https://my-indexer.com/v1/graphql");
  });
});
