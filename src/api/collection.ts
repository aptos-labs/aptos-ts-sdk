// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { getCollectionId, getCollectionData } from "../internal/collection";
import { GetCollectionDataResponse, HexInput, TokenStandard } from "../types";

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
   * @param args.creatorAddress the address of the collection's creator
   * @param args.collectionName the name of the collection
   * @param args.options.tokenStandard the token standard to query
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
   * Queries a collection's Id.
   *
   * This is the same as the collection's object address in V2, but V1 does
   * not use objects, and does not have an address
   *
   * @param args.creatorAddress the address of the collection's creator
   * @param args.collectionName the name of the collection
   * @param args.options.tokenStandard the token standard to query
   * @returns the collection id
   */
  async getCollectionId(args: {
    creatorAddress: HexInput;
    collectionName: string;
    options?: {
      tokenStandard?: TokenStandard;
    };
  }): Promise<string> {
    return getCollectionId({ aptosConfig: this.config, ...args });
  }
}
