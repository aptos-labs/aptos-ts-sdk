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
  async getPepper(args: { jwt: string; ephemeralKeyPair: EphemeralKeyPair }): Promise<Uint8Array> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    extraFieldKey?: string;
    disableConnect?: boolean;
    fetchProofAsync?: boolean;
  }): Promise<KeylessAccount> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }
}
