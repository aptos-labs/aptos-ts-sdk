// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralKeyPair, KeylessAccount } from "../account";
import { deriveKeylessAccount, getPepper } from "../internal/keyless";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `OIDB` related queries on Aptos.
 */
export class Keyless {
  constructor(readonly config: AptosConfig) {}

  /**
   * TODO
   *
   * @param args.jwt jwt token
   * @returns The pepper
   */
  async getPepper(args: { jwt: string, ephemeralKeyPair: EphemeralKeyPair; }): Promise<Uint8Array> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  /**
   * TODO
   *
   * @param args.jwt jwt token
   * @param args.ephemeralKeyPair
   * @param args.uidKey
   * @param args.pepper
   * @returns
   */
    async deriveKeylessAccount(args: {
      jwt: string;
      ephemeralKeyPair: EphemeralKeyPair;
      uidKey?: string;
      pepper?: HexInput;
      extraFieldKey?: string
    }): Promise<KeylessAccount> {
      return deriveKeylessAccount({ aptosConfig: this.config, ...args });
    }
}
