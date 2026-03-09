// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { KeylessError, KeylessErrorType } from "../core/errors.js";
import type { FederatedKeylessPublicKey } from "../crypto/federated-keyless.js";
import {
  EphemeralCertificate,
  type KeylessPublicKey,
  KeylessSignature,
  MAX_AUD_VAL_BYTES,
  MAX_ISS_VAL_BYTES,
  MAX_UID_VAL_BYTES,
  ZeroKnowledgeSig,
  type ZkProof,
} from "../crypto/keyless.js";
import { AnyPublicKey, AnySignature } from "../crypto/single-key.js";
import { EphemeralCertificateVariant, SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator.js";
import { deriveTransactionType, generateSigningMessage } from "../transactions/signing-message.js";
import type { AnyRawTransaction, AnyRawTransactionInstance } from "../transactions/types.js";
import { EphemeralKeyPair } from "./ephemeral-key-pair.js";
import type { Account, SingleKeySigner } from "./types.js";

// ── JWT Helpers (replaces jwt-decode dependency) ──

const MAX_JWT_SEGMENT_BYTES = 8192;
const TEXT_ENCODER = new TextEncoder();

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const decoded = base64UrlDecode(parts[1]);
  if (decoded.length > MAX_JWT_SEGMENT_BYTES) {
    throw new Error(`JWT payload exceeds maximum size of ${MAX_JWT_SEGMENT_BYTES} bytes`);
  }
  return JSON.parse(decoded);
}

function decodeJwtHeader(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const decoded = base64UrlDecode(parts[0]);
  if (decoded.length > MAX_JWT_SEGMENT_BYTES) {
    throw new Error(`JWT header exceeds maximum size of ${MAX_JWT_SEGMENT_BYTES} bytes`);
  }
  return JSON.parse(decoded);
}

/**
 * Extracts the `iss`, `aud`, and the uid value identified by `uidKey` from a
 * raw JWT string without requiring a network request.
 *
 * @param args.jwt - The raw JSON Web Token string.
 * @param args.uidKey - The JWT payload claim to use as the user identifier.
 *   Defaults to `"sub"`.
 * @returns An object with `iss`, `aud`, and `uidVal` extracted from the JWT payload.
 *
 * @throws {@link KeylessError} with type `JWT_PARSING_ERROR` if the JWT is
 *   malformed or missing required claims.
 */
export function getIssAudAndUidVal(args: { jwt: string; uidKey?: string }): {
  iss: string;
  aud: string;
  uidVal: string;
} {
  const { jwt, uidKey = "sub" } = args;
  let jwtPayload: Record<string, unknown>;
  try {
    jwtPayload = decodeJwtPayload(jwt);
  } catch {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: "Invalid JWT format",
    });
  }
  if (typeof jwtPayload.iss !== "string") {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: "Invalid JWT: missing required claim",
    });
  }
  if (typeof jwtPayload.aud !== "string") {
    const details = Array.isArray(jwtPayload.aud)
      ? "Invalid JWT: 'aud' claim is an array; only a single string audience is supported"
      : "Invalid JWT: missing or malformed 'aud' claim";
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details,
    });
  }
  const uidVal = jwtPayload[uidKey];
  if (typeof uidVal !== "string") {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: `Invalid JWT: claim '${uidKey}' is missing or not a string`,
    });
  }
  if (TEXT_ENCODER.encode(jwtPayload.iss).length > MAX_ISS_VAL_BYTES) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: `Invalid JWT: 'iss' exceeds maximum length of ${MAX_ISS_VAL_BYTES} bytes`,
    });
  }
  if (TEXT_ENCODER.encode(jwtPayload.aud).length > MAX_AUD_VAL_BYTES) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: `Invalid JWT: 'aud' exceeds maximum length of ${MAX_AUD_VAL_BYTES} bytes`,
    });
  }
  if (TEXT_ENCODER.encode(uidVal).length > MAX_UID_VAL_BYTES) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: `Invalid JWT: '${uidKey}' exceeds maximum length of ${MAX_UID_VAL_BYTES} bytes`,
    });
  }
  return { iss: jwtPayload.iss, aud: jwtPayload.aud, uidVal };
}

