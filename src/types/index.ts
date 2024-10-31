// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Network } from "../utils/apiEndpoints";
import { OrderBy, TokenStandard } from "./indexer";

export * from "./indexer";

/**
 * Different MIME types used for data interchange in transactions and responses.
 * @group Implementation
 * @category Types
 */
export enum MimeType {
  /**
   * JSON representation, used for transaction submission and accept type JSON output
   * @group Implementation
   * @category Types
   */
  JSON = "application/json",
  /**
   * BCS representation, used for accept type BCS output
   * @group Implementation
   * @category Types
   */
  BCS = "application/x-bcs",
  /**
   * BCS representation, used for transaction submission in BCS input
   * @group Implementation
   * @category Types
   */
  BCS_SIGNED_TRANSACTION = "application/x.aptos.signed_transaction+bcs",
  BCS_VIEW_FUNCTION = "application/x.aptos.view_function+bcs",
}

/**
 * Hexadecimal data input for functions, supporting both string and Uint8Array formats.
 * @group Implementation
 * @category Types
 */
export type HexInput = string | Uint8Array;

/**
 * Variants of type tags used in the system, encompassing various data types and structures.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/language_storage.rs#L27}
 * @group Implementation
 * @category Types
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
 * Variants of script transaction arguments used in Rust, encompassing various data types for transaction processing.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/transaction_argument.rs#L11}
 * @group Implementation
 * @category Types
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
 * The payload for various transaction types in the system.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/mod.rs#L478}
 * @group Implementation
 * @category Types
 */
export enum TransactionPayloadVariants {
  Script = 0,
  EntryFunction = 2,
  Multisig = 3,
}

/**
 * Variants of transactions used in the system.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/mod.rs#L440}
 * @group Implementation
 * @category Types
 */
export enum TransactionVariants {
  MultiAgentTransaction = 0,
  FeePayerTransaction = 1,
}

/**
 * Variants of transaction authenticators used in the system.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs#L44}
 * @group Implementation
 * @category Types
 */
export enum TransactionAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  MultiAgent = 2,
  FeePayer = 3,
  SingleSender = 4,
}

/**
 * Variants of account authenticators used in transactions.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs#L414}
 * @group Implementation
 * @category Types
 */
export enum AccountAuthenticatorVariant {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
}

/**
 * Variants of private keys that can comply with the AIP-80 standard.
 * {@link https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md}
 */
export enum PrivateKeyVariants {
  Ed25519 = "ed25519",
  Secp256k1 = "secp256k1",
}

/**
 * Variants of public keys used in cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum AnyPublicKeyVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Keyless = 3,
  FederatedKeyless = 4,
}

/**
 * Variants of signature types used for cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum AnySignatureVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Keyless = 3,
}

/**
 * Variants of ephemeral public keys used in cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum EphemeralPublicKeyVariant {
  Ed25519 = 0,
}

/**
 * Variants of ephemeral signatures used for secure communication.
 * @group Implementation
 * @category Types
 */
export enum EphemeralSignatureVariant {
  Ed25519 = 0,
}

/**
 * Variants of ephemeral certificates used in secure transactions.
 * @group Implementation
 * @category Types
 */
export enum EphemeralCertificateVariant {
  ZkProof = 0,
}

/**
 * Variants of zero-knowledge proofs used in cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum ZkpVariant {
  Groth16 = 0,
}

/**
 * BCS types
 * @group Implementation
 * @category Types
 */
export type Uint8 = number;

/**
 * A 16-bit unsigned integer.
 * @group Implementation
 * @category Types
 */
export type Uint16 = number;

/**
 * A 32-bit unsigned integer.
 * @group Implementation
 * @category Types
 */
export type Uint32 = number;

/**
 * A 64-bit unsigned integer value.
 * @group Implementation
 * @category Types
 */
export type Uint64 = bigint;

/**
 * A 128-bit unsigned integer used for precise arithmetic operations.
 * @group Implementation
 * @category Types
 */
export type Uint128 = bigint;

/**
 * A 256-bit unsigned integer used for precise numerical calculations.
 * @group Implementation
 * @category Types
 */
export type Uint256 = bigint;

/**
 * A number or a bigint value.
 * @group Implementation
 * @category Types
 */
export type AnyNumber = number | bigint;

