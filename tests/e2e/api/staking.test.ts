// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos, Network } from "../../../src";
import { longTestTimeout } from "../../unit/helper";

describe("staking api", () => {
  test(
    "it queries for the number of delegators",
    async () => {
      const config = new AptosConfig({ network: Network.MAINNET });
      const aptos = new Aptos(config);
      const numDelegatorsData = await aptos.getNumberOfDelegatorsForAllPools({
        options: { orderBy: [{ num_active_delegator: "desc" }] },
      });
      expect(numDelegatorsData.length).toBeGreaterThan(5);
      for (let i = 1; i <= 5; i += 1) {
        expect(numDelegatorsData[i].num_active_delegator).toBeGreaterThanOrEqual(
          numDelegatorsData[i + 1].num_active_delegator,
        );
      }
      const numDelegators = await aptos.getNumberOfDelegators({ poolAddress: numDelegatorsData[0].pool_address! });
      expect(numDelegators).toEqual(numDelegatorsData[0].num_active_delegator);
    },
    longTestTimeout,
  );

  test("it returns 0 if the poolAddress does not exist", async () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);
    const badAddress = "0x12345678901234567850020dfd67646b1e46282999483e7064e70f02f7e12345";
    const numDelegators = await aptos.getNumberOfDelegators({ poolAddress: badAddress });
    expect(numDelegators).toBe(0);
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
    expect(delegatedStakingActivities[0]).toHaveProperty("amount");
    expect(delegatedStakingActivities[0]).toHaveProperty("delegator_address");
    expect(delegatedStakingActivities[0]).toHaveProperty("event_index");
    expect(delegatedStakingActivities[0]).toHaveProperty("event_type");
    expect(delegatedStakingActivities[0]).toHaveProperty("pool_address");
    expect(delegatedStakingActivities[0]).toHaveProperty("transaction_version");
  });
});
