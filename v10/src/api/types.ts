// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// REST API response types from the Aptos fullnode

// Re-export MoveStructId from transactions to avoid duplication
import type { MoveStructId } from "../transactions/types.js";

export type { MoveStructId } from "../transactions/types.js";

/** The role a node plays in the Aptos network. */
export enum RoleType {
  /** A validator node that participates in consensus. */
  VALIDATOR = "validator",
  /** A full node that serves API requests but does not participate in consensus. */
  FULL_NODE = "full_node",
}

/** Information about the current state of the blockchain ledger, returned by the fullnode API. */
export type LedgerInfo = {
  /** The chain ID identifying this Aptos network (e.g. 1 for mainnet, 2 for testnet). */
  chain_id: number;
  /** The current epoch number as a string. */
  epoch: string;
  /** The latest ledger version (transaction height) as a string. */
  ledger_version: string;
  /** The oldest available ledger version as a string. */
  oldest_ledger_version: string;
  /** The timestamp of the latest committed transaction in microseconds as a string. */
  ledger_timestamp: string;
  /** The role of this node (validator or full_node). */
  node_role: RoleType;
  /** The oldest available block height as a string. */
  oldest_block_height: string;
  /** The latest block height as a string. */
  block_height: string;
  /** The git hash of the node binary, if available. */
  git_hash?: string;
};

/** Core on-chain data for an Aptos account. */
export type AccountData = {
  /** The next sequence number for transactions from this account. */
  sequence_number: string;
  /** The authentication key associated with this account. */
  authentication_key: string;
};

/**
 * A Move resource stored under an account, consisting of its struct type and data payload.
 * @typeParam T - The shape of the resource data. Defaults to `Record<string, unknown>`.
 */
export type MoveResource<T = Record<string, unknown>> = {
  /** The fully qualified Move struct type (e.g. `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`). */
  type: MoveStructId;
  /** The deserialized resource data. */
  data: T;
};

/** A published Move module, containing its bytecode and optional ABI. */
export type MoveModuleBytecode = {
  /** The hex-encoded bytecode of the module. */
  bytecode: string;
  /** The ABI (application binary interface) of the module, if available. */
  abi?: MoveModule;
};

/** The ABI of a Move module, describing its address, name, functions, and structs. */
export type MoveModule = {
  /** The address where the module is published. */
  address: string;
  /** The name of the module. */
  name: string;
  /** List of friend modules that have access to this module's private functions. */
  friends: string[];
  /** The functions exposed by this module. */
  exposed_functions: MoveFunction[];
  /** The structs defined in this module. */
  structs: MoveStruct[];
};

/** Description of a function defined in a Move module. */
export type MoveFunction = {
  /** The function name. */
  name: string;
  /** The visibility level (e.g. "public", "private", "friend"). */
  visibility: string;
  /** Whether this function is an entry function that can be called directly in transactions. */
  is_entry: boolean;
  /** Whether this function is a view function that can be called without submitting a transaction. */
  is_view: boolean;
  /** Generic type parameter constraints for this function. */
  generic_type_params: { constraints: string[] }[];
  /** The parameter types as Move type strings. */
  params: string[];
  /** The return types as Move type strings. */
  return: string[];
};

/** Description of a struct defined in a Move module. */
export type MoveStruct = {
  /** The struct name. */
  name: string;
  /** Whether this struct is a native (built-in) type. */
  is_native: boolean;
  /** The abilities this struct possesses (e.g. "copy", "drop", "store", "key"). */
  abilities: string[];
  /** Generic type parameter constraints for this struct. */
  generic_type_params: { constraints: string[] }[];
  /** The fields of the struct with their names and types. */
  fields: { name: string; type: string }[];
};

/** Gas price estimation returned by the fullnode, providing low/median/high estimates. */
export type GasEstimation = {
  /** The estimated gas unit price for deprioritized (low-priority) transactions. */
  deprioritized_gas_estimate?: number;
  /** The estimated gas unit price for normal-priority transactions. */
  gas_estimate: number;
  /** The estimated gas unit price for prioritized (high-priority) transactions. */
  prioritized_gas_estimate?: number;
};

/** A block on the Aptos blockchain, containing metadata and optionally its transactions. */
export type Block = {
  /** The height of this block as a string. */
  block_height: string;
  /** The hash of this block. */
  block_hash: string;
  /** The timestamp when this block was committed in microseconds as a string. */
  block_timestamp: string;
  /** The first transaction version included in this block. */
  first_version: string;
  /** The last transaction version included in this block. */
  last_version: string;
  /** The transactions in this block, if requested. */
  transactions?: TransactionResponse[];
};

/** The request body for querying a table item by key. */
export type TableItemRequest = {
  /** The Move type of the table key (e.g. `"address"`, `"u64"`). */
  key_type: string;
  /** The Move type of the table value. */
  value_type: string;
  /** The key to look up in the table. */
  key: unknown;
};

// ── Transaction response types ──

/** Discriminant values for the different transaction response types returned by the API. */
export enum TransactionResponseType {
  /** A transaction that has been submitted but not yet committed. */
  Pending = "pending_transaction",
  /** A user-submitted transaction that has been committed. */
  User = "user_transaction",
  /** The genesis transaction that initialized the blockchain. */
  Genesis = "genesis_transaction",
  /** A block metadata transaction inserted at the start of each block. */
  BlockMetadata = "block_metadata_transaction",
  /** A state checkpoint transaction. */
  StateCheckpoint = "state_checkpoint_transaction",
  /** A validator-specific transaction. */
  Validator = "validator_transaction",
  /** A block epilogue transaction inserted at the end of each block. */
  BlockEpilogue = "block_epilogue_transaction",
}

