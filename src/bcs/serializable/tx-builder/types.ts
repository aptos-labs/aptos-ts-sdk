// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { AccountAddress } from "../../../core";
import { Signer } from "../../../core/signer";
import { RawTransaction, TransactionPayload } from "../../../transactions/instances";
import { EntryFunctionArgumentTypes, InputGenerateTransactionOptions } from "../../../transactions/types";
import { HexInput } from "../../../types";
import { Network } from "../../../utils/apiEndpoints";

export interface EntryFunctionArgsField {
  [key: string]: EntryFunctionArgumentTypes;
}
// Let's build a flow based around the Dapp itself being the director of this transaction builder pattern.

/**
 * This represents either a RawTransaction or a RawTransactionWithData.
 * It's used to construct an AccountAuthenticator
 * @see AccountAuthenticator
 * @see RawTransaction
 * @see RawTransactionWithData
 */
export interface RawTransactionSigningMessage {
  rawTransaction: RawTransaction;
  secondarySignerAddresses?: Array<AccountAddress>;
  feePayerAddress?: AccountAddress;
}
export type TransactionBuilderInfo = {
  rawTransaction: RawTransaction;
  aptosConfig: AptosConfig;
  sender: AccountAddress;
  payload: TransactionPayload;
  senderSigner?: Signer;
  feePayerAddress?: AccountAddress;
  feePayerSigner?: Signer;
  secondarySignerAddresses?: Array<AccountAddress>;
  secondarySigners?: Array<Signer>;
  transactionHash?: HexInput;
};

export type CreateTransactionBuilderArgs = {
  sender: AccountAddress;
  payload: TransactionPayload;
  configOrNetwork: AptosConfig | Network;
  options?: InputGenerateTransactionOptions;
};

export type CreateTransactionBuilderWithFeePayerArgs = CreateTransactionBuilderArgs & {
  feePayerAddress: AccountAddress;
};

export type SignFeePayerTransactionFunction = (
  sender: AccountAddress,
  rawTransaction: RawTransaction,
  feePayerAddress: AccountAddress,
) => Promise<Signer>;
