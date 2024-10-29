// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Network } from "../utils/apiEndpoints";
import { AptosApiType } from "../utils/const";
import { OrderBy, TokenStandard } from "./indexer";

export * from "./indexer";

export enum MimeType {
  /**
   * JSON representation, used for transaction submission and accept type JSON output
   */
  JSON = "application/json",
  /**
   * BCS representation, used for accept type BCS output
   */
  BCS = "application/x-bcs",
  /**
   * BCS representation, used for transaction submission in BCS input
   */
  BCS_SIGNED_TRANSACTION = "application/x.aptos.signed_transaction+bcs",
  BCS_VIEW_FUNCTION = "application/x.aptos.view_function+bcs",
}

/**
 * Hex data as input to a function
 */
export type HexInput = string | Uint8Array;

/**
 * TypeTag enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/language_storage.rs#L27}
 */
export enum TypeTagVariants {
  Bool = 0,
  U8 = 1,
  U64 = 2,
  U128 = 3,
  Address = 4,
  Signer = 5,
  Vector = 6,
  Struct = 7,
  U16 = 8,
  U32 = 9,
  U256 = 10,
  Reference = 254, // This is specifically a placeholder and does not represent a real type
  Generic = 255, // This is specifically a placeholder and does not represent a real type
}

/**
 * Script transaction arguments enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/transaction_argument.rs#L11}
 */
export enum ScriptTransactionArgumentVariants {
  U8 = 0,
  U64 = 1,
  U128 = 2,
  Address = 3,
  U8Vector = 4,
  Bool = 5,
  U16 = 6,
  U32 = 7,
  U256 = 8,
  Serialized = 9,
}

/**
 * Transaction payload enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/mod.rs#L478}
 */
export enum TransactionPayloadVariants {
  Script = 0,
  EntryFunction = 2,
  Multisig = 3,
}

/**
 * Transaction variants enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/mod.rs#L440}
 */
export enum TransactionVariants {
  MultiAgentTransaction = 0,
  FeePayerTransaction = 1,
}

/**
 * Transaction Authenticator enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs#L44}
 */
export enum TransactionAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  MultiAgent = 2,
  FeePayer = 3,
  SingleSender = 4,
}

/**
 * Transaction Authenticator enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs#L414}
 */
export enum AccountAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
}

export enum AnyPublicKeyVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Keyless = 3,
  FederatedKeyless = 4,
}

export enum AnySignatureVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Keyless = 3,
}

export enum EphemeralPublicKeyVariant {
  Ed25519 = 0,
}

export enum EphemeralSignatureVariant {
  Ed25519 = 0,
}

export enum EphemeralCertificateVariant {
  ZkProof = 0,
}

export enum ZkpVariant {
  Groth16 = 0,
}

/**
 * BCS types
 */
export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint64 = bigint;
export type Uint128 = bigint;
export type Uint256 = bigint;
export type AnyNumber = number | bigint;

/**
 * Set of configuration options that can be provided when initializing the SDK.
 * The purpose of these options is to configure various aspects of the SDK's
 * behavior and interaction with the Aptos network
 */
export type AptosSettings = {
  readonly network?: Network;

  readonly fullnode?: string;

  readonly faucet?: string;

  readonly indexer?: string;

  readonly pepper?: string;

  readonly prover?: string;

  readonly clientConfig?: ClientConfig;

  readonly client?: Client;

  readonly fullnodeConfig?: FullNodeConfig;

  readonly indexerConfig?: IndexerConfig;

  readonly faucetConfig?: FaucetConfig;
};

/**
 *
 * Controls the number of results that are returned and the starting position of those results.
 * @param offset parameter specifies the starting position of the query result within the set of data. Default is 0.
 * @param limit specifies the maximum number of items or records to return in a query result. Default is 25.
 */
export interface PaginationArgs {
  offset?: AnyNumber;
  limit?: number;
}

export interface TokenStandardArg {
  tokenStandard?: TokenStandard;
}

export interface OrderByArg<T extends {}> {
  orderBy?: OrderBy<T>;
}

export interface WhereArg<T extends {}> {
  where?: T;
}

/**
 * QUERY TYPES
 */

/**
 * A configuration object we can pass with the request to the server.
 *
 * @param API_KEY - api key generated from developer portal {@link https://developers.aptoslabs.com/manage/api-keys}}
 * @param HEADERS - extra headers we want to send with the request
 * @param WITH_CREDENTIALS - whether to carry cookies. By default, it is set to true and cookies will be sent
 */
