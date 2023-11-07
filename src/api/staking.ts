// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  getDelegatedStakingActivities,
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
} from "../internal/staking";
import { GetDelegatedStakingActivitiesResponse, GetNumberOfDelegatorsResponse, OrderBy } from "../types";
import { AccountAddressInput } from "../core";
import { Api } from "./api";
import { ProcessorType } from "../utils/const";

/**
 * A class to query all `Staking` related queries on Aptos.
 */
export class Staking extends Api {
  /**
   * Queries current number of delegators in a pool.  Throws an error if the pool is not found.
   *
   * @param args.poolAddress Pool address
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns The number of delegators for the given pool
   */
  async getNumberOfDelegators(args: {
    poolAddress: AccountAddressInput;
    minimumLedgerVersion?: string;
  }): Promise<number> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getNumberOfDelegators({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries current number of delegators in a pool.  Throws an error if the pool is not found.
   *
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetNumberOfDelegatorsForAllPoolsResponse response type
   */
  async getNumberOfDelegatorsForAllPools(args?: {
    minimumLedgerVersion?: string;
    options?: {
      orderBy?: OrderBy<GetNumberOfDelegatorsResponse[0]>;
    };
  }): Promise<GetNumberOfDelegatorsResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getNumberOfDelegatorsForAllPools({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries delegated staking activities
   *
   * @param args.delegatorAddress Delegator address
   * @param args.poolAddress Pool address
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetDelegatedStakingActivitiesResponse response type
   */
  async getDelegatedStakingActivities(args: {
    delegatorAddress: AccountAddressInput;
    poolAddress: AccountAddressInput;
    minimumLedgerVersion?: string;
  }): Promise<GetDelegatedStakingActivitiesResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getDelegatedStakingActivities({ aptosConfig: this.config, ...args });
  }
}