// ── Proof fetch types ──

/** Indicates that a background proof fetch completed successfully. */
export type ProofFetchSuccess = { status: "Success" };

/** Indicates that a background proof fetch failed, along with an error description. */
export type ProofFetchFailure = { status: "Failed"; error: string };

/** Union of the two possible outcomes of an asynchronous proof fetch. */
export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure;

/**
 * Callback invoked once a background zero-knowledge proof fetch resolves.
 *
 * @param status - The final {@link ProofFetchStatus} of the fetch attempt.
 * @returns A promise that the caller may await.
 */
export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;

// ── AbstractKeylessAccount ──

/**
 * Abstract base class shared by {@link KeylessAccount} and
 * {@link FederatedKeylessAccount}.
 *
 * Manages the ephemeral key pair, zero-knowledge proof, JWT, and pepper that
 * are common to all keyless signing flows.  Subclasses supply the concrete
 * public key type and serialization details.
 *
 * Proof can be provided either eagerly (as a resolved {@link ZeroKnowledgeSig})
 * or lazily (as a `Promise<ZeroKnowledgeSig>` with a `proofFetchCallback`).
 */
export abstract class AbstractKeylessAccount extends Serializable implements Account, SingleKeySigner {
  /** Length in bytes of the pepper value used to blind the user identifier. */
  static readonly PEPPER_LENGTH: number = 31;

  /** The keyless public key (either standard or federated). */
  readonly publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  /** The short-lived ephemeral key pair used to produce the inner signature. */
  readonly ephemeralKeyPair: EphemeralKeyPair;
  /** The JWT payload claim used as the user identifier (e.g. `"sub"`). */
  readonly uidKey: string;
  /** The value of the {@link uidKey} claim from the JWT payload. */
  readonly uidVal: string;
  /** The `aud` (audience) claim from the JWT payload. */
  readonly aud: string;
  /** The 31-byte pepper that blinds the user identifier in the public key. */
  readonly pepper: Uint8Array;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /**
   * The resolved zero-knowledge proof, or `undefined` while an async fetch is
   * still in progress.
   */
  proof: ZeroKnowledgeSig | undefined;
  /**
   * Either the resolved proof or the promise that will resolve to it.
   * Use {@link waitForProofFetch} to await a pending promise.
   */
  readonly proofOrPromise: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
  /** Always `SigningScheme.SingleKey` for keyless accounts. */
  readonly signingScheme: SigningScheme = SigningScheme.SingleKey;
  /**
   * The raw JWT string used to derive the public key.
   *
   * **Security note:** The JWT payload may contain personally identifiable
   * information (email, name, etc.) and is serialized to BCS when persisting
   * the account. Call {@link clearSensitiveData} when the account is no longer
   * needed to minimize exposure. Note that JavaScript strings are immutable
   * and cannot be zeroed in memory — the runtime may retain copies until
   * garbage collection.
   */
  readonly jwt: string;
  /**
   * Optional 32-byte hash of the Groth16 verification key that was used to
   * generate the proof.  When present, it is included in signatures to allow
   * on-chain verification key rotation.
   */
  readonly verificationKeyHash?: Uint8Array;

  /** Whether sensitive data (pepper, etc.) has been cleared from memory. */
  private sensitiveDataCleared = false;

  // Use native EventTarget instead of eventemitter3
  private readonly eventTarget: EventTarget;

