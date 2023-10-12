// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  getDelegatedStakingActivities,
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
} from "../internal/staking";
import {
  GetDelegatedStakingActivitiesResponse,
  GetNumberOfDelegatorsForAllPoolsResponse,
  HexInput,
  OrderBy,
} from "../types";
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
   * Queries current number of delegators in a pool.  Throws an error if the pool is not found.
   *
   * @param poolAddress Pool address
   * @returns The number of delegators for the given pool
   */
  async getNumberOfDelegators(args: { poolAddress: HexInput }): Promise<number> {
    const numDelegators = await getNumberOfDelegators({ aptosConfig: this.config, ...args });
    return numDelegators;
  }

  /**
   * Queries current number of delegators in a pool.  Throws an error if the pool is not found.
   *
   * @param poolAddress Pool address
   * @returns GetNumberOfDelegatorsForAllPoolsResponse response type
   */
  async getNumberOfDelegatorsForAllPools(args?: {
    options?: {
      orderBy?: OrderBy<GetNumberOfDelegatorsForAllPoolsResponse[0]>;
    };
  }): Promise<GetNumberOfDelegatorsForAllPoolsResponse> {
    const numDelegatorData = await getNumberOfDelegatorsForAllPools({ aptosConfig: this.config, ...args });
    return numDelegatorData;
  }

  /**
   * Queries delegated staking activities
   *
   * @param delegatorAddress Delegator address
   * @param poolAddress Pool address
   * @returns GetDelegatedStakingActivitiesResponse response type
   */
  async getDelegatedStakingActivities(args: {
    delegatorAddress: HexInput;
    poolAddress: HexInput;
  }): Promise<GetDelegatedStakingActivitiesResponse> {
    const delegatedStakingActivities = await getDelegatedStakingActivities({ aptosConfig: this.config, ...args });
    return delegatedStakingActivities;
  }
}
