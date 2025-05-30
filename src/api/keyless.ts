// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { FederatedKeylessAccount } from "../account/FederatedKeylessAccount";
import { AccountAddressInput, ZeroKnowledgeSig } from "../core";
import {
  deriveKeylessAccount,
  getPepper,
  getProof,
  updateFederatedKeylessJwkSetTransaction,
} from "../internal/keyless";
import { InputGenerateTransactionOptions, SimpleTransaction } from "../transactions";
import { HexInput } from "../types";
import { CedraConfig } from "./cedraConfig";

/**
 * A class to query all `Keyless` related queries on Cedra.
 *
 * More documentation on how to integrate Keyless Accounts see the below
 * [Cedra Keyless Integration Guide](https://cedra.dev/guides/keyless-accounts/#cedra-keyless-integration-guide).
 * @group Keyless
 */
export class Keyless {
  /**
   * Initializes a new instance of the Cedra class with the provided configuration.
   * This allows you to interact with the Cedra blockchain using the specified network settings.
   *
   * @param config - The configuration settings for connecting to the Cedra network.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new configuration for the Cedra client
   *     const config = new CedraConfig({ network: Network.TESTNET }); // Specify your desired network
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Keyless
   */
  constructor(readonly config: CedraConfig) {}

  /**
   * Fetches the pepper from the Cedra pepper service API.
   *
   * @param args - The arguments for fetching the pepper.
   * @param args.jwt - JWT token.
   * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
   * @param args.derivationPath - A derivation path used for creating multiple accounts per user via the BIP-44 standard. Defaults
   * to "m/44'/637'/0'/0'/0".
   * @returns The pepper which is a Uint8Array of length 31.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const ephemeralKeyPair = new EphemeralKeyPair(); // create a new ephemeral key pair
   *   const jwt = "your_jwt_token"; // replace with a real JWT token
   *
   *   // Fetching the pepper using the provided JWT and ephemeral key pair
   *   const pepper = await cedra.getPepper({
   *     jwt,
   *     ephemeralKeyPair,
   *     // derivationPath: "m/44'/637'/0'/0'/0" // specify your own if needed
   *   });
   *
   *   console.log("Fetched pepper:", pepper);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Keyless
   */
  async getPepper(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    derivationPath?: string;
  }): Promise<Uint8Array> {
    return getPepper({ cedraConfig: this.config, ...args });
  }

  /**
   * Fetches a proof from the Cedra prover service API.
   *
   * @param args - The arguments for fetching the proof.
   * @param args.jwt - JWT token.
   * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
   * @param args.pepper - The pepper used for the account. If not provided, it will be fetched from the Cedra pepper service.
   * @param args.uidKey - A key in the JWT token to use to set the uidVal in the IdCommitment.
   *
   * @returns The proof which is represented by a ZeroKnowledgeSig.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network, EphemeralKeyPair, getPepper } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const jwt = "your_jwt_token"; // replace with a real JWT token
   *   const ephemeralKeyPair = new EphemeralKeyPair(); // create a new ephemeral key pair
   *
   *   // Fetch the proof using the getProof function
   *   const proof = await cedra.getProof({
   *     jwt,
   *     ephemeralKeyPair,
   *     pepper: await getPepper({}), // fetch the pepper if not provided
   *     uidKey: "sub", // specify the uid key
   *   });
   *
   *   console.log("Fetched proof:", proof);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Keyless
   */
  async getProof(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper?: HexInput;
    uidKey?: string;
  }): Promise<ZeroKnowledgeSig> {
    return getProof({ cedraConfig: this.config, ...args });
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
   * Derives a Keyless Account from the provided JWT token and corresponding EphemeralKeyPair. This function computes the proof
   * via the proving service and can fetch the pepper from the pepper service if not explicitly provided.
   *
   * @param args - The arguments required to derive the Keyless Account.
   * @param args.jwt - The JWT token used for deriving the account.
   * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
   * @param args.jwkAddress - The address the where the JWKs used to verify signatures are found.  Setting the value derives a
   * FederatedKeylessAccount.
   * @param args.uidKey - An optional key in the JWT token to set the uidVal in the IdCommitment.
   * @param args.pepper - An optional pepper value.
   * @param args.proofFetchCallback - An optional callback function for fetching the proof in the background, allowing for a more
   * responsive user experience.
   *
   * @returns A KeylessAccount that can be used to sign transactions.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network, deriveKeylessAccount } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   const jwt = "your_jwt_token"; // replace with a real JWT token
   *   const ephemeralKeyPair = new EphemeralKeyPair(); // create a new ephemeral key pair
   *
   *   // Deriving the Keyless Account
   *   const keylessAccount = await deriveKeylessAccount({
   *     jwt,
   *     ephemeralKeyPair,
   *     uidKey: "your_uid_key", // optional
   *     pepper: "your_pepper", // optional
   *   });
   *
   *   console.log("Keyless Account derived:", keylessAccount);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Keyless
   */
  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    jwkAddress?: AccountAddressInput;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount | FederatedKeylessAccount> {
    return deriveKeylessAccount({ cedraConfig: this.config, ...args });
  }

  /**
   * This installs a set of FederatedJWKs at an address for a given iss.
   *
   * It will fetch the JSON Web Keyset (JWK) set from the well-known endpoint and update the FederatedJWKs at the sender's address
   * to reflect it.
   *
   * @param args.sender The account that will install the JWKs
   * @param args.iss the iss claim of the federated OIDC provider.
   * @param args.jwksUrl the URL to find the corresponding JWKs. For supported IDP providers this parameter in not necessary.
   *
   * @returns The pending transaction that results from submission.
   * @group Keyless
   */
  async updateFederatedKeylessJwkSetTransaction(args: {
    sender: Account;
    iss: string;
    jwksUrl?: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return updateFederatedKeylessJwkSetTransaction({ cedraConfig: this.config, ...args });
  }
}