  protected constructor(args: {
    address?: AccountAddress;
    publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
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
    super();
    const {
      address,
      ephemeralKeyPair,
      publicKey,
      uidKey,
      uidVal,
      aud,
      pepper,
      proof,
      proofFetchCallback,
      jwt,
      verificationKeyHash,
    } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    this.publicKey = publicKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : (new AnyPublicKey(this.publicKey).authKey() as { derivedAddress(): AccountAddress }).derivedAddress();
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.jwt = jwt;
    this.eventTarget = new EventTarget();
    this.proofOrPromise = proof;

    if (proof instanceof ZeroKnowledgeSig) {
      this.proof = proof;
    } else {
      if (proofFetchCallback === undefined) {
        throw new Error("Must provide callback for async proof fetch");
      }
      this.eventTarget.addEventListener(
        "proofFetchFinish",
        async (e) => {
          const status = (e as CustomEvent<ProofFetchStatus>).detail;
          await proofFetchCallback(status);
        },
        { once: true },
      );
      this.init(proof);
    }

    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== AbstractKeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${AbstractKeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;

    if (verificationKeyHash !== undefined) {
      if (Hex.hexInputToUint8Array(verificationKeyHash).length !== 32) {
        throw new Error("verificationKeyHash must be 32 bytes");
      }
      this.verificationKeyHash = Hex.hexInputToUint8Array(verificationKeyHash);
    }
  }

  /**
   * Returns the {@link AnyPublicKey} wrapper around this account's keyless public key.
   *
   * @returns An {@link AnyPublicKey} wrapping the underlying keyless public key.
   */
  getAnyPublicKey(): AnyPublicKey {
    return new AnyPublicKey(this.publicKey);
  }

  /**
   * Overwrites the pepper bytes with random and zero data, then marks the
   * account's sensitive material as cleared.
   *
   * After calling this method, the account can no longer sign transactions or
   * be serialized. Use this when the account is no longer needed to reduce the
   * window during which sensitive data resides in memory.
   *
   * **Limitations:**
   * - The JWT string (`this.jwt`) is a JavaScript string and cannot be zeroed.
   *   The runtime may retain it until garbage collection.
   * - The ephemeral key pair should be cleared separately via
   *   `ephemeralKeyPair.clear()` if supported.
   */
  clearSensitiveData(): void {
    if (!this.sensitiveDataCleared) {
      crypto.getRandomValues(this.pepper);
      this.pepper.fill(0);
      this.sensitiveDataCleared = true;
    }
  }

  /**
   * Returns whether {@link clearSensitiveData} has been called.
   */
  isSensitiveDataCleared(): boolean {
    return this.sensitiveDataCleared;
  }

  /**
   * Awaits a pending proof fetch promise and stores the resolved proof.
   *
   * Dispatches a `proofFetchFinish` event on success or failure, which triggers
   * the registered {@link ProofFetchCallback}.
   *
   * @param promise - The promise that will resolve to a {@link ZeroKnowledgeSig}.
   * @returns A promise that resolves once the proof has been stored (or the fetch fails).
   */
  async init(promise: Promise<ZeroKnowledgeSig>): Promise<void> {
    try {
      this.proof = await promise;
      this.eventTarget.dispatchEvent(new CustomEvent("proofFetchFinish", { detail: { status: "Success" } }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.toString() : "Unknown";
      this.eventTarget.dispatchEvent(
        new CustomEvent("proofFetchFinish", { detail: { status: "Failed", error: errorMsg } }),
      );
    }
  }

  /**
   * Serializes this account into BCS bytes.
   *
   * Throws if the proof has not yet been resolved (i.e. async fetch is still pending).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    if (this.sensitiveDataCleared) {
      throw new Error("Cannot serialize a KeylessAccount whose sensitive data has been cleared");
    }
    this.accountAddress.serialize(serializer);
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.ephemeralKeyPair.serialize(serializer);
    if (this.proof === undefined) {
      throw new Error("Cannot serialize - proof undefined");
    }
    this.proof.serialize(serializer);
    serializer.serializeOption(this.verificationKeyHash, 32);
  }

  /**
   * Deserializes the fields that are common to all keyless account types from a
   * BCS byte stream.
   *
   * Concrete subclasses call this method and then deserialize any additional
   * type-specific fields before constructing themselves.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns An object containing `address`, `jwt`, `uidKey`, `pepper`,
   *   `ephemeralKeyPair`, `proof`, and an optional `verificationKeyHash`.
   */
  static partialDeserialize(deserializer: Deserializer): {
    address: AccountAddress;
    jwt: string;
    uidKey: string;
    pepper: Uint8Array;
    ephemeralKeyPair: EphemeralKeyPair;
    proof: ZeroKnowledgeSig;
    verificationKeyHash?: Uint8Array;
  } {
    const address = AccountAddress.deserialize(deserializer);
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = ZeroKnowledgeSig.deserialize(deserializer);
    const verificationKeyHash = deserializer.deserializeOption("fixedBytes", 32);
    return { address, jwt, uidKey, pepper, ephemeralKeyPair, proof, verificationKeyHash };
  }

  /**
   * Returns whether this account's ephemeral key pair has passed its expiry date.
   *
   * @returns `true` if the ephemeral key pair is expired, `false` otherwise.
   */
  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  /**
   * Signs a message and returns an {@link AccountAuthenticatorSingleKey} wrapping
   * the keyless public key and the {@link KeylessSignature}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorSingleKey} ready for use in a transaction.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(new AnyPublicKey(this.publicKey), new AnySignature(this.sign(message)));
  }

  /**
   * Signs a raw transaction and returns an {@link AccountAuthenticatorSingleKey}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorSingleKey} containing the keyless signature.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(
      new AnyPublicKey(this.publicKey),
      new AnySignature(this.signTransaction(transaction)),
    );
  }

  /**
   * Waits for a pending background proof fetch to complete.
   *
   * If the proof was supplied eagerly, this resolves immediately.
   *
   * @returns A promise that resolves once {@link proofOrPromise} has settled.
   */
  async waitForProofFetch(): Promise<void> {
    if (this.proofOrPromise instanceof Promise) {
      await this.proofOrPromise;
    }
  }

  /**
   * Validates the account state prior to signing a transaction.
   *
   * Checks that:
   * - The ephemeral key pair has not expired.
   * - The zero-knowledge proof has been resolved (waits if needed).
   * - The JWT header contains a `kid` field.
   *
   * @returns A promise that resolves when the account is ready to sign.
   * @throws {@link KeylessError} if the account is expired, the proof is missing,
   *   or the JWT is malformed.
   */
  async checkKeylessAccountValidity(..._args: unknown[]): Promise<void> {
    if (this.isExpired()) {
      throw KeylessError.fromErrorType({ type: KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED });
    }
    await this.waitForProofFetch();
    if (this.proof === undefined) {
      throw KeylessError.fromErrorType({ type: KeylessErrorType.ASYNC_PROOF_FETCH_FAILED });
    }
    const header = decodeJwtHeader(this.jwt);
    if (header.kid === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.JWT_PARSING_ERROR,
        details: "checkKeylessAccountValidity failed. JWT is missing 'kid' in header.",
      });
    }
    // Full JWK verification requires network access (API layer).
    // Additional checks can be added in the API layer's checkKeylessAccountValidity wrapper.
  }

  /**
   * Signs a raw message and returns a {@link KeylessSignature}.
   *
   * The signature includes the JWT header, an ephemeral certificate wrapping the
   * zero-knowledge proof, the ephemeral public key, and the inner ephemeral
   * signature over the message.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns A {@link KeylessSignature} over the message.
   *
   * @throws {@link KeylessError} if the ephemeral key pair is expired or the
   *   proof has not yet been resolved.
   */
  sign(message: HexInput): KeylessSignature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    if (this.isExpired()) {
      throw KeylessError.fromErrorType({ type: KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED });
    }
    if (this.proof === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.PROOF_NOT_FOUND,
        details: "Proof not found - make sure to call `await account.checkKeylessAccountValidity()` before signing.",
      });
    }
    const ephemeralPublicKey = this.ephemeralKeyPair.getPublicKey();
    const ephemeralSignature = this.ephemeralKeyPair.sign(message);