/**
 * Configuration options for initializing the SDK, allowing customization of its behavior and interaction with the Aptos network.
 * @group Implementation
 * @category Types
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
 * Defines the parameters for paginating query results, including the starting position and maximum number of items to return.
 * @param offset Specifies the starting position of the query result. Default is 0.
 * @param limit Specifies the maximum number of items to return. Default is 25.
 * @group Implementation
 * @category Types
 */
export interface PaginationArgs {
  offset?: AnyNumber;
  limit?: number;
}

/**
 * Represents the arguments for specifying a token standard.
 *
 * @param tokenStandard - Optional standard of the token.
 * @group Implementation
 * @category Types
 */
export interface TokenStandardArg {
  tokenStandard?: TokenStandard;
}
/**
 * @group Implementation
 * @category Types
 */
export interface OrderByArg<T extends {}> {
  orderBy?: OrderBy<T>;
}
/**
 * @group Implementation
 * @category Types
 */
export interface WhereArg<T extends {}> {
  where?: T;
}

/**
 * QUERY TYPES
 */

/**
 * A configuration object for requests to the server, including API key, extra headers, and cookie handling options.
 * @group Implementation
 * @category Types
 */
export type ClientConfig = ClientHeadersType & {
  WITH_CREDENTIALS?: boolean;
  API_KEY?: string;
};

/**
 * A configuration object for a Fullnode, allowing for the inclusion of extra headers in requests.
 * @group Implementation
 * @category Types
 */
export type FullNodeConfig = ClientHeadersType;

/**
 * An Indexer configuration object for sending requests with additional headers.
 * @group Implementation
 * @category Types
 */
export type IndexerConfig = ClientHeadersType;

/**
 * A configuration object for a faucet, including optional authentication and headers for requests.
 * @group Implementation
 * @category Types
 */
export type FaucetConfig = ClientHeadersType & {
  AUTH_TOKEN?: string;
};

/**
 * General type definition for client headers.
 * @group Implementation
 * @category Types
 */
export type ClientHeadersType = {
  HEADERS?: Record<string, string | number | boolean>;
};

/**
 * Represents a client for making requests to a service provider.
 *
 * @param Req - The type of the request payload.
 * @param Res - The type of the response payload.
 * @group Implementation
 * @category Types
 */
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
/**
 * @group Implementation
 * @category Types
 */
export interface ClientResponse<Res> {
  status: number;
  statusText: string;
  data: Res;
  config?: any;
  request?: any;
  response?: any;
  headers?: any;
}
/**
 * @group Implementation
 * @category Types
 */
export interface Client {
  /**
   * Sends a request to the specified URL with the given options.
   *
   * @param requestOptions - The options for the request.
   * @param requestOptions.url - The URL to send the request to.
   * @param requestOptions.method - The HTTP method to use, either "GET" or "POST".
   * @param requestOptions.path - An optional path to append to the URL.
   * @param requestOptions.body - The body of the request, applicable for POST requests.
   * @param requestOptions.contentType - The content type of the request body.
   * @param requestOptions.acceptType - The expected content type of the response.
   * @param requestOptions.params - Optional parameters to include in the request.
   * @param requestOptions.originMethod - An optional method to specify the origin of the request.
   * @param requestOptions.overrides - Optional configuration overrides for the request.
   * @group Implementation
   * @category Types
   */
  provider<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>>;
}

/**
 * The API request type
 *
 * @param url - the url to make the request to, i.e. https://fullnode.devnet.aptoslabs.com/v1
 * @param method - the request method "GET" | "POST"
 * @param endpoint (optional) - the endpoint to make the request to, i.e. transactions
 * @param body (optional) - the body of the request
 * @param contentType (optional) - the content type to set the `content-type` header to,
 * by default is set to `application/json`
 * @param params (optional) - query params to add to the request
 * @param originMethod (optional) - the local method the request came from
 * @param overrides (optional) - a `ClientConfig` object type to override request data
 * @group Implementation
 * @category Types
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
 * The ledger version of transactions, defaulting to the latest version if not specified.
 * @group Implementation
 * @category Types
 */
export type LedgerVersionArg = {
  ledgerVersion?: AnyNumber;
};

/**
 * RESPONSE TYPES
 * @group Implementation
 * @category Types
 */

/**
 * The output of the estimate gas API, including the deprioritized estimate for the gas unit price.
 * @group Implementation
 * @category Types
 */
