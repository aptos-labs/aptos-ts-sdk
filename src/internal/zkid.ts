// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/zkid}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { postAptosPepperService } from "../client";
import { EphemeralAccount, Hex, ZkIDAccount } from "../core";
import { AnyRawTransaction } from "../transactions";
import { signWithOIDC } from "../transactions/transactionBuilder/transactionBuilder";
import { HexInput, PendingTransactionResponse } from "../types";
import { submitTransaction } from "./transactionSubmission";

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

export async function signAndSubmitWithOIDC(args: {
  aptosConfig: AptosConfig;
  signer: ZkIDAccount;
  transaction: AnyRawTransaction;
  jwt: string;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, signer, transaction, jwt } = args;
  const authenticator = signWithOIDC({
    signer,
    transaction,
    jwt,
  });
  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator: authenticator,
  });
}