/** Union of all possible transaction response types (pending or committed). */
export type TransactionResponse = PendingTransactionResponse | CommittedTransactionResponse;

/** Union of all committed (finalized) transaction response types. */
export type CommittedTransactionResponse =
  | UserTransactionResponse
  | GenesisTransactionResponse
  | BlockMetadataTransactionResponse
  | StateCheckpointTransactionResponse
  | ValidatorTransactionResponse
  | BlockEpilogueTransactionResponse;

/** A transaction that has been submitted to the mempool but not yet committed to the ledger. */
export type PendingTransactionResponse = {
  type: TransactionResponseType.Pending;
  /** The transaction hash. */
  hash: string;
  /** The sender's account address. */
  sender: string;
  /** The sender's sequence number for this transaction. */
  sequence_number: string;
  /** The maximum gas amount the sender is willing to pay. */
  max_gas_amount: string;
  /** The gas unit price in Octas. */
  gas_unit_price: string;
  /** The transaction expiration timestamp in seconds since the Unix epoch. */
  expiration_timestamp_secs: string;
  /** The transaction payload. */
  payload: unknown;
  /** The transaction signature, if present. */
  signature?: unknown;
};

/** A user-submitted transaction that has been committed to the ledger. */
export type UserTransactionResponse = {
  type: TransactionResponseType.User;
  /** The ledger version at which this transaction was committed. */
  version: string;
  /** The transaction hash. */
  hash: string;
  /** Hash of the state changes produced by this transaction. */
  state_change_hash: string;
  /** Root hash of the event accumulator. */
  event_root_hash: string;
  /** Hash of the state checkpoint, if applicable. */
  state_checkpoint_hash: string | null;
  /** The actual gas consumed by this transaction. */
  gas_used: string;
  /** Whether the transaction executed successfully. */
  success: boolean;
  /** The VM status or error message. */
  vm_status: string;
  /** Root hash of the transaction accumulator. */
  accumulator_root_hash: string;
  /** The state changes (write set) produced by this transaction. */
  changes: unknown[];
  /** The sender's account address. */
  sender: string;
  /** The sender's sequence number for this transaction. */
  sequence_number: string;
  /** The maximum gas amount the sender was willing to pay. */
  max_gas_amount: string;
  /** The gas unit price in Octas. */
  gas_unit_price: string;
  /** The transaction expiration timestamp in seconds since the Unix epoch. */
  expiration_timestamp_secs: string;
  /** The transaction payload. */
  payload: unknown;
  /** The transaction signature, if present. */
  signature?: unknown;
  /** The events emitted by this transaction. */
  events: unknown[];
  /** The timestamp when this transaction was committed in microseconds. */
  timestamp: string;
};

/** The genesis transaction that initialized the blockchain state. */
export type GenesisTransactionResponse = {
  type: TransactionResponseType.Genesis;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  payload: unknown;
  events: unknown[];
};

/** A block metadata transaction inserted by validators at the beginning of each block. */
export type BlockMetadataTransactionResponse = {
  type: TransactionResponseType.BlockMetadata;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  /** The unique ID of this block metadata transaction. */
  id: string;
  /** The epoch number. */
  epoch: string;
  /** The round number within the epoch. */
  round: string;
  events: unknown[];
  /** Bitvec of which validators voted for the previous block. */
  previous_block_votes_bitvec: number[];
  /** The address of the validator that proposed this block. */
  proposer: string;
  /** Indices of validators that failed to propose. */
  failed_proposer_indices: number[];
  timestamp: string;
};

/** A state checkpoint transaction that records a snapshot of the ledger state. */
export type StateCheckpointTransactionResponse = {
  type: TransactionResponseType.StateCheckpoint;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  timestamp: string;
};

/** A validator-specific transaction (e.g. stake operations). */
export type ValidatorTransactionResponse = {
  type: TransactionResponseType.Validator;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  events: unknown[];
  timestamp: string;
};

/** A block epilogue transaction inserted at the end of each block. */
export type BlockEpilogueTransactionResponse = {
  type: TransactionResponseType.BlockEpilogue;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  timestamp: string;
};

// ── View function types ──

/** The payload for calling a Move view function on-chain without submitting a transaction. */
export type ViewFunctionPayload = {
  /** The fully qualified function name (e.g. `"0x1::coin::balance"`). */
  function: MoveStructId;
  /** The type arguments for the function call, as Move type strings. */
  type_arguments: string[];
  /** The arguments to pass to the function. */
  arguments: unknown[];
};

// ── Type guards ──

/**
 * Checks whether a transaction response represents a pending (not yet committed) transaction.
 * @param response - The transaction response to check.
 * @returns `true` if the response is a {@link PendingTransactionResponse}.
 */
export function isPendingTransactionResponse(response: TransactionResponse): response is PendingTransactionResponse {
  return response.type === TransactionResponseType.Pending;
}

/**
 * Checks whether a transaction response represents a committed user transaction.
 * @param response - The transaction response to check.
 * @returns `true` if the response is a {@link UserTransactionResponse}.
 */
export function isUserTransactionResponse(response: TransactionResponse): response is UserTransactionResponse {
  return response.type === TransactionResponseType.User;
}
