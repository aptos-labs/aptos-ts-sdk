// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { AccountAddress } from "../core/account-address.js";
import { type Groth16VerificationKey, KeylessPublicKey, type ZeroKnowledgeSig } from "../crypto/keyless.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { AbstractKeylessAccount, getIssAudAndUidVal, type ProofFetchCallback } from "./abstract-keyless-account.js";
import type { EphemeralKeyPair } from "./ephemeral-key-pair.js";

export class KeylessAccount extends AbstractKeylessAccount {
  readonly publicKey: KeylessPublicKey;

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

  serialize(serializer: Serializer): void {
    super.serialize(serializer);
  }

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

  static fromBytes(bytes: HexInput): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(Hex.hexInputToUint8Array(bytes)));
  }

  static create(args: {
    address?: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
    verificationKey?: Groth16VerificationKey;
    verificationKeyHash?: Uint8Array;
  }): KeylessAccount {
    const {
      address,
      proof,
      jwt,
      ephemeralKeyPair,
      pepper,
      uidKey = "sub",
      proofFetchCallback,
      verificationKey,
      verificationKeyHash,
    } = args;

    if (verificationKeyHash && verificationKey) {
      throw new Error("Cannot provide both verificationKey and verificationKeyHash");
    }

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
      verificationKeyHash: verificationKeyHash ?? (verificationKey ? verificationKey.hash() : undefined),
    });
  }
}
