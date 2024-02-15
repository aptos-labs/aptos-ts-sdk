// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralAccount, GrothZkIDAccount, ZkIDAccount } from "../core";
import { deriveAccountFromJWTAndEphemAccount, deriveGrothAccountFromJWTAndEphemAccount, getPepper } from "../internal/zkid";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `ZkID` related queries on Aptos.
 */
export class ZkID {
  constructor(readonly config: AptosConfig) {}

  /**
   * TODO
   *
   * @param args.jwt jwt token
   * @returns The pepper
   */
  async getPepper(args: { jwt: string }): Promise<string> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  /**
   * TODO
   *
   * @param args.jwt jwt token
   * @param args.ephemeralAccount
   * @param args.uidKey
   * @param args.pepper
   * @returns
   */
  async deriveAccountFromJWTAndEphemAccount(args: {
    jwt: string;
    ephemeralAccount: EphemeralAccount;
    uidKey?: string;
    pepper?: HexInput;
  }): Promise<ZkIDAccount> {
    return deriveAccountFromJWTAndEphemAccount({ aptosConfig: this.config, ...args });
  }

    /**
   * TODO
   *
   * @param args.jwt jwt token
   * @param args.ephemeralAccount
   * @param args.uidKey
   * @param args.pepper
   * @returns
   */
    async deriveGrothAccountFromJWTAndEphemAccount(args: {
      jwt: string;
      ephemeralAccount: EphemeralAccount;
      uidKey?: string;
      pepper?: HexInput;
      extraFieldKey?: string
    }): Promise<GrothZkIDAccount> {
      return deriveGrothAccountFromJWTAndEphemAccount({ aptosConfig: this.config, ...args });
    }
}
