// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { FederatedKeylessPublicKey } from "../crypto/federated-keyless.js";
import type { Groth16VerificationKey, ZeroKnowledgeSig } from "../crypto/keyless.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { AbstractKeylessAccount, getIssAudAndUidVal, type ProofFetchCallback } from "./abstract-keyless-account.js";
import type { EphemeralKeyPair } from "./ephemeral-key-pair.js";

export class FederatedKeylessAccount extends AbstractKeylessAccount {
  readonly publicKey: FederatedKeylessPublicKey;
  readonly audless: boolean;

  constructor(args: {
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
    verificationKeyHash?: HexInput;
    audless?: boolean;
  }) {
    const publicKey = FederatedKeylessPublicKey.create(args);
    super({ publicKey, ...args });
    this.publicKey = publicKey;
    this.audless = args.audless ?? false;
  }

  serialize(serializer: Serializer): void {
    super.serialize(serializer);
    (this.publicKey.jwkAddress as AccountAddress).serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): FederatedKeylessAccount {
    const { address, proof, ephemeralKeyPair, jwt, uidKey, pepper, verificationKeyHash } =
      AbstractKeylessAccount.partialDeserialize(deserializer);
    const jwkAddress = AccountAddress.deserialize(deserializer);
    const { iss, aud, uidVal } = getIssAudAndUidVal({ jwt, uidKey });
    return new FederatedKeylessAccount({
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
      jwkAddress,
    });
  }

  static fromBytes(bytes: HexInput): FederatedKeylessAccount {
    return FederatedKeylessAccount.deserialize(new Deserializer(Hex.hexInputToUint8Array(bytes)));
  }

  static create(args: {
    address?: AccountAddress;
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
    verificationKey?: Groth16VerificationKey;
    verificationKeyHash?: Uint8Array;
  }): FederatedKeylessAccount {
    const {
      address,
      proof,
      jwt,
      ephemeralKeyPair,
      pepper,
      jwkAddress,
      uidKey = "sub",
      proofFetchCallback,
      verificationKey,
      verificationKeyHash,
    } = args;

    if (verificationKeyHash && verificationKey) {
      throw new Error("Cannot provide both verificationKey and verificationKeyHash");
    }

    const { iss, aud, uidVal } = getIssAudAndUidVal({ jwt, uidKey });
    return new FederatedKeylessAccount({
      address,
      proof,
      ephemeralKeyPair,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwkAddress: AccountAddress.from(jwkAddress),
      jwt,
      proofFetchCallback,
      verificationKeyHash: verificationKeyHash ?? (verificationKey ? verificationKey.hash() : undefined),
    });
  }
}
