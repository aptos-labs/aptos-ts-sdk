// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos } from "../../../src";
import { Network } from "../../../src/utils/apiEndpoints";

// Note: These test against main net and could fail.
describe("staking api", () => {
  test("it queries for the number of delegators for a given poolAddress", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
    const existingDelegatorPoolAddr = "0x06099edbe54f242bad50020dfd67646b1e46282999483e7064e70f02f7ea3c15";
    const numDelegators = await aptos.getNumberOfDelegators({ poolAddress: existingDelegatorPoolAddr });
    expect(numDelegators).toBeGreaterThanOrEqual(0);
  });

  test("it throws if the poolAddress does not exist", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
    const badAddress = "0x12345678901234567850020dfd67646b1e46282999483e7064e70f02f7e12345";
    await expect(aptos.getNumberOfDelegators({ poolAddress: badAddress })).rejects.toThrow();
  });

  test("it queries for the number of delegators for all pools", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
    const numDelegatorsData = await aptos.getNumberOfDelegatorsForAllPools();
    expect(numDelegatorsData.length).toBeGreaterThan(0);
    expect(numDelegatorsData[0].num_active_delegator).toBeGreaterThanOrEqual(0);
  });

  test("it queries for the activity of a delegator for a given pool", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
    const poolAddress = "0x06099edbe54f242bad50020dfd67646b1e46282999483e7064e70f02f7ea3c15";
    const delegatorAddress = "0x5aa16d9f590b635f8cc17ba4abf40f60c77df0078cf5296a539cfbb9e87a285a";
    const delegatedStakingActivities = await aptos.getDelegatedStakingActivities({
      poolAddress,
      delegatorAddress,
    });
    expect(delegatedStakingActivities.length).toBeGreaterThan(0);
  });
});
