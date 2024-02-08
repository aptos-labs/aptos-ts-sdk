// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "./accountAddress";
import { AuthenticationKey } from "./authenticationKey";
import { PublicKey, Signature } from "./crypto/asymmetricCrypto";


import { HexInput, SigningScheme } from "../types";
import { MultiKey } from "./crypto";
import { MultiSignature } from "./crypto/multiSignature";
import { Signer } from "./account";


export class MultiKeyAccount implements Signer{
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

  signers: Signer[];

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
   constructor(args: { multiKey: MultiKey; signers: Signer[] }) {
    const { multiKey, signers } = args;

    this.publicKey = multiKey;
    this.signers = signers
    this.signingScheme = SigningScheme.MultiKey;

    this.accountAddress = AuthenticationKey.fromPublicKey({ publicKey: this.publicKey} ).derivedAddress();

    const bits : number[] = [];
    for (const signer of signers) {
      bits.push(this.publicKey.getIndex(signer.publicKey));
    }
    this.signaturesBitmap = this.publicKey.createBitmap({bits});
  }

  static fromPublicKeysAndSigners(
    args: { publicKeys: PublicKey[]; signaturesRequired: number; signers: Signer[] }
  ): MultiKeyAccount {
    const { publicKeys, signaturesRequired, signers } = args;
    const multiKey = new MultiKey({publicKeys, signaturesRequired})
    return new MultiKeyAccount({multiKey, signers})
  }

  static isMultiKeySigner(signer: Signer): signer is MultiKeyAccount {
    return signer instanceof MultiKeyAccount;
  }

  /**
   * This key enables account owners to rotate their private key(s)
   * associated with the account without changing the address that hosts their account.
   * See here for more info: {@link https://aptos.dev/concepts/accounts#single-signer-authentication}
   *
   * @param args.publicKey PublicKey - public key of the account
   * @returns The authentication key for the associated account
   */
  static authKey(args: { publicKey: PublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return AuthenticationKey.fromPublicKey({ publicKey });
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
    return new MultiSignature(signatures);
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
