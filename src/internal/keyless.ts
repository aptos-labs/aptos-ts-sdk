// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/keyless}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * keyless namespace and without having a dependency cycle error.
 */
import { AptosConfig } from "../api/aptosConfig";
import { postAptosPepperService, postAptosProvingService } from "../client";
import {
  EphemeralSignature,
  Groth16Zkp,
  Hex,
  KeylessPublicKey,
  ZeroKnowledgeSig,
  ZkProof,
  getKeylessConfig,
} from "../core";
import { HexInput, ZkpVariant } from "../types";
import { EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { PepperFetchRequest, PepperFetchResponse, ProverRequest, ProverResponse } from "../types/keyless";
import { nowInSeconds } from "../utils/helpers";
import { lookupOriginalAccountAddress } from "./account";

export async

/**
 * Retrieves a pepper value based on the provided configuration and ephemeral key pair.
 * This function is essential for generating secure tokens or credentials in a keyless authentication flow.
 * 
 * @param args - The configuration parameters for fetching the pepper.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.jwt - The JSON Web Token used for authentication.
 * @param args.ephemeralKeyPair - The ephemeral key pair used for generating the pepper.
 * @param args.uidKey - An optional unique identifier key, defaults to "sub".
 * @param args.derivationPath - An optional derivation path for the key.
 * 
 * @returns A Uint8Array representing the retrieved pepper value.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * import { EphemeralKeyPair } from "your-ephemeral-key-pair-library"; // replace with actual library
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const jwt = "your_jwt_token"; // replace with a real JWT
 * const ephemeralKeyPair = new EphemeralKeyPair(); // create an ephemeral key pair
 * 
 * async function runExample() {
 *   // Fetch the pepper value using the provided configuration
 *   const pepper = await getPepper({
 *     aptosConfig: config,
 *     jwt,
 *     ephemeralKeyPair,
 *     uidKey: "sub", // optional, specify if needed
 *     derivationPath: "m/44'/60'/0'/0/0" // optional, specify if needed
 *   });
 * 
 *   console.log(pepper); // Log the retrieved pepper value
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  derivationPath?: string;
}): Promise<Uint8Array> {
  const { aptosConfig, jwt, ephemeralKeyPair, uidKey = "sub", derivationPath } = args;

  const body = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.getPublicKey().bcsToHex().toStringWithoutPrefix(),
    exp_date_secs: ephemeralKeyPair.expiryDateSecs,
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    uid_key: uidKey,
    derivation_path: derivationPath,
  };
  const { data } = await postAptosPepperService<PepperFetchRequest, PepperFetchResponse>({
    aptosConfig,
    path: "fetch",
    body,
    originMethod: "getPepper",
    overrides: { WITH_CREDENTIALS: false },
  });
  return Hex.fromHexInput(data.pepper).toUint8Array();
}

export async

/**
 * Generates a zero-knowledge proof using the provided parameters.
 * This function is essential for creating secure proofs that can be verified without revealing sensitive information.
 * 
 * @param args - The arguments required to generate the proof.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.jwt - The JSON Web Token used for authentication.
 * @param args.ephemeralKeyPair - The ephemeral key pair used for the proof generation.
 * @param args.pepper - An optional pepper value for added security (default is generated).
 * @param args.uidKey - An optional unique identifier key (default is "sub").
 * 
 * @throws Error if the pepper length is incorrect or if the ephemeral key pair's lifespan exceeds the maximum allowed.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, EphemeralKeyPair } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const ephemeralKeyPair = new EphemeralKeyPair(); // Generate a new ephemeral key pair
 *   const jwt = "your_jwt_token"; // replace with a real JWT
 * 
 *   // Generate the proof using the getProof function
 *   const proof = await aptos.getProof({
 *     aptosConfig: config,
 *     jwt,
 *     ephemeralKeyPair,
 *   });
 * 
 *   console.log("Generated Proof:", proof);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getProof(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  pepper?: HexInput;
  uidKey?: string;
}): Promise<ZeroKnowledgeSig> {
  const { aptosConfig, jwt, ephemeralKeyPair, pepper = await getPepper(args), uidKey = "sub" } = args;
  if (Hex.fromHexInput(pepper).toUint8Array().length !== KeylessAccount.PEPPER_LENGTH) {
    throw new Error(`Pepper needs to be ${KeylessAccount.PEPPER_LENGTH} bytes`);
  }
  const { maxExpHorizonSecs } = await getKeylessConfig({ aptosConfig });
  if (maxExpHorizonSecs < ephemeralKeyPair.expiryDateSecs - nowInSeconds()) {
    throw Error(`The EphemeralKeyPair is too long lived.  It's lifespan must be less than ${maxExpHorizonSecs}`);
  }
  const json = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.getPublicKey().bcsToHex().toStringWithoutPrefix(),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    exp_date_secs: ephemeralKeyPair.expiryDateSecs,
    exp_horizon_secs: maxExpHorizonSecs,
    pepper: Hex.fromHexInput(pepper).toStringWithoutPrefix(),
    uid_key: uidKey,
  };

  const { data } = await postAptosProvingService<ProverRequest, ProverResponse>({
    aptosConfig,
    path: "prove",
    body: json,
    originMethod: "getProof",
    overrides: { WITH_CREDENTIALS: false },
  });

  const proofPoints = data.proof;
  const groth16Zkp = new Groth16Zkp({
    a: proofPoints.a,
    b: proofPoints.b,
    c: proofPoints.c,
  });

  const signedProof = new ZeroKnowledgeSig({
    proof: new ZkProof(groth16Zkp, ZkpVariant.Groth16),
    trainingWheelsSignature: EphemeralSignature.fromHex(data.training_wheels_signature),
    expHorizonSecs: maxExpHorizonSecs,
  });
  return signedProof;
}

export async

/**
 * Derives a keyless account using the provided configuration and authentication details.
 * This function helps in creating a keyless account that can be used for authentication without managing private keys.
 * 
 * @param args - The parameters required to derive the keyless account.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.jwt - The JSON Web Token used for authentication.
 * @param args.ephemeralKeyPair - The ephemeral key pair used for the keyless account.
 * @param args.uidKey - An optional unique identifier key for the account.
 * @param args.pepper - An optional pepper value for added security.
 * @param args.proofFetchCallback - An optional callback function to handle proof fetching.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, deriveKeylessAccount } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const jwt = "your_jwt_token"; // replace with a real JWT
 * const ephemeralKeyPair = { /* ephemeral key pair details */ }; // replace with a real key pair
 * 
 * async function runExample() {
 *   // Deriving a keyless account
 *   const keylessAccount = await deriveKeylessAccount({
 *     aptosConfig: config,
 *     jwt,
 *     ephemeralKeyPair,
 *     uidKey: "your_uid_key", // replace with a real UID key if needed
 *     pepper: "0x1234567890abcdef", // replace with a real pepper value if needed
 *   });
 * 
 *   console.log("Keyless Account:", keylessAccount);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function deriveKeylessAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  pepper?: HexInput;
  proofFetchCallback?: ProofFetchCallback;
}): Promise<KeylessAccount> {
  const { aptosConfig, jwt, uidKey, proofFetchCallback, pepper = await getPepper(args) } = args;
  const proofPromise = getProof({ ...args, pepper });
  // If a callback is provided, pass in the proof as a promise to KeylessAccount.create.  This will make the proof be fetched in the
  // background and the callback will handle the outcome of the fetch.  This allows the developer to not have to block on the proof fetch
  // allowing for faster rendering of UX.
  //
  // If no callback is provided, the just await the proof fetch and continue syncronously.
  const proof = proofFetchCallback ? proofPromise : await proofPromise;

  // Look up the original address to handle key rotations
  const publicKey = KeylessPublicKey.fromJwtAndPepper({ jwt, pepper, uidKey });
  const address = await lookupOriginalAccountAddress({
    aptosConfig,
    authenticationKey: publicKey.authKey().derivedAddress(),
  });

  const keylessAccount = KeylessAccount.create({ ...args, address, proof, pepper, proofFetchCallback });

  return keylessAccount;
}