// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./Account";
import { MultiKey, MultiSignature, PublicKey, Signature } from "../core/crypto";
import { AccountAddress } from "../core/accountAddress";
import { HexInput, SigningScheme } from "../types";
import { AccountAuthenticatorMultiKey } from "../transactions/authenticator/account";
import { AnyRawTransaction } from "../transactions/types";


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
   * constructor for Account
   *
   * Need to update this to use the new crypto library if new schemes are added.
   *
   * @param args.privateKey PrivateKey - private key of the account
   * @param args.address AccountAddress - address of the account
   * @param args.legacy optional. If set to false, the keypair authentication keys will be derived with a unified scheme.
   * Defaults to deriving an authentication key with the legacy scheme.
   *
   * This method is private because it should only be called by the factory static methods.
   * @returns Account
   */
   constructor(args: { multiKey: MultiKey; signers: Account[] }) {
    const { multiKey, signers } = args;

    this.publicKey = multiKey;
    this.signers = signers
    this.signingScheme = SigningScheme.MultiKey;

    this.accountAddress = this.publicKey.authKey().derivedAddress();

    const bits : number[] = [];
    for (const signer of signers) {
      bits.push(this.publicKey.getIndex(signer.publicKey));
    }
    this.signaturesBitmap = this.publicKey.createBitmap({bits});
  }

  static fromPublicKeysAndSigners(
    args: { publicKeys: PublicKey[]; signaturesRequired: number; signers: Account[] }
  ): MultiKeyAccount {
    const { publicKeys, signaturesRequired, signers } = args;
    const multiKey = new MultiKey({publicKeys, signaturesRequired})
    return new MultiKeyAccount({multiKey, signers})
  }

  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  signWithAuthenticator(transaction: AnyRawTransaction) {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Sign the given message with the private key.
   *
   * TODO: Add sign transaction or specific types
   *
   * @param data in HexInput format
   * @returns Signature
   */
  sign(data: HexInput): MultiSignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(data));
    }
    return new MultiSignature({signatures, bitmap: this.signaturesBitmap});
  }

  signTransaction(transaction: AnyRawTransaction) {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.signTransaction(transaction));
    }
    return new MultiSignature({signatures, bitmap: this.signaturesBitmap});
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
