// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  CreateCollectionOptions,
  createCollectionTransaction,
  getCollectionId,
  getCollectionData,
} from "../internal/collection";
import { Account } from "../core";
import { GenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
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
   * Creates a new collection within the specified account
   *
   * @param args.creator the account of the collection's creator
   * @param args.description the description of the collection
   * @param args.name the name of the collection
   * @param args.uri the URI to additional info about the collection
   *
   * The parameters below are optional.
   * @param args.maxSupply controls the max supply of the tokens - defaults MAX_U64_BIG_INT
   * @param args.mutableDescription controls mutability of the collection's description - defaults true
   * @param args.mutableRoyalty controls mutability of the collection's description - defaults true
   * @param args.mutableUri controls mutability of the collection's URI - defaults true
   * @param args.mutableTokenDescription controls mutability of the token's description - defaults true
   * @param args.mutableTokenName controls mutability of the token's name - defaults true
   * @param args.mutableTokenProperties controls mutability of token's properties - defaults true
   * @param args.mutableTokenUri controls mutability of the token's URI - defaults true
   * @param args.tokensBurnableByCreator controls whether tokens can be burnable by the creator - defaults true
   * @param args.tokensFreezableByCreator controls whether tokens can be frozen by the creator - defaults true
   * @param args.royaltyNumerator the numerator of the royalty to be paid to the creator when a token is transferred - defaults 0
   * @param args.royaltyDenominator the denominator of the royalty to be paid to the creator when a token is transferred -
   *    defaults 1
   *
   * @returns A SingleSignerTransaction that when submitted will create the collection.
   */
  async createCollectionTransaction(
    args: {
      creator: Account;
      description: string;
      name: string;
      uri: string;
      options?: GenerateTransactionOptions;
    } & CreateCollectionOptions,
  ): Promise<SingleSignerTransaction> {
    return createCollectionTransaction({ aptosConfig: this.config, ...args });
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
   * Queries a collection's ID.
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
