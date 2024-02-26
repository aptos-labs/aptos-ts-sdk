// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/oidb}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { jwtDecode } from "jwt-decode";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { AptosConfig } from "../api/aptosConfig";
import { getAptosPepperService, postAptosPepperService, postAptosProvingService } from "../client";
import {
  EPK_LIFESPAN,
  EphemeralAccount,
  Groth16Zkp,
  OidbAccount,
  Hex,
  SignedGroth16Signature,
  ZkIDAccount,
} from "../core";
import { generateSigningMessage } from "../transactions";
import { HexInput } from "../types";
import { Serializer } from "../bcs";

function getPepperInput(args: {jwt: string, uidKey?: string}): ProjPointType<bigint> {
  const {jwt, uidKey } = args;
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  const serializer = new Serializer();
  serializer.serializeStr(jwtPayload.iss);
  serializer.serializeStr(jwtPayload.aud);
  serializer.serializeStr(jwtPayload[uidKey || "sub"]);
  serializer.serializeStr(uidKey || "sub");
  const serial = serializer.toUint8Array()
  const mess = bls.G1.hashToCurve(serial, { DST: "APTOS_OIDB_VUF_SCHEME0_DST" }).toAffine();
  const pp = bls.G1.ProjectivePoint.fromAffine(mess);
  return pp
}

export async function getPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralAccount: EphemeralAccount;
  uidKey?: string;
}): Promise<Uint8Array> {
  const { aptosConfig, jwt, ephemeralAccount, uidKey } = args;

  const body = {
      jwt_b64: jwt,
      epk_hex_string: ephemeralAccount.publicKey.bcsToHex().toStringWithoutPrefix(),
      epk_expiry_time_secs: Number(ephemeralAccount.expiryTimestamp),
      epk_blinder_hex_string: Hex.fromHexInput(ephemeralAccount.blinder).toStringWithoutPrefix(),
      uid_key: uidKey,
  };
  const jsonString = JSON.stringify(body);
  console.log(jsonString);
  const { data } = await postAptosPepperService<any, { pepper_key_hex_string: string }>({
    aptosConfig,
    path: "",
    body,
    originMethod: "getPepper",
  });
  console.log(data);
  const pepperBase = Hex.fromHexInput(data.pepper_key_hex_string).toUint8Array();

  const { data: pubKeyResponse } = await getAptosPepperService<any, { vrf_public_key_hex_string: string }>({
    aptosConfig,
    path: "vrf-pub-key",
    originMethod: "getPepper",
  });

  const publicKeyFromService = bls.G2.ProjectivePoint.fromHex(pubKeyResponse.vrf_public_key_hex_string);

  const pepperVerified = bls.verifyShortSignature(pepperBase, getPepperInput(args), publicKeyFromService);
  if (!pepperVerified) {
    throw new Error("Unable to verify");
  }

  const hash = sha3Hash.create();
  hash.update(pepperBase);
  const hashDigest = hash.digest();

  const pepper = Hex.fromHexInput(hashDigest).toUint8Array().slice(0, 31)

  return pepper;
}

export async function getProof(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralAccount: EphemeralAccount;
  pepper: HexInput;
  uidKey?: string;
  extraFieldKey?: string;
}): Promise<SignedGroth16Signature> {
  const { aptosConfig, jwt, ephemeralAccount, pepper, uidKey, extraFieldKey } = args;
  const extraFieldKey2 = extraFieldKey || "iss";
  const json = {
    jwt_b64: jwt,
    epk_hex_string: ephemeralAccount.publicKey.bcsToHex().toStringWithoutPrefix(),
    epk_blinder_hex_string: Hex.fromHexInput(ephemeralAccount.blinder).toStringWithoutPrefix(),
    epk_expiry_time_secs: Number(ephemeralAccount.expiryTimestamp),
    epk_expiry_horizon_secs: EPK_LIFESPAN,
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

  const { data } = await postAptosProvingService<
    any,
    { data: { proof: { pi_a: string; pi_b: string; pi_c: string }; public_inputs_hash: string } }
  >({
    aptosConfig,
    path: "prove",
    body: json,
    originMethod: "getProof",
  });

  const proofPoints = data.data.proof;

  const proof = new Groth16Zkp({
    a: proofPoints.pi_a,
    b: proofPoints.pi_b,
    c: proofPoints.pi_c,
  });
  const signMess = generateSigningMessage(proof.bcsToBytes(), "Groth16Zkp");
  const nonMalleabilitySignature = ephemeralAccount.sign(signMess);
  const signedProof = new SignedGroth16Signature({ proof, nonMalleabilitySignature, extraField });
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
    pepper = await getPepper(args);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }
  return ZkIDAccount.fromJWT({ ...args, pepper });
}

export async function deriveOidbAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralAccount: EphemeralAccount;
  uidKey?: string;
  pepper?: HexInput;
  extraFieldKey?: string;
}): Promise<OidbAccount> {
  let { pepper } = args;
  if (pepper === undefined) {
    pepper = await getPepper(args);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }

  const proof = await getProof({ ...args, pepper });
  return OidbAccount.fromJWTAndProof({ ...args, proof, pepper });
}