export type ClientConfig = ClientHeadersType & {
  WITH_CREDENTIALS?: boolean;
  API_KEY?: string;
};

/**
 * A Fullnode only configuration object
 *
 * @param HEADERS - extra headers we want to send with the request
 */
export type FullNodeConfig = ClientHeadersType;

/**
 * An Indexer only configuration object
 *
 * @param HEADERS - extra headers we want to send with the request
 */
export type IndexerConfig = ClientHeadersType;

/**
 * A Faucet only configuration object
 *
 * @param HEADERS - extra headers we want to send with the request
 * @param AUTH_TOKEN - an auth token to send with a faucet request
 */
export type FaucetConfig = ClientHeadersType & {
  AUTH_TOKEN?: string;
};

/**
 * General type definition for client HEADERS
 */
export type ClientHeadersType = {
  HEADERS?: Record<string, string | number | boolean>;
};

export interface ClientRequest<Req> {
  url: string;
  method: "GET" | "POST";
  originMethod?: string;
  body?: Req;
  contentType?: string;
  params?: any;
  overrides?: ClientConfig & FullNodeConfig & IndexerConfig & FaucetConfig;
  headers?: Record<string, any>;
}

export interface ClientResponse<Res> {
  status: number;
  statusText: string;
  data: Res;
  config?: any;
  request?: any;
  response?: any;
  headers?: any;
}

export interface Client {
  provider<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>>;
}

/**
 * The API request type
 *
 * @param url - the url to make the request to, i.e https://fullnode.devnet.aptoslabs.com/v1
 * @param method - the request method "GET" | "POST"
 * @param endpoint (optional) - the endpoint to make the request to, i.e transactions
 * @param body (optional) - the body of the request
 * @param contentType (optional) - the content type to set the `content-type` header to,
 * by default is set to `application/json`
 * @param params (optional) - query params to add to the request
 * @param originMethod (optional) - the local method the request came from
 * @param overrides (optional) - a `ClientConfig` object type to override request data
 */
export type AptosRequest = {
  url: string;
  method: "GET" | "POST";
  path?: string;
  body?: any;
  contentType?: string;
  acceptType?: string;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  originMethod?: string;
  overrides?: ClientConfig & FullNodeConfig & IndexerConfig & FaucetConfig;
};

/**
 * Specifies ledger version of transactions. By default latest version will be used
 */
export type LedgerVersionArg = {
  ledgerVersion?: AnyNumber;
};

/**
 * RESPONSE TYPES
 */

/**
 * Type holding the outputs of the estimate gas API
 */
export type GasEstimation = {
  /**
   * The deprioritized estimate for the gas unit price
   */
  deprioritized_gas_estimate?: number;
  /**
   * The current estimate for the gas unit price
   */
  gas_estimate: number;
  /**
   * The prioritized estimate for the gas unit price
   */
  prioritized_gas_estimate?: number;
};

export type MoveResource<T = {}> = {
  type: MoveStructId;
  data: T;
};

export type AccountData = {
  sequence_number: string;
  authentication_key: string;
};

export type MoveModuleBytecode = {
  bytecode: string;
  abi?: MoveModule;
};

/**
 * TRANSACTION TYPES
 */

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

export function isPendingTransactionResponse(response: TransactionResponse): response is PendingTransactionResponse {
  return response.type === TransactionResponseType.Pending;
}

export function isUserTransactionResponse(response: TransactionResponse): response is UserTransactionResponse {
  return response.type === TransactionResponseType.User;
}

export function isGenesisTransactionResponse(response: TransactionResponse): response is GenesisTransactionResponse {
  return response.type === TransactionResponseType.Genesis;
}

export function isBlockMetadataTransactionResponse(
  response: TransactionResponse,
): response is BlockMetadataTransactionResponse {
  return response.type === TransactionResponseType.BlockMetadata;
}

export function isStateCheckpointTransactionResponse(
  response: TransactionResponse,
): response is StateCheckpointTransactionResponse {
  return response.type === TransactionResponseType.StateCheckpoint;
}

export function isValidatorTransactionResponse(
  response: TransactionResponse,
): response is ValidatorTransactionResponse {
  return response.type === TransactionResponseType.Validator;
}

export function isBlockEpilogueTransactionResponse(
  response: TransactionResponse,
): response is BlockEpilogueTransactionResponse {
  return response.type === TransactionResponseType.BlockEpilogue;
}

export type PendingTransactionResponse = {
  type: TransactionResponseType.Pending;
  hash: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: TransactionPayloadResponse;
  signature?: TransactionSignature;
};