export type GasEstimation = {
  /**
   * The deprioritized estimate for the gas unit price
   * @group Implementation
   * @category Types
   */
  deprioritized_gas_estimate?: number;
  /**
   * The current estimate for the gas unit price
   * @group Implementation
   * @category Types
   */
  gas_estimate: number;
  /**
   * The prioritized estimate for the gas unit price
   * @group Implementation
   * @category Types
   */
  prioritized_gas_estimate?: number;
};
/**
 * @group Implementation
 * @category Types
 */
export type MoveResource<T = {}> = {
  type: MoveStructId;
  data: T;
};

/**
 * The data associated with an account, including its sequence number.
 * @group Implementation
 * @category Types
 */
export type AccountData = {
  sequence_number: string;
  authentication_key: string;
};

/**
 * A Move module containing an address.
 * @group Implementation
 * @category Types
 */
export type MoveModuleBytecode = {
  bytecode: string;
  abi?: MoveModule;
};

/**
 * TRANSACTION TYPES
 */

/**
 * Different types of transaction responses that can occur in the system.
 * @group Implementation
 * @category Types
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

/**
 * The response for a transaction, which can be either pending or committed.
 * @group Implementation
 * @category Types
 */
export type TransactionResponse = PendingTransactionResponse | CommittedTransactionResponse;

/**
 * The response for a committed transaction, which can be one of several transaction types.
 * @group Implementation
 * @category Types
 */
export type CommittedTransactionResponse =
  | UserTransactionResponse
  | GenesisTransactionResponse
  | BlockMetadataTransactionResponse
  | StateCheckpointTransactionResponse
  | ValidatorTransactionResponse
  | BlockEpilogueTransactionResponse;

/**
 * Determine if the given transaction response is currently pending.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the transaction is pending.
 * @group Implementation
 * @category Types
 */
export function isPendingTransactionResponse(response: TransactionResponse): response is PendingTransactionResponse {
  return response.type === TransactionResponseType.Pending;
}

/**
 * Determines if the given transaction response is a user transaction.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the transaction is of type User.
 * @group Implementation
 * @category Types
 */
export function isUserTransactionResponse(response: TransactionResponse): response is UserTransactionResponse {
  return response.type === TransactionResponseType.User;
}

/**
 * Determines if the given transaction response is a Genesis transaction.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the transaction is a Genesis transaction.
 * @group Implementation
 * @category Types
 */
export function isGenesisTransactionResponse(response: TransactionResponse): response is GenesisTransactionResponse {
  return response.type === TransactionResponseType.Genesis;
}

/**
 * Determine if the given transaction response is of type BlockMetadata.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the response is a BlockMetadata transaction.
 * @group Implementation
 * @category Types
 */
export function isBlockMetadataTransactionResponse(
  response: TransactionResponse,
): response is BlockMetadataTransactionResponse {
  return response.type === TransactionResponseType.BlockMetadata;
}

/**
 * Determines if the provided transaction response is a state checkpoint transaction.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the transaction response is of type StateCheckpoint.
 * @group Implementation
 * @category Types
 */
export function isStateCheckpointTransactionResponse(
  response: TransactionResponse,
): response is StateCheckpointTransactionResponse {
  return response.type === TransactionResponseType.StateCheckpoint;
}

/**
 * Determine if the given transaction response is of type Validator.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the transaction response is a Validator type.
 * @group Implementation
 * @category Types
 */
export function isValidatorTransactionResponse(
  response: TransactionResponse,
): response is ValidatorTransactionResponse {
  return response.type === TransactionResponseType.Validator;
}

/**
 * Determines if the given transaction response is of the type Block Epilogue.
 *
 * @param response - The transaction response to evaluate.
 * @returns A boolean indicating whether the response is a Block Epilogue transaction.
 * @group Implementation
 * @category Types
 */
export function isBlockEpilogueTransactionResponse(
  response: TransactionResponse,
): response is BlockEpilogueTransactionResponse {
  return response.type === TransactionResponseType.BlockEpilogue;
}

/**
 * The response for a pending transaction, indicating that the transaction is still being processed.
 * @group Implementation
 * @category Types
 */
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

/**
 * The response structure for a user transaction.
 * @group Implementation
 * @category Types
 */
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
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
   * @group Implementation
   * @category Types
   */
  events: Array<Event>;
  timestamp: string;
};

/**
 * The response for a genesis transaction, indicating the type of transaction.
 * @group Implementation
 * @category Types
 */
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
   */
  changes: Array<WriteSetChange>;
  payload: GenesisPayload;
  /**
   * Events emitted during genesis
   * @group Implementation
   * @category Types
   */
  events: Array<Event>;
};

