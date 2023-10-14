// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getTokenData } from "../internal/token";
import { GetTokenDataResponse, HexInput } from "../types";
import { AptosConfig } from "./aptos_config";

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
}
