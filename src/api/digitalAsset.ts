// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  GetCollectionDataResponse,
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  HexInput,
  OrderBy,
  PaginationArgs,
  TokenStandard,
} from "../types";
import { AptosConfig } from "./aptosConfig";
import { Account } from "../core";
import { InputGenerateTransactionOptions, InputSingleSignerTransaction } from "../transactions/types";
import {
  CreateCollectionOptions,
  createCollectionTransaction,
  getCollectionData,
  getCollectionId,
  getCurrentTokenOwnership,
  getOwnedTokens,
  getTokenActivity,
  getTokenData,
  mintTokenTransaction,
} from "../internal/digitalAsset";

/**
 * A class to query all `DigitalAsset` related queries on Aptos.
 */
export class DigitalAsset {
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
      options?: InputGenerateTransactionOptions;
    } & CreateCollectionOptions,
  ): Promise<InputSingleSignerTransaction> {
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

  /**
   * Create a transaction to mint a token into the creators account within an existing collection.
   *
   * @param args.creator the creator of the collection
   * @param args.collection the name of the collection the token belongs to
   * @param args.description the description of the token
   * @param args.name the name of the token
   * @param args.uri the URI to additional info about the token
   *
   * @returns A SingleSignerTransaction that can be simulated or submitted to chain
   */
  async mintTokenTransaction(args: {
    creator: Account;
    collection: string;
    description: string;
    name: string;
    uri: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<InputSingleSignerTransaction> {
    return mintTokenTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets token data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @returns GetTokenDataResponse containing relevant data to the token.
   */
  async getTokenData(args: { tokenAddress: HexInput }): Promise<GetTokenDataResponse> {
    return getTokenData({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets token ownership data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @returns GetCurrentTokenOwnershipResponse containing relevant ownership data of the token.
   */
  async getCurrentTokenOwnership(args: { tokenAddress: HexInput }): Promise<GetCurrentTokenOwnershipResponse> {
    return getCurrentTokenOwnership({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets the tokens that the given address owns.
   *
   * @param args.ownerAddress The address of the owner
   * @returns GetOwnedTokensResponse containing ownership data of the tokens belonging to the ownerAddresss.
   */
  async getOwnedTokens(args: {
    ownerAddress: HexInput;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetOwnedTokensResponse[0]>;
    };
  }): Promise<GetOwnedTokensResponse> {
    return getOwnedTokens({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets the activity data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @returns GetTokenActivityResponse containing relevant activity data to the token.
   */
  async getTokenActivity(args: {
    tokenAddress: HexInput;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetTokenActivityResponse[0]>;
    };
  }): Promise<GetTokenActivityResponse> {
    return getTokenActivity({ aptosConfig: this.config, ...args });
  }
}
