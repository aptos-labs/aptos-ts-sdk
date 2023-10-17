// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { GetFungibleAssetMetadataResponse, PaginationArgs } from "../types";
import { AptosConfig } from "./aptos_config";
import { getFungibleAssetMetadata } from "../internal/fungible_asset";
import { FungibleAssetMetadataBoolExp } from "../types/generated/types";

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
  async getFungibleAssetMetadata(args: {
    options?: {
      pagination?: PaginationArgs;
      where?: FungibleAssetMetadataBoolExp;
    };
  }): Promise<GetFungibleAssetMetadataResponse> {
    return getFungibleAssetMetadata({ aptosConfig: this.config, ...args });
  }
}