export type UserTransactionResponse = {
  type: TransactionResponseType.User;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: TransactionPayloadResponse;
  signature?: TransactionSignature;
  /**
   * Events generated by the transaction
   */
  events: Array<Event>;
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
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  payload: GenesisPayload;
  /**
   * Events emitted during genesis
   */
  events: Array<Event>;
};

export type BlockMetadataTransactionResponse = {
  type: TransactionResponseType.BlockMetadata;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  id: string;
  epoch: string;
  round: string;
  /**
   * The events emitted at the block creation
   */
  events: Array<Event>;
  /**
   * Previous block votes
   */
  previous_block_votes_bitvec: Array<number>;
  proposer: string;
  /**
   * The indices of the proposers who failed to propose
   */
  failed_proposer_indices: Array<number>;
  timestamp: string;
};

export type StateCheckpointTransactionResponse = {
  type: TransactionResponseType.StateCheckpoint;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  timestamp: string;
};

export type ValidatorTransactionResponse = {
  type: TransactionResponseType.Validator;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  /**
   * The events emitted by the validator transaction
   */
  events: Array<Event>;
  timestamp: string;
};

/**
 * BlockEndInfo describes the gas state of the block
 */
export type BlockEndInfo = {
  block_gas_limit_reached: boolean;
  block_output_limit_reached: boolean;
  block_effective_block_gas_units: number;
  block_approx_output_size: number;
};

/**
 * BlockEpilogueTransactionResponse is a transaction that is executed at the end of a block keeping track of data from
 * the whole block
 */
export type BlockEpilogueTransactionResponse = {
  type: TransactionResponseType.BlockEpilogue;
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash: string | null;
  gas_used: string;
  /**
   * Whether the transaction was successful
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   */
  changes: Array<WriteSetChange>;
  timestamp: string;
  block_end_info: BlockEndInfo | null;
};

/**
 * WRITESET CHANGE TYPES
 */

export type WriteSetChange =
  | WriteSetChangeDeleteModule
  | WriteSetChangeDeleteResource
  | WriteSetChangeDeleteTableItem
  | WriteSetChangeWriteModule
  | WriteSetChangeWriteResource
  | WriteSetChangeWriteTableItem;

export type WriteSetChangeDeleteModule = {
  type: string;
  address: string;
  /**
   * State key hash
   */
  state_key_hash: string;
  module: MoveModuleId;
};

export type WriteSetChangeDeleteResource = {
  type: string;
  address: string;
  state_key_hash: string;
  resource: string;
};

export type WriteSetChangeDeleteTableItem = {
  type: string;
  state_key_hash: string;
  handle: string;
  key: string;
  data?: DeletedTableData;
};

export type WriteSetChangeWriteModule = {
  type: string;
  address: string;
  state_key_hash: string;
  data: MoveModuleBytecode;
};

export type WriteSetChangeWriteResource = {
  type: string;
  address: string;
  state_key_hash: string;
  data: MoveResource;
};

export type WriteSetChangeWriteTableItem = {
  type: string;
  state_key_hash: string;
  handle: string;
  key: string;
  value: string;
  data?: DecodedTableData;
};

export type DecodedTableData = {
  /**
   * Key of table in JSON
   */
  key: any;
  /**
   * Type of key
   */
  key_type: string;
  /**
   * Value of table in JSON
   */
  value: any;
  /**
   * Type of value
   */
  value_type: string;
};

/**
 * Deleted table data
 */
export type DeletedTableData = {
  /**
   * Deleted key
   */
  key: any;
  /**
   * Deleted key type
   */
  key_type: string;
};

export type TransactionPayloadResponse = EntryFunctionPayloadResponse | ScriptPayloadResponse | MultisigPayloadResponse;

export type EntryFunctionPayloadResponse = {
  type: string;
  function: MoveFunctionId;
  /**
   * Type arguments of the function
   */
  type_arguments: Array<string>;
  /**
   * Arguments of the function
   */
  arguments: Array<any>;
};

export type ScriptPayloadResponse = {
  type: string;
  code: MoveScriptBytecode;
  /**
   * Type arguments of the function
   */
  type_arguments: Array<string>;
  /**
   * Arguments of the function
   */
  arguments: Array<any>;
};

export type MultisigPayloadResponse = {
  type: string;
  multisig_address: string;
  transaction_payload?: EntryFunctionPayloadResponse;
};

export type GenesisPayload = {
  type: string;
  write_set: WriteSet;
};

/**
 * Move script bytecode
 */
