// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// REST API response types from the Aptos fullnode

// Re-export MoveStructId from transactions to avoid duplication
import type { MoveStructId } from "../transactions/types.js";

export type { MoveStructId } from "../transactions/types.js";

export enum RoleType {
  VALIDATOR = "validator",
  FULL_NODE = "full_node",
}

export type LedgerInfo = {
  chain_id: number;
  epoch: string;
  ledger_version: string;
  oldest_ledger_version: string;
  ledger_timestamp: string;
  node_role: RoleType;
  oldest_block_height: string;
  block_height: string;
  git_hash?: string;
};

export type AccountData = {
  sequence_number: string;
  authentication_key: string;
};

export type MoveResource<T = Record<string, unknown>> = {
  type: MoveStructId;
  data: T;
};

export type MoveModuleBytecode = {
  bytecode: string;
  abi?: MoveModule;
};

export type MoveModule = {
  address: string;
  name: string;
  friends: string[];
  exposed_functions: MoveFunction[];
  structs: MoveStruct[];
};

export type MoveFunction = {
  name: string;
  visibility: string;
  is_entry: boolean;
  is_view: boolean;
  generic_type_params: { constraints: string[] }[];
  params: string[];
  return: string[];
};

export type MoveStruct = {
  name: string;
  is_native: boolean;
  abilities: string[];
  generic_type_params: { constraints: string[] }[];
  fields: { name: string; type: string }[];
};

export type GasEstimation = {
  deprioritized_gas_estimate?: number;
  gas_estimate: number;
  prioritized_gas_estimate?: number;
};

export type Block = {
  block_height: string;
  block_hash: string;
  block_timestamp: string;
  first_version: string;
  last_version: string;
  transactions?: TransactionResponse[];
};

export type TableItemRequest = {
  key_type: string;
  value_type: string;
  key: unknown;
};

// ── Transaction response types ──

export enum TransactionResponseType {
  Pending = "pending_transaction",
  User = "user_transaction",
  Genesis = "genesis_transaction",
  BlockMetadata = "block_metadata_transaction",
  StateCheckpoint = "state_checkpoint_transaction",
  Validator = "validator_transaction",
  BlockEpilogue = "block_epilogue_transaction",
}

export type TransactionResponse = PendingTransactionResponse | CommittedTransactionResponse;

export type CommittedTransactionResponse =
  | UserTransactionResponse
  | GenesisTransactionResponse
  | BlockMetadataTransactionResponse
  | StateCheckpointTransactionResponse
  | ValidatorTransactionResponse
  | BlockEpilogueTransactionResponse;

export type PendingTransactionResponse = {
  type: TransactionResponseType.Pending;
  hash: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: unknown;
  signature?: unknown;
};

export type UserTransactionResponse = {
  type: TransactionResponseType.User;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  changes: unknown[];
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: unknown;
  signature?: unknown;
  events: unknown[];
  timestamp: string;
};

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
  id: string;
  epoch: string;
  round: string;
  events: unknown[];
  previous_block_votes_bitvec: number[];
  proposer: string;
  failed_proposer_indices: number[];
  timestamp: string;
};

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

export type ViewFunctionPayload = {
  function: MoveStructId;
  type_arguments: string[];
  arguments: unknown[];
};

// ── Type guards ──

export function isPendingTransactionResponse(response: TransactionResponse): response is PendingTransactionResponse {
  return response.type === TransactionResponseType.Pending;
}

export function isUserTransactionResponse(response: TransactionResponse): response is UserTransactionResponse {
  return response.type === TransactionResponseType.User;
}
