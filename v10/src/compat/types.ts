// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// v6-compatible type aliases and parameter shapes
// These map v6's single-object-arg calling convention to v10 types.

import type { Account } from "../account/types.js";
import type { TableItemRequest, ViewFunctionPayload } from "../api/types.js";
import type { AnyNumber, EntryFunctionArgument } from "../bcs/types.js";
import type { AccountAddressInput } from "../core/account-address.js";
import type { TypeTag } from "../core/type-tag.js";
import type { HexInput } from "../hex/index.js";
import type { AnyRawTransaction, MoveStructId } from "../transactions/types.js";

// ── v6 parameter types ──

/**
 * Configuration settings for the v6-compatible {@link Aptos} constructor.
 * Mirrors the shape accepted by `AptosConfig` but uses optional fields
 * that were common in v6.
 */
export type AptosConfigSettings = {
  /** The Aptos network to connect to (e.g. `Network.MAINNET`). */
  network?: import("../core/network.js").Network;
  /** Custom full node URL. Overrides the default URL for the selected network. */
  fullnode?: string;
  /** Custom faucet URL. Overrides the default URL for the selected network. */
  faucet?: string;
  /** Custom pepper service URL for Keyless accounts. */
  pepper?: string;
  /** Custom ZK prover URL for Keyless accounts. */
  prover?: string;
  /** Custom indexer GraphQL URL. Overrides the default URL for the selected network. */
  indexer?: string;
  /** Default client configuration applied to all requests. */
  clientConfig?: import("../client/types.js").ClientConfig;
  /** Default configuration applied to full node requests only. */
  fullnodeConfig?: import("../client/types.js").FullNodeConfig;
  /** Default configuration applied to indexer requests only. */
  indexerConfig?: import("../client/types.js").IndexerConfig;
  /** Default configuration applied to faucet requests only. */
  faucetConfig?: import("../client/types.js").FaucetConfig;
};

// v6 Account API args

/** Arguments for {@link Aptos.getAccountInfo}. */
export type GetAccountInfoArgs = { accountAddress: AccountAddressInput };

/** Arguments for {@link Aptos.getAccountModules}. */
export type GetAccountModulesArgs = {
  accountAddress: AccountAddressInput;
  options?: { limit?: number; ledgerVersion?: AnyNumber };
};

/** Arguments for {@link Aptos.getAccountModule}. */
export type GetAccountModuleArgs = {
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: { ledgerVersion?: AnyNumber };
};

/** Arguments for {@link Aptos.getAccountResource}. */
export type GetAccountResourceArgs = {
  accountAddress: AccountAddressInput;
  resourceType: MoveStructId;
  options?: { ledgerVersion?: AnyNumber };
};

/** Arguments for {@link Aptos.getAccountResources}. */
export type GetAccountResourcesArgs = {
  accountAddress: AccountAddressInput;
  options?: { limit?: number; ledgerVersion?: AnyNumber };
};

/** Arguments for {@link Aptos.getAccountTransactions}. */
export type GetAccountTransactionsArgs = {
  accountAddress: AccountAddressInput;
  options?: { offset?: AnyNumber; limit?: number };
};

// v6 General API args

/** Arguments for {@link Aptos.getBlockByVersion}. */
export type GetBlockByVersionArgs = {
  ledgerVersion: AnyNumber;
  options?: { withTransactions?: boolean };
};

/** Arguments for {@link Aptos.getBlockByHeight}. */
export type GetBlockByHeightArgs = {
  blockHeight: AnyNumber;
  options?: { withTransactions?: boolean };
};

/** Arguments for {@link Aptos.view}. */
export type ViewArgs = {
  payload: ViewFunctionPayload;
  options?: { ledgerVersion?: AnyNumber };
};

// v6 Transaction args

/**
 * Transaction generation options in v6 style.
 * Maps to `BuildSimpleTransactionOptions` in v10, except `accountSequenceNumber`
 * replaces `sequenceNumber`.
 */
export type InputGenerateTransactionOptions = {
  maxGasAmount?: AnyNumber;
  gasUnitPrice?: AnyNumber;
  expireTimestamp?: AnyNumber;
  accountSequenceNumber?: AnyNumber;
};

/**
 * The Move function payload for building a simple transaction, in v6 style.
 */
export type InputGenerateTransactionPayloadData = {
  /** Fully qualified Move function identifier, e.g. `"0x1::coin::transfer"`. */
  function: MoveStructId;
  /** Optional Move type arguments for generic functions. */
  typeArguments?: TypeTag[];
  /** Function arguments as BCS-serializable values. */
  functionArguments?: EntryFunctionArgument[];
};

/** Arguments for {@link CompatBuild.simple} (building a simple transaction in v6 style). */
export type BuildSimpleArgs = {
  sender: AccountAddressInput;
  data: InputGenerateTransactionPayloadData;
  options?: InputGenerateTransactionOptions;
};

/** Arguments for {@link Aptos.signTransaction}. */
export type SignTransactionArgs = {
  signer: Account;
  transaction: AnyRawTransaction;
};

/** Arguments for {@link Aptos.signAndSubmitTransaction}. */
export type SignAndSubmitArgs = {
  signer: Account;
  transaction: AnyRawTransaction;
};

/** Arguments for {@link Aptos.waitForTransaction}. */
export type WaitForTransactionArgs = {
  transactionHash: HexInput;
  options?: { timeoutSecs?: number; checkSuccess?: boolean };
};

/** Arguments for {@link Aptos.getTransactions}. */
export type GetTransactionsArgs = {
  options?: { offset?: AnyNumber; limit?: number };
};

/** Arguments for {@link Aptos.getTransactionByHash}. */
export type GetTransactionByHashArgs = {
  transactionHash: HexInput;
};

/** Arguments for {@link Aptos.getTransactionByVersion}. */
export type GetTransactionByVersionArgs = {
  ledgerVersion: AnyNumber;
};

/** Arguments for {@link Aptos.getSigningMessage}. */
export type GetSigningMessageArgs = {
  transaction: AnyRawTransaction;
};

// v6 Faucet args

/** Arguments for {@link Aptos.fundAccount}. */
export type FundAccountArgs = {
  accountAddress: AccountAddressInput;
  amount: number;
  options?: { timeoutSecs?: number; checkSuccess?: boolean };
};

// v6 Coin args

/** Arguments for {@link Aptos.transferCoinTransaction}. */
export type TransferCoinArgs = {
  sender: AccountAddressInput;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  /** @deprecated The `coinType` parameter is not supported in v10. Passing it has no effect. */
  coinType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
};

// v6 Table args

/** Arguments for {@link Aptos.getTableItem}. */
export type GetTableItemArgs = {
  handle: string;
  data: TableItemRequest;
  options?: { ledgerVersion?: AnyNumber };
};