export type MoveScriptBytecode = {
  bytecode: string;
  abi?: MoveFunction;
};

/**
 * These are the JSON representations of transaction signatures returned from the node API.
 */
export type TransactionSignature =
  | TransactionEd25519Signature
  | TransactionSecp256k1Signature
  | TransactionMultiEd25519Signature
  | TransactionMultiAgentSignature
  | TransactionFeePayerSignature;

export function isEd25519Signature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return "signature" in signature && signature.signature === "ed25519_signature";
}

export function isSecp256k1Signature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return "signature" in signature && signature.signature === "secp256k1_ecdsa_signature";
}

export function isMultiAgentSignature(signature: TransactionSignature): signature is TransactionMultiAgentSignature {
  return signature.type === "multi_agent_signature";
}

export function isFeePayerSignature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return signature.type === "fee_payer_signature";
}

export function isMultiEd25519Signature(
  signature: TransactionSignature,
): signature is TransactionMultiEd25519Signature {
  return signature.type === "multi_ed25519_signature";
}

export type TransactionEd25519Signature = {
  type: string;
  public_key: string;
  signature: "ed25519_signature";
};

export type TransactionSecp256k1Signature = {
  type: string;
  public_key: string;
  signature: "secp256k1_ecdsa_signature";
};

export type TransactionMultiEd25519Signature = {
  type: "multi_ed25519_signature";
  /**
   * The public keys for the Ed25519 signature
   */
  public_keys: Array<string>;
  /**
   * Signature associated with the public keys in the same order
   */
  signatures: Array<string>;
  /**
   * The number of signatures required for a successful transaction
   */
  threshold: number;
  bitmap: string;
};

export type TransactionMultiAgentSignature = {
  type: "multi_agent_signature";
  sender: AccountSignature;
  /**
   * The other involved parties' addresses
   */
  secondary_signer_addresses: Array<string>;
  /**
   * The associated signatures, in the same order as the secondary addresses
   */
  secondary_signers: Array<AccountSignature>;
};

export type TransactionFeePayerSignature = {
  type: "fee_payer_signature";
  sender: AccountSignature;
  /**
   * The other involved parties' addresses
   */
  secondary_signer_addresses: Array<string>;
  /**
   * The associated signatures, in the same order as the secondary addresses
   */
  secondary_signers: Array<AccountSignature>;
  fee_payer_address: string;
  fee_payer_signer: AccountSignature;
};

/**
 * The union of all single account signatures.
 */
export type AccountSignature =
  | TransactionEd25519Signature
  | TransactionSecp256k1Signature
  | TransactionMultiEd25519Signature;

export type WriteSet = ScriptWriteSet | DirectWriteSet;

export type ScriptWriteSet = {
  type: string;
  execute_as: string;
  script: ScriptPayloadResponse;
};

export type DirectWriteSet = {
  type: string;
  changes: Array<WriteSetChange>;
  events: Array<Event>;
};

export type EventGuid = {
  creation_number: string;
  account_address: string;
};

export type Event = {
  guid: EventGuid;
  sequence_number: string;
  type: string;
  /**
   * The JSON representation of the event
   */
  data: any;
};

/**
 * Map of Move types to local TypeScript types
 */
export type MoveUint8Type = number;
export type MoveUint16Type = number;
export type MoveUint32Type = number;
export type MoveUint64Type = string;
export type MoveUint128Type = string;
export type MoveUint256Type = string;
export type MoveAddressType = string;
export type MoveObjectType = string;
export type MoveOptionType = MoveType | null | undefined;
/**
 * This is the format for a fully qualified struct, resource, or entry function in Move.
 */
export type MoveStructId = `${string}::${string}::${string}`;
// These are the same, unfortunately, it reads really strangely to take a StructId for a Function and there wasn't a
// good middle ground name.
export type MoveFunctionId = MoveStructId;

// TODO: Add support for looking up ABI to add proper typing
export type MoveStructType = {};

export type MoveType =
  | boolean
  | string
  | MoveUint8Type
  | MoveUint16Type
  | MoveUint32Type
  | MoveUint64Type
  | MoveUint128Type
  | MoveUint256Type
  | MoveAddressType
  | MoveObjectType
  | MoveStructType
  | Array<MoveType>;

