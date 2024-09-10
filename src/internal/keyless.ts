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
  AccountAddressInput,
  EphemeralSignature,
  Groth16Zkp,
  Hex,
  KeylessPublicKey,
  ZeroKnowledgeSig,
  ZkProof,
  getKeylessConfig,
} from "../core";
import { HexInput, PendingTransactionResponse, ZkpVariant } from "../types";
import { Account, EphemeralKeyPair, KeylessAccount, ProofFetchCallback } from "../account";
import { PepperFetchRequest, PepperFetchResponse, ProverRequest, ProverResponse } from "../types/keyless";
import { nowInSeconds } from "../utils/helpers";
import { lookupOriginalAccountAddress } from "./account";
import { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless";
import { FederatedKeylessAccount } from "../account/FederatedKeylessAccount";
import { MoveString, MoveVector } from "../bcs";
import { generateTransaction, signAndSubmitTransaction } from "./transactionSubmission";

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
}): Promise<KeylessAccount>;

export async function deriveKeylessAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  jwkAddress: AccountAddressInput;
  uidKey?: string;
  pepper?: HexInput;
  proofFetchCallback?: ProofFetchCallback;
}): Promise<FederatedKeylessAccount>;

export async function deriveKeylessAccount(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralKeyPair: EphemeralKeyPair;
  jwkAddress?: AccountAddressInput;
  uidKey?: string;
  pepper?: HexInput;
  proofFetchCallback?: ProofFetchCallback;
}): Promise<KeylessAccount | FederatedKeylessAccount> {
  const { aptosConfig, jwt, jwkAddress, uidKey, proofFetchCallback, pepper = await getPepper(args) } = args;
  const proofPromise = getProof({ ...args, pepper });
  // If a callback is provided, pass in the proof as a promise to KeylessAccount.create.  This will make the proof be fetched in the
  // background and the callback will handle the outcome of the fetch.  This allows the developer to not have to block on the proof fetch
  // allowing for faster rendering of UX.
  //
  // If no callback is provided, the just await the proof fetch and continue syncronously.
  const proof = proofFetchCallback ? proofPromise : await proofPromise;

  // Look up the original address to handle key rotations and then instantiate the account.
  if (jwkAddress !== undefined) {
    const publicKey = FederatedKeylessPublicKey.fromJwtAndPepper({ jwt, pepper, jwkAddress, uidKey });
    const address = await lookupOriginalAccountAddress({
      aptosConfig,
      authenticationKey: publicKey.authKey().derivedAddress(),
    });

    return FederatedKeylessAccount.create({ ...args, address, proof, pepper, proofFetchCallback, jwkAddress });
  }

  const publicKey = KeylessPublicKey.fromJwtAndPepper({ jwt, pepper, uidKey });
  const address = await lookupOriginalAccountAddress({
    aptosConfig,
    authenticationKey: publicKey.authKey().derivedAddress(),
  });
  return KeylessAccount.create({ ...args, address, proof, pepper, proofFetchCallback });
}

interface JWK {
  kty: string; // Key type
  kid: string; // Key ID
  alg: string; // Algorithm used with the key
  n: string; // Modulus (for RSA keys)
  e: string; // Exponent (for RSA keys)
}

interface JWKS {
  keys: JWK[];
}

export async function updateFederatedKeylessJwkSet(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  iss: string;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, sender, iss } = args;
  const jwksUrl = `${iss}.well-known/jwks.json`;
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
  }
  const jwks: JWKS = await response.json();
  const jwkAddBytecode =
    // eslint-disable-next-line max-len
    "a11ceb0b060000000701000602060c03121a042c02052e4707757808ed0120000000010002010307000004070000050700020603040100000705060000080708000009090600000a0a0500000206060c0a020a08000a08000a08000a080008080008000801080008000308020a080201080001060a0900010100010802040800080008000800010801020a02080102060c0a0802046a776b7306737472696e6706766563746f7206537472696e67034a574b0550617463680869735f656d707479146e65775f70617463685f72656d6f76655f616c6c0b6e65775f7273615f6a776b146e65775f70617463685f7570736572745f6a776b1470617463685f6665646572617465645f6a776b730000000000000000000000000000000000000000000000000000000000000001000001500e02380020040505090b0001062a00000000000000270e0241020c0b0e0341020a0b21041205160b0001062a00000000000000270e0441020a0b21041c05200b0001062a00000000000000270e0541020b0b210426052a0b0001062a00000000000000271101400601000000000000000c0d0e02380020044c05320d0245020c090d0345020c060d0445020c070d0545020c0a0b090b060b070b0a11020c080a010b0811030c0c0d0d0b0c4406052d0b000b0d110402";
  const jwkAddTransaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      bytecode: jwkAddBytecode,
      functionArguments: [
        new MoveString(iss),
        MoveVector.MoveString(jwks.keys.map((key) => key.kid)),
        MoveVector.MoveString(jwks.keys.map((key) => key.alg)),
        MoveVector.MoveString(jwks.keys.map((key) => key.e)),
        MoveVector.MoveString(jwks.keys.map((key) => key.n)),
      ],
    },
  });
  const txn = await signAndSubmitTransaction({ aptosConfig, signer: sender, transaction: jwkAddTransaction });
  return txn;
}
