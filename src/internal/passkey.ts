// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/passkey}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import { bufferToBase64URLString, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  generateAuthenticationOptions as _generateAuthenticationOptions,
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyAuthenticationResponse as _verifyAuthenticationResponse,
  verifyRegistrationResponse as _verifyRegistrationResponse,
} from "@simplewebauthn/server";
import {
  AuthenticationResponseJSON,
  AuthenticatorDevice,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server/esm/deps";
import { convertCOSEtoPKCS, cose, isoBase64URL, parseAuthenticatorData } from "@simplewebauthn/server/helpers";
import { AptosConfig } from "../api/aptosConfig";
import { AccountAddress, AccountPublicKey, AuthenticationKey, PublicKey } from "../core";
import { PasskeyPublicKey } from "../core/crypto/passkey";
import { Secp256r1PublicKey } from "../core/crypto/secp256r1";
import { AccountAuthenticator, AnyRawTransaction, signWithPasskey as _signWithPasskey } from "../transactions";
import { HexInput, PendingTransactionResponse } from "../types";
import { AllowCredentialOption } from "../types/passkey";
import { submitTransaction } from "./transactionSubmission";

const supportedAlgorithmIDs = [cose.COSEALG.ES256];

export async function generateRegistrationOptions(args: {
  rpName: string;
  rpID: string;
  userID?: Uint8Array;
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

export async function generateAuthenticationOptions(args: {
  credentialId: string | Uint8Array;
  timeout?: number;
  rpID: string;
}): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { credentialId } = args;
  const allowCredentials: AllowCredentialOption[] = [
    {
      id: typeof credentialId !== "string" ? bufferToBase64URLString(credentialId) : credentialId,
    },
  ];
  return _generateAuthenticationOptions({ ...args, allowCredentials, userVerification: "required" });
}

export async function authenticateCredential(
  requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON,
): Promise<AuthenticationResponseJSON> {
  return startAuthentication(requestOptionsJSON);
}

export async function verifyAuthenticationResponse(args: {
  response: AuthenticationResponseJSON;
  expectedChallenge: string | ((challenge: string) => boolean | Promise<boolean>);
  expectedOrigin: string | string[];
  expectedRPID: string | string[];
  expectedType?: string | string[];
  authenticator: AuthenticatorDevice;
  requireUserVerification?: boolean;
  advancedFIDOConfig?: {
    userVerification?: UserVerificationRequirement;
  };
}): Promise<VerifiedAuthenticationResponse> {
  return _verifyAuthenticationResponse({ ...args });
}

export function parsePublicKey(response: RegistrationResponseJSON): PublicKey {
  const authData = isoBase64URL.toBuffer(response.response.authenticatorData!);
  const parsedAuthenticatorData = parseAuthenticatorData(authData);
  // Convert from COSE
  const publicKey = convertCOSEtoPKCS(parsedAuthenticatorData.credentialPublicKey!);
  return new Secp256r1PublicKey(publicKey);
}

export async function signWithPasskey(args: {
  credentialId: string | Uint8Array;
  publicKey: PublicKey;
  transaction: AnyRawTransaction;
  timeout?: number;
  rpID: string;
  options?: {
    allowCredentials?: AllowCredentialOption[];
  };
}): Promise<AccountAuthenticator> {
  return _signWithPasskey({ ...args });
}

export async function signAndSubmitWithPasskey(args: {
  aptosConfig: AptosConfig;
  credentialId: string | Uint8Array;
  publicKey: PublicKey;
  transaction: AnyRawTransaction;
  timeout?: number;
  rpID: string;
  options?: {
    allowCredentials?: AllowCredentialOption[];
  };
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

  let publicKeyObj: AccountPublicKey;
  switch (algorithm) {
    // ES256, P256, Secp256r1 are all the same thing.
    case cose.COSEALG.ES256:
      publicKeyObj = new PasskeyPublicKey(publicKey);
      break;
    default:
      throw new Error("Algorithm is not supported");
  }
  const authKey = AuthenticationKey.fromPublicKey({ publicKey: publicKeyObj });
  return AccountAddress.from(authKey.toString());
}
