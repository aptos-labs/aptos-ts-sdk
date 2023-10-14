// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getTokenData } from "../internal/token";
import { GetTokenDataResponse, HexInput, TokenStandard } from "../types";
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
   * This creates an account if it does not exist and mints the specified amount of
   * coins into that account
   *
   * @param address Hex-encoded 16 bytes Aptos account address wich mints tokens
   * @param amount Amount of tokens to mint
   * @param timeoutSecs Timeout in seconds. Defaults to 20 seconds.
   * @returns Hashes of submitted transactions
   */
  async getTokenData(args: {
    tokenAddress: HexInput;
    options?: {
      tokenStandard?: TokenStandard;
    };
  }): Promise<GetTokenDataResponse> {
    const data = await getTokenData({ aptosConfig: this.config, ...args });
    return data;
  }
}
