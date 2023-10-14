// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getCollectionAddress, getCollectionData } from "../internal/collection";
import { GetCollectionDataResponse, HexInput, TokenStandard } from "../types";
import { AptosConfig } from "./aptos_config";

/**
 * A class to query all `Collection` related queries on Aptos.
 */
export class Collection {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Queries data of a specific collection by the collection creator address and the collection name.
   *
   * If, for some reason, a creator account has 2 collections with the same name in v1 and v2,
   * can pass an optional `tokenStandard` parameter to query a specific standard
   *
   * @param creatorAddress the address of the collection's creator
   * @param collectionName the name of the collection
   * @returns GetCollectionDataResponse response type
   */
  async getCollectionData(args: {
    creatorAddress: HexInput;
    collectionName: string;
    options?: {
      tokenStandard?: TokenStandard;
    };
  }): Promise<GetCollectionDataResponse> {
    return getCollectionData({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries a collection's address.
   *
   * @param creatorAddress the address of the collection's creator
   * @param collectionName the name of the collection
   * @returns the collection address
   */
  async getCollectionAddress(args: {
    creatorAddress: HexInput;
    collectionName: string;
    options?: {
      tokenStandard?: TokenStandard;
    };
  }): Promise<string> {
    return getCollectionAddress({ aptosConfig: this.config, ...args });
  }
}