/**
 * The structure representing a blockchain block with its height.
 * @group Implementation
 * @category Types
 */
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
   */
  changes: Array<WriteSetChange>;
  id: string;
  epoch: string;
  round: string;
  /**
   * The events emitted at the block creation
   * @group Implementation
   * @category Types
   */
  events: Array<Event>;
  /**
   * Previous block votes
   * @group Implementation
   * @category Types
   */
  previous_block_votes_bitvec: Array<number>;
  proposer: string;
  /**
   * The indices of the proposers who failed to propose
   * @group Implementation
   * @category Types
   */
  failed_proposer_indices: Array<number>;
  timestamp: string;
};

/**
 * The response for a state checkpoint transaction, indicating the type of transaction.
 * @group Implementation
 * @category Types
 */
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
   */
  changes: Array<WriteSetChange>;
  timestamp: string;
};

/**
 * The response for a validator transaction, indicating the type of transaction.
 * @group Implementation
 * @category Types
 */
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
   */
  changes: Array<WriteSetChange>;
  /**
   * The events emitted by the validator transaction
   * @group Implementation
   * @category Types
   */
  events: Array<Event>;
  timestamp: string;
};

/**
 * Describes the gas state of the block, indicating whether the block gas limit has been reached.
 * @group Implementation
 * @category Types
 */
export type BlockEndInfo = {
  block_gas_limit_reached: boolean;
  block_output_limit_reached: boolean;
  block_effective_block_gas_units: number;
  block_approx_output_size: number;
};

/**
 * A transaction executed at the end of a block that tracks data from the entire block.
 * @group Implementation
 * @category Types
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
   * @group Implementation
   * @category Types
   */
  success: boolean;
  /**
   * The VM status of the transaction, can tell useful information in a failure
   * @group Implementation
   * @category Types
   */
  vm_status: string;
  accumulator_root_hash: string;
  /**
   * Final state of resources changed by the transaction
   * @group Implementation
   * @category Types
   */
  changes: Array<WriteSetChange>;
  timestamp: string;
  block_end_info: BlockEndInfo | null;
};

/**
 * WRITESET CHANGE TYPES
 * @group Implementation
 * @category Types
 */

/**
 * A union type that encompasses both script and direct write sets for data operations.
 * @group Implementation
 * @category Types
 */
export type WriteSetChange =
  | WriteSetChangeDeleteModule
  | WriteSetChangeDeleteResource
  | WriteSetChangeDeleteTableItem
  | WriteSetChangeWriteModule
  | WriteSetChangeWriteResource
  | WriteSetChangeWriteTableItem;

/**
 * The structure for a module deletion change in a write set.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeDeleteModule = {
  type: string;
  address: string;
  /**
   * State key hash
   * @group Implementation
   * @category Types
   */
  state_key_hash: string;
  module: MoveModuleId;
};

/**
 * The payload for a resource deletion in a write set change.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeDeleteResource = {
  type: string;
  address: string;
  state_key_hash: string;
  resource: string;
};

/**
 * The payload for a write set change that deletes a table item.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeDeleteTableItem = {
  type: string;
  state_key_hash: string;
  handle: string;
  key: string;
  data?: DeletedTableData;
};

/**
 * The structure for a write module change in a write set.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeWriteModule = {
  type: string;
  address: string;
  state_key_hash: string;
  data: MoveModuleBytecode;
};

/**
 * The resource associated with a write set change, identified by its type.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeWriteResource = {
  type: string;
  address: string;
  state_key_hash: string;
  data: MoveResource;
};

/**
 * The structure for a write operation on a table in a write set change.
 * @group Implementation
 * @category Types
 */
export type WriteSetChangeWriteTableItem = {
  type: string;
  state_key_hash: string;
  handle: string;
  key: string;
  value: string;
  data?: DecodedTableData;
};

/**
 * The decoded data for a table, including its key in JSON format.
 * @group Implementation
 * @category Types
 */
export type DecodedTableData = {
  /**
   * Key of table in JSON
   * @group Implementation
   * @category Types
   */
  key: any;
  /**
   * Type of key
   * @group Implementation
   * @category Types
   */
  key_type: string;
  /**
   * Value of table in JSON
   * @group Implementation
   * @category Types
   */
  value: any;
  /**
   * Type of value
   * @group Implementation
   * @category Types
   */
  value_type: string;
};

