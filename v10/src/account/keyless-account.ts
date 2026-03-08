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

/**
 * A standard Aptos keyless account backed by an OIDC JWT from a trusted provider.
 *
 * Keyless accounts allow users to authenticate using an OAuth/OIDC identity
 * (e.g. Google, Apple) instead of a traditional private key.  The account
 * address is derived from the OIDC provider's issuer (`iss`), the application
 * identifier (`aud`), and a blinded user identifier, so the user's identity is
 * never exposed on-chain.
 *
 * Use the static {@link KeylessAccount.create} factory for the most ergonomic
 * construction; the constructor is available for advanced use cases.
 *
 * @example
 * ```typescript
 * const ekp = EphemeralKeyPair.generate();
 * const account = KeylessAccount.create({
 *   jwt,
 *   ephemeralKeyPair: ekp,
 *   pepper,
 *   proof: zkProof,
 * });
 * await account.checkKeylessAccountValidity();
 * const sig = account.sign(message);
 * ```
 */
export class KeylessAccount extends AbstractKeylessAccount {
  /** The {@link KeylessPublicKey} derived from the OIDC parameters. */
  readonly publicKey: KeylessPublicKey;

  /**
   * Creates a {@link KeylessAccount} from explicit OIDC claim values.
   *
   * Prefer {@link KeylessAccount.create} for a higher-level API that extracts
   * claims directly from the JWT.
   *
   * @param args.address - Optional explicit on-chain address; derived from the public key when omitted.
   * @param args.ephemeralKeyPair - The short-lived key pair whose public key is committed to in the JWT nonce.
   * @param args.iss - The OIDC issuer claim (`iss`) from the JWT.
   * @param args.uidKey - The JWT payload claim used as the user identifier.
   * @param args.uidVal - The value of `uidKey` in the JWT payload.
   * @param args.aud - The audience claim (`aud`) from the JWT.
   * @param args.pepper - A 31-byte random value used to blind the user identifier.
   * @param args.proof - The zero-knowledge proof, or a promise that will resolve to one.
   * @param args.proofFetchCallback - Required when `proof` is a promise; called on completion.
   * @param args.jwt - The raw JWT string.
   * @param args.verificationKeyHash - Optional 32-byte hash of the Groth16 verification key.
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
   * Serializes this account into BCS bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    super.serialize(serializer);
  }

  /**
   * Deserializes a {@link KeylessAccount} from a BCS byte stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A fully-constructed {@link KeylessAccount}.
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
   * Deserializes a {@link KeylessAccount} from a hex-encoded byte string or
   * `Uint8Array`.
   *
   * @param bytes - BCS bytes previously produced by {@link KeylessAccount.serialize}.
   * @returns A fully-constructed {@link KeylessAccount}.
   */
  static fromBytes(bytes: HexInput): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(Hex.hexInputToUint8Array(bytes)));
  }

  /**
   * High-level factory that creates a {@link KeylessAccount} by extracting OIDC
   * claims directly from the JWT.
   *
   * This is the recommended way to construct a {@link KeylessAccount}.
   *
   * @param args.address - Optional explicit on-chain address.
   * @param args.proof - The zero-knowledge proof, or a promise resolving to one.
   * @param args.jwt - The raw JWT string from the OIDC provider.
   * @param args.ephemeralKeyPair - The short-lived key pair committed to in the JWT nonce.
   * @param args.pepper - A 31-byte random value used to blind the user identifier.
   * @param args.uidKey - The JWT claim to use as the user identifier. Defaults to `"sub"`.
   * @param args.proofFetchCallback - Required when `proof` is a promise; called on completion.
   * @param args.verificationKey - The Groth16 verification key (hashed and stored).
   * @param args.verificationKeyHash - Pre-computed 32-byte hash of the verification key.
   * @returns A new {@link KeylessAccount}.
   *
   * @throws Error if both `verificationKey` and `verificationKeyHash` are provided.
   *
   * @example
   * ```typescript
   * const account = KeylessAccount.create({
   *   jwt,
   *   ephemeralKeyPair,
   *   pepper,
   *   proof: zkProof,
   * });
   * ```
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
