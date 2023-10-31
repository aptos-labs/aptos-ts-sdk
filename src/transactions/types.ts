// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { MoveOption, MoveString, MoveVector } from "../bcs/serializable/moveStructs";
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
import { AnyNumber, HexInput, MoveFunctionGenericTypeParam, MoveStructType } from "../types";
import { TypeTag } from "./typeTag";

/**
 * Entry function arguments to be used when building a raw transaction using remote ABI
 */
export type SimpleEntryFunctionArgumentTypes =
  | boolean
  | number
  | bigint
  | string
  | null // To support optional empty
  | undefined // To support optional empty
  | Uint8Array
  | Array<SimpleEntryFunctionArgumentTypes>;

/**
 * Entry function arguments to be used when building a raw transaction using BCS serialized arguments
 */
export type EntryFunctionArgumentTypes =
  | Bool
  | U8
  | U16
  | U32
  | U64
  | U128
  | U256
  | AccountAddress
  | MoveVector<EntryFunctionArgumentTypes>
  | MoveOption<EntryFunctionArgumentTypes>
  | MoveString
  | FixedBytes;

/**
 * Script function arguments to be used when building a raw transaction using BCS serialized arguments
 */
export type ScriptFunctionArgumentTypes =
  | Bool
  | U8
  | U16
  | U32
  | U64
  | U128
  | U256
  | AccountAddress
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
export type InputGenerateTransactionOptions = {
  maxGasAmount?: AnyNumber;
  gasUnitPrice?: AnyNumber;
  expireTimestamp?: AnyNumber;
  accountSequenceNumber?: AnyNumber;
};

/**
 * The generated transaction payload type that was produces from `generateTransactionPayload()` function.
 */
export type AnyTransactionPayloadInstance =
  | TransactionPayloadEntryFunction
  | TransactionPayloadScript
  | TransactionPayloadMultisig;

/**
 * Unified type for the data needed to generate a transaction payload of types:
 * Entry Function | Script | Multi Sig
 */
export type InputGenerateTransactionPayloadData = InputEntryFunctionData | InputScriptData | InputMultiSigData;

export type InputGenerateTransactionPayloadDataWithRemoteABI =
  | (InputScriptData & { aptosConfig?: undefined })
  | InputEntryFunctionDataWithRemoteABI
  | InputMultiSigDataWithRemoteABI;

/**
 * The data needed to generate an Entry Function payload
 */
export type InputEntryFunctionData = {
  function: MoveStructType;
  typeArguments?: Array<TypeTag>;
  functionArguments: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;
};

export type InputEntryFunctionDataWithRemoteABI = InputEntryFunctionData & { aptosConfig: AptosConfig };
/**
 * The data needed to generate a Multi Sig payload
 */
export type InputMultiSigData = {
  multisigAddress: AccountAddress;
} & InputEntryFunctionData;

/**
 * The data needed to generate a Multi Sig payload
 */
export type InputMultiSigDataWithRemoteABI = {
  multisigAddress: AccountAddress | string;
} & InputEntryFunctionDataWithRemoteABI;

/**
 * The data needed to generate a Script payload
 */
export type InputScriptData = {
  bytecode: HexInput;
  typeArguments?: Array<TypeTag>;
  functionArguments: Array<ScriptFunctionArgumentTypes>;
};

/**
 * Interface of an Entry function's ABI.
 *
 * This is used to provide type checking and simple input conversion on ABI based transaction submission.
 */
export type EntryFunctionABI = {
  typeParameters: Array<MoveFunctionGenericTypeParam>;
  parameters: Array<TypeTag>;
};

/**
 * Interface of the arguments to generate a single signer transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface InputGenerateSingleSignerRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: AnyTransactionPayloadInstance;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
  options?: InputGenerateTransactionOptions;
}

/**
 * Interface of the arguments to generate a fee payer transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface InputGenerateFeePayerRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: AnyTransactionPayloadInstance;
  feePayerAddress: HexInput;
  secondarySignerAddresses?: HexInput[];
  options?: InputGenerateTransactionOptions;
}

/**
 * Interface of the arguments to generate a multi-agent transaction.
 * Used to provide to `generateTransaction()` method in the transaction builder flow
 */
