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

/**
 * A keyless account whose JSON Web Keys (JWKs) are stored at an arbitrary
 * on-chain address rather than the well-known provider registry.
 *
 * Federated keyless accounts allow organizations to operate their own OIDC
 * provider and register the corresponding JWKs under a custom on-chain address.
 * This enables keyless signing for any OIDC-compatible identity provider, not
 * just those already supported by the Aptos framework.
 *
 * Use the static {@link FederatedKeylessAccount.create} factory for the most
 * ergonomic construction.
 *
 * @example
 * ```typescript
 * const ekp = EphemeralKeyPair.generate();
 * const account = FederatedKeylessAccount.create({
 *   jwt,
 *   ephemeralKeyPair: ekp,
 *   pepper,
 *   proof: zkProof,
 *   jwkAddress: "0xabc...",
 * });
 * await account.checkKeylessAccountValidity();
 * ```
 */
export class FederatedKeylessAccount extends AbstractKeylessAccount {
  /** The {@link FederatedKeylessPublicKey} that includes the JWK provider address. */
  readonly publicKey: FederatedKeylessPublicKey;
  /** Whether the account is configured in audience-less mode. */
  readonly audless: boolean;

  /**
   * Creates a {@link FederatedKeylessAccount} from explicit OIDC claim values
   * and a JWK provider address.
   *
   * Prefer {@link FederatedKeylessAccount.create} for a higher-level API that
   * extracts claims directly from the JWT.
   *
   * @param args.address - Optional explicit on-chain address; derived from the public key when omitted.
   * @param args.ephemeralKeyPair - The short-lived key pair whose public key is committed to in the JWT nonce.
   * @param args.iss - The OIDC issuer claim (`iss`) from the JWT.
   * @param args.uidKey - The JWT payload claim used as the user identifier.
   * @param args.uidVal - The value of `uidKey` in the JWT payload.
   * @param args.aud - The audience claim (`aud`) from the JWT.
   * @param args.pepper - A 31-byte random value used to blind the user identifier.
   * @param args.jwkAddress - The on-chain address where the JWKs for the OIDC provider are stored.
   * @param args.proof - The zero-knowledge proof, or a promise that will resolve to one.
   * @param args.proofFetchCallback - Required when `proof` is a promise; called on completion.
   * @param args.jwt - The raw JWT string.
   * @param args.verificationKeyHash - Optional 32-byte hash of the Groth16 verification key.
   * @param args.audless - Whether the account is audience-less. Defaults to `false`.
   */
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

  /**
   * Serializes this account into BCS bytes, including the JWK provider address.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    super.serialize(serializer);
    (this.publicKey.jwkAddress as AccountAddress).serialize(serializer);
  }

  /**
   * Deserializes a {@link FederatedKeylessAccount} from a BCS byte stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A fully-constructed {@link FederatedKeylessAccount}.
   */
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

  /**
   * Deserializes a {@link FederatedKeylessAccount} from a hex-encoded byte string
   * or `Uint8Array`.
   *
   * @param bytes - BCS bytes previously produced by
   *   {@link FederatedKeylessAccount.serialize}.
   * @returns A fully-constructed {@link FederatedKeylessAccount}.
   */
  static fromBytes(bytes: HexInput): FederatedKeylessAccount {
    return FederatedKeylessAccount.deserialize(new Deserializer(Hex.hexInputToUint8Array(bytes)));
  }

  /**
   * High-level factory that creates a {@link FederatedKeylessAccount} by
   * extracting OIDC claims directly from the JWT.
   *
   * This is the recommended way to construct a {@link FederatedKeylessAccount}.
   *
   * @param args.address - Optional explicit on-chain address.
   * @param args.proof - The zero-knowledge proof, or a promise resolving to one.
   * @param args.jwt - The raw JWT string from the OIDC provider.
   * @param args.ephemeralKeyPair - The short-lived key pair committed to in the JWT nonce.
   * @param args.pepper - A 31-byte random value used to blind the user identifier.
   * @param args.jwkAddress - The on-chain address (or address input) where the JWKs are stored.
   * @param args.uidKey - The JWT claim to use as the user identifier. Defaults to `"sub"`.
   * @param args.proofFetchCallback - Required when `proof` is a promise; called on completion.
   * @param args.verificationKey - The Groth16 verification key (hashed and stored).
   * @param args.verificationKeyHash - Pre-computed 32-byte hash of the verification key.
   * @returns A new {@link FederatedKeylessAccount}.
   *
   * @throws Error if both `verificationKey` and `verificationKeyHash` are provided.
   *
   * @example
   * ```typescript
   * const account = FederatedKeylessAccount.create({
   *   jwt,
   *   ephemeralKeyPair,
   *   pepper,
   *   proof: zkProof,
   *   jwkAddress: "0xabc...",
   * });
   * ```
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
