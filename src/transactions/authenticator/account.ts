// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { Serializer, Deserializer, Serializable } from "../../bcs";
import { AnyPublicKey } from "../../core/crypto/anyPublicKey";
import { AnySignature } from "../../core/crypto/anySignature";
import { Ed25519PublicKey, Ed25519Signature } from "../../core/crypto/ed25519";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../../core/crypto/multiEd25519";
import { AccountAuthenticatorVariant } from "../../types";

export abstract class AccountAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): AccountAuthenticator {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AccountAuthenticatorVariant.Ed25519:
        return AccountAuthenticatorEd25519.load(deserializer);
      case AccountAuthenticatorVariant.MultiEd25519:
        return AccountAuthenticatorMultiEd25519.load(deserializer);
      case AccountAuthenticatorVariant.SingleKey:
        return SingleKeyAuthenticator.load(deserializer);
      default:
        throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
    }
  }
}

/**
 * Transaction authenticator Ed25519 for a multi signer transaction
 *
 * @param public_key Account's Ed25519 public key.
 * @param signature Account's Ed25519 signature
 *
 */
export class AccountAuthenticatorEd25519 extends AccountAuthenticator {
  public readonly public_key: Ed25519PublicKey;

  public readonly signature: Ed25519Signature;

  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorEd25519(public_key, signature);
  }
}

/**
 * Transaction authenticator Multi Ed25519 for a multi signers transaction
 *
 * @param public_key Account's MultiEd25519 public key.
 * @param signature Account's MultiEd25519 signature
 *
 */
export class AccountAuthenticatorMultiEd25519 extends AccountAuthenticator {
  public readonly public_key: MultiEd25519PublicKey;

  public readonly signature: MultiEd25519Signature;

  constructor(public_key: MultiEd25519PublicKey, signature: MultiEd25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiEd25519 {
    const public_key = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorMultiEd25519(public_key, signature);
  }
}

/**
 * SingleKeyAuthenticator for a single signer
 *
 * @param public_key AnyPublicKey
 * @param signature AnySignature
 *
 */
export class SingleKeyAuthenticator extends AccountAuthenticator {
  public readonly public_key: AnyPublicKey;

  public readonly signature: AnySignature;

  constructor(public_key: AnyPublicKey, signature: AnySignature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.SingleKey);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): SingleKeyAuthenticator {
    const public_key = AnyPublicKey.deserialize(deserializer);
    const signature = AnySignature.deserialize(deserializer);
    return new SingleKeyAuthenticator(public_key, signature);
  }
}
