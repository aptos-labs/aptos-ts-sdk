// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { HexInput } from "../types";
import { AccountAddress } from "../core/accountAddress";
import { getIssAudAndUidVal, Groth16VerificationKey, KeylessPublicKey, ZeroKnowledgeSig } from "../core/crypto";

import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Deserializer, Serializer } from "../bcs";
import { AbstractKeylessAccount, ProofFetchCallback } from "./AbstractKeylessAccount";
import { Hex } from "../core/hex";

/**
 * Account implementation for the Keyless authentication scheme.
 *
 * Used to represent a Keyless based account and sign transactions with it.
 *
 * Use `KeylessAccount.create()` to instantiate a KeylessAccount with a JWT, proof and EphemeralKeyPair.
 *
 * When the proof expires or the JWT becomes invalid, the KeylessAccount must be instantiated again with a new JWT,
 * EphemeralKeyPair, and corresponding proof.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export class KeylessAccount extends AbstractKeylessAccount {
  /**
   * The KeylessPublicKey associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly publicKey: KeylessPublicKey;

  // Use the static constructor 'create' instead.

  /**
   * Use the static generator `create(...)` instead.
   * Creates an instance of the KeylessAccount with an optional proof.
   *
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.iss - A JWT issuer.
   * @param args.uidKey - The claim on the JWT to identify a user.  This is typically 'sub' or 'email'.
   * @param args.uidVal - The unique id for this user, intended to be a stable user identifier.
   * @param args.aud - The value of the 'aud' claim on the JWT, also known as client ID.  This is the identifier for the dApp's
   * OIDC registration with the identity provider.
   * @param args.pepper - A hexadecimal input used for additional security.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  constructor(args: {
    address?: AccountAddress;
    ephemeralKeyPair: EphemeralKeyPair;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    proofFetchCallback?: ProofFetchCallback;
    jwt: string;
    verificationKeyHash?: HexInput;
  }) {
    const publicKey = KeylessPublicKey.create(args);
    super({ publicKey, ...args });
    this.publicKey = publicKey;
  }

  /**
   * Serializes the transaction data into a format suitable for transmission or storage.
   * This function ensures that both the transaction bytes and the proof are properly serialized.
   *
   * @param serializer - The serializer instance used to convert the transaction data into bytes.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  serialize(serializer: Serializer): void {
    super.serialize(serializer);
  }

  /**
   * Deserializes the provided deserializer to create a KeylessAccount instance.
   * This function extracts necessary components such as the JWT, UID key, pepper, ephemeral key pair, and proof from the deserializer.
   *
   * @param deserializer - The deserializer instance used to retrieve the serialized data.
   * @returns A KeylessAccount instance created from the deserialized data.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static deserialize(deserializer: Deserializer): KeylessAccount {
    const { address, proof, ephemeralKeyPair, jwt, uidKey, pepper, verificationKeyHash } =
      AbstractKeylessAccount.partialDeserialize(deserializer);
    const { iss, aud, uidVal } = getIssAudAndUidVal({ jwt, uidKey });
    return new KeylessAccount({
      address,
      proof,
      ephemeralKeyPair,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwt,
      verificationKeyHash,
    });
  }

  /**
   * Deserialize bytes using this account's information.
   *
   * @param bytes The bytes being interpreted.
   * @returns
   */
  static fromBytes(bytes: HexInput): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(Hex.hexInputToUint8Array(bytes)));
  }

  /**
   * Creates a KeylessAccount instance using the provided parameters.
   * This function allows you to set up a KeylessAccount with specific attributes such as address, proof, and JWT.
   * This is used instead of the KeylessAccount constructor.
   *
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.pepper - A hexadecimal input used for additional security.
   * @param args.uidKey - Optional key for user identification, defaults to "sub".
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static create(args: {
    address?: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
    verificationKey?: Groth16VerificationKey;
  }): KeylessAccount {
    const { address, proof, jwt, ephemeralKeyPair, pepper, uidKey = "sub", proofFetchCallback, verificationKey } = args;

    const { iss, aud, uidVal } = getIssAudAndUidVal({ jwt, uidKey });
    return new KeylessAccount({
      address,
      proof,
      ephemeralKeyPair,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwt,
      proofFetchCallback,
      verificationKeyHash: verificationKey ? verificationKey.hash() : undefined,
    });
  }
}