/**
 * Possible Move values acceptable by move functions (entry, view)
 *
 * Map of a Move value to the corresponding TypeScript value
 *
 * `Bool -> boolean`
 *
 * `u8, u16, u32 -> number`
 *
 * `u64, u128, u256 -> string`
 *
 * `String -> string`
 *
 * `Address -> 0x${string}`
 *
 * `Struct - 0x${string}::${string}::${string}`
 *
 * `Object -> 0x${string}`
 *
 * `Vector -> Array<MoveValue>`
 *
 * `Option -> MoveValue | null | undefined`
 */
export type MoveValue =
  | boolean
  | string
  | MoveUint8Type
  | MoveUint16Type
  | MoveUint32Type
  | MoveUint64Type
  | MoveUint128Type
  | MoveUint256Type
  | MoveAddressType
  | MoveObjectType
  | MoveStructId
  | MoveOptionType
  | Array<MoveValue>;

/**
 * Move module id is a string representation of Move module.
 * Module name is case-sensitive.
 */
export type MoveModuleId = `${string}::${string}`;

/**
 * Move function visibility
 */
export enum MoveFunctionVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  FRIEND = "friend",
}

/**
 * Move function ability
 */
export enum MoveAbility {
  STORE = "store",
  DROP = "drop",
  KEY = "key",
  COPY = "copy",
}

/**
 * Move abilities tied to the generic type param and associated with the function that uses it
 */
export type MoveFunctionGenericTypeParam = {
  constraints: Array<MoveAbility>;
};

/**
 * Move struct field
 */
export type MoveStructField = {
  name: string;
  type: string;
};

/**
 * A Move module
 */
export type MoveModule = {
  address: string;
  name: string;
  /**
   * Friends of the module
   */
  friends: Array<MoveModuleId>;
  /**
   * Public functions of the module
   */
  exposed_functions: Array<MoveFunction>;
  /**
   * Structs of the module
   */
  structs: Array<MoveStruct>;
};

/**
 * A move struct
 */
export type MoveStruct = {
  name: string;
  /**
   * Whether the struct is a native struct of Move
   */
  is_native: boolean;
  /**
   * Whether the struct is a module event (aka v2 event). This will be false for v1
   * events because the value is derived from the #[event] attribute on the struct in
   * the Move source code. This attribute is only relevant for v2 events.
   */
  is_event: boolean;
  /**
   * Abilities associated with the struct
   */
  abilities: Array<MoveAbility>;
  /**
   * Generic types associated with the struct
   */
  generic_type_params: Array<MoveFunctionGenericTypeParam>;
  /**
   * Fields associated with the struct
   */
  fields: Array<MoveStructField>;
};

/**
 * Move function
 */
export type MoveFunction = {
  name: string;
  visibility: MoveFunctionVisibility;
  /**
   * Whether the function can be called as an entry function directly in a transaction
   */
  is_entry: boolean;
  /**
   * Whether the function is a view function or not
   */
  is_view: boolean;
  /**
   * Generic type params associated with the Move function
   */
  generic_type_params: Array<MoveFunctionGenericTypeParam>;
  /**
   * Parameters associated with the move function
   */
  params: Array<string>;
  /**
   * Return type of the function
   */
  return: Array<string>;
};

export enum RoleType {
  VALIDATOR = "validator",
  FULL_NODE = "full_node",
}

export type LedgerInfo = {
  /**
   * Chain ID of the current chain
   */
  chain_id: number;
  epoch: string;
  ledger_version: string;
  oldest_ledger_version: string;
  ledger_timestamp: string;
  node_role: RoleType;
  oldest_block_height: string;
  block_height: string;
  /**
   * Git hash of the build of the API endpoint.  Can be used to determine the exact
   * software version used by the API endpoint.
   */
  git_hash?: string;
};

/**
 * A Block type
 */
export type Block = {
  block_height: string;
  block_hash: string;
  block_timestamp: string;
  first_version: string;
  last_version: string;
  /**
   * The transactions in the block in sequential order
   */
  transactions?: Array<TransactionResponse>;
};

// REQUEST TYPES

/**
 * Table Item request for the GetTableItem API
 */
export type TableItemRequest = {
  key_type: MoveValue;
  value_type: MoveValue;
  /**
   * The value of the table item's key
   */
  key: any;
};

/**
 * A list of Authentication Key schemes that are supported by Aptos.
 *
 * They are combinations of signing schemes and derive schemes.
 */
export type AuthenticationKeyScheme = SigningScheme | DeriveScheme;

export enum SigningScheme {
  /**
   * For Ed25519PublicKey
   */
  Ed25519 = 0,
  /**
   * For MultiEd25519PublicKey
   */
  MultiEd25519 = 1,
  /**
   * For SingleKey ecdsa
   */
  SingleKey = 2,