/**
 * Data for a deleted table entry.
 * @group Implementation
 * @category Types
 */
export type DeletedTableData = {
  /**
   * Deleted key
   * @group Implementation
   * @category Types
   */
  key: any;
  /**
   * Deleted key type
   * @group Implementation
   * @category Types
   */
  key_type: string;
};

/**
 * The payload for a transaction response, which can be an entry function, script, or multisig payload.
 * @group Implementation
 * @category Types
 */
export type TransactionPayloadResponse = EntryFunctionPayloadResponse | ScriptPayloadResponse | MultisigPayloadResponse;

/**
 * The response payload for an entry function, containing the type of the entry.
 * @group Implementation
 * @category Types
 */
export type EntryFunctionPayloadResponse = {
  type: string;
  function: MoveFunctionId;
  /**
   * Type arguments of the function
   * @group Implementation
   * @category Types
   */
  type_arguments: Array<string>;
  /**
   * Arguments of the function
   * @group Implementation
   * @category Types
   */
  arguments: Array<any>;
};

/**
 * The payload for a script response, containing the type of the script.
 * @group Implementation
 * @category Types
 */
export type ScriptPayloadResponse = {
  type: string;
  code: MoveScriptBytecode;
  /**
   * Type arguments of the function
   * @group Implementation
   * @category Types
   */
  type_arguments: Array<string>;
  /**
   * Arguments of the function
   * @group Implementation
   * @category Types
   */
  arguments: Array<any>;
};

/**
 * The response payload for a multisig transaction, containing the type of the transaction.
 * @group Implementation
 * @category Types
 */
export type MultisigPayloadResponse = {
  type: string;
  multisig_address: string;
  transaction_payload?: EntryFunctionPayloadResponse;
};

/**
 * The payload for the genesis block containing the type of the payload.
 * @group Implementation
 * @category Types
 */
export type GenesisPayload = {
  type: string;
  write_set: WriteSet;
};

/**
 * The bytecode for a Move script.
 * @group Implementation
 * @category Types
 */
export type MoveScriptBytecode = {
  bytecode: string;
  abi?: MoveFunction;
};

/**
 * JSON representations of transaction signatures returned from the node API.
 * @group Implementation
 * @category Types
 */
export type TransactionSignature =
  | TransactionEd25519Signature
  | TransactionSecp256k1Signature
  | TransactionMultiEd25519Signature
  | TransactionMultiAgentSignature
  | TransactionFeePayerSignature;

/**
 * Determine if the provided signature is an Ed25519 signature.
 * This function checks for the presence of the "signature" property
 * and verifies that its value is "ed25519_signature".
 *
 * @param signature - The transaction signature to be checked.
 * @returns A boolean indicating whether the signature is an Ed25519 signature.
 * @group Implementation
 * @category Types
 */
export function isEd25519Signature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return "signature" in signature && signature.signature === "ed25519_signature";
}

/**
 * Determine if the provided signature is a valid secp256k1 ECDSA signature.
 *
 * @param signature - The transaction signature to validate.
 * @returns A boolean indicating whether the signature is a secp256k1 ECDSA signature.
 * @group Implementation
 * @category Types
 */
export function isSecp256k1Signature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return "signature" in signature && signature.signature === "secp256k1_ecdsa_signature";
}

/**
 * Determine if the provided transaction signature is a multi-agent signature.
 *
 * @param signature - The transaction signature to evaluate.
 * @returns A boolean indicating whether the signature is a multi-agent signature.
 * @group Implementation
 * @category Types
 */
export function isMultiAgentSignature(signature: TransactionSignature): signature is TransactionMultiAgentSignature {
  return signature.type === "multi_agent_signature";
}

/**
 * Determine if the provided signature is a fee payer signature.
 *
 * @param signature - The transaction signature to evaluate.
 * @returns A boolean indicating whether the signature is a fee payer signature.
 * @group Implementation
 * @category Types
 */
export function isFeePayerSignature(signature: TransactionSignature): signature is TransactionFeePayerSignature {
  return signature.type === "fee_payer_signature";
}

/**
 * Determine if the provided signature is of type "multi_ed25519_signature".
 *
 * @param signature - The transaction signature to check.
 * @returns A boolean indicating whether the signature is a multi-ed25519 signature.
 * @group Implementation
 * @category Types
 */
export function isMultiEd25519Signature(
  signature: TransactionSignature,
): signature is TransactionMultiEd25519Signature {
  return signature.type === "multi_ed25519_signature";
}

