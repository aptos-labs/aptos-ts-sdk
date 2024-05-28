// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/keyless}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import { AptosConfig } from "../api/aptosConfig";
import { postAptosPepperService, postAptosProvingService } from "../client";
import { EPK_HORIZON_SECS, EphemeralSignature, Groth16Zkp, Hex, ZeroKnowledgeSig, ZkProof } from "../core";
import { HexInput, ZkpVariant } from "../types";
import { EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { PepperFetchResponse, ProverResponse } from "../types/keyless";

export async function getPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  derivationPath?: string;
}): Promise<Uint8Array> {
  const { aptosConfig, jwt, ephemeralKeyPair, uidKey, derivationPath } = args;

  const body = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.getPublicKey().bcsToHex().toStringWithoutPrefix(),
    exp_date_secs: ephemeralKeyPair.expiryDateSecs,
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    uid_key: uidKey || "sub",
    derivation_path: derivationPath,
  };
  const { data } = await postAptosPepperService<any, PepperFetchResponse>({
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
  pepper: HexInput;
  uidKey?: string;
  extraFieldKey?: string;
}): Promise<ZeroKnowledgeSig> {
  const { aptosConfig, jwt, ephemeralKeyPair, pepper, uidKey, extraFieldKey } = args;
  const json = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.getPublicKey().bcsToHex().toStringWithoutPrefix(),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    exp_date_secs: ephemeralKeyPair.expiryDateSecs,
    exp_horizon_secs: EPK_HORIZON_SECS,
    pepper: Hex.fromHexInput(pepper).toStringWithoutPrefix(),
    extra_field: extraFieldKey,
    uid_key: uidKey || "sub",
  };

  const { data } = await postAptosProvingService<any, ProverResponse>({
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
  });
  return signedProof;
}

export async function deriveKeylessAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  pepper?: HexInput;
  extraFieldKey?: string;
  proofFetchCallback?: ProofFetchCallback;
}): Promise<KeylessAccount> {
  const { proofFetchCallback } = args;
  let { pepper } = args;
  if (pepper === undefined) {
    pepper = await getPepper(args);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== KeylessAccount.PEPPER_LENGTH) {
    throw new Error(`Pepper needs to be ${KeylessAccount.PEPPER_LENGTH} bytes`);
  }

  const proofPromise = getProof({ ...args, pepper });
  const proof = proofFetchCallback ? proofPromise : await proofPromise;

  const keylessAccount = KeylessAccount.fromJWTAndProof({ ...args, proof, pepper, proofFetchCallback });

  return keylessAccount;
}
