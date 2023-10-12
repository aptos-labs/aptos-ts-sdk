// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/staking}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptos_config";
import { Hex } from "../core";
import {
  GetDelegatedStakingActivitiesResponse,
  GetNumberOfDelegatorsForAllPoolsResponse,
  HexInput,
  OrderBy,
} from "../types";
import {
  GetDelegatedStakingActivitiesQuery,
  GetNumberOfDelegatorsForAllPoolsQuery,
  GetNumberOfDelegatorsQuery,
} from "../types/generated/operations";
import {
  GetDelegatedStakingActivities,
  GetNumberOfDelegators,
  GetNumberOfDelegatorsForAllPools,
} from "../types/generated/queries";
import { queryIndexer } from "./general";

export async function getNumberOfDelegators(args: {
  aptosConfig: AptosConfig;
  poolAddress: HexInput;
}): Promise<number> {
  const { aptosConfig, poolAddress } = args;
  const address = Hex.fromHexInput({ hexInput: poolAddress }).toString();
  const query = {
    query: GetNumberOfDelegators,
    variables: { poolAddress: address },
  };
  const data: GetNumberOfDelegatorsQuery = await queryIndexer<GetNumberOfDelegatorsQuery>({ aptosConfig, query });
  if (data.num_active_delegator_per_pool.length === 0) {
    throw Error("Delegator pool not found");
  }
  return data.num_active_delegator_per_pool[0].num_active_delegator;
}

export async function getNumberOfDelegatorsForAllPools(args: {
  aptosConfig: AptosConfig;
  options?: {
    orderBy?: OrderBy<GetNumberOfDelegatorsForAllPoolsResponse[0]>;
  };
}): Promise<GetNumberOfDelegatorsForAllPoolsResponse> {
  const { aptosConfig, options } = args;
  const query = {
    query: GetNumberOfDelegatorsForAllPools,
    variables: { order_by: options?.orderBy },
  };
  const data: GetNumberOfDelegatorsForAllPoolsQuery = await queryIndexer<GetNumberOfDelegatorsForAllPoolsQuery>({
    aptosConfig,
    query,
  });
  return data.num_active_delegator_per_pool;
}

export async function getDelegatedStakingActivities(args: {
  aptosConfig: AptosConfig;
  delegatorAddress: HexInput;
  poolAddress: HexInput;
}): Promise<GetDelegatedStakingActivitiesResponse> {
  const { aptosConfig, delegatorAddress, poolAddress } = args;
  const query = {
    query: GetDelegatedStakingActivities,
    variables: {
      delegatorAddress: Hex.fromHexInput({ hexInput: delegatorAddress }).toString(),
      poolAddress: Hex.fromHexInput({ hexInput: poolAddress }).toString(),
    },
  };
  const data = await queryIndexer<GetDelegatedStakingActivitiesQuery>({ aptosConfig, query });
  return data.delegated_staking_activities;
}
