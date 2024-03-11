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
import { EPK_LIFESPAN, Groth16Zkp, Hex, SignedGroth16Signature } from "../core";
import { generateSigningMessage } from "../transactions";
import { HexInput } from "../types";
import { Serializer } from "../bcs";
import { EphemeralKeyPair, KeylessAccount } from "../account";

function getPepperInput(args: { jwt: string; uidKey?: string }): ProjPointType<bigint> {
  const { jwt, uidKey } = args;
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  const serializer = new Serializer();
  serializer.serializeStr(jwtPayload.iss);
  serializer.serializeStr(jwtPayload.aud);
  serializer.serializeStr(jwtPayload[uidKey || "sub"]);
  serializer.serializeStr(uidKey || "sub");
  const serial = serializer.toUint8Array();
  const mess = bls.G1.hashToCurve(serial, { DST: "APTOS_OIDB_VUF_SCHEME0_DST" }).toAffine();
  const pp = bls.G1.ProjectivePoint.fromAffine(mess);
  return pp;
}

export async function getPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  verify?: boolean;
}): Promise<Uint8Array> {
  const { aptosConfig, jwt, ephemeralKeyPair, uidKey, verify } = args;

  const body = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.publicKey.bcsToHex().toStringWithoutPrefix(),
    exp_date_secs: Number(ephemeralKeyPair.expiryDateSecs),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    uid_key: uidKey,
  };
  // const jsonString = JSON.stringify(body);
  // console.log(jsonString);
  const { data } = await postAptosPepperService<any, { signature: string }>({
    aptosConfig,
    path: "fetch",
    body,
    originMethod: "getPepper",
  });
  // console.log(data);
  const pepperBase = Hex.fromHexInput(data.signature).toUint8Array();

  if (verify) {
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
  }

  const hash = sha3Hash.create();
  hash.update(pepperBase);
  const hashDigest = hash.digest();

  const pepper = Hex.fromHexInput(hashDigest).toUint8Array().slice(0, 31);

  return pepper;
}

export async function getProof(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  pepper: HexInput;
  uidKey?: string;
  extraFieldKey?: string;
}): Promise<SignedGroth16Signature> {
  const { aptosConfig, jwt, ephemeralKeyPair, pepper, uidKey, extraFieldKey } = args;
  const extraFieldKey2 = extraFieldKey || "iss";
  const json = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.publicKey.bcsToHex().toStringWithoutPrefix(),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    exp_date_secs: Number(ephemeralKeyPair.expiryDateSecs),
    exp_horizon_secs: EPK_LIFESPAN,
    pepper: Hex.fromHexInput(pepper).toStringWithoutPrefix(),
    extra_field: extraFieldKey2,
    uid_key: uidKey || "sub",
  };
  // const jsonString = JSON.stringify(json);
  // console.log(jsonString);
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  const extraFieldVal = jwtPayload[extraFieldKey2];
  const extraField = `"${extraFieldKey2}":"${extraFieldVal}",`;
  // console.log(extraField);
  if (typeof jwtPayload.aud !== "string") {
    throw new Error("aud was not found or an array of values");
  }

  const { data } = await postAptosProvingService<
    any,
    { proof: { a: string; b: string; c: string }; public_inputs_hash: string }
  >({
    aptosConfig,
    path: "prove",
    body: json,
    originMethod: "getProof",
  });
  // console.log(data);

  const proofPoints = data.proof;

  const proof = new Groth16Zkp({
    a: proofPoints.a,
    b: proofPoints.b,
    c: proofPoints.c,
  });
  const signedProof = new SignedGroth16Signature({ proof, extraField });
  return signedProof;
}

export async function deriveKeylessAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  pepper?: HexInput;
  extraFieldKey?: string;
}): Promise<KeylessAccount> {
  let { pepper } = args;
  if (pepper === undefined) {
    pepper = await getPepper(args);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }

  const proof = await getProof({ ...args, pepper });
  return KeylessAccount.fromJWTAndProof({ ...args, proof, pepper });
}
