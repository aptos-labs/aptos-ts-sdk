// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import EventEmitter from "eventemitter3";
import { jwtDecode } from "jwt-decode";
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
  MoveJWK,
  getKeylessConfig,
  fetchJWK,
  KeylessConfiguration,
} from "../core/crypto";

import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Hex } from "../core/hex";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator/account";
import { Deserializer, Serializable, Serializer } from "../bcs";
import { deriveTransactionType, generateSigningMessage } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../transactions/types";
import { base64UrlDecode } from "../utils/helpers";
import { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless";
import { Account } from "./Account";
import { AptosConfig } from "../api/aptosConfig";
import { KeylessError, KeylessErrorType } from "../errors";
import type { SingleKeySigner } from "./SingleKeyAccount";

/**
 * An interface which defines if an Account utilizes Keyless signing.
 */
export interface KeylessSigner extends Account {
  checkKeylessAccountValidity(aptosConfig: AptosConfig): Promise<void>;
}

export function isKeylessSigner(obj: any): obj is KeylessSigner {
  return obj !== null && obj !== undefined && typeof obj.checkKeylessAccountValidity === "function";
}

/**
 * Account implementation for the Keyless authentication scheme.  This abstract class is used for standard Keyless Accounts
 * and Federated Keyless Accounts.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export abstract class AbstractKeylessAccount extends Serializable implements KeylessSigner, SingleKeySigner {
  static readonly PEPPER_LENGTH: number = 31;

  /**
   * The KeylessPublicKey associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly publicKey: KeylessPublicKey | FederatedKeylessPublicKey;

  /**
   * The EphemeralKeyPair used to generate sign.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly ephemeralKeyPair: EphemeralKeyPair;

  /**
   * The claim on the JWT to identify a user.  This is typically 'sub' or 'email'.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly uidKey: string;

  /**
   * The value of the uidKey claim on the JWT.  This intended to be a stable user identifier.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly uidVal: string;

  /**
   * The value of the 'aud' claim on the JWT, also known as client ID.  This is the identifier for the dApp's
   * OIDC registration with the identity provider.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly aud: string;

  /**
   * A value contains 31 bytes of entropy that preserves privacy of the account. Typically fetched from a pepper provider.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly pepper: Uint8Array;

  /**
   * Account address associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly accountAddress: AccountAddress;

  /**
   * The zero knowledge signature (if ready) which contains the proof used to validate the EphemeralKeyPair.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  proof: ZeroKnowledgeSig | undefined;

  /**
   * The proof of the EphemeralKeyPair or a promise that provides the proof.  This is used to allow for awaiting on
   * fetching the proof.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly proofOrPromise: ZeroKnowledgeSig | Promise<ZeroKnowledgeSig>;

  /**
   * Signing scheme used to sign transactions
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly signingScheme: SigningScheme = SigningScheme.SingleKey;

  /**
   * The JWT token used to derive the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly jwt: string;

  /**
   * The hash of the verification key used to verify the proof. This is optional and can be used to check verifying key
   * rotations which may invalidate the proof.
   */
  readonly verificationKeyHash?: Uint8Array;

  /**
   * An event emitter used to assist in handling asynchronous proof fetching.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  private readonly emitter: EventEmitter<ProofFetchEvents>;

  /**
   * Use the static generator `create(...)` instead.
   * Creates an instance of the KeylessAccount with an optional proof.
   *
   * @param args - The parameters for creating a KeylessAccount.
   * @param args.address - Optional account address associated with the KeylessAccount.
   * @param args.publicKey - A KeylessPublicKey or FederatedKeylessPublicKey.
   * @param args.ephemeralKeyPair - The ephemeral key pair used in the account creation.
   * @param args.iss - A JWT issuer.
   * @param args.uidKey - The claim on the JWT to identify a user.  This is typically 'sub' or 'email'.
   * @param args.uidVal - The unique id for this user, intended to be a stable user identifier.
   * @param args.aud - The value of the 'aud' claim on the JWT, also known as client ID.  This is the identifier for the dApp's
   * OIDC registration with the identity provider.
   * @param args.pepper - A hexadecimal input used for additional security.
   * @param args.proof - A Zero Knowledge Signature or a promise that resolves to one.
   * @param args.proofFetchCallback - Optional callback function for fetching proof.
   * @param args.jwt - A JSON Web Token used for authentication.
   * @param args.verificationKeyHash Optional 32-byte verification key hash as hex input used to check proof validity.
   */
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

  /**
   * This initializes the asynchronous proof fetch
   * @return Emits whether the proof succeeds or fails, but has no return.
   * @group Implementation
   * @category Account (On-Chain Model)
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
   * Serializes the jwt data into a format suitable for transmission or storage.
   * This function ensures that both the jwt data and the proof are properly serialized.
   *
   * @param serializer - The serializer instance used to convert the jwt data into bytes.
   */
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

  /**
   * Checks if the proof is expired.  If so the account must be re-derived with a new EphemeralKeyPair
   * and JWT token.
   * @return boolean
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  /**
   * Sign a message using Keyless.
   * @param message the message to sign, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   * @group Implementation
   * @category Account (On-Chain Model)
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
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    const signature = new AnySignature(this.signTransaction(transaction));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  /**
   * Waits for asynchronous proof fetching to finish.
   * @return
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async waitForProofFetch() {
    if (this.proofOrPromise instanceof Promise) {
      await this.proofOrPromise;
    }
  }

  /**
   * Validates that the Keyless Account can be used to sign transactions.
   * @return
   */
  async checkKeylessAccountValidity(aptosConfig: AptosConfig): Promise<void> {
    if (this.isExpired()) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED,
      });
    }
    await this.waitForProofFetch();
    if (this.proof === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.ASYNC_PROOF_FETCH_FAILED,
      });
    }
    const header = jwtDecode(this.jwt, { header: true });
    if (header.kid === undefined) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.JWT_PARSING_ERROR,
        details: "checkKeylessAccountValidity failed. JWT is missing 'kid' in header. This should never happen.",
      });
    }
    if (this.verificationKeyHash !== undefined) {
      const { verificationKey } = await getKeylessConfig({ aptosConfig });
      if (Hex.hexInputToString(verificationKey.hash()) !== Hex.hexInputToString(this.verificationKeyHash)) {
        throw KeylessError.fromErrorType({
          type: KeylessErrorType.INVALID_PROOF_VERIFICATION_KEY_NOT_FOUND,
        });
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "[Aptos SDK] The verification key hash was not set. Proof may be invalid if the verification key has rotated.",
      );
    }
    await AbstractKeylessAccount.fetchJWK({ aptosConfig, publicKey: this.publicKey, kid: header.kid });
  }

  /**
   * Sign the given message using Keyless.
   * @param message in HexInput format
   * @returns Signature
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  sign(message: HexInput): KeylessSignature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    if (this.isExpired()) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED,
      });
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
   * Sign the given transaction with Keyless.
   * Signs the transaction and proof to guard against proof malleability.
   * @param transaction the transaction to be signed
   * @returns KeylessSignature
   * @group Implementation
   * @category Account (On-Chain Model)
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
   * Note - This function is currently incomplete and should only be used to verify ownership of the KeylessAccount
   *
   * Verifies a signature given the message.
   *
   * @param args.message the message that was signed.
   * @param args.signature the KeylessSignature to verify
   * @returns boolean
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  verifySignature(args: {
    message: HexInput;
    signature: KeylessSignature;
    jwk: MoveJWK;
    keylessConfig: KeylessConfiguration;
  }): boolean {
    return this.publicKey.verifySignature(args);
  }

  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: KeylessSignature;
    options?: { throwErrorWithReason?: boolean };
  }): Promise<boolean> {
    return this.publicKey.verifySignatureAsync({
      ...args,
    });
  }

  /**
   * Fetches the JWK from the issuer's well-known JWKS endpoint.
   *
   * @param args.publicKey The keyless public key to query
   * @param args.kid The kid of the JWK to fetch
   * @returns A JWK matching the `kid` in the JWT header.
   * @throws {KeylessError} If the JWK cannot be fetched
   */
  static async fetchJWK(args: {
    aptosConfig: AptosConfig;
    publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
    kid: string;
  }): Promise<MoveJWK> {
    return fetchJWK(args);
  }
}