/**
 * The signature for a transaction using the Ed25519 algorithm.
 * @group Implementation
 * @category Types
 */
export type TransactionEd25519Signature = {
  type: string;
  public_key: string;
  signature: "ed25519_signature";
};

/**
 * The structure for a Secp256k1 signature in a transaction.
 * @group Implementation
 * @category Types
 */
export type TransactionSecp256k1Signature = {
  type: string;
  public_key: string;
  signature: "secp256k1_ecdsa_signature";
};

/**
 * The structure for a multi-signature transaction using Ed25519.
 * @group Implementation
 * @category Types
 */
export type TransactionMultiEd25519Signature = {
  type: "multi_ed25519_signature";
  /**
   * The public keys for the Ed25519 signature
   * @group Implementation
   * @category Types
   */
  public_keys: Array<string>;
  /**
   * Signature associated with the public keys in the same order
   * @group Implementation
   * @category Types
   */
  signatures: Array<string>;
  /**
   * The number of signatures required for a successful transaction
   * @group Implementation
   * @category Types
   */
  threshold: number;
  bitmap: string;
};

/**
 * The structure for a multi-agent signature in a transaction.
 * @group Implementation
 * @category Types
 */
export type TransactionMultiAgentSignature = {
  type: "multi_agent_signature";
  sender: AccountSignature;
  /**
   * The other involved parties' addresses
   * @group Implementation
   * @category Types
   */
  secondary_signer_addresses: Array<string>;
  /**
   * The associated signatures, in the same order as the secondary addresses
   * @group Implementation
   * @category Types
   */
  secondary_signers: Array<AccountSignature>;
};

/**
 * The signature of the fee payer in a transaction.
 * @group Implementation
 * @category Types
 */
export type TransactionFeePayerSignature = {
  type: "fee_payer_signature";
  sender: AccountSignature;
  /**
   * The other involved parties' addresses
   * @group Implementation
   * @category Types
   */
  secondary_signer_addresses: Array<string>;
  /**
   * The associated signatures, in the same order as the secondary addresses
   * @group Implementation
   * @category Types
   */
  secondary_signers: Array<AccountSignature>;
  fee_payer_address: string;
  fee_payer_signer: AccountSignature;
};

/**
 * The union of all single account signatures, including Ed25519, Secp256k1, and MultiEd25519 signatures.
 * @group Implementation
 * @category Types
 */
export type AccountSignature =
  | TransactionEd25519Signature
  | TransactionSecp256k1Signature
  | TransactionMultiEd25519Signature;

/**
 * @group Implementation
 * @category Types
 */
export type WriteSet = ScriptWriteSet | DirectWriteSet;

/**
 * The set of properties for writing scripts, including the type of script.
 * @group Implementation
 * @category Types
 */
export type ScriptWriteSet = {
  type: string;
  execute_as: string;
  script: ScriptPayloadResponse;
};

/**
 * The set of direct write operations, identified by a type string.
 * @group Implementation
 * @category Types
 */
export type DirectWriteSet = {
  type: string;
  changes: Array<WriteSetChange>;
  events: Array<Event>;
};

/**
 * The structure for an event's unique identifier, including its creation number.
 * @group Implementation
 * @category Types
 */

/**
 * The structure for an event, identified by a unique GUID.
 * @group Implementation
 * @category Types
 */
export type EventGuid = {
  creation_number: string;
  account_address: string;
};
/**
 * @group Implementation
 * @category Types
 */
export type Event = {
  guid: EventGuid;
  sequence_number: string;
  type: string;
  /**
   * The JSON representation of the event
   * @group Implementation
   * @category Types
   */
  data: any;
};

/**
 * A number representing a Move uint8 type.
 * @group Implementation
 * @category Types
 */
export type MoveUint8Type = number;

/**
 * A 16-bit unsigned integer used in the Move programming language.
 * @group Implementation
 * @category Types
 */
export type MoveUint16Type = number;

/**
 * A 32-bit unsigned integer type used in Move programming.
 * @group Implementation
 * @category Types
 */
export type MoveUint32Type = number;

/**
 * A string representation of a 64-bit unsigned integer used in Move programming.
 * @group Implementation
 * @category Types
 */
export type MoveUint64Type = string;

/**
 * A string representing a 128-bit unsigned integer in the Move programming language.
 * @group Implementation
 * @category Types
 */
export type MoveUint128Type = string;