    return new KeylessSignature({
      jwtHeader: base64UrlDecode(this.jwt.split(".")[0]),
      ephemeralCertificate: new EphemeralCertificate(this.proof, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  /**
   * Signs a raw transaction and returns a {@link KeylessSignature}.
   *
   * The signing message is derived by hashing the transaction together with the
   * zero-knowledge proof to prevent proof replay.
   *
   * @param transaction - The raw transaction to sign.
   * @returns A {@link KeylessSignature} over the combined transaction-and-proof message.
   *
   * @throws {@link KeylessError} if the proof has not yet been resolved.
   */
  signTransaction(transaction: AnyRawTransaction): KeylessSignature {
    if (this.proof === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.PROOF_NOT_FOUND,
        details: "Proof not found - make sure to call `await account.checkKeylessAccountValidity()` before signing.",
      });
    }
    const raw = deriveTransactionType(transaction);
    const txnAndProof = new TransactionAndProof(raw, this.proof.proof);
    const signMess = txnAndProof.hash();
    return this.sign(signMess);
  }

  /**
   * Computes the signing message for a transaction combined with the
   * zero-knowledge proof.
   *
   * This is the message that is passed to the ephemeral key's inner signing
   * operation and allows the proof to be bound to the specific transaction.
   *
   * @param transaction - The raw transaction.
   * @returns The 32-byte signing message (SHA3-256 hash of the BCS-encoded
   *   {@link TransactionAndProof}).
   *
   * @throws {@link KeylessError} if the proof has not yet been resolved.
   */
  getSigningMessage(transaction: AnyRawTransaction): Uint8Array {
    if (this.proof === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.PROOF_NOT_FOUND,
        details: "Proof not found - make sure to call `await account.checkKeylessAccountValidity()` before signing.",
      });
    }
    const raw = deriveTransactionType(transaction);
    const txnAndProof = new TransactionAndProof(raw, this.proof.proof);
    return txnAndProof.hash();
  }

  /**
   * Verifies that a {@link KeylessSignature} is valid for the given message.
   *
   * **Note:** Keyless signature verification requires on-chain ZK proof
   * verification and cannot be performed client-side. This method always
   * throws an error. Use on-chain transaction submission to verify keyless
   * signatures.
   *
   * @param _args - An object with the `message` (hex input) and the
   *   `signature` ({@link KeylessSignature}) to verify.
   * @returns Never — always throws.
   * @throws Always throws because client-side keyless verification is not supported.
   */
  verifySignature(_args: { message: HexInput; signature: KeylessSignature; [key: string]: unknown }): boolean {
    throw new Error(
      "Keyless signature verification is not supported client-side. Keyless signatures are verified on-chain.",
    );
  }
}

