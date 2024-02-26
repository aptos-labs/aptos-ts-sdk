// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralAccount, KeylessAccount, ZkIDAccount } from "../core";
import { deriveAccountFromJWTAndEphemAccount, deriveKeylessAccount, getPepper } from "../internal/oidb";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `OIDB` related queries on Aptos.
 */
export class OIDB {
  constructor(readonly config: AptosConfig) {}

  /**
   * TODO
   *
   * @param args.jwt jwt token
   * @returns The pepper
   */
  async getPepper(args: { jwt: string, ephemeralAccount: EphemeralAccount; }): Promise<Uint8Array> {
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
    async deriveKeylessAccount(args: {
      jwt: string;
      ephemeralAccount: EphemeralAccount;
      uidKey?: string;
      pepper?: HexInput;
      extraFieldKey?: string
    }): Promise<KeylessAccount> {
      return deriveKeylessAccount({ aptosConfig: this.config, ...args });
    }
}
