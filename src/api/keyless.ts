// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, EphemeralKeyPair, KeylessAccount, MultiKeyAccount } from "../account";
import { deriveKeylessAccount, getPepper } from "../internal/keyless";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

interface BaseDeriveKeylessAccountArgs {
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  pepper?: HexInput;
  extraFieldKey?: string;
  fetchProofAsync?: boolean;
}

interface DeriveKeylessAccountArgs extends BaseDeriveKeylessAccountArgs {
  disableConnect: true;
}

interface DeriveKeylessAccountWithConnectArgs extends BaseDeriveKeylessAccountArgs {
  disableConnect?: boolean;
}

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

  async deriveKeylessAccount(args: DeriveKeylessAccountArgs): Promise<KeylessAccount>;
  async deriveKeylessAccount(args: DeriveKeylessAccountWithConnectArgs): Promise<MultiKeyAccount>;
  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    extraFieldKey?: string;
    disableConnect?: boolean;
    fetchProofAsync?: boolean;
  }): Promise<Account> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }
}