/**
 * A container class to hold a transaction and a proof.  It implements CryptoHashable which is used to create
 * the signing message for Keyless transactions.  We sign over the proof to ensure non-malleability.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export class TransactionAndProof extends Serializable {
  /**
   * The transaction to sign.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  transaction: AnyRawTransactionInstance;

  /**
   * The zero knowledge proof used in signing the transaction.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  proof?: ZkProof;

  /**
   * The domain separator prefix used when hashing.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly domainSeparator = "APTOS::TransactionAndProof";

  constructor(transaction: AnyRawTransactionInstance, proof?: ZkProof) {
    super();
    this.transaction = transaction;
    this.proof = proof;
  }

  /**
   * Serializes the transaction data into a format suitable for transmission or storage.
   * This function ensures that both the transaction bytes and the proof are properly serialized.
   *
   * @param serializer - The serializer instance used to convert the transaction data into bytes.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.transaction.bcsToBytes());
    serializer.serializeOption(this.proof);
  }

  /**
   * Hashes the bcs serialized from of the class. This is the typescript corollary to the BCSCryptoHash macro in aptos-core.
   *
   * @returns Uint8Array
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}
/**
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export type ProofFetchSuccess = {
  status: "Success";
};
/**
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export type ProofFetchFailure = {
  status: "Failed";
  error: string;
};
/**
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export type ProofFetchStatus = ProofFetchSuccess | ProofFetchFailure;
/**
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export type ProofFetchCallback = (status: ProofFetchStatus) => Promise<void>;
/**
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface ProofFetchEvents {
  proofFetchFinish: (status: ProofFetchStatus) => void;
}
