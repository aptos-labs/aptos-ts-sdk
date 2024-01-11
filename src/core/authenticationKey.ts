// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { Deserializer } from "../bcs/deserializer";
import { Serializable, Serializer } from "../bcs/serializer";
import { AuthenticationKeyScheme, HexInput } from "../types";
import { AccountAddress } from "./accountAddress";
import { Hex } from "./hex";

/**
 * Each account stores an authentication key. Authentication key enables account owners to rotate
 * their private key(s) associated with the account without changing the address that hosts their account.
 * @see {@link https://aptos.dev/concepts/accounts | Account Basics}
 *
 * Account addresses can be derived from AuthenticationKey
 */
export class AuthenticationKey extends Serializable {
  /**
   * An authentication key is always a SHA3-256 hash of data, and is always 32 bytes.
   *
   * The data to hash depends on the underlying public key type and the derivation scheme.
   */
  static readonly LENGTH: number = 32;

  /**
   * The raw bytes of the authentication key.
   */
  public readonly data: Hex;

  constructor(args: { data: HexInput }) {
    super();
    const { data } = args;
    const hex = Hex.fromHexInput(data);
    if (hex.toUint8Array().length !== AuthenticationKey.LENGTH) {
      throw new Error(`Authentication Key length should be ${AuthenticationKey.LENGTH}`);
    }
    this.data = hex;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data.toUint8Array());
  }

  /**
   * Deserialize an AuthenticationKey from the byte buffer in a Deserializer instance.
   * @param deserializer The deserializer to deserialize the AuthenticationKey from.
   * @returns An instance of AuthenticationKey.
   */
  static deserialize(deserializer: Deserializer): AuthenticationKey {
    const bytes = deserializer.deserializeFixedBytes(AuthenticationKey.LENGTH);
    return new AuthenticationKey({ data: bytes });
  }

  toString(): string {
    return this.data.toString();
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  static fromSchemeAndBytes(args: { scheme: AuthenticationKeyScheme; input: HexInput }): AuthenticationKey {
    const { scheme, input } = args;
    const inputBytes = Hex.fromHexInput(input).toUint8Array();
    const hashInput = new Uint8Array([...inputBytes, scheme]);
    const hash = sha3Hash.create();
    hash.update(hashInput);
    const hashDigest = hash.digest();
    return new AuthenticationKey({ data: hashDigest });
  }

  /**
   * Derives an account address from an AuthenticationKey. Since an AccountAddress is also 32 bytes,
   * the AuthenticationKey bytes are directly translated to an AccountAddress.
   *
   * @returns AccountAddress
   */
  derivedAddress(): AccountAddress {
    return new AccountAddress(this.data.toUint8Array());
  }
}
