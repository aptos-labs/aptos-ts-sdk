// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { Account, AccountAddressInput, PrivateKey } from "../core";
import { AnyRawTransaction, SingleSignerTransaction, InputGenerateTransactionOptions } from "../transactions/types";
import { PendingTransactionResponse, HexInput, TransactionResponse } from "../types";
import { publicPackageTransaction, rotateAuthKey, signAndSubmitTransaction } from "../internal/transactionSubmission";

export class TransactionSubmission {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Sign and submit a single signer transaction to chain
   *
   * @param args.signer The signer account to sign the transaction
   * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses
   * ```
   * {
   *  rawTransaction: RawTransaction,
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
   * @param args.account The publisher account
   * @param args.metadataBytes The package metadata bytes
   * @param args.moduleBytecode An array of the bytecode of each module in the package in compiler output order
   *
   * @returns A SingleSignerTransaction that can be simulated or submitted to chain
   */
  async publishPackageTransaction(args: {
    account: AccountAddressInput;
    metadataBytes: HexInput;
    moduleBytecode: Array<HexInput>;
    options?: InputGenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return publicPackageTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Rotate an account's auth key. After rotation, only the new private key can be used to sign txns for
   * the account.
   * Note: Only legacy Ed25519 scheme is supported for now.
   * More info: {@link https://aptos.dev/guides/account-management/key-rotation/}
   * @param args.fromAccount The account to rotate the auth key for
   * @param args.toNewPrivateKey The new private key to rotate to
   *
   * @returns PendingTransactionResponse
   */
  async rotateAuthKey(args: { fromAccount: Account; toNewPrivateKey: PrivateKey }): Promise<TransactionResponse> {
    return rotateAuthKey({ aptosConfig: this.config, ...args });
  }
}
