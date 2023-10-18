// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/staking}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Hex } from "../core";
import { GetDelegatedStakingActivitiesResponse, GetNumberOfDelegatorsResponse, HexInput, OrderBy } from "../types";
import { GetDelegatedStakingActivitiesQuery, GetNumberOfDelegatorsQuery } from "../types/generated/operations";
import { GetDelegatedStakingActivities, GetNumberOfDelegators } from "../types/generated/queries";
import { queryIndexer } from "./general";

export async function getNumberOfDelegators(args: {
  aptosConfig: AptosConfig;
  poolAddress: HexInput;
}): Promise<number> {
  const { aptosConfig, poolAddress } = args;
  const address = Hex.fromHexInput(poolAddress).toString();
  const query = {
    query: GetNumberOfDelegators,
    variables: { where_condition: { pool_address: { _eq: address } } },
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
    orderBy?: OrderBy<GetNumberOfDelegatorsResponse[0]>;
  };
}): Promise<GetNumberOfDelegatorsResponse> {
  const { aptosConfig, options } = args;
  const query = {
    query: GetNumberOfDelegators,
    variables: { where_condition: {}, order_by: options?.orderBy },
  };
  const data: GetNumberOfDelegatorsQuery = await queryIndexer<GetNumberOfDelegatorsQuery>({
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
      delegatorAddress: Hex.fromHexInput(delegatorAddress).toString(),
      poolAddress: Hex.fromHexInput(poolAddress).toString(),
    },
  };
  const data = await queryIndexer<GetDelegatedStakingActivitiesQuery>({ aptosConfig, query });
  return data.delegated_staking_activities;
}
