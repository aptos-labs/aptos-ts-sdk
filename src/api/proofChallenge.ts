// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Signature } from "../core";
import { createProofChallenge, signProofChallenge } from "../internal/proofChallenge";
import { MoveFunctionId } from "../types";
import { AptosConfig } from "./aptosConfig";
import { ProofChallenge as ProofChallengeInstance } from "../transactions/instances/proofChallenge";
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from "../transactions/types";

/**
 * A class for all `ProofChallenge` Aptos related operations
 */
export class ProofChallenge {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Creates a generic proof challenge
   *
   * @param args.struct The struct address of the challenge
   * @param args.data The struct arguments
   *
   * @returns ProofChallenge
   */
  async createProofChallenge(args: {
    struct: MoveFunctionId;
    data: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;
  }): Promise<ProofChallengeInstance> {
    return createProofChallenge({
      config: this.config,
      ...args,
    });
  }

  /**
   * Signs a generic proof challenge
   *
   * @param args.challenge The generated challenge
   * @param args.signer The signer account
   *
   * @returns Signature
   */
  // eslint-disable-next-line class-methods-use-this
  signProofChallenge(args: { challenge: ProofChallengeInstance; signer: Account }): Signature {
    return signProofChallenge({
      ...args,
    });
  }
}
