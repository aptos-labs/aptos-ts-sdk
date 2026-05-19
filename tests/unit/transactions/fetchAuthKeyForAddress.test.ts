// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, test, expect, beforeEach } from "vitest";
import { AptosConfig, Network } from "../../../src";
import { AccountAddress, AuthenticationKey } from "../../../src/core";
import { fetchAndCacheAuthKeyForAddress } from "../../../src/internal/account";
import * as utilsModule from "../../../src/internal/utils/utils";
import { clearMemoizeCache } from "../../../src/utils/memoize";

const ON_CHAIN_AUTH_KEY = `0x${"ab".repeat(32)}`;
const OTHER_AUTH_KEY = `0x${"cd".repeat(32)}`;

describe("fetchAndCacheAuthKeyForAddress", () => {
  const getInfoSpy = vi.spyOn(utilsModule, "getInfo");

  beforeEach(() => {
    vi.clearAllMocks();
    clearMemoizeCache();
  });

  test("returns an AuthenticationKey whose bytes match the on-chain authentication_key", async () => {
    getInfoSpy.mockResolvedValue({ sequence_number: "0", authentication_key: ON_CHAIN_AUTH_KEY });
    const config = new AptosConfig({ network: Network.MAINNET });
    const result = await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    expect(result).toBeInstanceOf(AuthenticationKey);
    expect(result.toString()).toBe(ON_CHAIN_AUTH_KEY);
  });

  test("memoizes per (network, address) — second call for the same address skips getInfo", async () => {
    getInfoSpy.mockResolvedValue({ sequence_number: "0", authentication_key: ON_CHAIN_AUTH_KEY });
    const config = new AptosConfig({ network: Network.MAINNET });
    await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    expect(getInfoSpy).toHaveBeenCalledTimes(1);
  });

  test("uses separate cache entries for different addresses on the same network", async () => {
    getInfoSpy.mockImplementation(async ({ accountAddress }: { accountAddress: any }) => ({
      sequence_number: "0",
      authentication_key:
        AccountAddress.from(accountAddress).toString() === AccountAddress.ONE.toString()
          ? ON_CHAIN_AUTH_KEY
          : OTHER_AUTH_KEY,
    }));
    const config = new AptosConfig({ network: Network.MAINNET });
    const a = await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    const b = await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.TWO });
    expect(a.toString()).toBe(ON_CHAIN_AUTH_KEY);
    expect(b.toString()).toBe(OTHER_AUTH_KEY);
    expect(getInfoSpy).toHaveBeenCalledTimes(2);
  });

  test("uses separate cache entries for the same address on different networks", async () => {
    getInfoSpy
      .mockResolvedValueOnce({ sequence_number: "0", authentication_key: ON_CHAIN_AUTH_KEY })
      .mockResolvedValueOnce({ sequence_number: "0", authentication_key: OTHER_AUTH_KEY });
    const mainnet = new AptosConfig({ network: Network.MAINNET });
    const testnet = new AptosConfig({ network: Network.TESTNET });
    const a = await fetchAndCacheAuthKeyForAddress({ aptosConfig: mainnet, accountAddress: AccountAddress.ONE });
    const b = await fetchAndCacheAuthKeyForAddress({ aptosConfig: testnet, accountAddress: AccountAddress.ONE });
    expect(a.toString()).toBe(ON_CHAIN_AUTH_KEY);
    expect(b.toString()).toBe(OTHER_AUTH_KEY);
    expect(getInfoSpy).toHaveBeenCalledTimes(2);
  });
});
