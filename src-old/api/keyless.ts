// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { ZeroKnowledgeSig } from "../core";
import { deriveKeylessAccount, getPepper, getProof } from "../internal/keyless";
import { HexInput } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `Keyless` related queries on Aptos.
 *
 * More documentation on how to integrate Keyless Accounts see the below
 * https://aptos.dev/guides/keyless-accounts/#aptos-keyless-integration-guide
 */
export class Keyless {
  constructor(readonly config: AptosConfig) {}

  /**
   * Fetches the pepper from the Aptos pepper service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.derivationPath a derivation path used for creating multiple accounts per user via the BIP-44 standard. Defaults
   * to "m/44'/637'/0'/0'/0".
   * @returns The pepper which is a Uint8Array of length 31.
   */
  async getPepper(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    derivationPath?: string;
  }): Promise<Uint8Array> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches a proof from the Aptos prover service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.uidKey a key in the JWT token to use to set the uidVal in the IdCommitment
   * @param args.pepper the pepper used for the account.  If not provided it will be fetched from the Aptos pepper service
   *
   * @returns The proof which is represented by a ZeroKnowledgeSig.
   */
  async getProof(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper?: HexInput;
    uidKey?: string;
  }): Promise<ZeroKnowledgeSig> {
    return getProof({ aptosConfig: this.config, ...args });
  }

  /**
   * Derives the Keyless Account from the JWT token and corresponding EphemeralKeyPair.  It will lookup the pepper from
   * the pepper service if not explicitly provided.  It will compute the proof via the proving service.  It will ch
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.uidKey a key in the JWT token to use to set the uidVal in the IdCommitment
   * @param args.pepper the pepper
   * @param args.proofFetchCallback a callback function that if set, the fetch of the proof will be done in the background. Once
   * fetching finishes the callback function will be called.  This should be used to provide a more responsive user experience as now
   * they are not blocked on fetching the proof. Thus the function will return much more quickly.
   *
   * @returns A KeylessAccount that can be used to sign transactions
   */
  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }
}
