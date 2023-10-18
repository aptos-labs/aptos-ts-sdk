// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import {
  getCurrentTokenOwnership,
  getOwnedTokens,
  getTokenActivity,
  getTokenData,
  mintTokenTransaction,
} from "../internal/token";
import {
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  HexInput,
  OrderBy,
  PaginationArgs,
} from "../types";
import { Account } from "../core";
import { GenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";

/**
 * A class to query all `Token` related queries on Aptos.
 */
export class Token {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
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
   * @returns GetTokenDataResponse containing relevant data to the token.
   */
  async mintTokenTransaction(args: {
    creator: Account;
    collection: string;
    description: string;
    name: string;
    uri: string;
    options?: GenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return mintTokenTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * This gets token data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @returns GetTokenDataResponse containing relevant data to the token.
   */
  async getTokenData(args: { tokenAddress: HexInput }): Promise<GetTokenDataResponse> {
    return getTokenData({ aptosConfig: this.config, ...args });
  }

  /**
   * This gets token ownership data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @returns GetCurrentTokenOwnershipResponse containing relevant ownership data of the token.
   */
  async getCurrentTokenOwnership(args: { tokenAddress: HexInput }): Promise<GetCurrentTokenOwnershipResponse> {
    return getCurrentTokenOwnership({ aptosConfig: this.config, ...args });
  }

  /**
   * This gets the tokens that the given address owns.
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
   * This gets the activity data given the address of a token.
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