  MultiKey = 3,
}

export enum SigningSchemeInput {
  /**
   * For Ed25519PublicKey
   */
  Ed25519 = 0,
  /**
   * For Secp256k1Ecdsa
   */
  Secp256k1Ecdsa = 2,
}

/**
 * Scheme used for deriving account addresses from other data
 */
export enum DeriveScheme {
  /**
   * Derives an address using an AUID, used for objects
   */
  DeriveAuid = 251,
  /**
   * Derives an address from another object address
   */
  DeriveObjectAddressFromObject = 252,
  /**
   * Derives an address from a GUID, used for objects
   */
  DeriveObjectAddressFromGuid = 253,
  /**
   * Derives an address from seed bytes, used for named objects
   */
  DeriveObjectAddressFromSeed = 254,
  /**
   * Derives an address from seed bytes, used for resource accounts
   */
  DeriveResourceAccountAddress = 255,
}

/**
 * Option properties to pass for waitForTransaction() function
 */
export type WaitForTransactionOptions = {
  timeoutSecs?: number;
  checkSuccess?: boolean;
  // Default behavior is to wait for the indexer. Set this to false to disable waiting.
  waitForIndexer?: boolean;
};

/**
 * Input type to generate an account using Single Signer
 * Ed25519 or Legacy Ed25519
 */
export type GenerateAccountWithEd25519 = {
  scheme: SigningSchemeInput.Ed25519;
  legacy: boolean;
};

/**
 * Input type to generate an account using Single Signer
 * Secp256k1
 */
export type GenerateAccountWithSingleSignerSecp256k1Key = {
  scheme: SigningSchemeInput.Secp256k1Ecdsa;
  legacy?: false;
};

export type GenerateAccount = GenerateAccountWithEd25519 | GenerateAccountWithSingleSignerSecp256k1Key;

export enum KeylessErrorCategory {
  API_ERROR,
  SESSION_EXPIRED,
  INVALID_STATE,
  UNKNOWN,
}

export enum KeylessErrorResolutionTip {
  REAUTHENTICATE = "Re-authentiate to continue using your keyless account",
  // eslint-disable-next-line max-len
  REAUTHENTICATE_UNSURE = "Try re-authentiating. If the error persists join the telegram group at https://t.me/+h5CN-W35yUFiYzkx for further support",
  UPDATE_REQUEST_PARAMS = "Update the invalid request parameters and reauthenticate.",
  // eslint-disable-next-line max-len
  RATE_LIMIT_EXCEEDED = "Cache the keyless account and reuse it to avoid making too many requests.  Keyless accounts are valid until either the EphemeralKeyPair expires, when the JWK is rotated, or when the proof verifying key is changed, whichever comes soonest.",
  // eslint-disable-next-line max-len
  SERVER_ERROR = "Try again later.  See aptosApiError error for more context. For additional support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  // eslint-disable-next-line max-len
  CALL_PRECHECK = "Call `await account.checkKeylessAccountValidity()` to wait for asyncronous changes and check for account validity before signing or serializing.",
  REINSTANTIATE = "Try instantiating the account again.  Avoid manipulating the account object directly",
  JOIN_SUPPORT_GROUP = "For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
  UNKNOWN = "Error unknown. For support join the telegram group at https://t.me/+h5CN-W35yUFiYzkx",
}

export enum KeylessErrorType {
  EPHEMERAL_KEY_PAIR_EXPIRED,

  PROOF_NOT_FOUND,

  ASYNC_PROOF_FETCH_FAILED,

  INVALID_PROOF_VERIFICATION_FAILED,

  INVALID_PROOF_VERIFICATION_KEY_NOT_FOUND,

  INVALID_JWT_SIG,

  INVALID_JWT_JWK_NOT_FOUND,

  INVALID_JWT_ISS_NOT_RECOGNIZED,

  INVALID_JWT_FEDERATED_ISS_NOT_SUPPORTED,

  INVALID_TW_SIG_VERIFICATION_FAILED,

  INVALID_TW_SIG_PUBLIC_KEY_NOT_FOUND,

  INVALID_EXPIRY_HORIZON,

  JWT_PARSING_ERROR,

  JWK_FETCH_FAILED,

  RATE_LIMIT_EXCEEDED,

  PEPPER_SERVICE_INTERNAL_ERROR,

  PEPPER_SERVICE_BAD_REQUEST,

  PEPPER_SERVICE_OTHER,

  PROVER_SERVICE_INTERNAL_ERROR,

