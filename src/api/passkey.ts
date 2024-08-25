/* eslint-disable class-methods-use-this */
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/server/esm/deps";
import { AccountAddress, PublicKey } from "../core";
import {
  generateRegistrationOptions,
  getPasskeyAccountAddress,
  parsePublicKey,
  registerCredential,
  signAndSubmitWithPasskey,
  signWithPasskey,
} from "../internal/passkey";
import { AccountAuthenticator, AnyRawTransaction } from "../transactions";
import { HexInput, PendingTransactionResponse } from "../types";
import { AllowCredentialOption } from "../types/passkey";
import { AptosConfig } from "./aptosConfig";

/**
 * A class for all `Passkeys` related operations on Aptos on the browser.
 */
export class Passkey {
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
  async signAndSubmitWithPasskey(args: {
    credentialId: string | Uint8Array;
    publicKey: PublicKey;
    transaction: AnyRawTransaction;
    timeout?: number;
    rpID: string;
    options?: {
      allowCredentials?: AllowCredentialOption[];
    };
  }): Promise<PendingTransactionResponse> {
    return signAndSubmitWithPasskey({ aptosConfig: this.config, ...args });
  }

  async signWithPasskey(args: {
    credentialId: string | Uint8Array;
    publicKey: PublicKey;
    transaction: AnyRawTransaction;
    timeout?: number;
    rpID: string;
    options?: {
      allowCredentials?: AllowCredentialOption[];
    };
  }): Promise<AccountAuthenticator> {
    return signWithPasskey({ ...args });
  }

  async getPasskeyAccountAddress(args: { publicKey: HexInput }): Promise<AccountAddress> {
    return getPasskeyAccountAddress(args);
  }

  async generateRegistrationOptions(args: {
    rpName: string;
    rpID: string;
    userID?: Uint8Array;
    userName: string;
    challenge?: string | Uint8Array;
    userDisplayName?: string;
    timeout?: number;
    attestationType?: AttestationConveyancePreference;
    authenticatorAttachment?: AuthenticatorAttachment;
  }): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return generateRegistrationOptions(args);
  }

  async registerCredential(
    creationOptionsJSON: PublicKeyCredentialCreationOptionsJSON,
  ): Promise<RegistrationResponseJSON> {
    return registerCredential(creationOptionsJSON);
  }

  parsePublicKey(response: RegistrationResponseJSON): PublicKey {
    return parsePublicKey(response);
  }
}
