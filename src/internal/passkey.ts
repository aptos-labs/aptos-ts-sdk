// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/passkeysBrowser}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { startRegistration } from "@simplewebauthn/browser";
import { isoBase64URL, cose, parseAuthenticatorData, convertCOSEtoPKCS } from "@simplewebauthn/server/helpers";
import { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/server/esm/deps";
import { AptosConfig } from "../api/aptosConfig";
import { AccountAddress, AuthenticationKey, PublicKey } from "../core";
import { AnyRawTransaction, signWithPasskey } from "../transactions";
import { HexInput, PendingTransactionResponse } from "../types";
import { submitTransaction } from "./transactionSubmission";
import { Secp256r1PublicKey } from "../core/crypto/secp256r1";

const supportedAlgorithmIDs = [cose.COSEALG.ES256];

export async function generateRegistrationOptions(args: {
  rpName: string;
  rpID: string;
  userID: string;
  userName: string;
  challenge?: string | Uint8Array;
  userDisplayName?: string;
  timeout?: number;
  attestationType?: AttestationConveyancePreference;
  authenticatorAttachment?: AuthenticatorAttachment;
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { authenticatorAttachment } = args;
  const authenticatorSelection: AuthenticatorSelectionCriteria = {
    authenticatorAttachment,
    residentKey: "required",
    userVerification: "required",
  };

  return _generateRegistrationOptions({
    ...args,
    authenticatorSelection,
    supportedAlgorithmIDs,
  });
}

export async function registerCredential(
  creationOptionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationResponseJSON> {
  return startRegistration(creationOptionsJSON);
}

export async function verifyRegistrationResponse(args: {
  response: RegistrationResponseJSON;
  expectedChallenge: string | ((challenge: string) => boolean | Promise<boolean>);
  expectedOrigin: string | string[];
  expectedRPID?: string | string[];
}): Promise<VerifiedRegistrationResponse> {
  return _verifyRegistrationResponse({
    ...args,
    requireUserVerification: true,
    supportedAlgorithmIDs,
  });
}

export function parsePublicKey(response: RegistrationResponseJSON): PublicKey {
  const authData = isoBase64URL.toBuffer(response.response.authenticatorData!);
  const parsedAuthenticatorData = parseAuthenticatorData(authData);
  // Convert from COSE
  const publicKey = convertCOSEtoPKCS(parsedAuthenticatorData.credentialPublicKey!);
  return new Secp256r1PublicKey(publicKey);
}

export async function signAndSubmitWithPasskey(args: {
  aptosConfig: AptosConfig;
  credentialId: string | Uint8Array;
  publicKey: PublicKey;
  transaction: AnyRawTransaction;
  timeout?: number;
  rpID?: string;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, transaction } = args;

  const authenticator = await signWithPasskey({ ...args });
  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator: authenticator,
  });
}

export async function getPasskeyAccountAddress(args: { publicKey: HexInput; alg?: number }): Promise<AccountAddress> {
  const { publicKey, alg } = args;
  const algorithm = alg ?? cose.COSEALG.ES256;

  let publicKeyObj: PublicKey;
  switch (algorithm) {
    // ES256, P256, Secp256r1 are all the same thing.
    case cose.COSEALG.ES256:
      publicKeyObj = new Secp256r1PublicKey(publicKey);
      break;
    default:
      throw new Error("Algorithm is not supported");
  }
  const authKey = AuthenticationKey.fromPublicKey({ publicKey: publicKeyObj });
  return AccountAddress.from(authKey.toString());
}
