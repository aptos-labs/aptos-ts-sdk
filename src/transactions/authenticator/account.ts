// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Deserializer, Serializable } from "../../bcs";
import { Ed25519PublicKey, Ed25519Signature } from "../../core/crypto/ed25519";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../../core/crypto/multiEd25519";
import { AnyPublicKey, AnySignature } from "../../core/crypto/singleKey";
import { MultiKey, MultiKeySignature } from "../../core/crypto/multiKey";
import { AccountAuthenticatorVariant, HexInput } from "../../types";

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
        return AccountAuthenticatorSingleKey.load(deserializer);
      case AccountAuthenticatorVariant.MultiKey:
        return AccountAuthenticatorMultiKey.load(deserializer);
      default:
        throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
    }
  }

  isEd25519(): this is AccountAuthenticatorEd25519 {
    return this instanceof AccountAuthenticatorEd25519;
  }

  isMultiEd25519(): this is AccountAuthenticatorMultiEd25519 {
    return this instanceof AccountAuthenticatorMultiEd25519;
  }

  isSingleKey(): this is AccountAuthenticatorSingleKey {
    return this instanceof AccountAuthenticatorSingleKey;
  }

  isMultiKey(): this is AccountAuthenticatorMultiKey {
    return this instanceof AccountAuthenticatorMultiKey;
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

  verify(message: HexInput): boolean {
    return this.public_key.verifySignature({ message, signature: this.signature });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorEd25519 {
    const publicKey = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorEd25519(publicKey, signature);
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

  constructor(publicKey: MultiEd25519PublicKey, signature: MultiEd25519Signature);
  constructor(publicKey: MultiEd25519PublicKey, authenticators: AccountAuthenticatorEd25519[]);
  constructor(
    publicKey: MultiEd25519PublicKey,
    signatureOrAuthenticators: MultiEd25519Signature | AccountAuthenticatorEd25519[],
  ) {
    super();
    this.public_key = publicKey;
    if (signatureOrAuthenticators instanceof MultiEd25519Signature) {
      this.signature = signatureOrAuthenticators;
    } else {
      const authenticators = signatureOrAuthenticators;
      const signatures: Ed25519Signature[] = [];
      const bits: number[] = [];
      for (const authenticator of authenticators) {
        const index = publicKey.publicKeys.findIndex((key) => key.toString() === authenticator.public_key.toString());
        if (index === -1) {
          throw new Error("Unexpected public key");
        }
        signatures.push(authenticator.signature);
        bits.push(index);
      }
      const bitmap = MultiEd25519Signature.createBitmap({ bits });
      this.signature = new MultiEd25519Signature({ signatures, bitmap });
    }
  }

  verify(message: HexInput): boolean {
    return this.public_key.verifySignature({ message, signature: this.signature });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiEd25519 {
    const publicKey = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorMultiEd25519(publicKey, signature);
  }
}

/**
 * AccountAuthenticatorSingleKey for a single signer
 *
 * @param public_key AnyPublicKey
 * @param signature AnySignature
 *
 */
export class AccountAuthenticatorSingleKey extends AccountAuthenticator {
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

  static load(deserializer: Deserializer): AccountAuthenticatorSingleKey {
    const publicKey = AnyPublicKey.deserialize(deserializer);
    const signature = AnySignature.deserialize(deserializer);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }
}

/**
 * AccountAuthenticatorMultiKey for a multi signer
 *
 * @param public_keys MultiKey
 * @param signatures Signature
 *
 */
export class AccountAuthenticatorMultiKey extends AccountAuthenticator {
  public readonly publicKey: MultiKey;

  public readonly signature: MultiKeySignature;

  constructor(publicKey: MultiKey, signature: MultiKeySignature);
  constructor(publicKey: MultiKey, authenticators: AccountAuthenticatorSingleKey[]);
  constructor(publicKey: MultiKey, signatureOrAuthenticators: MultiKeySignature | AccountAuthenticatorSingleKey[]) {
    super();
    this.publicKey = publicKey;
    if (signatureOrAuthenticators instanceof MultiKeySignature) {
      this.signature = signatureOrAuthenticators;
    } else {
      const authenticators = signatureOrAuthenticators;
      const signatures: AnySignature[] = [];
      const bits: number[] = [];
      for (const authenticator of authenticators) {
        const index = publicKey.publicKeys.findIndex((key) => key.toString() === authenticator.public_key.toString());
        if (index === -1) {
          throw new Error("Unexpected public key");
        }
        signatures.push(authenticator.signature);
        bits.push(index);
      }
      const bitmap = MultiKeySignature.createBitmap({ bits });
      this.signature = new MultiKeySignature({ signatures, bitmap });
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiKey);
    this.publicKey.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiKey {
    const publicKey = MultiKey.deserialize(deserializer);
    const signature = MultiKeySignature.deserialize(deserializer);
    return new AccountAuthenticatorMultiKey(publicKey, signature);
  }
}
