// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { AccountAddress } from "./accountAddress";
import { PublicKey } from "./crypto/asymmetricCrypto";
import { Ed25519PublicKey } from "./crypto/ed25519";
import { MultiEd25519PublicKey } from "./crypto/multiEd25519";
import { Hex } from "./hex";
import { AuthenticationKeyScheme, HexInput, SigningScheme } from "../types";
import { AnyPublicKey } from "./crypto/anyPublicKey";

/**
 * Each account stores an authentication key. Authentication key enables account owners to rotate
 * their private key(s) associated with the account without changing the address that hosts their account.
 * @see {@link https://aptos.dev/concepts/accounts | Account Basics}
 *
 * Note: AuthenticationKey only supports Ed25519 and MultiEd25519 public keys for now.
 *
 * Account addresses can be derived from AuthenticationKey
 */
export class AuthenticationKey {
  /**
   * An authentication key is always a SHA3-256 hash of data, and is always 32 bytes.
   */
  static readonly LENGTH: number = 32;

  /**
   * The raw bytes of the authentication key.
   */
  public readonly data: Hex;

  constructor(args: { data: HexInput }) {
    const { data } = args;
    const hex = Hex.fromHexInput(data);
    if (hex.toUint8Array().length !== AuthenticationKey.LENGTH) {
      throw new Error(`Authentication Key length should be ${AuthenticationKey.LENGTH}`);
    }
    this.data = hex;
  }

  toString(): string {
    return this.data.toString();
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * Creates an AuthenticationKey from seed bytes and a scheme
   *
   * This allows for the creation of AuthenticationKeys that are not derived from Public Keys directly
   * @param args
   */
  private static fromBytesAndScheme(args: { publicKey: PublicKey; scheme: AuthenticationKeyScheme }) {
    const { publicKey, scheme } = args;

    // TODO - check for single key or multi key
    if (scheme === SigningScheme.SingleKey) {
      let newBytes = publicKey.bcsToBytes();
      const authKeyBytes = new Uint8Array([...newBytes, scheme]);
      const hash = sha3Hash.create();
      hash.update(authKeyBytes);
      const hashDigest = hash.digest();
      return new AuthenticationKey({ data: hashDigest });
    }
    const bytes = publicKey.toUint8Array();
    const inputBytes = Hex.fromHexInput(bytes).toUint8Array();
    const authKeyBytes = new Uint8Array(inputBytes.length + 1);
    authKeyBytes.set(inputBytes);
    authKeyBytes.set([scheme], inputBytes.length);
    const hash = sha3Hash.create();
    hash.update(authKeyBytes);
    const hashDigest = hash.digest();

    return new AuthenticationKey({ data: hashDigest });
  }

  /**
   * Converts a PublicKey(s) to AuthenticationKey
   *
   * @param args.publicKey
   * @returns AuthenticationKey
   */
  static fromPublicKey(args: { publicKey: PublicKey }): AuthenticationKey {
    const { publicKey } = args;

    let scheme: number;
    if (publicKey instanceof Ed25519PublicKey) {
      // for legacy support
      scheme = SigningScheme.Ed25519.valueOf();
    } else if (publicKey instanceof MultiEd25519PublicKey) {
      // for legacy support
      scheme = SigningScheme.MultiEd25519.valueOf();
    } else if (publicKey instanceof AnyPublicKey) {
      scheme = SigningScheme.SingleKey.valueOf();
    } else {
      throw new Error("No supported authentication scheme for public key");
    }

    return AuthenticationKey.fromBytesAndScheme({ publicKey: publicKey, scheme });
  }

  /**
   * Derives an account address from AuthenticationKey. Since current AccountAddress is 32 bytes,
   * AuthenticationKey bytes are directly translated to AccountAddress.
   *
   * @returns AccountAddress
   */
  derivedAddress(): AccountAddress {
    return new AccountAddress({ data: this.data.toUint8Array() });
  }
}
