// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import type { Ed25519PrivateKey, Ed25519Signature } from "../crypto/ed25519.js";
import { type MultiEd25519PublicKey, MultiEd25519Signature } from "../crypto/multi-ed25519.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorMultiEd25519 } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Account } from "./types.js";

export interface MultiEd25519SignerConstructorArgs {
  publicKey: MultiEd25519PublicKey;
  signers: Ed25519PrivateKey[];
  address?: AccountAddressInput;
}

export class MultiEd25519Account implements Account {
  readonly publicKey: MultiEd25519PublicKey;
  readonly accountAddress: AccountAddress;
  readonly signingScheme = SigningScheme.MultiEd25519;
  readonly signers: Ed25519PrivateKey[];
  readonly signerIndices: number[];
  readonly signaturesBitmap: Uint8Array;

  constructor(args: MultiEd25519SignerConstructorArgs) {
    const { signers, publicKey, address } = args;
    this.publicKey = publicKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.MultiEd25519,
          input: this.publicKey.bcsToBytes(),
        }).derivedAddress();

    if (publicKey.threshold > signers.length) {
      throw new Error(
        `Not enough signers provided to satisfy the required signatures. Need ${publicKey.threshold} signers, but only ${signers.length} provided`,
      );
    } else if (publicKey.threshold < signers.length) {
      throw new Error(
        `More signers provided than required. Need ${publicKey.threshold} signers, but ${signers.length} provided`,
      );
    }

    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex(signer.publicKey()));
    }

    const signersAndBitPosition: [Ed25519PrivateKey, number][] = signers.map((signer, index) => [
      signer,
      bitPositions[index],
    ]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);

    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndices = signersAndBitPosition.map((value) => value[1]);
    this.signaturesBitmap = this.publicKey.createBitmap({ bits: bitPositions });
  }

  verifySignature(args: { message: HexInput; signature: MultiEd25519Signature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.sign(message));
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.signTransaction(transaction));
  }

  sign(message: HexInput): MultiEd25519Signature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(message) as Ed25519Signature);
    }
    return new MultiEd25519Signature({ signatures, bitmap: this.signaturesBitmap });
  }

  signTransaction(transaction: AnyRawTransaction): MultiEd25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
