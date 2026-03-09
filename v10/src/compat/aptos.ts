// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// v6-compatible Aptos class that provides flat mixin-style methods
// delegating to v10's namespaced API functions.

import * as accountFns from "../api/account.js";
import * as coinFns from "../api/coin.js";
import type { AptosConfig, AptosSettings } from "../api/config.js";
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

  /**
   * Builds a simple entry function transaction using v6-style argument shape.
   * Delegates to {@link transactionFns.buildSimpleTransaction}.
   *
   * @param args - The v6-style build arguments containing `sender`, `data`, and optional `options`.
   * @returns A promise that resolves to a {@link SimpleTransaction}.
   */
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
 * A v6-compatible `Aptos` class that exposes flat (non-namespaced) methods
 * for gradual migration from the v6 SDK to the v10 namespaced API.
 *
 * Extends the v10 {@link V10Aptos} class and adds:
 * - Flat methods equivalent to `aptos.account.*`, `aptos.transaction.*`, etc.
 * - A v6-style `transaction.build.simple(args)` sub-object.
 *
 * Import from `@aptos-labs/ts-sdk/compat` to use:
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk/compat";
 *
 * const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
 *
 * // v6-style flat call
 * const info = await aptos.getAccountInfo({ accountAddress: "0x1" });
 *
 * // v6-style transaction build
 * const txn = await aptos.transaction.build.simple({
 *   sender: "0x1",
 *   data: { function: "0x1::coin::transfer", functionArguments: [...] },
 * });
 * ```
 *
 * @deprecated Use `Aptos` from `@aptos-labs/ts-sdk` (v10 native API) instead.
 * This compat class is provided for gradual migration only.
 */
export class Aptos extends V10Aptos {
  // Override transaction to provide v6-compatible build sub-object
  declare readonly transaction: V10Aptos["transaction"] & {
    build: CompatBuild;
  };

  /**
   * @param config - An `AptosConfig` instance or `AptosSettings` object.
   *   If omitted, defaults to `Network.DEVNET`.
   */
  constructor(config?: AptosConfig | AptosSettings) {
    super(config);

    // Attach the compat Build sub-object to the existing transaction namespace
    const compatBuild = new CompatBuild(this.config);
    Object.defineProperty(this.transaction, "build", {
      value: compatBuild,
      writable: false,
      enumerable: true,
    });
  }

  // ── General API (flat) ──

  /**
   * Fetches the current ledger information (chain ID, block height, epoch, etc.).
   * @returns A promise resolving to the current {@link LedgerInfo}.
   */
  getLedgerInfo(): Promise<LedgerInfo> {
    return generalFns.getLedgerInfo(this.config);
  }

  /**
   * Fetches the chain ID for the configured network.
   * @returns A promise resolving to the numeric chain ID.
   */
  getChainId(): Promise<number> {
    return generalFns.getChainId(this.config);
  }

  /**
   * Fetches a block by its ledger version.
   * @param args - Contains `ledgerVersion` and optional `options.withTransactions`.
   * @returns A promise resolving to the {@link Block} at the given ledger version.
   */
  getBlockByVersion(args: GetBlockByVersionArgs): Promise<Block> {
    return generalFns.getBlockByVersion(this.config, args.ledgerVersion, args.options);
  }

  /**
   * Fetches a block by its block height.
   * @param args - Contains `blockHeight` and optional `options.withTransactions`.
   * @returns A promise resolving to the {@link Block} at the given height.
   */
  getBlockByHeight(args: GetBlockByHeightArgs): Promise<Block> {
    return generalFns.getBlockByHeight(this.config, args.blockHeight, args.options);
  }

  /**
   * Executes a Move view function and returns the result.
   * @typeParam T - The expected return type of the view function.
   * @param args - Contains the view function `payload` and optional `options.ledgerVersion`.
   * @returns A promise resolving to the view function's return values.
   */
  view<T extends unknown[] = unknown[]>(args: ViewArgs): Promise<T> {
    return generalFns.view<T>(this.config, args.payload, args.options);
  }

  /**
   * Fetches the current gas price estimate from the full node.
   * @returns A promise resolving to a {@link GasEstimation} object.
   */
  getGasPriceEstimation(): Promise<GasEstimation> {
    return generalFns.getGasPriceEstimation(this.config);
  }

  // ── Account API (flat) ──

  /**
   * Fetches account information (sequence number, authentication key) for a given address.
   * @param args - Contains `accountAddress`.
   * @returns A promise resolving to {@link AccountData}.
   */
  getAccountInfo(args: GetAccountInfoArgs): Promise<AccountData> {
    return accountFns.getAccountInfo(this.config, args.accountAddress);
  }

  /**
   * Fetches all published Move modules for an account.
   * @param args - Contains `accountAddress` and optional `options` (limit, ledgerVersion).
   * @returns A promise resolving to an array of {@link MoveModuleBytecode}.
   */
  getAccountModules(args: GetAccountModulesArgs): Promise<MoveModuleBytecode[]> {
    return accountFns.getAccountModules(this.config, args.accountAddress, args.options);
  }

  /**
   * Fetches a specific published Move module for an account.
   * @param args - Contains `accountAddress`, `moduleName`, and optional `options.ledgerVersion`.
   * @returns A promise resolving to a {@link MoveModuleBytecode}.
   */
  getAccountModule(args: GetAccountModuleArgs): Promise<MoveModuleBytecode> {
    return accountFns.getAccountModule(this.config, args.accountAddress, args.moduleName, args.options);
  }

  /**
   * Fetches a specific Move resource from an account, typed as `T`.
   * @typeParam T - The expected resource data type. Defaults to `unknown`.
   * @param args - Contains `accountAddress`, `resourceType`, and optional `options.ledgerVersion`.
   * @returns A promise resolving to the resource data typed as `T`.
   */
  getAccountResource<T = unknown>(args: GetAccountResourceArgs): Promise<T> {
    return accountFns.getAccountResource<T>(this.config, args.accountAddress, args.resourceType, args.options);
  }

  /**
   * Fetches all Move resources stored on an account.
   * @param args - Contains `accountAddress` and optional `options` (limit, ledgerVersion).
   * @returns A promise resolving to an array of {@link MoveResource}.
   */
  getAccountResources(args: GetAccountResourcesArgs): Promise<MoveResource[]> {
    return accountFns.getAccountResources(this.config, args.accountAddress, args.options);
  }

  /**
   * Fetches the list of committed transactions sent by an account.
   * @param args - Contains `accountAddress` and optional `options` (offset, limit).
   * @returns A promise resolving to an array of {@link CommittedTransactionResponse}.
   */
  getAccountTransactions(args: GetAccountTransactionsArgs): Promise<CommittedTransactionResponse[]> {
    return accountFns.getAccountTransactions(this.config, args.accountAddress, args.options);
  }

  // ── Transaction API (flat) ──

  /**
   * Signs a raw transaction with the given signer's private key.
   * @param args - Contains `signer` (Account) and `transaction` (raw transaction).
   * @returns An {@link AccountAuthenticator} containing the signature.
   */
  signTransaction(args: SignTransactionArgs): AccountAuthenticator {
    return transactionFns.signTransaction(args.signer, args.transaction);
  }

  /**
   * Signs a transaction and submits it to the network in a single step.
   * @param args - Contains `signer` and `transaction`.
   * @returns A promise resolving to a {@link PendingTransactionResponse} with the transaction hash.
   */
  signAndSubmitTransaction(args: SignAndSubmitArgs): Promise<PendingTransactionResponse> {
    return transactionFns.signAndSubmitTransaction(this.config, args.signer, args.transaction);
  }

  /**
   * Waits for a transaction to be committed on-chain.
   * @param args - Contains `transactionHash` and optional `options` (timeoutSecs, checkSuccess).
   * @returns A promise resolving to the {@link CommittedTransactionResponse} when committed.
   * @throws If the transaction is not committed within the timeout, or if `checkSuccess` is
   *   `true` and the transaction failed on-chain.
   */
  waitForTransaction(args: WaitForTransactionArgs): Promise<CommittedTransactionResponse> {
    return transactionFns.waitForTransaction(this.config, args.transactionHash, args.options);
  }

  /**
   * Fetches recent transactions from the ledger.
   * @param args - Optional arguments containing `options` (offset, limit).
   * @returns A promise resolving to an array of {@link TransactionResponse}.
   */
  getTransactions(args?: GetTransactionsArgs): Promise<TransactionResponse[]> {
    return transactionFns.getTransactions(this.config, args?.options);
  }

  /**
   * Fetches a transaction by its hash.
   * @param args - Contains `transactionHash`.
   * @returns A promise resolving to a {@link TransactionResponse}.
   */
  getTransactionByHash(args: GetTransactionByHashArgs): Promise<TransactionResponse> {
    return transactionFns.getTransactionByHash(this.config, args.transactionHash);
  }

  /**
   * Fetches a transaction by its ledger version.
   * @param args - Contains `ledgerVersion`.
   * @returns A promise resolving to a {@link TransactionResponse}.
   */
  getTransactionByVersion(args: GetTransactionByVersionArgs): Promise<TransactionResponse> {
    return transactionFns.getTransactionByVersion(this.config, args.ledgerVersion);
  }

  /**
   * Returns the bytes that a signer must sign for a given raw transaction.
   * @param args - Contains `transaction` (the raw transaction to get the signing message for).
   * @returns A `Uint8Array` of the signing message bytes.
   */
  getSigningMessage(args: GetSigningMessageArgs): Uint8Array {
    return transactionFns.getSigningMessage(args.transaction);
  }

  // ── Faucet API (flat) ──

  /**
   * Funds a test account with APT from the configured faucet.
   * Only available on devnet and testnet.
   * @param args - Contains `accountAddress`, `amount` (in Octas), and optional `options`.
   * @returns A promise resolving to the {@link UserTransactionResponse} of the funding transaction.
   */
  fundAccount(args: FundAccountArgs): Promise<UserTransactionResponse> {
    return faucetFns.fundAccount(this.config, args.accountAddress, args.amount, args.options);
  }

  // ── Coin API (flat) ──

  /**
   * Builds a simple coin transfer transaction.
   * @param args - Contains `sender`, `recipient`, `amount`, and optional `options`.
   * @returns A promise resolving to a {@link SimpleTransaction} ready to be signed and submitted.
   */
  transferCoinTransaction(args: TransferCoinArgs): Promise<SimpleTransaction> {
    const options = args.options
      ? {
          maxGasAmount: args.options.maxGasAmount,
          gasUnitPrice: args.options.gasUnitPrice,
          expireTimestamp: args.options.expireTimestamp,
          sequenceNumber: args.options.accountSequenceNumber,
        }
      : undefined;
    return coinFns.transferCoinTransaction(this.config, args.sender, args.recipient, args.amount, options);
  }

  // ── Table API (flat) ──

  /**
   * Fetches an item from a Move table by its handle and key.
   * @typeParam T - The expected value type. Defaults to `unknown`.
   * @param args - Contains `handle` (table handle), `data` (key/value type info), and optional `options`.
   * @returns A promise resolving to the table item value typed as `T`.
   */
  getTableItem<T = unknown>(args: GetTableItemArgs): Promise<T> {
    return tableFns.getTableItem<T>(this.config, args.handle, args.data, args.options);
  }
}
