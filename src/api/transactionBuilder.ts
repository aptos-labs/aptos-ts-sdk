// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { GenerateTransactionPayloadData, TransactionPayload } from "../transactions/types";
import { generateTransactionPayload as generateTransactionPayload_ } from "../transactions/transaction_builder/transaction_builder";
import * as authenticators from "../transactions/authenticator";
import * as payloads from "../transactions/instances/transactionPayload";
import * as rawTransactions from "../transactions/instances/rawTransaction";
import * as signedTransactions from "../transactions/instances/signedTransaction";
import * as transactionArguments from "../transactions/instances/transactionArgument";
export namespace TransactionBuilderTypes {
  export async function generateTransactionPayload(args: GenerateTransactionPayloadData): Promise<TransactionPayload> {
    const payload = generateTransactionPayload_(args);
    return payload;
  }

  export type TransactionPayload = payloads.TransactionPayload;
  export type TransactionPayloadEntryFunction = payloads.TransactionPayloadEntryFunction;
  export type TransactionPayloadMultisig = payloads.TransactionPayloadMultisig;
  export type TransactionPayloadScript = payloads.TransactionPayloadScript;
  export type TransactionPayloadMultiSig = payloads.MultiSigTransactionPayload; // TODO: Change the name (on the right) to TransactionPayloadMultiSig

  export type RawTransaction = rawTransactions.RawTransaction;
  export type RawTransactionWithData = rawTransactions.RawTransactionWithData;
  export type FeePayerRawTransaction = rawTransactions.FeePayerRawTransaction;
  export type MultiAgentRawTransaction = rawTransactions.MultiAgentRawTransaction;

  export type SignedTransaction = signedTransactions.SignedTransaction;

  export type EntryFunctionArgument = transactionArguments.EntryFunctionArgument;
  export type ScriptFunctionArgument = transactionArguments.ScriptFunctionArgument;

  export type AccountAuthenticator = authenticators.AccountAuthenticator;
  export type AccountAuthenticatorEd25519 = authenticators.AccountAuthenticatorEd25519;
  export type AccountAuthenticatorMultiEd25519 = authenticators.AccountAuthenticatorMultiEd25519;
  export type AccountAuthenticatorSingleKey = authenticators.AccountAuthenticatorSingleKey;

  export type TransactionAuthenticator = authenticators.TransactionAuthenticator;
  export type TransactionAuthenticatorEd25519 = authenticators.TransactionAuthenticatorEd25519;
  export type TransactionAuthenticatorFeePayer = authenticators.TransactionAuthenticatorFeePayer;
  export type TransactionAuthenticatorMultiAgent = authenticators.TransactionAuthenticatorMultiAgent;
  export type TransactionAuthenticatorMultiEd25519 = authenticators.TransactionAuthenticatorMultiEd25519;
  export type SingleSenderTransactionAuthenticator = authenticators.SingleSenderTransactionAuthenticator;
}
