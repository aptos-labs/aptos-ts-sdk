// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { MoveObject, MoveOption, MoveString, MoveVector } from "../bcs/serializable/moveStructs";
import { Bool, U128, U16, U256, U32, U64, U8 } from "../bcs/serializable/movePrimitives";
import { FixedBytes } from "../bcs/serializable/fixedBytes";
import { AccountAddress } from "../core";
import { PublicKey } from "../core/crypto/asymmetricCrypto";
import {
  MultiAgentRawTransaction,
  FeePayerRawTransaction,
  RawTransaction,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultisig,
  TransactionPayloadScript,
} from "./instances";
import { HexInput, MoveStructType } from "../types";
import { TypeTag } from "./typeTag/typeTag";

export type EntryFunctionArgumentTypes =
  | Bool
  | U8
  | U16
  | U32
  | U64
  | U128
  | U256
  | AccountAddress
  | MoveObject
  | MoveVector<EntryFunctionArgumentTypes>
  | MoveOption<EntryFunctionArgumentTypes>
  | MoveString
  | FixedBytes;
export type ScriptFunctionArgumentTypes =
  | Bool
  | U8
  | U16
  | U32
  | U64
  | U128
  | U256
  | AccountAddress
  | MoveObject
  | MoveVector<U8>
  | MoveString
  | FixedBytes;

/**
 * Type that holds all raw transaction instances Aptos SDK supports
 */
export type AnyRawTransactionInstance = RawTransaction | MultiAgentRawTransaction | FeePayerRawTransaction;

// TRANSACTION GENERATION TYPES //

/**
 * Optional options to set when generating a transaction
 */
export type GenerateTransactionOptions = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
  expireTimestamp?: string;
  accountSequenceNumber?: string | bigint;
};

/**
 * The generated transaction payload type that was produces from `generateTransactionPayload()` function.
 */
export type TransactionPayload =
  | TransactionPayloadEntryFunction
  | TransactionPayloadScript
  | TransactionPayloadMultisig;

/**
 * Unified type for the data needed to generate a transaction payload of types:
 * Entry Function | Script | Multi Sig
 */
export type GenerateTransactionPayloadData = EntryFunctionData | ScriptData | MultiSigData;

/**
 * The data needed to generate an Entry Function payload
 */
export type EntryFunctionData = {
  function: MoveStructType;
  typeArguments?: Array<TypeTag>;
  arguments: Array<EntryFunctionArgumentTypes>;
};

/**
 * The data needed to generate a Multi Sig payload
 */
export type MultiSigData = {
  multisigAddress: AccountAddress;
} & EntryFunctionData;

/**
 * The data needed to generate a Script payload
 */
export type ScriptData = {
  bytecode: HexInput;
  typeArguments?: Array<TypeTag>;
  arguments: Array<ScriptFunctionArgumentTypes>;
};

/**
 * Interface of the arguments to generate a single signer transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface GenerateSingleSignerRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: TransactionPayload;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
  options?: GenerateTransactionOptions;
}

/**
 * Interface of the arguments to generate a fee payer transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface GenerateFeePayerRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: TransactionPayload;
  feePayerAddress: HexInput;
  secondarySignerAddresses?: HexInput[];
  options?: GenerateTransactionOptions;
}

/**
 * Interface of the arguments to generate a multi agent transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface GenerateMultiAgentRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: TransactionPayload;
  secondarySignerAddresses: HexInput[];
  feePayerAddress?: undefined;
  options?: GenerateTransactionOptions;
}

/**
 * Unified type that holds all the interfaces to generate different transaction types
 */
export type GenerateRawTransactionArgs =
  | GenerateSingleSignerRawTransactionArgs
  | GenerateFeePayerRawTransactionArgs
  | GenerateMultiAgentRawTransactionArgs;

/**
 * Interface that holds the return data when generating a single signer transaction
 *
 * @param rawTransaction a bcs serialized raw transaction
 */
export interface SingleSignerTransaction {
  rawTransaction: Uint8Array;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
}

/**
 * Interface that holds the return data when generating a fee payer transaction
 *
 * @param rawTransaction a bcs serialized raw transaction
 * @param secondarySignerAddresses optional. secondary signer addresses for multi agent transaction
 * @param feePayerAddress fee payer address for a fee payer transaction (aka Sponsored Transaction)
 */
export interface FeePayerTransaction {
  rawTransaction: Uint8Array;
  feePayerAddress: AccountAddress;
  secondarySignerAddresses?: AccountAddress[];
}

/**
 * Interface that holds the return data when generating a multi agent transaction.
 *
 * @param rawTransaction a bcs serialized raw transaction
 * @param secondarySignerAddresses secondary signer addresses for multi agent transaction
 */
export interface MultiAgentTransaction {
  rawTransaction: Uint8Array;
  secondarySignerAddresses: AccountAddress[];
  feePayerAddress?: undefined;
}

/**
 * Unified type that holds all the return interfaces when generating different transaction types
 */
export type AnyRawTransaction = SingleSignerTransaction | FeePayerTransaction | MultiAgentTransaction;

// TRANSACTION SIMULATION TYPES //

export type SimulateTransactionData = {
  /**
   * The transaction to simulate, probably generated by `generateTransaction()`
   */
  transaction: AnyRawTransaction;
  /**
   * For a single signer transaction
   */
  signerPublicKey: PublicKey;
  /**
   * For a fee payer or multi agent transaction that requires additional signers in
   */
  secondarySignersPublicKeys?: Array<PublicKey>;
  /**
   * For a fee payer transaction (aka Sponsored Transaction)
   */
  feePayerPublicKey?: PublicKey;
  options?: SimulateTransactionOptions;
};

export type SimulateTransactionOptions = {
  estimateGasUnitPrice?: boolean;
  estimateMaxGasAmount?: boolean;
  estimatePrioritizedGasUnitPrice?: boolean;
};

// USER INPUT TYPES //

/**
 * Interface that holds the user data input when generating a single signer transaction
 */
export interface GenerateSingleSignerRawTransactionInput {
  sender: HexInput;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
  options?: GenerateTransactionOptions;
  data: GenerateTransactionPayloadData;
}

/**
 * Interface that holds the user data input when generating a fee payer transaction
 */
export interface GenerateFeePayerRawTransactionInput {
  sender: HexInput;
  feePayerAddress: HexInput;
  secondarySignerAddresses?: HexInput[];
  options?: GenerateTransactionOptions;
  data: GenerateTransactionPayloadData;
}

/**
 * Interface that holds the user data input when generating a multi agent transaction
 */
export interface GenerateMultiAgentRawTransactionInput {
  sender: HexInput;
  secondarySignerAddresses: HexInput[];
  feePayerAddress?: undefined;
  options?: GenerateTransactionOptions;
  data: GenerateTransactionPayloadData;
}

/**
 * Unified type that holds all the user data input interfaces when generating different transaction types
 */
export type GenerateTransactionInput =
  | GenerateMultiAgentRawTransactionInput
  | GenerateFeePayerRawTransactionInput
  | GenerateSingleSignerRawTransactionInput;