export interface InputGenerateMultiAgentRawTransactionArgs {
  aptosConfig: AptosConfig;
  sender: HexInput;
  payload: AnyTransactionPayloadInstance;
  secondarySignerAddresses: HexInput[];
  feePayerAddress?: undefined;
  options?: InputGenerateTransactionOptions;
}

/**
 * Unified type that holds all the interfaces to generate different transaction types
 */
export type InputGenerateRawTransactionArgs =
  | InputGenerateSingleSignerRawTransactionArgs
  | InputGenerateFeePayerRawTransactionArgs
  | InputGenerateMultiAgentRawTransactionArgs;

/**
 * Interface that holds the return data when generating a single signer transaction
 *
 * @param rawTransaction a bcs serialized raw transaction
 */
export interface InputSingleSignerTransaction {
  rawTransaction: Uint8Array;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
}

/**
 * Interface that holds the return data when generating a fee payer transaction
 *
 * @param rawTransaction a bcs serialized raw transaction
 * @param secondarySignerAddresses optional. secondary signer addresses for multi-agent transaction
 * @param feePayerAddress fee payer address for a fee payer transaction (aka Sponsored Transaction)
 */
export interface InputFeePayerTransaction {
  rawTransaction: Uint8Array;
  feePayerAddress: AccountAddress;
  secondarySignerAddresses?: AccountAddress[];
}

/**
 * Interface that holds the return data when generating a multi-agent transaction.
 *
 * @param rawTransaction a bcs serialized raw transaction
 * @param secondarySignerAddresses secondary signer addresses for multi-agent transaction
 */
export interface InputMultiAgentTransaction {
  rawTransaction: Uint8Array;
  secondarySignerAddresses: AccountAddress[];
  feePayerAddress?: undefined;
}

/**
 * Unified type that holds all the return interfaces when generating different transaction types
 */
export type AnyRawTransaction = InputSingleSignerTransaction | InputFeePayerTransaction | InputMultiAgentTransaction;

// TRANSACTION SIMULATION TYPES //

export type InputSimulateTransactionData = {
  /**
   * The transaction to simulate, probably generated by `generateTransaction()`
   */
  transaction: AnyRawTransaction;
  /**
   * For a single signer transaction
   */
  signerPublicKey: PublicKey;
  /**
   * For a fee payer or multi-agent transaction that requires additional signers in
   */
  secondarySignersPublicKeys?: Array<PublicKey>;
  /**
   * For a fee payer transaction (aka Sponsored Transaction)
   */
  feePayerPublicKey?: PublicKey;
  options?: InputSimulateTransactionOptions;
};

export type InputSimulateTransactionOptions = {
  estimateGasUnitPrice?: boolean;
  estimateMaxGasAmount?: boolean;
  estimatePrioritizedGasUnitPrice?: boolean;
};

// USER INPUT TYPES //

/**
 * Interface that holds the user data input when generating a single signer transaction
 */
export interface InputGenerateSingleSignerRawTransactionData {
  sender: HexInput;
  feePayerAddress?: undefined;
  secondarySignerAddresses?: undefined;
  options?: InputGenerateTransactionOptions;
  data: InputGenerateTransactionPayloadData;
}

/**
 * Interface that holds the user data input when generating a fee payer transaction
 */
export interface InputGenerateFeePayerRawTransactionData {
  sender: HexInput;
  feePayerAddress: HexInput;
  secondarySignerAddresses?: HexInput[];
  options?: InputGenerateTransactionOptions;
  data: InputGenerateTransactionPayloadData;
}

/**
 * Interface that holds the user data input when generating a multi-agent transaction
 */
export interface InputGenerateMultiAgentRawTransactionData {
  sender: HexInput;
  secondarySignerAddresses: HexInput[];
  feePayerAddress?: undefined;
  options?: InputGenerateTransactionOptions;
  data: InputGenerateTransactionPayloadData;
}

/**
 * Unified type that holds all the user data input interfaces when generating different transaction types
 */
export type InputGenerateTransactionData =
  | InputGenerateMultiAgentRawTransactionData
  | InputGenerateFeePayerRawTransactionData
  | InputGenerateSingleSignerRawTransactionData;
