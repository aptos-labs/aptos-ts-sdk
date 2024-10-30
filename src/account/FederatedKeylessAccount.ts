// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { HexInput } from "../types";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { ZeroKnowledgeSig } from "../core/crypto";

import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Deserializer, Serializer } from "../bcs";
import { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless";
import { AbstractKeylessAccount, ProofFetchCallback } from "./AbstractKeylessAccount";

/**
 * Account implementation for the FederatedKeyless authentication scheme.
 *
 * Used to represent a FederatedKeyless based account and sign transactions with it.
 *
 * Use `FederatedKeylessAccount.create()` to instantiate a KeylessAccount with a JSON Web Token (JWT), proof, EphemeralKeyPair and the
 * address the JSON Web Key Set (JWKS) are installed that will be used to verify the JWT.
 *
 * When the proof expires or the JWT becomes invalid, the KeylessAccount must be instantiated again with a new JWT,
 * EphemeralKeyPair, and corresponding proof.
 */
export class FederatedKeylessAccount extends AbstractKeylessAccount {
  /**
   * The FederatedKeylessPublicKey associated with the account
   */
  readonly publicKey: FederatedKeylessPublicKey;

  /**
   * Use the static generator `FederatedKeylessAccount.create(...)` instead.
   * Creates a KeylessAccount instance using the provided parameters.
   * This function allows you to set up a KeylessAccount with specific attributes such as address, proof, and JWT.
   *
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.jwkAddress - The address which stores the JSON Web Key Set (JWKS) used to verify the JWT.
   * @param args.uidKey - Optional key for user identification, defaults to "sub".
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   */
  private constructor(args: {
    address?: AccountAddress;
    ephemeralKeyPair: EphemeralKeyPair;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    jwkAddress: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    proofFetchCallback?: ProofFetchCallback;
    jwt: string;
  }) {
    const publicKey = FederatedKeylessPublicKey.create(args);
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
    if (this.proof === undefined) {
      throw new Error("Cannot serialize - proof undefined");
    }
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.publicKey.jwkAddress.serialize(serializer);
    this.ephemeralKeyPair.serialize(serializer);
    this.proof.serialize(serializer);
  }

  /**
   * Deserializes the provided deserializer to create a KeylessAccount instance.
   * This function extracts necessary components such as the JWT, UID key, pepper, ephemeral key pair, and proof from the deserializer.
   *
   * @param deserializer - The deserializer instance used to retrieve the serialized data.
   * @returns A KeylessAccount instance created from the deserialized data.
   */
  static deserialize(deserializer: Deserializer): FederatedKeylessAccount {
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const jwkAddress = AccountAddress.deserialize(deserializer);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = ZeroKnowledgeSig.deserialize(deserializer);
    return FederatedKeylessAccount.create({
      proof,
      pepper,
      jwkAddress,
      uidKey,
      jwt,
      ephemeralKeyPair,
    });
  }

  /**
   * Deserialize bytes using this account's information.
   *
   * @param bytes The bytes being interpreted.
   * @returns
   */
  static fromBytes(bytes: Uint8Array): FederatedKeylessAccount {
    return FederatedKeylessAccount.deserialize(new Deserializer(bytes));
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
   * @param args.jwkAddress - The address which stores the JSON Web Key Set (JWKS) used to verify the JWT.
   * @param args.uidKey - Optional key for user identification, defaults to "sub".
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   */
  static create(args: {
    address?: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
  }): FederatedKeylessAccount {
    const { address, proof, jwt, ephemeralKeyPair, pepper, jwkAddress, uidKey = "sub", proofFetchCallback } = args;

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    if (typeof jwtPayload.iss !== "string") {
      throw new Error("iss was not found");
    }
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const uidVal = jwtPayload[uidKey];
    return new FederatedKeylessAccount({
      address,
      proof,
      ephemeralKeyPair,
      iss: jwtPayload.iss,
      uidKey,
      uidVal,
      aud: jwtPayload.aud,
      pepper,
      jwkAddress: AccountAddress.from(jwkAddress),
      jwt,
      proofFetchCallback,
    });
  }
}
