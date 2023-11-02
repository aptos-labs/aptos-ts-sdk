// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { AccountAddress } from "../../../core";
import { Signer } from "../../../core/signer";
import { RawTransaction, RawTransactionWithData, TransactionPayload } from "../../../transactions/instances";
import { Network } from "../../../utils/apiEndpoints";
import { Deserializer } from "../../deserializer";
import { TransactionBuilder } from "./transactionBuilder";

/**
 * For Move entry functions with multiple &signers:
 * public entry fun(signer_1: &signer, signer_2: &signer, ..., signer_n: &signer);
 */
export class MultiSignerTransactionBuilder extends TransactionBuilder {
  public readonly rawTransaction: RawTransaction;
  public readonly rawTransactionWithData: RawTransactionWithData;
  public readonly sender: AccountAddress;
  public readonly secondarySignerAddresses: Array<AccountAddress>; // specified at instantiation, since order matters
  public readonly senderSigner?: Signer;
  public readonly secondarySigners?: Array<Signer>;

  private constructor(args: {
    rawTransaction: RawTransaction;
    sender: AccountAddress;
    secondarySignerAddresses: Array<AccountAddress>;
    senderSigner?: Signer; // you can pass this now or collect it later
    secondarySigners?: Array<Signer>; // you can pass this now or collect it later
  }) {
    super({ ...args });
    const { rawTransaction, sender, secondarySignerAddresses, senderSigner, secondarySigners } = args;
    this.sender = sender;
    this.rawTransaction = rawTransaction;
    this.secondarySigners = secondarySigners;
    this.rawTransactionWithData = deriveTransactionType({
      rawTransaction: this.rawTransaction.bcsToBytes(),
      secondarySignerAddresses: secondarySignerAddresses,
    });
    this.senderSigner = senderSigner;
    this.secondarySignerAddresses = secondarySignerAddresses;
  }
  // this.feePayerAddress = args.feePayerAddress;

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
    options: GenerateTransactionOptions;
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
