// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey, type Ed25519PublicKey, type Ed25519Signature } from "../crypto/ed25519.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorEd25519 } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Account } from "./types.js";

export interface Ed25519SignerConstructorArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
}

export interface Ed25519SignerFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

export class Ed25519Account implements Account {
  readonly privateKey: Ed25519PrivateKey;
  readonly publicKey: Ed25519PublicKey;
  readonly accountAddress: AccountAddress;
  readonly signingScheme = SigningScheme.Ed25519;

  constructor(args: Ed25519SignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = privateKey.publicKey() as Ed25519PublicKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.Ed25519,
          input: this.publicKey.toUint8Array(),
        }).derivedAddress();
  }

  static generate(): Ed25519Account {
    return new Ed25519Account({ privateKey: Ed25519PrivateKey.generate() });
  }

  static fromDerivationPath(args: Ed25519SignerFromDerivationPathArgs): Ed25519Account {
    const { path, mnemonic } = args;
    return new Ed25519Account({ privateKey: Ed25519PrivateKey.fromDerivationPath(path, mnemonic) });
  }

  verifySignature(args: { message: HexInput; signature: Ed25519Signature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.privateKey.sign(message) as Ed25519Signature);
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.signTransaction(transaction));
  }

  sign(message: HexInput): Ed25519Signature {
    return this.privateKey.sign(message) as Ed25519Signature;
  }

  signTransaction(transaction: AnyRawTransaction): Ed25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