/**
 * A string representation of a 256-bit unsigned integer used in Move programming.
 * @group Implementation
 * @category Types
 */
export type MoveUint256Type = string;

/**
 * A string representing a Move address.
 * @group Implementation
 * @category Types
 */
export type MoveAddressType = string;

/**
 * The type for identifying objects to be moved within the system.
 * @group Implementation
 * @category Types
 */
export type MoveObjectType = string;

/**
 * The type for move options, which can be a MoveType, null, or undefined.
 * @group Implementation
 * @category Types
 */
export type MoveOptionType = MoveType | null | undefined;

/**
 * A structure representing a move with a name.
 * @group Implementation
 * @category Types
 */
export type MoveStructId = `${string}::${string}::${string}`;

/**
 * The move function containing its name. Same as MoveStructId since it reads weird to take a StructId for a Function.
 * @group Implementation
 * @category Types
 */
export type MoveFunctionId = MoveStructId;

// TODO: Add support for looking up ABI to add proper typing
/**
 * @group Implementation
 * @category Types
 */
export type MoveStructType = {};

/**
 * A union type that encompasses various data types used in Move, including primitive types, address types, object types, and
 * arrays of MoveType.
 * @group Implementation
 * @category Types
 */
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
 * @group Implementation
 * @category Types
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
 * A string representation of a Move module, formatted as `module_name::function_name`.
 * Module names are case-sensitive.
 * @group Implementation
 * @category Types
 */
export type MoveModuleId = `${string}::${string}`;

/**
 * Specifies the visibility levels for move functions, controlling access permissions.
 * @group Implementation
 * @category Types
 */
export enum MoveFunctionVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  FRIEND = "friend",
}

/**
 * Abilities related to moving items within the system.
 * @group Implementation
 * @category Types
 */
export enum MoveAbility {
  STORE = "store",
  DROP = "drop",
  KEY = "key",
  COPY = "copy",
}

/**
 * Move abilities associated with the generic type parameter of a function.
 * @group Implementation
 * @category Types
 */
export type MoveFunctionGenericTypeParam = {
  constraints: Array<MoveAbility>;
};

/**
 * A field in a Move struct, identified by its name.
 * @group Implementation
 * @category Types
 */
export type MoveStructField = {
  name: string;
  type: string;
};

/**
 * A Move module
 * @group Implementation
 * @category Types
 */
export type MoveModule = {
  address: string;
  name: string;
  /**
   * Friends of the module
   * @group Implementation
   * @category Types
   */
  friends: Array<MoveModuleId>;
  /**
   * Public functions of the module
   * @group Implementation
   * @category Types
   */
  exposed_functions: Array<MoveFunction>;
  /**
   * Structs of the module
   * @group Implementation
   * @category Types
   */
  structs: Array<MoveStruct>;
};

/**
 * A move struct
 * @group Implementation
 * @category Types
 */
export type MoveStruct = {
  name: string;
  /**
   * Whether the struct is a native struct of Move
   * @group Implementation
   * @category Types
   */
  is_native: boolean;
  /**
   * Whether the struct is a module event (aka v2 event). This will be false for v1
   * events because the value is derived from the #[event] attribute on the struct in
   * the Move source code. This attribute is only relevant for v2 events.
   * @group Implementation
   * @category Types
   */
  is_event: boolean;
  /**
   * Abilities associated with the struct
   * @group Implementation
   * @category Types
   */
  abilities: Array<MoveAbility>;
  /**
   * Generic types associated with the struct
   * @group Implementation
   * @category Types
   */
  generic_type_params: Array<MoveFunctionGenericTypeParam>;
  /**
   * Fields associated with the struct
   * @group Implementation
   * @category Types
   */
  fields: Array<MoveStructField>;
};

/**
 * Move function
 * @group Implementation
 * @category Types
 */
export type MoveFunction = {
  name: string;
  visibility: MoveFunctionVisibility;
  /**
   * Whether the function can be called as an entry function directly in a transaction
   * @group Implementation
   * @category Types
   */
  is_entry: boolean;
  /**
   * Whether the function is a view function or not
   * @group Implementation
   * @category Types
   */
  is_view: boolean;
  /**
   * Generic type params associated with the Move function
   * @group Implementation
   * @category Types
   */
  generic_type_params: Array<MoveFunctionGenericTypeParam>;
  /**
   * Parameters associated with the move function
   * @group Implementation
   * @category Types
   */
  params: Array<string>;
  /**
   * Return type of the function
   * @group Implementation
   * @category Types
   */
  return: Array<string>;
};

