// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { Account, AccountAddress } from "../../../core";
import { Signer } from "../../../core/signer";
import { waitForTransaction } from "../../../internal/transaction";
import { submitTransaction } from "../../../internal/transactionSubmission";
import { generateRawTransaction } from "../../../transactions";
import { RawTransaction } from "../../../transactions/instances";
import {
  HexInput,
  PendingTransactionResponse,
  UserTransactionResponse,
  WaitForTransactionOptions,
} from "../../../types";
import { getConfigOrNetwork } from "./helper";
import { CreateWithFeePayer, TransactionBuilder } from "./transactionBuilder";
import { SignFeePayerTransactionFunction, TransactionBuilderArgs, TransactionBuilderInfo, TransactionBuilderWithFeePayerArgs, TransactionBuilderWithSingleSignerArgs } from "./types";

export class SingleSignerTransactionBuilder extends TransactionBuilder implements CreateWithFeePayer {
  protected senderSigner?: Signer;
  // if fee payer is 0x0, then it's an anonymous fee payer 
  private withFeePayer: boolean = false;
  private feePayerAddress: AccountAddress = AccountAddress.ZERO;
  private feePayerSigner?: Signer;
  private transactionHash?: HexInput;

  protected constructor(args: {
    rawTransaction: RawTransaction;
    aptosConfig: AptosConfig;
    feePayerAddress?: AccountAddress;
  }) {
    const { feePayerAddress } = args;
    super(args);
    this.feePayerAddress = feePayerAddress ?? AccountAddress.ZERO;
  }

  getInfo(): TransactionBuilderInfo {
    return {
      rawTransaction: this.rawTransaction,
      aptosConfig: this.aptosConfig,
      sender: this.rawTransaction.sender,
      payload: this.rawTransaction.payload as any, // TODO: Figure out why it makes you cast this
      senderSigner: this.senderSigner,
      feePayerAddress: this.feePayerAddress,
      feePayerSigner: this.feePayerSigner,
      secondarySignerAddresses: undefined,
      secondarySigners: undefined,
      transactionHash: this.transactionHash,
    };
  }

  private static async generate(
    args: TransactionBuilderArgs,
  ): Promise<SingleSignerTransactionBuilder> {
    const { sender, payload, configOrNetwork, options, feePayerAddress } = args;
    const aptosConfig = getConfigOrNetwork(configOrNetwork);
    const rawTransaction = await generateRawTransaction({ sender: sender.data, payload: payload as any, aptosConfig, options });
    return new SingleSignerTransactionBuilder({ rawTransaction, aptosConfig, feePayerAddress });
  }

  static async create(args: TransactionBuilderWithSingleSignerArgs): Promise<SingleSignerTransactionBuilder> {
    const builder = await SingleSignerTransactionBuilder.generate(args);
    return builder;
  }

  static async createWithExplicitFeePayer(
    args: TransactionBuilderWithFeePayerArgs,
  ): Promise<SingleSignerTransactionBuilder> {
    const builder = await SingleSignerTransactionBuilder.generate(args);
    return builder;
  }

  static async createWithAnonymousFeePayer(
    args: TransactionBuilderWithSingleSignerArgs,
  ): Promise<SingleSignerTransactionBuilder> {
    const builder = await SingleSignerTransactionBuilder.generate(args);
    return builder;
  }

  /**
   * This function needs to be called twice, once by the sender and once by the fee payer.
   * @param signer the signer of the transaction, either the sender or the fee payer.
   */
  sign(signer: Account): void {
    // default to 0x0
    let feePayerAddressToUse = this.withFeePayer ? this.feePayerAddress : undefined;
    // unless the signer is the fee payer
    if (!signer.accountAddress.equals(this.rawTransaction.sender)) {
      // The fee payer must sign the transaction with themselves as the fee payer,
      // so if the signer is not the sender, then they must be the fee payer.
      // It's possible the fee payer is 0x0, so we need to manually override that
      feePayerAddressToUse = signer.accountAddress;
    }
    console.log(signer);
    console.log(this.rawTransaction.sender);
    console.log(this.rawTransaction.payload);
    console.log(feePayerAddressToUse);
    const inferredSigner = Signer.fromAccount({
      account: signer,
      rawTransaction: this.rawTransaction,
      feePayerAddress: feePayerAddressToUse,
    });
    this.addSignature(inferredSigner);
  }

  // Either this or below for dapp context.
  // This one is less explicit, since it requires you get a `Signer` back from a wallet adapter (or an `AccountAuthenticator` that you create a
  // `Signer` with yourself)
  addSignature(signer: Signer): void {
    if (this.withFeePayer && (signer.accountAddress == this.feePayerAddress || this.feePayerAddress == AccountAddress.ZERO)) {
      this.feePayerSigner = signer;
    } else if (signer.accountAddress.equals(this.rawTransaction.sender)) {
      this.senderSigner = signer;
    } else {
      throw new Error("The signer address does not match either the sender or the fee payer address.");
    }
  }

  async addWalletSignature(signFeePayerTransaction: SignFeePayerTransactionFunction): Promise<void> {
    // the wallet must implement logic to infer if the feepayer needs to be changed from 0x0 or not
    const signer = await signFeePayerTransaction(this.rawTransaction.sender, this.rawTransaction, this.feePayerAddress);
    this.addSignature(signer);
  }

  async submit(): Promise<PendingTransactionResponse> {
    if (this.senderSigner === undefined || (this.withFeePayer && this.feePayerSigner === undefined)) {
      throw new Error("You must sign the transaction before submitting it.");
    }
    const response = await submitTransaction({
      aptosConfig: this.aptosConfig,
      transaction: {
        rawTransaction: this.rawTransaction,
      },
      senderAuthenticator: this.senderSigner.authenticator,
      feePayerAuthenticator: this.withFeePayer ? this.feePayerSigner?.authenticator : undefined,
    });
    this.transactionHash = response.hash;
    return response as PendingTransactionResponse;
  }

  async waitForResponse(waitForTransactionOptions?: WaitForTransactionOptions): Promise<UserTransactionResponse> {
    if (this.transactionHash === undefined) {
      throw new Error("You must submit the transaction before waiting for it.");
    }
    const response = await waitForTransaction({
      transactionHash: this.transactionHash,
      aptosConfig: this.aptosConfig,
      options: waitForTransactionOptions,
    });
    return response as UserTransactionResponse;
  }

  async submitAndWaitForResponse(
    waitForTransactionOptions?: WaitForTransactionOptions,
  ): Promise<UserTransactionResponse> {
    await this.submit();
    const response = await this.waitForResponse(waitForTransactionOptions);
    return response as UserTransactionResponse;
  }

  async signSubmitAndWaitForResponse(args: {
    signer: Account | Signer;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { signer, waitForTransactionOptions } = args;
    if (signer instanceof Account) {
      this.sign(signer);
    } else {
      this.addSignature(signer);
    }
    return this.submitAndWaitForResponse(waitForTransactionOptions);
  }
}
