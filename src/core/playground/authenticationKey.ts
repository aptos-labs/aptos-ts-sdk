// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { HexInput, SigningScheme as AuthenticationKeyScheme } from "../../types";

import { AccountAddress } from "../accountAddress";
import { Hex } from "../hex";

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

  static fromSchemeAndBytes({
    scheme,
    input,
  }: {
    scheme: AuthenticationKeyScheme;
    input: HexInput;
  }): AuthenticationKey {
    const inputBytes = Hex.fromHexInput(input).toUint8Array();
    const hashInput = new Uint8Array([...inputBytes, scheme]);
    const hash = sha3Hash.create();
    hash.update(Hex.fromHexInput(hashInput).toUint8Array());
    const hashDigest = hash.digest();
    return new AuthenticationKey({ data: hashDigest });
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
