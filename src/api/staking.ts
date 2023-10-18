// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  getDelegatedStakingActivities,
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
} from "../internal/staking";
import { GetDelegatedStakingActivitiesResponse, GetNumberOfDelegatorsResponse, HexInput, OrderBy } from "../types";

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
   * @param args.poolAddress Pool address
   * @returns The number of delegators for the given pool
   */
  async getNumberOfDelegators(args: { poolAddress: HexInput }): Promise<number> {
    return getNumberOfDelegators({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries current number of delegators in a pool.  Throws an error if the pool is not found.
   *
   * @returns GetNumberOfDelegatorsForAllPoolsResponse response type
   */
  async getNumberOfDelegatorsForAllPools(args?: {
    options?: {
      orderBy?: OrderBy<GetNumberOfDelegatorsResponse[0]>;
    };
  }): Promise<GetNumberOfDelegatorsResponse> {
    return getNumberOfDelegatorsForAllPools({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries delegated staking activities
   *
   * @param args.delegatorAddress Delegator address
   * @param args.poolAddress Pool address
   * @returns GetDelegatedStakingActivitiesResponse response type
   */
  async getDelegatedStakingActivities(args: {
    delegatorAddress: HexInput;
    poolAddress: HexInput;
  }): Promise<GetDelegatedStakingActivitiesResponse> {
    return getDelegatedStakingActivities({ aptosConfig: this.config, ...args });
  }
}
