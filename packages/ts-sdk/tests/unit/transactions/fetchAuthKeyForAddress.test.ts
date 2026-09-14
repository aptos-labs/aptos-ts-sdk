// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, test, expect, beforeEach } from "vitest";
import { AptosConfig, Network } from "../../../src";
import { AccountAddress, AuthenticationKey } from "../../../src/core";
import { fetchAndCacheAuthKeyForAddress } from "../../../src/internal/account";
import { AptosApiError } from "../../../src/errors";
import { AptosApiType } from "../../../src/utils/const";
import * as utilsModule from "../../../src/internal/utils/utils";
import { clearMemoizeCache } from "../../../src/utils/memoize";

const ON_CHAIN_AUTH_KEY = `0x${"ab".repeat(32)}`;
const OTHER_AUTH_KEY = `0x${"cd".repeat(32)}`;

function makeAptosApiError(errorCode: string, status = 404): AptosApiError {
  return new AptosApiError({
    apiType: AptosApiType.FULLNODE,
    aptosRequest: { url: "http://test/v1/accounts/0x1", method: "GET" },
    aptosResponse: {
      data: { message: "x", error_code: errorCode },
      status,
      statusText: status === 404 ? "Not Found" : "Error",
      url: "http://test/v1/accounts/0x1",
      headers: {},
    },
  });
}

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

  test("returns the address as the auth key when no Account resource exists on chain", async () => {
    getInfoSpy.mockRejectedValue(makeAptosApiError("account_not_found"));
    const config = new AptosConfig({ network: Network.MAINNET });
    const result = await fetchAndCacheAuthKeyForAddress({
      aptosConfig: config,
      accountAddress: AccountAddress.ONE,
    });
    expect(result).toBeInstanceOf(AuthenticationKey);
    expect(result.toString()).toBe(AccountAddress.ONE.toStringLong());
  });

  test("caches the address-fallback result like a normal hit", async () => {
    getInfoSpy.mockRejectedValue(makeAptosApiError("account_not_found"));
    const config = new AptosConfig({ network: Network.MAINNET });
    await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    await fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE });
    expect(getInfoSpy).toHaveBeenCalledTimes(1);
  });

  test("other API errors still propagate (no silent fallback)", async () => {
    const apiErr = makeAptosApiError("rate_limited", 429);
    getInfoSpy.mockRejectedValue(apiErr);
    const config = new AptosConfig({ network: Network.MAINNET });
    await expect(
      fetchAndCacheAuthKeyForAddress({ aptosConfig: config, accountAddress: AccountAddress.ONE }),
    ).rejects.toBe(apiErr);
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
