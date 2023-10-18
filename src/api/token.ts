// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { getCurrentTokenOwnership, getOwnedTokens, getTokenActivity, getTokenData } from "../internal/token";
import {
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  HexInput,
  OrderBy,
  PaginationArgs,
} from "../types";

/**
 * A class to query all `Token` related queries on Aptos.
 */
export class Token {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
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
  async getOwnedTokens(args: { ownerAddress: HexInput }): Promise<GetOwnedTokensResponse> {
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
