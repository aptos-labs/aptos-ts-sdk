// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { HexInput } from "../types";
import { AccountAddress } from "../core/accountAddress";
import { ZeroKnowledgeSig } from "../core/crypto";

import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Deserializer, Serializer } from "../bcs";
import { AbstractKeylessAccount, ProofFetchCallback } from "./AbstractKeylessAccount";

/**
 * Account implementation for the Keyless authentication scheme.
 *
 * Used to represent a Keyless based account and sign transactions with it.
 *
 * Use KeylessAccount.create to instantiate a KeylessAccount with a JWT, proof and EphemeralKeyPair.
 *
 * When the proof expires or the JWT becomes invalid, the KeylessAccount must be instantiated again with a new JWT,
 * EphemeralKeyPair, and corresponding proof.
 */
export class KeylessAccount extends AbstractKeylessAccount {
  // Use the static constructor 'create' instead.
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
    super(args);
  }

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
