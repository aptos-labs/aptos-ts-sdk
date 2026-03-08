import { describe, expect, it } from "vitest";
import {
  Network,
  NetworkToChainId,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToNetworkName,
  NetworkToNodeAPI,
} from "../../../src/core/network.js";

describe("Network enum", () => {
  it("has expected values", () => {
    expect(Network.MAINNET).toBe("mainnet");
    expect(Network.TESTNET).toBe("testnet");
    expect(Network.DEVNET).toBe("devnet");
    expect(Network.LOCAL).toBe("local");
    expect(Network.CUSTOM).toBe("custom");
  });
});

describe("Network endpoint maps", () => {
  it("NetworkToNodeAPI has correct mainnet URL", () => {
    expect(NetworkToNodeAPI[Network.MAINNET]).toContain("mainnet.aptoslabs.com");
  });

  it("NetworkToNodeAPI has correct local URL", () => {
    expect(NetworkToNodeAPI[Network.LOCAL]).toContain("127.0.0.1");
  });

  it("NetworkToIndexerAPI has correct testnet URL", () => {
    expect(NetworkToIndexerAPI[Network.TESTNET]).toContain("testnet");
  });

  it("NetworkToFaucetAPI has correct devnet URL", () => {
    expect(NetworkToFaucetAPI[Network.DEVNET]).toContain("devnet");
  });

  it("NetworkToChainId has mainnet chain ID 1", () => {
    expect(NetworkToChainId[Network.MAINNET]).toBe(1);
  });

  it("NetworkToChainId has testnet chain ID 2", () => {
    expect(NetworkToChainId[Network.TESTNET]).toBe(2);
  });

  it("NetworkToNetworkName maps correctly", () => {
    expect(NetworkToNetworkName[Network.MAINNET]).toBe("mainnet");
    expect(NetworkToNetworkName[Network.TESTNET]).toBe("testnet");
  });
});
