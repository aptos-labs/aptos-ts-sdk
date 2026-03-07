// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// v6-compatible Aptos class that provides flat mixin-style methods
// delegating to v10's namespaced API functions.

import * as accountFns from "../api/account.js";
import * as coinFns from "../api/coin.js";
import { AptosConfig, type AptosSettings } from "../api/config.js";
import * as faucetFns from "../api/faucet.js";
import * as generalFns from "../api/general.js";
import { Aptos as V10Aptos } from "../api/index.js";
import * as tableFns from "../api/table.js";
import * as transactionFns from "../api/transaction.js";
import type {
  AccountData,
  Block,
  CommittedTransactionResponse,
  GasEstimation,
  LedgerInfo,
  MoveModuleBytecode,
  MoveResource,
  PendingTransactionResponse,
  TransactionResponse,
  UserTransactionResponse,
} from "../api/types.js";
import type { AccountAuthenticator } from "../transactions/authenticator.js";
import type { SimpleTransaction } from "../transactions/simple-transaction.js";

import type {
  BuildSimpleArgs,
  FundAccountArgs,
  GetAccountInfoArgs,
  GetAccountModuleArgs,
  GetAccountModulesArgs,
  GetAccountResourceArgs,
  GetAccountResourcesArgs,
  GetAccountTransactionsArgs,
  GetBlockByHeightArgs,
  GetBlockByVersionArgs,
  GetSigningMessageArgs,
  GetTableItemArgs,
  GetTransactionByHashArgs,
  GetTransactionByVersionArgs,
  GetTransactionsArgs,
  SignAndSubmitArgs,
  SignTransactionArgs,
  TransferCoinArgs,
  ViewArgs,
  WaitForTransactionArgs,
} from "./types.js";

// ── v6-compatible Build sub-object ──

class CompatBuild {
  constructor(private config: AptosConfig) {}

  async simple(args: BuildSimpleArgs): Promise<SimpleTransaction> {
    return transactionFns.buildSimpleTransaction(
      this.config,
      args.sender,
      {
        function: args.data.function,
        typeArguments: args.data.typeArguments,
        functionArguments: args.data.functionArguments,
      },
      args.options
        ? {
            maxGasAmount: args.options.maxGasAmount,
            gasUnitPrice: args.options.gasUnitPrice,
            expireTimestamp: args.options.expireTimestamp,
            sequenceNumber: args.options.accountSequenceNumber,
          }
        : undefined,
    );
  }
}

// ── v6-compatible Aptos class ──

/**
 * @deprecated Use `Aptos` from `@aptos-labs/ts-sdk` (v10 native API) instead.
 * This compat class provides v6-style flat methods for gradual migration.
 */
export class Aptos extends V10Aptos {
  // Override transaction to provide v6-compatible build sub-object
  declare readonly transaction: V10Aptos["transaction"] & {
    build: CompatBuild;
  };

  constructor(config?: AptosConfig | AptosSettings) {
    super(config instanceof AptosConfig ? config : config);

    // Attach the compat Build sub-object to the existing transaction namespace
    const compatBuild = new CompatBuild(this.config);
    Object.defineProperty(this.transaction, "build", {
      value: compatBuild,
      writable: false,
      enumerable: true,
    });
  }

  // ── General API (flat) ──

  getLedgerInfo(): Promise<LedgerInfo> {
    return generalFns.getLedgerInfo(this.config);
  }

  getChainId(): Promise<number> {
    return generalFns.getChainId(this.config);
  }

  getBlockByVersion(args: GetBlockByVersionArgs): Promise<Block> {
    return generalFns.getBlockByVersion(this.config, args.ledgerVersion, args.options);
  }

  getBlockByHeight(args: GetBlockByHeightArgs): Promise<Block> {
    return generalFns.getBlockByHeight(this.config, args.blockHeight, args.options);
  }

  view<T extends unknown[] = unknown[]>(args: ViewArgs): Promise<T> {
    return generalFns.view<T>(this.config, args.payload, args.options);
  }

  getGasPriceEstimation(): Promise<GasEstimation> {
    return generalFns.getGasPriceEstimation(this.config);
  }

  // ── Account API (flat) ──

  getAccountInfo(args: GetAccountInfoArgs): Promise<AccountData> {
    return accountFns.getAccountInfo(this.config, args.accountAddress);
  }

  getAccountModules(args: GetAccountModulesArgs): Promise<MoveModuleBytecode[]> {
    return accountFns.getAccountModules(this.config, args.accountAddress, args.options);
  }

  getAccountModule(args: GetAccountModuleArgs): Promise<MoveModuleBytecode> {
    return accountFns.getAccountModule(this.config, args.accountAddress, args.moduleName, args.options);
  }

  getAccountResource<T = unknown>(args: GetAccountResourceArgs): Promise<T> {
    return accountFns.getAccountResource<T>(this.config, args.accountAddress, args.resourceType, args.options);
  }

  getAccountResources(args: GetAccountResourcesArgs): Promise<MoveResource[]> {
    return accountFns.getAccountResources(this.config, args.accountAddress, args.options);
  }

  getAccountTransactions(args: GetAccountTransactionsArgs): Promise<CommittedTransactionResponse[]> {
    return accountFns.getAccountTransactions(this.config, args.accountAddress, args.options);
  }

  // ── Transaction API (flat) ──

  signTransaction(args: SignTransactionArgs): AccountAuthenticator {
    return transactionFns.signTransaction(args.signer, args.transaction);
  }

  signAndSubmitTransaction(args: SignAndSubmitArgs): Promise<PendingTransactionResponse> {
    return transactionFns.signAndSubmitTransaction(this.config, args.signer, args.transaction);
  }

  waitForTransaction(args: WaitForTransactionArgs): Promise<CommittedTransactionResponse> {
    return transactionFns.waitForTransaction(this.config, args.transactionHash, args.options);
  }

  getTransactions(args?: GetTransactionsArgs): Promise<TransactionResponse[]> {
    return transactionFns.getTransactions(this.config, args?.options);
  }

  getTransactionByHash(args: GetTransactionByHashArgs): Promise<TransactionResponse> {
    return transactionFns.getTransactionByHash(this.config, args.transactionHash);
  }

  getTransactionByVersion(args: GetTransactionByVersionArgs): Promise<TransactionResponse> {
    return transactionFns.getTransactionByVersion(this.config, args.ledgerVersion);
  }

  getSigningMessage(args: GetSigningMessageArgs): Promise<Uint8Array> {
    return transactionFns.getSigningMessage(args.transaction);
  }

  // ── Faucet API (flat) ──

  fundAccount(args: FundAccountArgs): Promise<UserTransactionResponse> {
    return faucetFns.fundAccount(this.config, args.accountAddress, args.amount, args.options);
  }

  // ── Coin API (flat) ──

  transferCoinTransaction(args: TransferCoinArgs): Promise<SimpleTransaction> {
    const options = args.options
      ? {
          maxGasAmount: args.options.maxGasAmount,
          gasUnitPrice: args.options.gasUnitPrice,
          expireTimestamp: args.options.expireTimestamp,
          sequenceNumber: args.options.accountSequenceNumber,
        }
      : undefined;
    return coinFns.transferCoinTransaction(
      this.config,
      args.sender,
      args.recipient,
      args.amount,
      args.coinType,
      options,
    );
  }

  // ── Table API (flat) ──

  getTableItem<T = unknown>(args: GetTableItemArgs): Promise<T> {
    return tableFns.getTableItem<T>(this.config, args.handle, args.data, args.options);
  }
}
