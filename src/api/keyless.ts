// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { ZeroKnowledgeSig } from "../core";
import { deriveKeylessAccount, getPepper, getProof } from "../internal/keyless";
import { HexInput } from "../types";
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
 * @param args - The arguments for fetching the pepper.
 * @param args.jwt - JWT token.
 * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
 * @param args.derivationPath - A derivation path used for creating multiple accounts per user via the BIP-44 standard. Defaults to "m/44'/637'/0'/0'/0".
 * @returns The pepper which is a Uint8Array of length 31.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const ephemeralKeyPair = { /* create or retrieve your ephemeral key pair */ };
 *   const jwt = "your.jwt.token"; // replace with a real JWT token
 * 
 *   // Fetch the pepper using the provided JWT and ephemeral key pair
 *   const pepper = await aptos.getPepper({ jwt, ephemeralKeyPair });
 * 
 *   console.log("Fetched pepper:", pepper);
 * }
 * runExample().catch(console.error);
 * ```
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
 * This function allows you to retrieve a Zero Knowledge proof necessary for secure transactions.
 * 
 * @param args - The arguments for fetching the proof.
 * @param args.jwt - JWT token.
 * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
 * @param args.pepper - The pepper used for the account. If not provided, it will be fetched from the Aptos pepper service.
 * @param args.uidKey - A key in the JWT token to use to set the uidVal in the IdCommitment.
 * 
 * @returns The proof represented by a ZeroKnowledgeSig.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Create an ephemeral key pair
 *   const ephemeralKeyPair = {
 *     getPublicKey: () => ({ bcsToHex: () => "publicKeyHex" }), // replace with real public key logic
 *     blinder: "blinderHex", // replace with real blinder
 *     expiryDateSecs: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
 *   };
 * 
 *   // Fetch the proof using the getProof function
 *   const proof = await aptos.getProof({
 *     jwt: "your.jwt.token.here", // replace with a real JWT
 *     ephemeralKeyPair,
 *     uidKey: "sub", // optional, specify if needed
 *     // pepper: "yourPepperHex" // optional, specify if needed
 *   });
 * 
 *   console.log(proof);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getProof(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper?: HexInput;
    uidKey?: string;
  }): Promise<ZeroKnowledgeSig> {
    return getProof({ aptosConfig: this.config, ...args });
  }

/**
 * Derives a Keyless Account using the provided JWT token and EphemeralKeyPair. This function allows you to create a Keyless Account that can be used to sign transactions.
 * 
 * @param args - The arguments required to derive the Keyless Account.
 * @param args.jwt - The JWT token.
 * @param args.ephemeralKeyPair - The EphemeralKeyPair used to generate the nonce in the JWT token.
 * @param args.uidKey - An optional key in the JWT token to set the uidVal in the IdCommitment.
 * @param args.pepper - An optional pepper value. If not provided, it will be fetched from the pepper service.
 * @param args.proofFetchCallback - An optional callback function that allows the proof to be fetched in the background for a more responsive user experience.
 * 
 * @returns A KeylessAccount that can be used to sign transactions.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const jwt = "your_jwt_token"; // replace with a real JWT token
 *   const ephemeralKeyPair = { /* your ephemeral key pair */ }; // replace with a real ephemeral key pair
 * 
 *   // Deriving the Keyless Account
 *   const keylessAccount = await aptos.deriveKeylessAccount({
 *     jwt,
 *     ephemeralKeyPair,
 *     uidKey: "your_uid_key", // optional
 *     pepper: "your_pepper_value", // optional
 *     proofFetchCallback: (proof) => {
 *       console.log("Proof fetched:", proof);
 *     },
 *   });
 * 
 *   console.log("Keyless Account derived:", keylessAccount);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async deriveKeylessAccount(args: {
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    uidKey?: string;
    pepper?: HexInput;
    proofFetchCallback?: ProofFetchCallback;
  }): Promise<KeylessAccount> {
    return deriveKeylessAccount({ aptosConfig: this.config, ...args });
  }
}