// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/zkid}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { JwtPayload, jwtDecode } from "jwt-decode";
import { AptosConfig } from "../api/aptosConfig";
import { postAptosPepperService, postAptosProvingService } from "../client";
import { EPK_LIFESPAN, EphemeralAccount, Groth16Zkp, GrothZkIDAccount, Hex, SignedGroth16Signature, ZkIDAccount } from "../core";
import { EphemeralSignature } from "../core/crypto/ephemeralSignature";
import { generateSigningMessage, generateSigningMessageForSerializable } from "../transactions";
import { HexInput } from "../types";

export async function getPepper(args: { aptosConfig: AptosConfig; jwt: string }): Promise<string> {
  const { aptosConfig, jwt } = args;

  const { data } = await postAptosPepperService<any, { OK: {pepper_hexlified: string }}>({
    aptosConfig,
    path: "unencrypted",
    body: {
      jwt,
    },
    originMethod: "getPepper",
  });
  return data.OK.pepper_hexlified;
}

export async function getProof(args: { 
  aptosConfig: AptosConfig; 
  jwt: string; ephemeralAccount: 
  EphemeralAccount, 
  pepper: HexInput, 
  uidKey?: string;
  extraFieldKey?: string}): Promise<SignedGroth16Signature> {
  const { aptosConfig, jwt, ephemeralAccount, pepper, uidKey, extraFieldKey} = args;
  const extraFieldKey2 = extraFieldKey || "iss";
  const json = {
    jwt_b64: jwt,
    epk_hex_string: ephemeralAccount.publicKey.bcsToHex().toStringWithoutPrefix(),
    epk_blinder_hex_string: Hex.fromHexInput(ephemeralAccount.blinder).toStringWithoutPrefix(),
    exp_date: Number(ephemeralAccount.expiryTimestamp),
    exp_horizon: EPK_LIFESPAN,
    pepper: Hex.fromHexInput(pepper).toStringWithoutPrefix(),
    extra_field: extraFieldKey2,
    uid_key: uidKey || "sub",
  };
  const jsonString = JSON.stringify(json);

  console.log(jsonString);
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  const extraFieldVal = jwtPayload[extraFieldKey2];
  const extraField = `"${extraFieldKey2}":"${extraFieldVal}",`;
  // console.log(extraField);
  if (typeof jwtPayload.aud !== "string") {
    throw new Error("aud was not found or an array of values");
  }


  const { data } = await postAptosProvingService<any, { data: {proof: {pi_a: string; pi_b: string, pi_c:string }, public_inputs_hash: string }}>({
    aptosConfig,
    path: "prove",
    body: json,
    originMethod: "getProof",
  });

  console.log(data.data.proof);
  console.log(data.data.public_inputs_hash);

  const proofPoints = data.data.proof

  const proof = new Groth16Zkp({
    a: proofPoints.pi_a,
    b: proofPoints.pi_b,
    c: proofPoints.pi_c,
  })
  const signMess = generateSigningMessage(proof.bcsToBytes(),"Groth16Zkp");
  const nonMalleabilitySignature = ephemeralAccount.sign(signMess);
  const signedProof = new SignedGroth16Signature({proof, nonMalleabilitySignature, extraField})
  return signedProof;
}

export async function deriveAccountFromJWTAndEphemAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralAccount: EphemeralAccount;
  uidKey?: string;
  pepper?: HexInput;
}): Promise<ZkIDAccount> {
  let { pepper } = args;
  if (pepper === undefined) {
    const pepperResult = await getPepper(args);
    pepper = Hex.fromHexInput(pepperResult).toUint8Array().slice(0, 31);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }
  return ZkIDAccount.fromJWT({ ...args, pepper });
}

export async function deriveGrothAccountFromJWTAndEphemAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralAccount: EphemeralAccount;
  uidKey?: string;
  pepper?: HexInput;
  extraFieldKey?: string;
}): Promise<GrothZkIDAccount> {
  let { pepper } = args;
  if (pepper === undefined) {
    const pepperResult = await getPepper(args);
    pepper = Hex.fromHexInput(pepperResult).toUint8Array().slice(0, 31);

    console.log("Pepper");
    console.log(pepperResult.substring(0, 62))
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }


  const proof = await getProof({...args, pepper});
  return GrothZkIDAccount.fromJWTAndProof({ ...args, proof, pepper })
}

