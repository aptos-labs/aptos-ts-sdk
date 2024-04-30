// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/oidb}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import { jwtDecode } from "jwt-decode";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { AptosConfig } from "../api/aptosConfig";
import { getAptosPepperService, postAptosPepperService, postAptosProvingService } from "../client";
import {
  APTOS_BIP44_DEFAULT_DERIVATION_PATH,
  EPK_HORIZON_SECS,
  EphemeralSignature,
  Groth16Zkp,
  Hex,
  SignedGroth16Signature,
} from "../core";
import { HexInput } from "../types";
import { Serializer } from "../bcs";
import { EphemeralKeyPair, KeylessAccount } from "../account";
import { PepperFetchResponse, ProverResponse } from "../types/keyless";

const APTOS_KEYLESS_PEPPER_PINKAS_VUF_DST = "APTOS_KEYLESS_PEPPER_PINKAS_VUF_DST";

function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

const PINKAS_VUF_SECRET_KEY_BASE_AFFINE = bls.G2.hashToCurve(
  stringToUint8Array("APTOS_KEYLESS_PEPPER_PINKAS_VUF_SECRET_KEY_BASE"),
  { DST: APTOS_KEYLESS_PEPPER_PINKAS_VUF_DST },
).toAffine();

function getPepperInput(args: { jwt: string; uidKey?: string }): ProjPointType<bigint> {
  const { jwt, uidKey } = args;
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  const serializer = new Serializer();
  serializer.serializeStr(jwtPayload.iss);
  serializer.serializeStr(jwtPayload.aud);
  serializer.serializeStr(jwtPayload[uidKey || "sub"]);
  serializer.serializeStr(uidKey || "sub");
  const serial = serializer.toUint8Array();
  const msg = bls.G1.hashToCurve(serial, { DST: "APTOS_PEPPER_SERVICE_BLS12381_VUF_DST" }).toAffine();
  const pp = bls.G1.ProjectivePoint.fromAffine(msg);
  return pp;
}

async function verifyPepperBase(args: {
  aptosConfig: AptosConfig;
  pepperInput: ProjPointType<bigint>;
  pepperBase: Uint8Array;
}): Promise<boolean> {
  const { aptosConfig, pepperInput, pepperBase } = args;
  const { data: pubKeyResponse } = await getAptosPepperService<any, { vrf_public_key_hex_string: string }>({
    aptosConfig,
    path: "vrf-pub-key",
    originMethod: "getPepper",
  });
  const publicKeyFromService = bls.G2.ProjectivePoint.fromHex(pubKeyResponse.vrf_public_key_hex_string);
  return bls.verifyShortSignature(pepperBase, pepperInput, publicKeyFromService);
}

export async function getPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  uidKey?: string;
  derivationPath?: string;
  verify?: boolean;
}): Promise<Uint8Array> {
  const { aptosConfig, jwt, ephemeralKeyPair, uidKey, verify } = args;
  let { derivationPath } = args;

  const body = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.publicKey.bcsToHex().toStringWithoutPrefix(),
    exp_date_secs: Number(ephemeralKeyPair.expiryDateSecs),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    uid_key: uidKey,
  };
  // console.log(JSON.stringify(body));
  const { data } = await postAptosPepperService<any, PepperFetchResponse>({
    aptosConfig,
    path: "fetch",
    body,
    originMethod: "getPepper",
    overrides: { WITH_CREDENTIALS: false },
  });
  const pepperBase = Hex.fromHexInput(data.signature).toUint8Array();

  if (verify) {
    const pepperVerified = verifyPepperBase({ aptosConfig, pepperBase, pepperInput: getPepperInput(args) });
    if (!pepperVerified) {
      throw new Error("Unable to verify");
    }
  }
  // This takes the BLS VUF H(m)^sk and transforms it into a Pinkas VUF e(H(m), g_3^sk), where g_3 is the base of the secret key (computed pseudo-randomly via hash-to-curve).
  // This gives us the freedom of either decentralizing the pepper service as a BLS-based MPC or on top of the validators, by reusing the Pinkas WVUF-based randomness infrastructure.
  const newPepperBase = bls.pairing(
    bls.G1.ProjectivePoint.fromHex(pepperBase),
    bls.G2.ProjectivePoint.fromAffine(PINKAS_VUF_SECRET_KEY_BASE_AFFINE),
  );

  if (derivationPath === undefined) {
    derivationPath = APTOS_BIP44_DEFAULT_DERIVATION_PATH;
  }
  const pepper = KeylessAccount.fromDerivationPath(derivationPath, bls.fields.Fp12.toBytes(newPepperBase));
  return pepper.slice(0, 31);
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
  const jwtPayload = jwtDecode<{ [key: string]: string }>(jwt);
  let extraField;
  if (extraFieldKey) {
    const extraFieldVal = jwtPayload[extraFieldKey];
    extraField = `"${extraFieldKey}":"${extraFieldVal}",`;
  }
  const json = {
    jwt_b64: jwt,
    epk: ephemeralKeyPair.publicKey.bcsToHex().toStringWithoutPrefix(),
    epk_blinder: Hex.fromHexInput(ephemeralKeyPair.blinder).toStringWithoutPrefix(),
    exp_date_secs: Number(ephemeralKeyPair.expiryDateSecs),
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
  const proof = new Groth16Zkp({
    a: proofPoints.a,
    b: proofPoints.b,
    c: proofPoints.c,
  });

  const signedProof = new SignedGroth16Signature({
    proof,
    extraField,
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
  fetchProofAsync?: boolean;
}): Promise<KeylessAccount> {
  const { fetchProofAsync } = args;
  let { pepper } = args;
  if (pepper === undefined) {
    pepper = await getPepper(args);
  } else if (Hex.fromHexInput(pepper).toUint8Array().length !== 31) {
    throw new Error("Pepper needs to be 31 bytes");
  }

  const proofPromise = getProof({ ...args, pepper });
  const proof = fetchProofAsync ? proofPromise : await proofPromise;

  const keylessAccount = KeylessAccount.fromJWTAndProof({ ...args, proofFetcherOrData: proof, pepper });

    return keylessAccount;
}
