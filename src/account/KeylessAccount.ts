// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { decode } from "base-64";
import EventEmitter from "eventemitter3";
import { EphemeralCertificateVariant, HexInput, SigningScheme } from "../types";
import { AccountAddress } from "../core/accountAddress";
import {
  AnyPublicKey,
  AnySignature,
  KeylessPublicKey,
  KeylessSignature,
  EphemeralCertificate,
  Signature,
  ZeroKnowledgeSig,
  ZkProof,
} from "../core/crypto";

import { Account } from "./Account";
import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Hex } from "../core/hex";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator/account";
import { Deserializer, Serializable, Serializer } from "../bcs";
import { deriveTransactionType, generateSigningMessageForSerializable } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../transactions/types";

export type ProofFetchSuccess = {
  status: "Success";
};

export type ProofFetchFailure = {
  status: "Failed";
  error: string;
};

export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure

export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;

export interface ProofFetchEvents {
  proofFetchFinish: (status: ProofFetchStatus) => void;
}

export class KeylessAccount extends Serializable implements Account {
  static readonly PEPPER_LENGTH: number = 31;

  publicKey: KeylessPublicKey;

  ephemeralKeyPair: EphemeralKeyPair;

  uidKey: string;

  uidVal: string;

  aud: string;

  pepper: Uint8Array;

  accountAddress: AccountAddress;

  proof: ZeroKnowledgeSig | undefined;

  proofOrPromise: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;

  signingScheme: SigningScheme;

  jwt: string;

  emitter: EventEmitter<ProofFetchEvents>;

  constructor(args: {
    address?: AccountAddress;
    ephemeralKeyPair: EphemeralKeyPair;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    proofOrFetcher: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    proofFetchCallback?: ProofFetchCallback
    jwt: string;
  }) {
    super();
    const { address, ephemeralKeyPair, uidKey, uidVal, aud, pepper, proofOrFetcher, proofFetchCallback, jwt } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    this.publicKey =  KeylessPublicKey.create(args);
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.jwt = jwt;
    this.emitter = new EventEmitter<ProofFetchEvents>();
    this.proofOrPromise = proofOrFetcher;
    if (proofOrFetcher instanceof ZeroKnowledgeSig) {
      this.proof = proofOrFetcher;
    } else {
      if (proofFetchCallback === undefined) {
        throw new Error("Must provide callback for async proof fetch")
      }
      this.emitter.on("proofFetchFinish", async (status) => {
        await proofFetchCallback(status);
        this.emitter.removeAllListeners();
      });
      this.init(proofOrFetcher);
    }
    

    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== KeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${KeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  async init(promise: Promise<ZeroKnowledgeSig>) {
    try {
      this.proof = await promise;
      this.emitter.emit("proofFetchFinish", {status: "Success"});
    } catch (error) {
      if (error instanceof Error) {
        this.emitter.emit("proofFetchFinish", {status: "Failed", error: error.toString()});
      } else {
        this.emitter.emit("proofFetchFinish", {status: "Failed", error: "Unknown"});
      }
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.ephemeralKeyPair.serialize(serializer);
    if (this.proof === undefined) {
      throw new Error("Connot serialize - proof undefined")
    }
    this.proof.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): KeylessAccount {
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = ZeroKnowledgeSig.deserialize(deserializer);
    return KeylessAccount.fromJWTAndProof({
      proof,
      pepper,
      uidKey,
      jwt,
      ephemeralKeyPair,
    });
  }

  /**
   * Checks if the proof is expired.  If so the account must be rederived with a new EphemeralKeyPair
   * and JWT token.
   * @return boolean
   */
  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  /**
   * Sign a message using Keyless.
   * @param message the message to sign, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    const signature = new AnySignature(this.sign(message));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  /**
   * Sign a transaction using Keyless.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    const signature = new AnySignature(this.signTransaction(transaction));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  /**
   * Waits for asyncronous proof fetching to finish.
   * @return
   */
  async waitForProofFetch() {
    if (this.proofOrPromise instanceof Promise) {
      await this.proofOrPromise;
    }
  }

  /**
   * Sign the given message using Keyless.
   * @param message in HexInput format
   * @returns Signature
   */
  sign(data: HexInput): KeylessSignature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    if (this.isExpired()) {
      throw new Error("Ephemeral key pair is expired.");
    }
    if (this.proof === undefined) {
      throw new Error("Proof not found");
    }
    const jwtHeader = this.jwt.split(".")[0];
    const ephemeralPublicKey = this.ephemeralKeyPair.getPublicKey();
    const ephemeralSignature = this.ephemeralKeyPair.sign(data);

    return new KeylessSignature({
      jwtHeader: base64UrlDecode(jwtHeader),
      ephemeralCertificate: new EphemeralCertificate(this.proof, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  /**
   * Sign the given transaction with Keyless.
   * Signs the transaction and proof to guard against proof malleability.
   * @param transaction the transaction to be signed
   * @returns KeylessSignature
   */
  signTransaction(transaction: AnyRawTransaction): KeylessSignature {
    if (this.proof === undefined) {
      throw new Error("Proof not found");
    }
    const raw = deriveTransactionType(transaction);
    const txnAndProof = new TransactionAndProof(raw, this.proof.proof)
    const signMess = generateSigningMessageForSerializable(txnAndProof);
    return this.sign(signMess);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    throw new Error("Not implemented");
  }

  static fromBytes(bytes: Uint8Array): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(bytes));
  }

  static fromJWTAndProof(args: {
    proof: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
    proofFetchCallback?: ProofFetchCallback;
  }): KeylessAccount {
    const { proof, jwt, ephemeralKeyPair, pepper, proofFetchCallback } = args;
    const uidKey = args.uidKey ?? "sub";

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
    return new KeylessAccount({
      proofOrFetcher: proof,
      ephemeralKeyPair,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwt,
      proofFetchCallback,
    });
  }
}

class TransactionAndProof extends Serializable {
  transaction: AnyRawTransactionInstance;

  proof?: ZkProof;

  constructor(transaction: AnyRawTransactionInstance, proof?: ZkProof) {
    super();
    this.transaction = transaction;
    this.proof = proof;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.transaction.bcsToBytes());
    serializer.serializeOption(this.proof);
  }
}

function base64UrlDecode(base64Url: string): string {
  // Replace base64url-specific characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad the string with '=' characters if needed
  const paddedBase64 = base64 + "==".substring(0, (3 - (base64.length % 3)) % 3);
  // Decode the base64 string using the base-64 library
  const decodedString = decode(paddedBase64);
  return decodedString;
}
