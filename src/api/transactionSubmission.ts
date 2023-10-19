// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { Account } from "../core";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import {
  AnyRawTransaction,
  FeePayerTransaction,
  GenerateMultiAgentRawTransactionInput,
  GenerateTransactionInput,
  GenerateFeePayerRawTransactionInput,
  GenerateSingleSignerRawTransactionInput,
  MultiAgentTransaction,
  SingleSignerTransaction,
  SimulateTransactionData,
  GenerateTransactionOptions,
} from "../transactions/types";
import { UserTransactionResponse, PendingTransactionResponse, HexInput } from "../types";
import {
  generateTransaction,
  publishModuleTransaction,
  signAndSubmitTransaction,
  signTransaction,
  simulateTransaction,
  submitTransaction,
} from "../internal/transactionSubmission";

export class TransactionSubmission {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * We are defining function signatures, each with its specific input and output.
   * These are the possible function signature for `generateTransaction` function.
   * When we call `generateTransaction` function with the relevant type properties,
   * Typescript can infer the return type based on the appropriate function overload.
   */
  async generateTransaction(args: GenerateSingleSignerRawTransactionInput): Promise<SingleSignerTransaction>;
  async generateTransaction(args: GenerateFeePayerRawTransactionInput): Promise<FeePayerTransaction>;
  async generateTransaction(args: GenerateMultiAgentRawTransactionInput): Promise<MultiAgentTransaction>;
  async generateTransaction(args: GenerateTransactionInput): Promise<AnyRawTransaction>;

  /**
   * Generates any transaction by passing in the required arguments
   *
   * @param args.sender The transaction sender's account address as a HexInput
   * @param args.data EntryFunctionData | ScriptData | MultiSigData
   * @param args.feePayerAddress optional. For a fee payer (aka sponsored) transaction
   * @param args.secondarySignerAddresses optional. For a multi-agent or fee payer (aka sponsored) transactions
   * @param args.options optional. GenerateTransactionOptions type
   *
   * @example
   * For a single signer entry function
   * move function name, move function type arguments, move function arguments
   * `
   * data: {
   *  function:"0x1::aptos_account::transfer",
   *  type_arguments:[]
   *  arguments:[receiverAddress,10]
   * }
   * `
   *
   * @example
   * For a single signer script function
   * module bytecode, move function type arguments, move function arguments
   * ```
   * data: {
   *  bytecode:"0x001234567",
   *  type_arguments:[],
   *  arguments:[receiverAddress,10]
   * }
   * ```
   *
   * @return A raw transaction type (note that it holds the raw transaction as a bcs serialized data)
   * ```
   * {
   *  rawTransaction: Uint8Array,
   *  secondarySignerAddresses? : Array<AccountAddress>,
   *  feePayerAddress?: AccountAddress
   * }
   * ```
   */
  async generateTransaction(args: GenerateTransactionInput): Promise<AnyRawTransaction> {
    return generateTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Sign a transaction that can later be submitted to chain
   *
   * @param args.signer The signer account to sign the transaction
   * @param args.transaction A raw transaction type (note that it holds the raw transaction as a bcs serialized data)
   * ```
   * {
   *  rawTransaction: Uint8Array,
   *  secondarySignerAddresses? : Array<AccountAddress>,
   *  feePayerAddress?: AccountAddress
   * }
   * ```
   *
   * @return The signer AccountAuthenticator
   */
  /* eslint-disable class-methods-use-this */
  signTransaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
    return signTransaction({ ...args });
  }

  /**
   * Simulates a transaction before singing it.
   *
   * @param args.signerPublicKey The signer public key
   * @param args.transaction The raw transaction to simulate
   * @param args.secondarySignersPublicKeys optional. For when the transaction is a multi signers transaction
   * @param args.feePayerPublicKey optional. For when the transaction is a fee payer (aka sponsored) transaction
   * @param args.options optional. A config to simulate the transaction with
   */
  async simulateTransaction(args: SimulateTransactionData): Promise<Array<UserTransactionResponse>> {
    return simulateTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Submit transaction to chain
   *
   * @param args.transaction A aptos transaction type
   * @param args.senderAuthenticator The account authenticator of the transaction sender
   * @param args.secondarySignerAuthenticators optional. For when the transaction is a multi signers transaction
   *
   * @return PendingTransactionResponse
   */
  async submitTransaction(args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    secondarySignerAuthenticators?: {
      feePayerAuthenticator?: AccountAuthenticator;
      additionalSignersAuthenticators?: Array<AccountAuthenticator>;
    };
  }): Promise<PendingTransactionResponse> {
    return submitTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Sign and submit a single signer transaction to chain
   *
   * @param args.signer The signer account to sign the transaction
   * @param args.transaction A raw transaction type (note that it holds the raw transaction as a bcs serialized data)
   * ```
   * {
   *  rawTransaction: Uint8Array,
   *  secondarySignerAddresses? : Array<AccountAddress>,
   *  feePayerAddress?: AccountAddress
   * }
   * ```
   *
   * @return PendingTransactionResponse
   */
  async signAndSubmitTransaction(args: {
    signer: Account;
    transaction: AnyRawTransaction;
  }): Promise<PendingTransactionResponse> {
    const { signer, transaction } = args;
    return signAndSubmitTransaction({
      aptosConfig: this.config,
      signer,
      transaction,
    });
  }

  /**
   * Generates a transaction to publish a move package to chain.
   *
   * To get the `metadataBytes` and `byteCode`, can compile using Aptos CLI with command
   * `aptos move compile --save-metadata ...`,
   * For more info {@link https://aptos.dev/tutorials/your-first-dapp/#step-4-publish-a-move-module}
   *
   * @param account The publisher account
   * @param metadataBytes The package metadata bytes
   * @param byteCode The bytecodes of modules
   *
   * @returns A SingleSignerTransaction that can be simulated or submitted to chain
   */
  async publishModuleTransaction(args: {
    account: HexInput;
    metadataBytes: HexInput;
    byteCode: HexInput;
    options?: GenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return publishModuleTransaction({ aptosConfig: this.config, ...args });
  }
}
