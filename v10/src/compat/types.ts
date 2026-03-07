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

export type AptosConfigSettings = {
  network?: import("../core/network.js").Network;
  fullnode?: string;
  faucet?: string;
  pepper?: string;
  prover?: string;
  indexer?: string;
  clientConfig?: import("../client/types.js").ClientConfig;
  fullnodeConfig?: import("../client/types.js").FullNodeConfig;
  indexerConfig?: import("../client/types.js").IndexerConfig;
  faucetConfig?: import("../client/types.js").FaucetConfig;
};

// v6 Account API args
export type GetAccountInfoArgs = { accountAddress: AccountAddressInput };
export type GetAccountModulesArgs = {
  accountAddress: AccountAddressInput;
  options?: { limit?: number; ledgerVersion?: AnyNumber };
};
export type GetAccountModuleArgs = {
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: { ledgerVersion?: AnyNumber };
};
export type GetAccountResourceArgs = {
  accountAddress: AccountAddressInput;
  resourceType: MoveStructId;
  options?: { ledgerVersion?: AnyNumber };
};
export type GetAccountResourcesArgs = {
  accountAddress: AccountAddressInput;
  options?: { limit?: number; ledgerVersion?: AnyNumber };
};
export type GetAccountTransactionsArgs = {
  accountAddress: AccountAddressInput;
  options?: { offset?: AnyNumber; limit?: number };
};

// v6 General API args
export type GetBlockByVersionArgs = {
  ledgerVersion: AnyNumber;
  options?: { withTransactions?: boolean };
};
export type GetBlockByHeightArgs = {
  blockHeight: AnyNumber;
  options?: { withTransactions?: boolean };
};
export type ViewArgs = {
  payload: ViewFunctionPayload;
  options?: { ledgerVersion?: AnyNumber };
};

// v6 Transaction args
export type InputGenerateTransactionOptions = {
  maxGasAmount?: AnyNumber;
  gasUnitPrice?: AnyNumber;
  expireTimestamp?: AnyNumber;
  accountSequenceNumber?: AnyNumber;
};

export type InputGenerateTransactionPayloadData = {
  function: MoveStructId;
  typeArguments?: TypeTag[];
  functionArguments?: EntryFunctionArgument[];
};

export type BuildSimpleArgs = {
  sender: AccountAddressInput;
  data: InputGenerateTransactionPayloadData;
  options?: InputGenerateTransactionOptions;
};

export type SignTransactionArgs = {
  signer: Account;
  transaction: AnyRawTransaction;
};

export type SignAndSubmitArgs = {
  signer: Account;
  transaction: AnyRawTransaction;
};

export type WaitForTransactionArgs = {
  transactionHash: HexInput;
  options?: { timeoutSecs?: number; checkSuccess?: boolean };
};

export type GetTransactionsArgs = {
  options?: { offset?: AnyNumber; limit?: number };
};

export type GetTransactionByHashArgs = {
  transactionHash: HexInput;
};

export type GetTransactionByVersionArgs = {
  ledgerVersion: AnyNumber;
};

export type GetSigningMessageArgs = {
  transaction: AnyRawTransaction;
};

// v6 Faucet args
export type FundAccountArgs = {
  accountAddress: AccountAddressInput;
  amount: number;
  options?: { timeoutSecs?: number; checkSuccess?: boolean };
};

// v6 Coin args
export type TransferCoinArgs = {
  sender: AccountAddressInput;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  coinType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
};

// v6 Table args
export type GetTableItemArgs = {
  handle: string;
  data: TableItemRequest;
  options?: { ledgerVersion?: AnyNumber };
};
