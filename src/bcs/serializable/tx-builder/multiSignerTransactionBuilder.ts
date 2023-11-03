// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { AccountAddress } from "../../../core";
import { Signer } from "../../../core/signer";
import { InputGenerateTransactionOptions, generateRawTransaction } from "../../../transactions";
import { RawTransaction, RawTransactionWithData, TransactionPayload } from "../../../transactions/instances";
import { HexInput } from "../../../types";
import { Network } from "../../../utils/apiEndpoints";
import { Deserializer } from "../../deserializer";
import { getConfigOrNetwork } from "./helper";
import { CreateWithSecondarySigners, TransactionBuilder } from "./transactionBuilder";
import { TransactionBuilderArgs, TransactionBuilderInfo, TransactionBuilderWithFeePayerAndSecondarySignersArgs, TransactionBuilderWithSecondarySignersArgs } from "./types";

/**
 * For Move entry functions with multiple &signers:
 * public entry fun(signer_1: &signer, signer_2: &signer, ..., signer_n: &signer);
 */
export class MultiSignerTransactionBuilder extends TransactionBuilder implements CreateWithSecondarySigners {
  protected senderSigner?: Signer;
  private secondarySignerAddresses: Array<AccountAddress>; // specified at instantiation, since order matters
  private secondarySigners?: Array<Signer>;
  private feePayerAddress: AccountAddress = AccountAddress.ZERO;
  private feePayerSigner?: Signer;
  private transactionHash?: HexInput;

  protected constructor(args: {
    rawTransaction: RawTransaction;
    aptosConfig: AptosConfig;
    feePayerAddress?: AccountAddress;
    secondarySignerAddresses: Array<AccountAddress>;,
  }) {
    super(args);
    const { feePayerAddress, secondarySignerAddresses } = args;
    this.feePayerAddress = feePayerAddress ?? AccountAddress.ZERO;
    this.secondarySignerAddresses = secondarySignerAddresses;
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
      secondarySignerAddresses: this.secondarySignerAddresses,
      secondarySigners: this.secondarySigners,
      transactionHash: this.transactionHash,
    };
  }

  private static async generate(
    args: TransactionBuilderArgs,
  ): Promise<MultiSignerTransactionBuilder> {
    const { sender, payload, configOrNetwork, options, feePayerAddress, secondarySignerAddresses } = args;
    const aptosConfig = getConfigOrNetwork(configOrNetwork);
    const rawTransaction = await generateRawTransaction({ sender: sender.data, payload: payload as any, aptosConfig, options });
    return new MultiSignerTransactionBuilder({ rawTransaction, aptosConfig, feePayerAddress, secondarySignerAddresses });
  }

  static async createWithFeePayer(args: TransactionBuilderWithSecondarySignersArgs): Promise<MultiSignerTransactionBuilder> {
    
  }
  static async createWithAnonymousFeePayer(args: TransactionBuilderWithFeePayerAndSecondarySignersArgs): Promise<MultiSignerTransactionBuilder> {
    
  }



  /**
   * Largely the same as @see generateRawTransaction, this function mainly serves to simplify the process by storing the raw transaction in the class fields.
   *
   * The main difference is that we require *all* of the information up front and store it, that way the developer doesn't have to worry about
   * the rest of the transaction builder flow.
   *
   * Ideally, this function is wrapped and called solely by auto-generated code that determines how many secondary signers are possibly for a given function, given its abi inputs.
   *
   * NOTE: The `sender` address passed in will be the first `&signer` in the Move function signature.
   * If there are any secondary `&signer` arguements, their order is determined by the order of the secondary signer addresses input here.
   * @param args.sender The address of the account that will appear as the first `&signer` in the Move function signature
   * @param args.secondarySignerAddresses The addresses of the accounts that will appear as the secondary `&signer` arguments in the Move function signature
   * @param args.feePayerAddress The address of the account that will pay the transaction fee, if unspecified, this will be `0x0`
   * @param args.payload The transaction payload
   * @param args.aptosConfigOrNetwork The AptosConfig or Network that will be used to generate the transaction
   * @param args.options The options that will be used to generate the transaction
   */
  static async create(args: {
    sender: AccountAddress;
    secondarySignerAddresses: Array<AccountAddress>;
    feePayerAddress?: AccountAddress;
    payload: TransactionPayload;
    aptosConfigOrNetwork: AptosConfig | Network;
    options: InputGenerateTransactionOptions;
  }): Promise<TransactionBuilder> {
    const { sender, payload, aptosConfigOrNetwork, options } = args;
    const aptosConfig = getConfigOrNetwork(aptosConfigOrNetwork);
    const transaction = await buildTransaction({ sender: sender.toString(), payload, aptosConfig, options });
    const deserializer = new Deserializer(transaction.rawTransaction);
    const derivedRawTransaction = deriveTransactionType(transaction);
    const signingMessage = await getSigningMessage(derivedRawTransaction);
    const rawTransaction = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = args.secondarySignerAddresses;
    const feePayerAddress = args.feePayerAddress;
    const signingMessage = signingMessage;

    return new MultiSignerTransactionBuilder({
      rawTransaction,
      sender,
      signingMessage,
      secondarySignerAddresses,
      feePayerAddress,
    });
  }
}
