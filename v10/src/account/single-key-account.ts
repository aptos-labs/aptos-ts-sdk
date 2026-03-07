// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { PrivateKey } from "../crypto/private-key.js";
import { Secp256k1PrivateKey } from "../crypto/secp256k1.js";
import { AnyPublicKey, AnySignature, type PrivateKeyInput } from "../crypto/single-key.js";
import { SigningScheme, SigningSchemeInput } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Ed25519Account } from "./ed25519-account.js";
import type { Account, SingleKeySigner } from "./types.js";

export interface SingleKeySignerConstructorArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
}

export interface SingleKeySignerGenerateArgs {
  scheme?: SigningSchemeInput;
}

export type SingleKeySignerFromDerivationPathArgs = SingleKeySignerGenerateArgs & {
  path: string;
  mnemonic: string;
};

export class SingleKeyAccount implements Account, SingleKeySigner {
  readonly privateKey: PrivateKey;
  readonly publicKey: AnyPublicKey;
  readonly accountAddress: AccountAddress;
  readonly signingScheme = SigningScheme.SingleKey;

  constructor(args: SingleKeySignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = new AnyPublicKey(privateKey.publicKey());
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.SingleKey,
          input: this.publicKey.bcsToBytes(),
        }).derivedAddress();
  }

  getAnyPublicKey(): AnyPublicKey {
    return this.publicKey;
  }

  static generate(args: SingleKeySignerGenerateArgs = {}): SingleKeyAccount {
    const { scheme = SigningSchemeInput.Ed25519 } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.generate();
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  static fromDerivationPath(args: SingleKeySignerFromDerivationPathArgs): SingleKeyAccount {
    const { scheme = SigningSchemeInput.Ed25519, path, mnemonic } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  static fromEd25519Account(account: Ed25519Account): SingleKeyAccount {
    return new SingleKeyAccount({ privateKey: account.privateKey, address: account.accountAddress });
  }

  verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.sign(message));
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.signTransaction(transaction));
  }

  sign(message: HexInput): AnySignature {
    return new AnySignature(this.privateKey.sign(message));
  }

  signTransaction(transaction: AnyRawTransaction): AnySignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
