// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  GetCurrentFungibleAssetBalancesResponse,
  GetFungibleAssetActivitiesResponse,
  GetFungibleAssetMetadataResponse,
  PaginationArgs,
} from "../types";
import { AptosConfig } from "./aptosConfig";
import {
  getCurrentFungibleAssetBalances,
  getFungibleAssetActivities,
  getFungibleAssetMetadata,
} from "../internal/fungibleAsset";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../types/generated/types";

/**
 * A class to query all `FungibleAsset` related queries on Aptos.
 */
export class FungibleAsset {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries the current fungible asset metadata.
   *
   * This query returns the fungible asset metadata for all fungible assets.
   * It can be filtered by creator address and asset type.
   *
   * @returns getFungibleAssetMetadata A list of fungible asset metadata
   */
  async getFungibleAssetMetadata(args?: {
    options?: {
      pagination?: PaginationArgs;
      where?: FungibleAssetMetadataBoolExp;
    };
  }): Promise<GetFungibleAssetMetadataResponse> {
    return getFungibleAssetMetadata({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the fungible asset activities
   *
   * This query returns the fungible asset activities.
   * It can be filtered by owner address, asset type, and type.
   *
   * @returns GetFungibleAssetActivitiesResponse A list of fungible asset metadata
   */
  async getFungibleAssetActivities(args?: {
    options?: {
      pagination?: PaginationArgs;
      where?: FungibleAssetActivitiesBoolExp;
    };
  }): Promise<GetFungibleAssetActivitiesResponse> {
    return getFungibleAssetActivities({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the fungible asset balance
   *
   * This query returns the fungible asset balance.
   * It can be filtered by owner address, and asset type
   *
   * @returns GetCurrentFungibleAssetBalancesResponse A list of fungible asset metadata
   */
  async getCurrentFungibleAssetBalances(args?: {
    options?: {
      pagination?: PaginationArgs;
      where?: CurrentFungibleAssetBalancesBoolExp;
    };
  }): Promise<GetCurrentFungibleAssetBalancesResponse> {
    return getCurrentFungibleAssetBalances({ aptosConfig: this.config, ...args });
  }
}