/**
 * Roles that can be assigned within the system, indicating different levels of access and functionality.
 * @group Implementation
 * @category Types
 */
export enum RoleType {
  VALIDATOR = "validator",
  FULL_NODE = "full_node",
}

/**
 * Information about the current blockchain ledger, including its chain ID.
 * @group Implementation
 * @category Types
 */
export type LedgerInfo = {
  /**
   * Chain ID of the current chain
   * @group Implementation
   * @category Types
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
   * @group Implementation
   * @category Types
   */
  git_hash?: string;
};

/**
 * A Block type
 * @group Implementation
 * @category Types
 */
export type Block = {
  block_height: string;
  block_hash: string;
  block_timestamp: string;
  first_version: string;
  last_version: string;
  /**
   * The transactions in the block in sequential order
   * @group Implementation
   * @category Types
   */
  transactions?: Array<TransactionResponse>;
};

// REQUEST TYPES

/**
 * The request payload for the GetTableItem API.
 * @group Implementation
 * @category Types
 */
export type TableItemRequest = {
  key_type: MoveValue;
  value_type: MoveValue;
  /**
   * The value of the table item's key
   * @group Implementation
   * @category Types
   */
  key: any;
};

/**
 * A list of supported Authentication Key schemes in Aptos, consisting of combinations of signing schemes and derive schemes.
 * @group Implementation
 * @category Types
 */
export type AuthenticationKeyScheme = SigningScheme | DeriveScheme;

/**
 * Different schemes for signing keys used in cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum SigningScheme {
  /**
   * For Ed25519PublicKey
   * @group Implementation
   * @category Types
   */
  Ed25519 = 0,
  /**
   * For MultiEd25519PublicKey
   * @group Implementation
   * @category Types
   */
  MultiEd25519 = 1,
  /**
   * For SingleKey ecdsa
   * @group Implementation
   * @category Types
   */
  SingleKey = 2,

  MultiKey = 3,
}

/**
 * Specifies the signing schemes available for cryptographic operations.
 * @group Implementation
 * @category Types
 */
export enum SigningSchemeInput {
  /**
   * For Ed25519PublicKey
   * @group Implementation
   * @category Types
   */
  Ed25519 = 0,
  /**
   * For Secp256k1Ecdsa
   * @group Implementation
   * @category Types
   */
  Secp256k1Ecdsa = 2,
}

/**
 * Specifies the schemes for deriving account addresses from various data sources.
 * @group Implementation
 * @category Types
 */
export enum DeriveScheme {
  /**
   * Derives an address using an AUID, used for objects
   * @group Implementation
   * @category Types
   */
  DeriveAuid = 251,
  /**
   * Derives an address from another object address
   * @group Implementation
   * @category Types
   */
  DeriveObjectAddressFromObject = 252,
  /**
   * Derives an address from a GUID, used for objects
   * @group Implementation
   * @category Types
   */
  DeriveObjectAddressFromGuid = 253,
  /**
   * Derives an address from seed bytes, used for named objects
   * @group Implementation
   * @category Types
   */
  DeriveObjectAddressFromSeed = 254,
  /**
   * Derives an address from seed bytes, used for resource accounts
   * @group Implementation
   * @category Types
   */
  DeriveResourceAccountAddress = 255,
}

/**
 * Options for configuring the behavior of the waitForTransaction() function.
 * @group Implementation
 * @category Types
 */
export type WaitForTransactionOptions = {
  timeoutSecs?: number;
  checkSuccess?: boolean;
  // Default behavior is to wait for the indexer. Set this to false to disable waiting.
  waitForIndexer?: boolean;
};

/**
 * Input type to generate an account using the Ed25519 signing scheme.
 * @group Implementation
 * @category Types
 */
export type GenerateAccountWithEd25519 = {
  scheme: SigningSchemeInput.Ed25519;
  legacy: boolean;
};

/**
 * Input type to generate an account with a Single Signer using Secp256k1.
 * @group Implementation
 * @category Types
 */
export type GenerateAccountWithSingleSignerSecp256k1Key = {
  scheme: SigningSchemeInput.Secp256k1Ecdsa;
  legacy?: false;
};
/**
 * @group Implementation
 * @category Types
 */
export type GenerateAccount = GenerateAccountWithEd25519 | GenerateAccountWithSingleSignerSecp256k1Key;
