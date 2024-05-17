// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { deriveKeylessAccount, getPepper } from "../internal/keyless";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `Keyless` related queries on Aptos.
 */
export class Keyless {
  constructor(readonly config: AptosConfig) {}

  /**
   * Fetches the pepper from the Aptos pepper service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @returns The pepper which is a Uint8Array of length 31.
   */
  async getPepper(args: { jwt: string; ephemeralKeyPair: EphemeralKeyPair }): Promise<Uint8Array> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches the pepper from the Aptos pepper service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.uidKey a key in the JWT token to use to set the uidVal in the IdCommitment
   * @param args.pepper the pepper
   * @param args.extraFieldKey a key in the JWT token used to reveal a value on chain
   * @param args.proofFetchCallback a callback function that if set, the fetch of the proof will be done asyncronously. Once
   * if finishes the callback function will be called.
   * @returns A KeylessAccount that can be used to sign transactions
   */
  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    extraFieldKey?: string;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }
}
