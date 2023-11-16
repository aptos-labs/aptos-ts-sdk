// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "./aptosConfig";
import { Account, AccountAddressInput, PrivateKey } from "../core";
import {
  AnyRawTransaction,
  SingleSignerTransaction,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
} from "../transactions/types";
import { PendingTransactionResponse, HexInput, TransactionResponse } from "../types";
import { publicPackageTransaction, rotateAuthKey, signAndSubmitTransaction } from "../internal/transactionSubmission";
import { TransactionWorker } from "../transactions/management";

export class TransactionSubmission {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Batch transactions for a single account.
   *
   * This function uses a transaction worker that receives payloads to be processed
   * and submitted to chain.
   * Note that this process is best for submitting multiple transactions that
   * dont rely on each other, i.e batch funds, batch token mints, etc.
   *
   * If any worker failure, the functions throws an error.
   *
   * @param args.sender The sender account to sign and submit the transaction
   * @param args.data An array of transaction payloads
   * @param args.options optional. Transaction generation configurations (excluding accountSequenceNumber)
   *
   * @return void. Throws if any error
   */
  async batchTransactionsForSingleAccount(args: {
    sender: Account;
    data: InputGenerateTransactionPayloadData[];
    options?: Omit<InputGenerateTransactionOptions, "accountSequenceNumber">;
  }): Promise<void> {
    try {
      const { sender, data, options } = args;
      const transactionWorker = new TransactionWorker(this.config, sender);

      transactionWorker.start();

      for (const d of data) {
        /* eslint-disable no-await-in-loop */
        await transactionWorker.push(d, options);
      }
    } catch (error: any) {
      throw new Error(`failed to submit transactions with error: ${error}`);
    }
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
