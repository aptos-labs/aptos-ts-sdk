// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, EphemeralKeyPair, KeylessAccount, ProofFetchCallback, TransactionAndProof } from "../account";
import { FederatedKeylessAccount } from "../account/FederatedKeylessAccount";
import { Deserializer } from "../bcs/deserializer";
import { AccountAddressInput, AnyPublicKey, AnySignature, Hex, KeylessPublicKey, KeylessSignature, ZeroKnowledgeSig } from "../core";
import {
  deriveKeylessAccount,
  getPepper,
  getProof,
  updateFederatedKeylessJwkSetTransaction,
} from "../internal/keyless";
import {
  AccountAuthenticatorSingleKey,
  AnyRawTransaction,
  AnyRawTransactionInstance,
  deriveTransactionType,
  SignedTransaction,
  SimpleTransaction,
  TransactionAuthenticatorSingleSender,
} from "../transactions";
import { HexInput } from "../types";
import { AptosApiType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to query all `Keyless` related queries on Aptos.
 *
 * More documentation on how to integrate Keyless Accounts see the below
 * https://aptos.dev/guides/keyless-accounts/#aptos-keyless-integration-guide
 */
export class Keyless {
  constructor(readonly config: AptosConfig) {}

  /**
   * Fetches the pepper from the Aptos pepper service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.derivationPath a derivation path used for creating multiple accounts per user via the BIP-44 standard. Defaults
   * to "m/44'/637'/0'/0'/0".
   * @returns The pepper which is a Uint8Array of length 31.
   */
  async getPepper(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    derivationPath?: string;
  }): Promise<Uint8Array> {
    return getPepper({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches a proof from the Aptos prover service API.
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.uidKey a key in the JWT token to use to set the uidVal in the IdCommitment
   * @param args.pepper the pepper used for the account.  If not provided it will be fetched from the Aptos pepper service
   *
   * @returns The proof which is represented by a ZeroKnowledgeSig.
   */
  async getProof(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper?: HexInput;
    uidKey?: string;
  }): Promise<ZeroKnowledgeSig> {
    return getProof({ aptosConfig: this.config, ...args });
  }

  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount>;

  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    jwkAddress: AccountAddressInput;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<FederatedKeylessAccount>;

  /**
   * Derives the Keyless Account from the JWT token and corresponding EphemeralKeyPair.  It will lookup the pepper from
   * the pepper service if not explicitly provided.  It will compute the proof via the proving service.  It will ch
   *
   * @param args.jwt JWT token
   * @param args.ephemeralKeyPair the EphemeralKeyPair used to generate the nonce in the JWT token
   * @param args.jwkAddress the where the JWKs used to verify signatures are found.  Setting the value derives a FederatedKeylessAccount
   * @param args.uidKey a key in the JWT token to use to set the uidVal in the IdCommitment
   * @param args.pepper the pepper
   * @param args.proofFetchCallback a callback function that if set, the fetch of the proof will be done in the background. Once
   * fetching finishes the callback function will be called.  This should be used to provide a more responsive user experience as now
   * they are not blocked on fetching the proof. Thus the function will return much more quickly.
   *
   * @returns A KeylessAccount that can be used to sign transactions
   */
  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    jwkAddress?: AccountAddressInput;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount | FederatedKeylessAccount> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }

  /**
   * This installs a set of FederatedJWKs at an address for a given iss.
   *
   * It will fetch the JWK set from the well-known endpoint and update the FederatedJWKs at the sender's address
   * to reflect it.
   *
   * @param args.sender The account that will install the JWKs
   * @param args.iss the iss claim of the federated OIDC provider.
   * @param args.jwksUrl the URL to find the corresponding JWKs. For supported IDP providers this parameter in not necessary.
   *
   * @returns The pending transaction that results from submission.
   */
  async updateFederatedKeylessJwkSetTransaction(args: {
    sender: Account;
    iss: string;
    jwksUrl?: string;
  }): Promise<SimpleTransaction> {
    return updateFederatedKeylessJwkSetTransaction({ aptosConfig: this.config, ...args });
  }

  async verifySignedKeylessTransactionBytes(signedTransactionBytes: HexInput) {
    const signedTxn = SignedTransaction.deserialize(
      new Deserializer(Hex.fromHexInput(signedTransactionBytes).toUint8Array()),
    );
    const keylessAuthenticator = (signedTxn.authenticator as TransactionAuthenticatorSingleSender)
      .sender as AccountAuthenticatorSingleKey;
    await this.verifyKeylessSignature({
      publicKey: keylessAuthenticator.public_key.publicKey as KeylessPublicKey,
      signature: keylessAuthenticator.signature.signature as KeylessSignature,
      transaction: signedTxn.raw_txn,
    });
  }

  async verifyKeylessSignature(args: {
    publicKey: KeylessPublicKey;
    signature: KeylessSignature;
    transaction: AnyRawTransactionInstance | AnyRawTransaction;
  }) {
    const { publicKey, signature, transaction } = args;
    const rawTxn = "rawTransaction" in transaction ? deriveTransactionType(transaction) : transaction;
    const url = this.config.getRequestUrl(AptosApiType.PEPPER);

    const headers = {
      "Content-Type": "application/json",
    };

    const txnAndProof = new TransactionAndProof(
      rawTxn,
      (signature.ephemeralCertificate.signature as ZeroKnowledgeSig).proof,
    );
    const signMess = txnAndProof.hash();
    const body = {
      public_key: new AnyPublicKey(publicKey).toString().slice(2),
      signature: new AnySignature(signature).toString().slice(2),
      message: Hex.fromHexInput(signMess).toStringWithoutPrefix(),
      address: new AnyPublicKey(publicKey).authKey().derivedAddress().toString(),
    };

    console.log(JSON.stringify(body));

    fetch(`${url}/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  }
}
