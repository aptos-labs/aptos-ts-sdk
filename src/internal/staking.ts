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
import { HexInput } from "../types";
import { GetDelegatedStakingActivitiesQuery, GetNumberOfDelegatorsQuery } from "../types/generated/operations";
import { GetDelegatedStakingActivities, GetNumberOfDelegators } from "../types/generated/queries";
import { queryIndexer } from "./general";

export async function getNumberOfDelegators(args: {
  aptosConfig: AptosConfig;
  poolAddress: HexInput;
}): Promise<GetNumberOfDelegatorsQuery> {
  const { aptosConfig, poolAddress } = args;
  const address = Hex.fromHexInput({ hexInput: poolAddress }).toString();
  const query = {
    query: GetNumberOfDelegators,
    variables: { poolAddress: address },
  };
  return queryIndexer({ aptosConfig, query });
}

export async function getDelegatedStakingActivities(args: {
  aptosConfig: AptosConfig;
  delegatorAddress: HexInput;
  poolAddress: HexInput;
}): Promise<GetDelegatedStakingActivitiesQuery> {
  const { aptosConfig, delegatorAddress, poolAddress } = args;
  const query = {
    query: GetDelegatedStakingActivities,
    variables: {
      delegatorAddress: Hex.fromHexInput({ hexInput: delegatorAddress }).toString(),
      poolAddress: Hex.fromHexInput({ hexInput: poolAddress }).toString(),
    },
  };
  return queryIndexer({ aptosConfig, query });
}
