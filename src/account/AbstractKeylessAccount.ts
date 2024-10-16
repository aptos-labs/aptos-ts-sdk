// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import EventEmitter from "eventemitter3";
import { EphemeralCertificateVariant, HexInput, SigningScheme } from "../types";
import { AccountAddress } from "../core/accountAddress";
import {
  AnyPublicKey,
  AnySignature,
  KeylessPublicKey,
  KeylessSignature,
  EphemeralCertificate,
  ZeroKnowledgeSig,
  ZkProof,
} from "../core/crypto";

import { Account } from "./Account";
import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Hex } from "../core/hex";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator/account";
import { Serializable, Serializer } from "../bcs";
import { deriveTransactionType, generateSigningMessage } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../transactions/types";
import { base64UrlDecode } from "../utils/helpers";
import { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless";

/**
 * Account implementation for the Keyless authentication scheme.  This abstract class is used for standard Keyless Accounts
 * and Federated Keyless Accounts.
 */
export abstract class AbstractKeylessAccount extends Serializable implements Account {
  static readonly PEPPER_LENGTH: number = 31;

  /**
   * The KeylessPublicKey associated with the account
   */
  readonly publicKey: KeylessPublicKey | FederatedKeylessPublicKey;

  /**
   * The EphemeralKeyPair used to generate sign.
   */
  readonly ephemeralKeyPair: EphemeralKeyPair;

  /**
   * The claim on the JWT to identify a user.  This is typically 'sub' or 'email'.
   */
  readonly uidKey: string;

  /**
   * The value of the uidKey claim on the JWT.  This intended to be a stable user identifier.
   */
  readonly uidVal: string;

  /**
   * The value of the 'aud' claim on the JWT, also known as client ID.  This is the identifier for the dApp's
   * OIDC registration with the identity provider.
   */
  readonly aud: string;

  /**
   * A value contains 31 bytes of entropy that preserves privacy of the account. Typically fetched from a pepper provider.
   */
  readonly pepper: Uint8Array;

  /**
   * Account address associated with the account
   */
  readonly accountAddress: AccountAddress;

  /**
   * The zero knowledge signature (if ready) which contains the proof used to validate the EphemeralKeyPair.
   */
  proof: ZeroKnowledgeSig | undefined;

  /**
   * The proof of the EphemeralKeyPair or a promise that provides the proof.  This is used to allow for awaiting on
   * fetching the proof.
   */
  readonly proofOrPromise: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;

  /**
   * Signing scheme used to sign transactions
   */
  readonly signingScheme: SigningScheme;

  /**
   * The JWT token used to derive the account
   */
  readonly jwt: string;

  /**
   * An event emitter used to assist in handling asynchronous proof fetching.
   */
  private readonly emitter: EventEmitter<ProofFetchEvents>;

  // Use the static constructor 'create' instead.
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
  }) {
    super();
    const { address, ephemeralKeyPair, publicKey, uidKey, uidVal, aud, pepper, proof, proofFetchCallback, jwt } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    this.publicKey = publicKey;
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.jwt = jwt;
    this.emitter = new EventEmitter<ProofFetchEvents>();
    this.proofOrPromise = proof;
    if (proof instanceof ZeroKnowledgeSig) {
      this.proof = proof;
    } else {
      if (proofFetchCallback === undefined) {
        throw new Error("Must provide callback for async proof fetch");
      }
      this.emitter.on("proofFetchFinish", async (status) => {
        await proofFetchCallback(status);
        this.emitter.removeAllListeners();
      });
      // Note, this is purposely not awaited to be non-blocking.  The caller should await on the proofFetchCallback.
      this.init(proof);
    }
    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== AbstractKeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${AbstractKeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  /**
   * This initializes the asynchronous proof fetch
   * @return
   */
  async init(promise: Promise<ZeroKnowledgeSig>) {
    try {
      this.proof = await promise;
      this.emitter.emit("proofFetchFinish", { status: "Success" });
    } catch (error) {
      if (error instanceof Error) {
        this.emitter.emit("proofFetchFinish", { status: "Failed", error: error.toString() });
      } else {
        this.emitter.emit("proofFetchFinish", { status: "Failed", error: "Unknown" });
      }
    }
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

  /**
   * Checks if the proof is expired.  If so the account must be re-derived with a new EphemeralKeyPair
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
   * Waits for asynchronous proof fetching to finish.
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
  sign(message: HexInput): KeylessSignature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    if (this.isExpired()) {
      throw new Error("EphemeralKeyPair is expired");
    }
    if (this.proof === undefined) {
      throw new Error("Proof not found - make sure to call `await account.waitForProofFetch()` before signing.");
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
   * Sign the given transaction with Keyless.
   * Signs the transaction and proof to guard against proof malleability.
   * @param transaction the transaction to be signed
   * @returns KeylessSignature
   */
  signTransaction(transaction: AnyRawTransaction): KeylessSignature {
    if (this.proof === undefined) {
      throw new Error("Proof not found - make sure to call `await account.waitForProofFetch()` before signing.");
    }
    const raw = deriveTransactionType(transaction);
    const txnAndProof = new TransactionAndProof(raw, this.proof.proof);
    const signMess = txnAndProof.hash();
    return this.sign(signMess);
  }

  /**
   * Note - This function is currently incomplete and should only be used to verify ownership of the KeylessAccount
   *
   * Verifies a signature given the message.
   *
   * TODO: Groth16 proof verification
   *
   * @param args.message the message that was signed.
   * @param args.signature the KeylessSignature to verify
   * @returns boolean
   */
  verifySignature(args: { message: HexInput; signature: KeylessSignature }): boolean {
    const { message, signature } = args;
    if (this.isExpired()) {
      return false;
    }
    if (!this.ephemeralKeyPair.getPublicKey().verifySignature({ message, signature: signature.ephemeralSignature })) {
      return false;
    }
    return true;
  }
}

/**
 * A container class to hold a transaction and a proof.  It implements CryptoHashable which is used to create
 * the signing message for Keyless transactions.  We sign over the proof to ensure non-malleability.
 */
export class TransactionAndProof extends Serializable {
  /**
   * The transaction to sign.
   */
  transaction: AnyRawTransactionInstance;

  /**
   * The zero knowledge proof used in signing the transaction.
   */
  proof?: ZkProof;

  /**
   * The domain separator prefix used when hashing.
   */
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

  /**
   * Hashes the bcs serialized from of the class. This is the typescript corollary to the BCSCryptoHash macro in aptos-core.
   *
   * @returns Uint8Array
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}

export type ProofFetchSuccess = {
  status: "Success";
};

export type ProofFetchFailure = {
  status: "Failed";
  error: string;
};

export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure;

export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;

export interface ProofFetchEvents {
  proofFetchFinish: (status: ProofFetchStatus) => void;
}
