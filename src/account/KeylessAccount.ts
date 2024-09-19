// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
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
import { Deserializer, Serializable, Serializer } from "../bcs";
import { deriveTransactionType, generateSigningMessage } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../transactions/types";
import { base64UrlDecode } from "../utils/helpers";

/**
 * Account implementation for the Keyless authentication scheme.
 *
 * Used to represent a Keyless based account and sign transactions with it.
 *
 * Use KeylessAccount.fromJWTAndProof to instantiate a KeylessAccount with a JWT, proof and EphemeralKeyPair.
 *
 * When the proof expires or the JWT becomes invalid, the KeylessAccount must be instantiated again with a new JWT,
 * EphemeralKeyPair, and corresponding proof.
 *
 * @static
 * @readonly PEPPER_LENGTH - The length of the pepper used for privacy preservation.
 */
export class KeylessAccount extends Serializable implements Account {
  static readonly PEPPER_LENGTH: number = 31;

  /**
   * The KeylessPublicKey associated with the account
   */
  readonly publicKey: KeylessPublicKey;

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
   * An event emitter used to assist in handling asycronous proof fetching.
   */
  private readonly emitter: EventEmitter<ProofFetchEvents>;

  // Use the static constructor 'create' instead.

  /**
   * Creates an instance of the transaction with an optional proof.
   * 
   * @param transaction - The raw transaction instance to be processed.
   * @param proof - An optional ZkProof associated with the transaction.
   */
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
    super();
    const { address, ephemeralKeyPair, uidKey, uidVal, aud, pepper, proof, proofFetchCallback, jwt } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    this.publicKey = KeylessPublicKey.create(args);
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
      this.init(proof);
    }
    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== KeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${KeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  /**
   * Initializes the asynchronous proof fetch. This function handles the promise for the Zero Knowledge Signature and emits events based on the success or failure of the fetch operation.
   * @param promise - A promise that resolves to a ZeroKnowledgeSig object.
   * @returns void
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

  /**
   * Serializes the transaction data into a format suitable for transmission or storage.
   * This function ensures that both the transaction bytes and the proof are properly serialized.
   * 
   * @param serializer - The serializer instance used to convert the transaction data into bytes.
   */
  serialize(serializer: Serializer): void;
  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.ephemeralKeyPair.serialize(serializer);
    if (this.proof === undefined) {
      throw new Error("Connot serialize - proof undefined");
    }
    this.proof.serialize(serializer);
  }

  /**
   * Deserializes the provided deserializer to create a KeylessAccount instance.
   * This function extracts necessary components such as the JWT, UID key, pepper, ephemeral key pair, and proof from the deserializer.
   * 
   * @param deserializer - The deserializer instance used to retrieve the serialized data.
   * @returns A KeylessAccount instance created from the deserialized data.
   */
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

  /**
   * Checks if the ephemeral key pair is expired. If it is expired, the account must be rederived with a new EphemeralKeyPair and JWT token.
   * @return boolean - Returns true if the key pair is expired, otherwise false.
   */
  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  /**
   * Sign a message using Keyless and return an AccountAuthenticator containing the signature and the account's public key.
   * 
   * @param message - The message to sign, represented as binary input in hexadecimal format.
   * @returns An AccountAuthenticatorSingleKey containing the public key and the signature.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    const signature = new AnySignature(this.sign(message));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  /**
   * Sign a transaction using Keyless and return an AccountAuthenticator containing the transaction's signature and the account's public key.
   * 
   * @param transaction - The raw transaction to be signed.
   * @returns An AccountAuthenticatorSingleKey containing the signature of the transaction along with the account's public key.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    const signature = new AnySignature(this.signTransaction(transaction));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  /**
   * Waits for asynchronous proof fetching to finish.
   * This function is particularly useful when dealing with signers that may require proof fetching, such as KeylessAccount or MultiKeyAccount.
   * @return {Promise<void>} A promise that resolves when the proof fetching is complete.
   */
  async waitForProofFetch() {
    if (this.proofOrPromise instanceof Promise) {
      await this.proofOrPromise;
    }
  }

  /**
   * Sign the given data using the ephemeral key pair and return a KeylessSignature object.
   * This function ensures that the ephemeral key pair is not expired and that a proof is defined before signing.
   * 
   * @param data - The data to be signed in HexInput format.
   * @returns A KeylessSignature object containing the signed data and associated metadata.
   * @throws Error if the ephemeral key pair is expired or if the proof is not defined.
   */
  sign(data: HexInput): KeylessSignature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    if (this.isExpired()) {
      throw new Error("EphemeralKeyPair is expired");
    }
    if (this.proof === undefined) {
      throw new Error("Proof not defined");
    }
    const ephemeralPublicKey = this.ephemeralKeyPair.getPublicKey();
    const ephemeralSignature = this.ephemeralKeyPair.sign(data);

    return new KeylessSignature({
      jwtHeader: base64UrlDecode(this.jwt.split(".")[0]),
      ephemeralCertificate: new EphemeralCertificate(this.proof, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  /**
   * Sign the given transaction with Keyless to guard against proof malleability.
   * @param transaction - The transaction to be signed.
   * @returns KeylessSignature - The signature of the signed transaction.
   * @throws Error - Throws an error if the proof is not found.
   */
  signTransaction(transaction: AnyRawTransaction): KeylessSignature {
    if (this.proof === undefined) {
      throw new Error("Proof not found");
    }
    const raw = deriveTransactionType(transaction);
    const txnAndProof = new TransactionAndProof(raw, this.proof.proof);
    const signMess = txnAndProof.hash();
    return this.sign(signMess);
  }

  /**
   * Verifies a signature given the message to confirm ownership of the KeylessAccount.
   * Note: This function is currently incomplete and should only be used for this purpose.
   * TODO: Groth16 proof verification
   * @param args - The arguments for verifying the signature.
   * @param args.message - The message that was signed.
   * @param args.signature - The KeylessSignature to verify.
   * @returns A boolean indicating whether the signature is valid.
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

  /**
   * Deserialize a byte array into a KeylessAccount instance.
   * This function allows you to reconstruct a KeylessAccount from its serialized form.
   * 
   * @param bytes - The byte array to deserialize.
   */
  static fromBytes(bytes: Uint8Array): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(bytes));
  }

  /**
   * Creates a KeylessAccount instance using the provided parameters.
   * This function allows you to set up a KeylessAccount with specific attributes such as address, proof, and JWT.
   * 
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.pepper - A hexadecimal input used for additional security.
   * @param args.uidKey - Optional key for user identification, defaults to "sub".
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   */
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
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
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
    });
  }
}

/**
 * A container class for holding a transaction and its associated proof. It implements the CryptoHashable interface,
 * which is utilized to create the signing message for Keyless transactions. The proof is signed to ensure non-malleability.
 *
 * @extends Serializable
 */
class TransactionAndProof extends Serializable {
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
   * Hashes the BCS serialized representation of the class along with the domain separator. This function generates a signing message that can be used for cryptographic operations.
   *
   * @returns Uint8Array - The resulting hash as a Uint8Array.
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}

/**
 * The result of a successful proof fetch operation.
 */
export type ProofFetchSuccess = {
  status: "Success";
};

/**
 * The payload for a failed proof fetch operation.
 */
export type ProofFetchFailure = {
  status: "Failed";
  error: string;
};

/**
 * The status of a proof fetch operation, which can either be a success or a failure.
 */
export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure;

/**
 * A callback function that handles the status of a proof fetch operation.
 */
export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;

/**  
 * Defines events related to the completion of proof fetching.  
 *  
 * @param proofFetchFinish - Callback invoked when proof fetching is finished, providing the status of the operation.  
 */
export interface ProofFetchEvents {
  proofFetchFinish: (status: ProofFetchStatus) => void;
}
