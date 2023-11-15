// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/passkeysBrowser}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */
import { sha3_256 } from "@noble/hashes/sha3";
import { p256 } from "@noble/curves/p256";
import { AptosConfig } from "../api/aptosConfig";
import { Hex } from "../core";
import {
  AnyRawTransaction,
  deriveTransactionType,
  getAuthenticatorForWebAuthn,
  getSigningMessage,
} from "../transactions";
import { HexInput, PendingTransactionResponse } from "../types";
import { submitTransaction } from "./transactionSubmission";

export async function signWithPasskey(args: {
  aptosConfig: AptosConfig;
  credentialId: HexInput;
  publicKey: HexInput;
  transaction: AnyRawTransaction;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, credentialId, publicKey, transaction } = args;
  const allowCredentials: PublicKeyCredentialDescriptor[] = [
    {
      type: "public-key",
      id: Hex.fromHexInput(credentialId).toUint8Array(),
    },
  ];

  // get the signing message and hash it to create the challenge
  const transactionToSign = deriveTransactionType(transaction);
  const signingMessage = getSigningMessage(transactionToSign);
  const challenge = sha3_256(signingMessage);

  const publicKeyCredReqOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials,
  };

  const authenticationResponse = (await navigator.credentials.get({
    publicKey: publicKeyCredReqOptions,
  })) as PublicKeyCredential;

  const authenticatorAssertionResponse = authenticationResponse.response as AuthenticatorAssertionResponse;

  const { clientDataJSON, authenticatorData, signature } = authenticatorAssertionResponse;

  const signatureCompact = p256.Signature.fromDER(new Uint8Array(signature)).toCompactRawBytes();

  const authenticator = getAuthenticatorForWebAuthn({
    publicKey,
    clientDataJSON: new Uint8Array(clientDataJSON),
    authenticatorData: new Uint8Array(authenticatorData),
    signature: signatureCompact,
  });

  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator: authenticator,
  });
}
