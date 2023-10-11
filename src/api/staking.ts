// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getDelegatedStakingActivities, getNumberOfDelegators } from "../internal/staking";
import { HexInput } from "../types";
import { GetDelegatedStakingActivitiesQuery, GetNumberOfDelegatorsQuery } from "../types/generated/operations";
import { AptosConfig } from "./aptos_config";

/**
 * A class to query all `Staking` related queries on Aptos.
 */
export class Staking {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries current number of delegators in a pool
   *
   * @returns GetNumberOfDelegatorsQuery response type
   */
  async getNumberOfDelegators(args: { poolAddress: HexInput }): Promise<GetNumberOfDelegatorsQuery> {
    const numDelegators = await getNumberOfDelegators({ aptosConfig: this.config, ...args });
    return numDelegators;
  }

  /**
   * Queries delegated staking activities
   *
   * @param delegatorAddress Delegator address
   * @param poolAddress Pool address
   * @returns GetDelegatedStakingActivitiesQuery response type
   */
  async getDelegatedStakingActivities(args: {
    delegatorAddress: HexInput;
    poolAddress: HexInput;
  }): Promise<GetDelegatedStakingActivitiesQuery> {
    const delegatedStakingActivities = await getDelegatedStakingActivities({ aptosConfig: this.config, ...args });
    return delegatedStakingActivities;
  }
}
