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

export async function getPepper(args: {
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

export async function getProof(args: {
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

export async function deriveKeylessAccount(args: {
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