  PROVER_SERVICE_BAD_REQUEST,

  PROVER_SERVICE_OTHER,

  UNKNOWN,
}

const KeylessErrors: { [key in KeylessErrorType]: [string, KeylessErrorCategory, KeylessErrorResolutionTip] } = {
  [KeylessErrorType.EPHEMERAL_KEY_PAIR_EXPIRED]: [
    "The ephemeral keypair has expired.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.PROOF_NOT_FOUND]: [
    "The required proof could not be found.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.CALL_PRECHECK,
  ],
  [KeylessErrorType.ASYNC_PROOF_FETCH_FAILED]: [
    "The required proof failed to fetch.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_PROOF_VERIFICATION_FAILED]: [
    "The provided proof is invalid.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_PROOF_VERIFICATION_KEY_NOT_FOUND]: [
    "The verification key used to authenticate was updated.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_JWT_SIG]: [
    "The JWK was found, but JWT failed verification",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_JWT_JWK_NOT_FOUND]: [
    "The JWK required to verify the JWT could not be found. The JWK may have been rotated out.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_JWT_ISS_NOT_RECOGNIZED]: [
    "The JWT issuer is not recognized.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.INVALID_JWT_FEDERATED_ISS_NOT_SUPPORTED]: [
    "The JWT issuer is not supported by the Federated Keyless ",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_TW_SIG_VERIFICATION_FAILED]: [
    "The training wheels signature is invalid.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REAUTHENTICATE_UNSURE,
  ],
  [KeylessErrorType.INVALID_TW_SIG_PUBLIC_KEY_NOT_FOUND]: [
    "The public key used to verify the training wheels signature was not found.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.INVALID_EXPIRY_HORIZON]: [
    "The expiry horizon is invalid.",
    KeylessErrorCategory.SESSION_EXPIRED,
    KeylessErrorResolutionTip.REAUTHENTICATE,
  ],
  [KeylessErrorType.JWK_FETCH_FAILED]: [
    "Failed to fetch JWKS.",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.JOIN_SUPPORT_GROUP,
  ],
  [KeylessErrorType.RATE_LIMIT_EXCEEDED]: [
    "Rate limit exceeded. Too many requests in a short period.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.RATE_LIMIT_EXCEEDED,
  ],
  [KeylessErrorType.PEPPER_SERVICE_INTERNAL_ERROR]: [
    "Internal error from Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PEPPER_SERVICE_BAD_REQUEST]: [
    "Bad request sent to Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.PEPPER_SERVICE_OTHER]: [
    "Unknown error from Pepper service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PROVER_SERVICE_INTERNAL_ERROR]: [
    "Internal error from Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.PROVER_SERVICE_BAD_REQUEST]: [
    "Bad request sent to Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.UPDATE_REQUEST_PARAMS,
  ],
  [KeylessErrorType.PROVER_SERVICE_OTHER]: [
    "Unknown error from Prover service.",
    KeylessErrorCategory.API_ERROR,
    KeylessErrorResolutionTip.SERVER_ERROR,
  ],
  [KeylessErrorType.JWT_PARSING_ERROR]: [
    "Error when parsing JWT. This should never happen. Join https://t.me/+h5CN-W35yUFiYzkx for support",
    KeylessErrorCategory.INVALID_STATE,
    KeylessErrorResolutionTip.REINSTANTIATE,
  ],
  [KeylessErrorType.UNKNOWN]: [
    "An unknown error has occurred.",
    KeylessErrorCategory.UNKNOWN,
    KeylessErrorResolutionTip.UNKNOWN,
  ],
};

export class KeylessError extends Error {
  readonly aptosApiError?: AptosApiError;

  readonly category: KeylessErrorCategory;

  readonly resolutionTip: KeylessErrorResolutionTip;

  readonly type: KeylessErrorType;

  /** @internal this constructor is for sdk internal use - do not instantiate outside of the SDK codebase */
  constructor(args: {
    aptosApiError?: AptosApiError;
    category: KeylessErrorCategory;
    resolutionTip: KeylessErrorResolutionTip;
    type: KeylessErrorType;
    message?: string;
    details?: string;
  }) {
    const { aptosApiError, category, resolutionTip, type, details } = args;
    const error = KeylessErrors[type];
    super(error[0]);
    this.name = "KeylessError";
    this.aptosApiError = aptosApiError;
    this.category = category;
    this.resolutionTip = resolutionTip;
    this.type = type;
    this.message = details ?? "";
  }

