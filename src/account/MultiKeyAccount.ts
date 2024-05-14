// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./Account";
import { MultiKey, MultiKeySignature, PublicKey, Signature } from "../core/crypto";
import { AccountAddress } from "../core/accountAddress";
import { HexInput, SigningScheme } from "../types";
import { AccountAuthenticatorMultiKey } from "../transactions/authenticator/account";
import { AnyRawTransaction } from "../transactions/types";
import { KeylessAccount } from "./KeylessAccount";

export class MultiKeyAccount implements Account {
  /**
   * Public key associated with the account
   */
  readonly publicKey: MultiKey;

  /**
   * Account address associated with the account
   */
  readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   */
  readonly signingScheme: SigningScheme;

  signers: Account[];

  signaturesBitmap: Uint8Array;

  /**
   * constructor for MultiKeyAccount
   *
   * @param args.multiKey the multikey of the account which consists of N public keys and a number M which is
   * the number of required signatures.
   * @param args.signers an array of M signers that will be used to sign the transaction
   * @returns MultiKeyAccount
   */
  constructor(args: { multiKey: MultiKey; signers: Account[] }) {
    const { multiKey, signers } = args;

    this.publicKey = multiKey;
    this.signers = signers;
    this.signingScheme = SigningScheme.MultiKey;

    this.accountAddress = this.publicKey.authKey().derivedAddress();

    const bits: number[] = [];
    for (const signer of signers) {
      bits.push(this.publicKey.getIndex(signer.publicKey));
    }
    this.signaturesBitmap = this.publicKey.createBitmap({ bits });
  }

  /**
   * Static constructor for MultiKeyAccount
   *
   * @param args.publicKeys the N public keys of the MultiKeyAccount
   * @param args.signaturesRequired the number of signatures required
   * @param args.signers an array of M signers that will be used to sign the transaction
   * @returns MultiKeyAccount
   */
  static fromPublicKeysAndSigners(args: {
    publicKeys: PublicKey[];
    signaturesRequired: number;
    signers: Account[];
  }): MultiKeyAccount {
    const { publicKeys, signaturesRequired, signers } = args;
    const multiKey = new MultiKey({ publicKeys, signaturesRequired });
    return new MultiKeyAccount({ multiKey, signers });
  }

  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.sign(message));
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  async waitForProofFetch() {
    const keylessSigners = this.signers.filter((signer) => signer instanceof KeylessAccount) as KeylessAccount[];
    await Promise.all(keylessSigners.filter((signer) => signer.proof instanceof Promise).map((signer) => signer.proof));
  }

  /**
   * Sign the given message with the account.
   *
   * @param data in HexInput format
   * @returns MultiSignature
   */
  sign(data: HexInput): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(data));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  signTransaction(transaction: AnyRawTransaction): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.signTransaction(transaction));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    return true;
  }
}
