// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { HexInput } from "../types";
import { AccountAddress } from "../core/accountAddress";
import { KeylessPublicKey, ZeroKnowledgeSig } from "../core/crypto";

import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Deserializer, Serializer } from "../bcs";
import { AbstractKeylessAccount, ProofFetchCallback } from "./AbstractKeylessAccount";

/**
 * Account implementation for the Keyless authentication scheme.
 *
 * Used to represent a Keyless based account and sign transactions with it.
 *
 * Use `KeylessAccount.create()` to instantiate a KeylessAccount with a JWT, proof and EphemeralKeyPair.
 *
 * When the proof expires or the JWT becomes invalid, the KeylessAccount must be instantiated again with a new JWT,
 * EphemeralKeyPair, and corresponding proof.
 *
 * @static
 * @readonly PEPPER_LENGTH - The length of the pepper used for privacy preservation.
 */
export class KeylessAccount extends AbstractKeylessAccount {
  /**
   * The KeylessPublicKey associated with the account
   */
  readonly publicKey: KeylessPublicKey;

  // Use the static constructor 'create' instead.

  /**
   * Creates an instance of the transaction with an optional proof.
   *
   * @param args.proof - An optional ZkProof associated with the transaction.
   */
  // TODO: Document rest of parameters
  private constructor(args: {
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
   */
  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.ephemeralKeyPair.serialize(serializer);
    if (this.proof === undefined) {
      throw new Error("Cannot serialize - proof undefined");
    }
    this.proof.serialize(serializer);
  }

  /**
   * Deserializes the provided deserializer to create a KeylessAccount instance.
   * This function extracts necessary components such as the JWT, UID key, pepper, ephemeral key pair, and proof from the deserializer.
   *
   * @param deserializer - The deserializer instance used to retrieve the serialized data.
   * @returns A KeylessAccount instance created from the deserialized data.
   */
  static deserialize(deserializer: Deserializer): KeylessAccount {
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = ZeroKnowledgeSig.deserialize(deserializer);
    return KeylessAccount.create({
      proof,
      pepper,
      uidKey,
      jwt,
      ephemeralKeyPair,
    });
  }

  static fromBytes(bytes: Uint8Array): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(bytes));
  }

  /**
   * Creates a KeylessAccount instance using the provided parameters.
   * This function allows you to set up a KeylessAccount with specific attributes such as address, proof, and JWT.
   *
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.pepper - A hexadecimal input used for additional security.
   * @param args.uidKey - Optional key for user identification, defaults to "sub".
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   */
  static create(args: {
    address?: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
  }): KeylessAccount {
    const { address, proof, jwt, ephemeralKeyPair, pepper, uidKey = "sub", proofFetchCallback } = args;

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    if (typeof jwtPayload.iss !== "string") {
      throw new Error("iss was not found");
    }
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const uidVal = jwtPayload[uidKey];
    return new KeylessAccount({
      address,
      proof,
      ephemeralKeyPair,
      iss: jwtPayload.iss,
      uidKey,
      uidVal,
      aud: jwtPayload.aud,
      pepper,
      jwt,
      proofFetchCallback,
    });
  }
}
