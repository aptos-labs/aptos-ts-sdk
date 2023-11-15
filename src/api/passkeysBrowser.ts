// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { HexInput, PendingTransactionResponse } from "../types";
import { AnyRawTransaction } from "../transactions";
import { signWithPasskey } from "../internal/passkeysBrowser";

/**
 * A class for all `Passkeys` related operations on Aptos on the browser.
 */
export class PasskeysBrowser {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Given a credentialId and a transaction, it prompts the client to sign the transaction
   *
   * @param args.credentialId The credential ID of the passkey
   * @param args.publicKey The public key associated with the passkey
   * @param args.transaction The transaction to sign
   * @returns The pending transaction response
   */
  async signWithPasskey(args: {
    credentialId: HexInput;
    publicKey: HexInput;
    transaction: AnyRawTransaction;
  }): Promise<PendingTransactionResponse> {
    return signWithPasskey({ aptosConfig: this.config, ...args });
  }
}