// ── TransactionAndProof ──

/**
 * A BCS-serializable container that binds a raw transaction to an optional
 * zero-knowledge proof.
 *
 * The hash of this structure is the actual bytes signed by the ephemeral key
 * inside a keyless signature, ensuring the proof cannot be replayed across
 * different transactions.
 */
export class TransactionAndProof extends Serializable {
  /** The raw transaction instance to be signed. */
  transaction: AnyRawTransactionInstance;
  /** The optional zero-knowledge proof to bind to the transaction. */
  proof?: ZkProof;
  /** The domain separator used when hashing this structure. */
  readonly domainSeparator = "APTOS::TransactionAndProof";

  /**
   * Creates a {@link TransactionAndProof}.
   *
   * @param transaction - The raw transaction to include.
   * @param proof - An optional {@link ZkProof} to bind to the transaction.
   */
  constructor(transaction: AnyRawTransactionInstance, proof?: ZkProof) {
    super();
    this.transaction = transaction;
    this.proof = proof;
  }

  /**
   * BCS-serializes the transaction and the optional proof into the given serializer.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.transaction.bcsToBytes());
    serializer.serializeOption(this.proof);
  }

  /**
   * Computes the signing message for this structure by hashing its BCS bytes
   * with the {@link domainSeparator}.
   *
   * @returns A 32-byte `Uint8Array` representing the signing message.
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}