  /**
   * Static constructor that creates a KeylessError instance using the KeylessErrors constant
   * @param args.type The type of KeylessError
   * @param args.aptosApiError optional AptosApiError supplied for api errors
   * @param args.details optional details to include in the error message
   * @returns A new KeylessError instance
   */
  static fromErrorType(args: {
    type: KeylessErrorType;
    aptosApiError?: AptosApiError;
    details?: string;
  }): KeylessError {
    const { aptosApiError, type, details } = args;

    const [message, category, resolutionTip] = KeylessErrors[type];
    return new KeylessError({
      message,
      details,
      aptosApiError,
      category,
      resolutionTip,
      type,
    });
  }
}

/**
 * The API response type
 *
 * @param status - the response status. i.e. 200
 * @param statusText - the response message
 * @param data the response data
 * @param url the url the request was made to
 * @param headers the response headers
 * @param config (optional) - the request object
 * @param request (optional) - the request object
 */
export interface AptosResponse<Req, Res> {
  status: number;
  statusText: string;
  data: Res;
  url: string;
  headers: any;
  config?: any;
  request?: Req;
}

type AptosApiErrorOpts = {
  apiType: AptosApiType;
  aptosRequest: AptosRequest;
  aptosResponse: AptosResponse<any, any>;
};

/**
 * The type returned from an API error
 *
 * @param name - the error name "AptosApiError"
 * @param url the url the request was made to
 * @param status - the response status. i.e. 400
 * @param statusText - the response message
 * @param data the response data
 * @param request - the AptosRequest
 */
export class AptosApiError extends Error {
  readonly url: string;

  readonly status: number;

  readonly statusText: string;

  readonly data: any;

  readonly request: AptosRequest;

  /** @internal this constructor is for sdk internal use - do not instantiate outside of the SDK codebase */
  constructor({ apiType, aptosRequest, aptosResponse }: AptosApiErrorOpts) {
    super(deriveErrorMessage({ apiType, aptosRequest, aptosResponse }));

    this.name = "AptosApiError";
    this.url = aptosResponse.url;
    this.status = aptosResponse.status;
    this.statusText = aptosResponse.statusText;
    this.data = aptosResponse.data;
    this.request = aptosRequest;
  }
}

function deriveErrorMessage({ apiType, aptosRequest, aptosResponse }: AptosApiErrorOpts): string {
  // extract the W3C trace_id from the response headers if it exists. Some services set this in the response and it's useful for debugging.
  // See https://www.w3.org/TR/trace-context/#relationship-between-the-headers .
  const traceId = aptosResponse.headers?.traceparent?.split("-")[1];
  const traceIdString = traceId ? `(trace_id:${traceId}) ` : "";

  const errorPrelude: string = `Request to [${apiType}]: ${aptosRequest.method} ${
    aptosResponse.url ?? aptosRequest.url
  } ${traceIdString}failed with`;

  // handle graphql responses from indexer api and extract the error message of the first error
  if (apiType === AptosApiType.INDEXER && aptosResponse.data?.errors?.[0]?.message != null) {
    return `${errorPrelude}: ${aptosResponse.data.errors[0].message}`;
  }

  // Received well-known structured error response body - simply serialize and return it.
  // We don't need http status codes etc. in this case.
  if (aptosResponse.data?.message != null && aptosResponse.data?.error_code != null) {
    return `${errorPrelude}: ${JSON.stringify(aptosResponse.data)}`;
  }

  // This is the generic/catch-all case. We received some response from the API but it doesn't appear to be a well-known structure.
  // We print http status codes and the response body (after some trimming),
  // in the hope that this gives enough context what went wrong without printing overly huge messages.
  return `${errorPrelude} status: ${aptosResponse.statusText}(code:${
    aptosResponse.status
  }) and response body: ${serializeAnyPayloadForErrorMessage(aptosResponse.data)}`;
}

const SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH = 400;

// this function accepts a payload of any type (probably an object) and serializes it to a string
// Since we don't know the type or size of the payload and we don't want to add a huge object in full to the error message
// we limit the to the first 200 and last 200 characters of the serialized payload and put a "..." in the middle.
function serializeAnyPayloadForErrorMessage(payload: any): string {
  const serializedPayload = JSON.stringify(payload);
  if (serializedPayload.length <= SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH) {
    return serializedPayload;
  }
  return `truncated(original_size:${serializedPayload.length}): ${serializedPayload.slice(
    0,
    SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH / 2,
  )}...${serializedPayload.slice(-SERIALIZED_PAYLOAD_TRIM_TO_MAX_LENGTH / 2)}`;
}
