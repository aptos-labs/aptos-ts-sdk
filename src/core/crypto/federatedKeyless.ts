// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountPublicKey, PublicKey } from "./publicKey";
import { Deserializer, Serializer } from "../../bcs";
import { HexInput, AnyPublicKeyVariant, SigningScheme } from "../../types";
import { AuthenticationKey } from "../authenticationKey";
import { AccountAddress, AccountAddressInput } from "../accountAddress";
import {
  KeylessConfiguration,
  KeylessPublicKey,
  KeylessSignature,
  MoveJWK,
  verifyKeylessSignature,
  verifyKeylessSignatureWithJwkAndConfig,
} from "./keyless";
import { AptosConfig } from "../../api";
import { Signature } from "..";

/**
 * Represents the FederatedKeylessPublicKey public key
 *
 * These keys use an on-chain address as a source of truth for the JWK used to verify signatures.
 *
 * FederatedKeylessPublicKey authentication key is represented in the SDK as `AnyPublicKey`.
 * @group Implementation
 * @category Serialization
 */
export class FederatedKeylessPublicKey extends AccountPublicKey {
  /**
   * The address that contains the JWK set to be used for verification.
   * @group Implementation
   * @category Serialization
   */
  readonly jwkAddress: AccountAddress;

  /**
   * The inner public key which contains the standard Keyless public key.
   * @group Implementation
   * @category Serialization
   */
  readonly keylessPublicKey: KeylessPublicKey;

  constructor(jwkAddress: AccountAddressInput, keylessPublicKey: KeylessPublicKey) {
    super();
    this.jwkAddress = AccountAddress.from(jwkAddress);
    this.keylessPublicKey = keylessPublicKey;
  }

  /**
   * Get the authentication key for the federated keyless public key
   *
   * @returns AuthenticationKey
   * @group Implementation
   * @category Serialization
   */
  authKey(): AuthenticationKey {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(AnyPublicKeyVariant.FederatedKeyless);
    serializer.serializeFixedBytes(this.bcsToBytes());
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: SigningScheme.SingleKey,
      input: serializer.toUint8Array(),
    });
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @param args.jwk - The JWK to use for verification.
   * @param args.keylessConfig - The keyless configuration to use for verification.
   * @returns true if the signature is valid
   * @group Implementation
   * @category Serialization
   */
  verifySignature(args: {
    message: HexInput;
    signature: Signature;
    jwk: MoveJWK;
    keylessConfig: KeylessConfiguration;
  }): boolean {
    try {
      verifyKeylessSignatureWithJwkAndConfig({ ...args, publicKey: this });
      return true;
    } catch (error) {
      return false;
    }
  }

  serialize(serializer: Serializer): void {
    this.jwkAddress.serialize(serializer);
    this.keylessPublicKey.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): FederatedKeylessPublicKey {
    const jwkAddress = AccountAddress.deserialize(deserializer);
    const keylessPublicKey = KeylessPublicKey.deserialize(deserializer);
    return new FederatedKeylessPublicKey(jwkAddress, keylessPublicKey);
  }

  static isPublicKey(publicKey: PublicKey): publicKey is FederatedKeylessPublicKey {
    return publicKey instanceof FederatedKeylessPublicKey;
  }

  /**
   * Verifies a keyless signature for a given message.  It will fetch the keyless configuration and the JWK to
   * use for verification from the appropriate network as defined by the aptosConfig.
   *
   * @param args.aptosConfig The aptos config to use for fetching the keyless configuration.
   * @param args.message The message to verify the signature against.
   * @param args.signature The signature to verify.
   * @param args.options.throwErrorWithReason Whether to throw an error with the reason for the failure instead of returning false.
   * @returns true if the signature is valid
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: KeylessSignature;
    options?: { throwErrorWithReason?: boolean };
  }): Promise<boolean> {
    return verifyKeylessSignature({
      ...args,
      publicKey: this,
    });
  }

  /**
   * Creates a FederatedKeylessPublicKey from the JWT components plus pepper
   *
   * @param args.iss the iss of the identity
   * @param args.uidKey the key to use to get the uidVal in the JWT token
   * @param args.uidVal the value of the uidKey in the JWT token
   * @param args.aud the client ID of the application
   * @param args.pepper The pepper used to maintain privacy of the account
   * @returns FederatedKeylessPublicKey
   * @group Implementation
   * @category Serialization
   */
  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.create(args));
  }

  static fromJwtAndPepper(args: {
    jwt: string;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
    uidKey?: string;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.fromJwtAndPepper(args));
  }

  static isInstance(publicKey: PublicKey) {
    return (
      "jwkAddress" in publicKey &&
      publicKey.jwkAddress instanceof AccountAddress &&
      "keylessPublicKey" in publicKey &&
      publicKey.keylessPublicKey instanceof KeylessPublicKey
    );
  }
}
