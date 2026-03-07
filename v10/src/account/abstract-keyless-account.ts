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

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function decodeJwtPayload(jwt: string): Record<string, any> {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  return JSON.parse(base64UrlDecode(parts[1]));
}

function decodeJwtHeader(jwt: string): Record<string, any> {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  return JSON.parse(base64UrlDecode(parts[0]));
}

export function getIssAudAndUidVal(args: { jwt: string; uidKey?: string }): {
  iss: string;
  aud: string;
  uidVal: string;
} {
  const { jwt, uidKey = "sub" } = args;
  let jwtPayload: Record<string, any>;
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
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: "Invalid JWT: missing or malformed required claim",
    });
  }
  return { iss: jwtPayload.iss, aud: jwtPayload.aud, uidVal: jwtPayload[uidKey] };
}

// ── Proof fetch types ──

export type ProofFetchSuccess = { status: "Success" };
export type ProofFetchFailure = { status: "Failed"; error: string };
export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure;
export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;

// ── AbstractKeylessAccount ──

export abstract class AbstractKeylessAccount extends Serializable implements Account, SingleKeySigner {
  static readonly PEPPER_LENGTH: number = 31;

  readonly publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  readonly ephemeralKeyPair: EphemeralKeyPair;
  readonly uidKey: string;
  readonly uidVal: string;
  readonly aud: string;
  readonly pepper: Uint8Array;
  readonly accountAddress: AccountAddress;
  proof: ZeroKnowledgeSig | undefined;
  readonly proofOrPromise: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
  readonly signingScheme: SigningScheme = SigningScheme.SingleKey;
  readonly jwt: string;
  readonly verificationKeyHash?: Uint8Array;

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
      : (new AnyPublicKey(this.publicKey).authKey() as any).derivedAddress();
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

  getAnyPublicKey(): AnyPublicKey {
    return new AnyPublicKey(this.publicKey);
  }

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

  serialize(serializer: Serializer): void {
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

  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(new AnyPublicKey(this.publicKey), new AnySignature(this.sign(message)));
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(
      new AnyPublicKey(this.publicKey),
      new AnySignature(this.signTransaction(transaction)),
    );
  }

  async waitForProofFetch(): Promise<void> {
    if (this.proofOrPromise instanceof Promise) {
      await this.proofOrPromise;
    }
  }

  async checkKeylessAccountValidity(..._args: any[]): Promise<void> {
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

  verifySignature(args: { message: HexInput; signature: KeylessSignature; [key: string]: any }): boolean {
    return this.publicKey.verifySignature(args);
  }
}

// ── TransactionAndProof ──

export class TransactionAndProof extends Serializable {
  transaction: AnyRawTransactionInstance;
  proof?: ZkProof;
  readonly domainSeparator = "APTOS::TransactionAndProof";

  constructor(transaction: AnyRawTransactionInstance, proof?: ZkProof) {
    super();
    this.transaction = transaction;
    this.proof = proof;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.transaction.bcsToBytes());
    serializer.serializeOption(this.proof);
  }

  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}
