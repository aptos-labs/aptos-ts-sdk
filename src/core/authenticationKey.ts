// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { AccountAddress } from "./accountAddress";
import type { AccountPublicKey } from "./crypto";
import { Hex } from "./hex";
import { AuthenticationKeyScheme, HexInput } from "../types";
import { Serializable, Serializer } from "../bcs/serializer";
import { Deserializer } from "../bcs/deserializer";

/**
 * Represents an authentication key used for account management. Each account stores an authentication key that enables account
 * owners to rotate their private key(s) without changing the address that hosts their account. The authentication key is a
 * SHA3-256 hash of data and is always 32 bytes in length.
 *
 * @see {@link https://aptos.dev/concepts/accounts | Account Basics}
 *
 * Account addresses can be derived from the AuthenticationKey.
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

  /**
   * Creates an instance of the AuthenticationKey using the provided hex input.
   * This ensures that the hex input is valid and conforms to the required length for an Authentication Key.
   *
   * @param args - The arguments for constructing the AuthenticationKey.
   * @param args.data - The hex input data to be used for the Authentication Key.
   * @throws {Error} Throws an error if the length of the provided hex input is not equal to the required Authentication Key
   * length.
   */
  constructor(args: { data: HexInput }) {
    super();
    const { data } = args;
    const hex = Hex.fromHexInput(data);
    if (hex.toUint8Array().length !== AuthenticationKey.LENGTH) {
      throw new Error(`Authentication Key length should be ${AuthenticationKey.LENGTH}`);
    }
    this.data = hex;
  }

  /**
   * Serializes the fixed bytes data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data.toUint8Array());
  }

  /**
   * Deserialize an AuthenticationKey from the byte buffer in a Deserializer instance.
   * @param deserializer - The deserializer to deserialize the AuthenticationKey from.
   * @returns An instance of AuthenticationKey.
   */
  static deserialize(deserializer: Deserializer): AuthenticationKey {
    const bytes = deserializer.deserializeFixedBytes(AuthenticationKey.LENGTH);
    return new AuthenticationKey({ data: bytes });
  }

  /**
   * Convert the internal data representation to a Uint8Array.
   *
   * This function is useful for obtaining a byte representation of the data, which can be utilized for serialization or transmission.
   *
   * @returns Uint8Array representation of the internal data.
   */
  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * Generates an AuthenticationKey from the specified scheme and input bytes.
   * This function is essential for creating a valid authentication key based on a given scheme.
   *
   * @param args - The arguments for generating the AuthenticationKey.
   * @param args.scheme - The authentication key scheme to use.
   * @param args.input - The input data in hexadecimal format to derive the key.
   * @returns An instance of AuthenticationKey containing the generated key data.
   */
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
   * Derives an AuthenticationKey from the provided public key using a specified derivation scheme.
   *
   * @deprecated Use `fromPublicKey` instead.
   * @param args - The arguments for deriving the authentication key.
   * @param args.publicKey - The public key used for the derivation.
   * @param args.scheme - The scheme to use for deriving the authentication key.
   */
  public static fromPublicKeyAndScheme(args: { publicKey: AccountPublicKey; scheme: AuthenticationKeyScheme }) {
    const { publicKey } = args;
    return publicKey.authKey();
  }

  /**
   * Converts a PublicKey to an AuthenticationKey using the derivation scheme inferred from the provided PublicKey instance.
   *
   * @param args - The arguments for the function.
   * @param args.publicKey - The PublicKey to be converted.
   * @returns AuthenticationKey - The derived AuthenticationKey.
   */
  static fromPublicKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return publicKey.authKey();
  }

  /**
   * Derives an account address from an AuthenticationKey by translating the AuthenticationKey bytes directly to an AccountAddress.
   *
   * @returns AccountAddress - The derived account address.
   */
  derivedAddress(): AccountAddress {
    return new AccountAddress(this.data.toUint8Array());
  }
}
