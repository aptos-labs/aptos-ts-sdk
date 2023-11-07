// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  GetCurrentFungibleAssetBalancesResponse,
  GetFungibleAssetActivitiesResponse,
  GetFungibleAssetMetadataResponse,
  PaginationArgs,
} from "../types";
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
import { Api } from "./api";
import { ProcessorType } from "../utils/const";

/**
 * A class to query all `FungibleAsset` related queries on Aptos.
 */
export class FungibleAsset extends Api {
  /**
   * Queries the current fungible asset metadata.
   *
   * This query returns the fungible asset metadata for all fungible assets.
   * It can be filtered by creator address and asset type.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   *
   * @returns getFungibleAssetMetadata A list of fungible asset metadata
   */
  async getFungibleAssetMetadata(args?: {
    minimumLedgerVersion?: string;
    options?: {
      pagination?: PaginationArgs;
      where?: FungibleAssetMetadataBoolExp;
    };
  }): Promise<GetFungibleAssetMetadataResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getFungibleAssetMetadata({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the current specific fungible asset metadata
   *
   * This query returns the fungible asset metadata for a specific fungible asset.
   *
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @param assetType The asset type of the fungible asset.
   * e.g
   * "0x1::aptos_coin::AptosCoin" for Aptos Coin
   * "0xc2948283c2ce03aafbb294821de7ee684b06116bb378ab614fa2de07a99355a8" - address format if this is fungible asset
   *
   * @returns getFungibleAssetMetadata A fungible asset metadata item
   */
  async getFungibleAssetMetadataByAssetType(args: {
    assetType: string;
    minimumLedgerVersion?: string;
  }): Promise<GetFungibleAssetMetadataResponse[0]> {
    await this.waitForIndexer({
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    const data = await getFungibleAssetMetadata({
      aptosConfig: this.config,
      options: {
        where: {
          asset_type: { _eq: args.assetType },
        },
      },
    });

    return data[0];
  }

  /**
   * Queries the fungible asset activities
   *
   * This query returns the fungible asset activities.
   * It can be filtered by owner address, asset type, and type.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   *
   * @returns GetFungibleAssetActivitiesResponse A list of fungible asset metadata
   */
  async getFungibleAssetActivities(args?: {
    minimumLedgerVersion?: string;
    options?: {
      pagination?: PaginationArgs;
      where?: FungibleAssetActivitiesBoolExp;
    };
  }): Promise<GetFungibleAssetActivitiesResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getFungibleAssetActivities({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the fungible asset balance
   *
   * This query returns the fungible asset balance.
   * It can be filtered by owner address, and asset type
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   *
   * @returns GetCurrentFungibleAssetBalancesResponse A list of fungible asset metadata
   */
  async getCurrentFungibleAssetBalances(args?: {
    minimumLedgerVersion?: string;
    options?: {
      pagination?: PaginationArgs;
      where?: CurrentFungibleAssetBalancesBoolExp;
    };
  }): Promise<GetCurrentFungibleAssetBalancesResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getCurrentFungibleAssetBalances({ aptosConfig: this.config, ...args });
  }
}
