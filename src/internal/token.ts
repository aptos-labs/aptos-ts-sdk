// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/token}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * token namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Hex } from "../core";
import { GetTokenDataResponse, HexInput } from "../types";
import { GetTokenDataQuery } from "../types/generated/operations";
import { GetTokenData } from "../types/generated/queries";
import { queryIndexer } from "./general";

export async function getTokenData(args: {
  aptosConfig: AptosConfig;
  tokenAddress: HexInput;
}): Promise<GetTokenDataResponse> {
  const { aptosConfig, tokenAddress } = args;

  const whereCondition: any = {
    token_data_id: { _eq: Hex.fromHexInput(tokenAddress).toString() },
  };

  const graphqlQuery = {
    query: GetTokenData,
    variables: {
      where_condition: whereCondition,
    },
  };

  const data = await queryIndexer<GetTokenDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getTokenData",
  });

  return data.current_token_datas_v2[0];
}
