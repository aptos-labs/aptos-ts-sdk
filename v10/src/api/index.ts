// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Account as AccountSigner } from "../account/types.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import * as accountFns from "./account.js";
import * as coinFns from "./coin.js";
import { AptosConfig, type AptosSettings } from "./config.js";
import * as faucetFns from "./faucet.js";
import * as generalFns from "./general.js";
import * as tableFns from "./table.js";
import * as transactionFns from "./transaction.js";

// ── Namespace API classes (composition, not mixins) ──

/** Provides access to general blockchain queries such as ledger info, blocks, view functions, and gas estimation. */
class GeneralAPI {
  constructor(private config: AptosConfig) {}

  /** Retrieves the current ledger information from the fullnode. */
  getLedgerInfo() {
    return generalFns.getLedgerInfo(this.config);
  }

  /** Retrieves the chain ID of the connected Aptos network. */
  getChainId() {
    return generalFns.getChainId(this.config);
  }

  /** Retrieves a block by the ledger version it contains. */
  getBlockByVersion(...args: DropFirst<Parameters<typeof generalFns.getBlockByVersion>>) {
    return generalFns.getBlockByVersion(this.config, ...args);
  }

  /** Retrieves a block by its height. */
  getBlockByHeight(...args: DropFirst<Parameters<typeof generalFns.getBlockByHeight>>) {
    return generalFns.getBlockByHeight(this.config, ...args);
  }

  /** Executes a Move view function on-chain without submitting a transaction. */
  view(...args: DropFirst<Parameters<typeof generalFns.view>>) {
    return generalFns.view(this.config, ...args);
  }

  /** Retrieves the current gas price estimation from the fullnode. */
  getGasPriceEstimation() {
    return generalFns.getGasPriceEstimation(this.config);
  }
}

/** Provides access to account-related queries such as account info, modules, resources, and transactions. */
class AccountAPI {
  constructor(private config: AptosConfig) {}

  /** Retrieves core account information (sequence number and authentication key). */
  getInfo(...args: DropFirst<Parameters<typeof accountFns.getAccountInfo>>) {
    return accountFns.getAccountInfo(this.config, ...args);
  }

  /** Retrieves all Move modules published under the specified account. */
  getModules(...args: DropFirst<Parameters<typeof accountFns.getAccountModules>>) {
    return accountFns.getAccountModules(this.config, ...args);
  }

  /** Retrieves a single Move module by name from the specified account. */
  getModule(...args: DropFirst<Parameters<typeof accountFns.getAccountModule>>) {
    return accountFns.getAccountModule(this.config, ...args);
  }

  /** Retrieves a specific Move resource by type from the specified account. */
  getResource<T = unknown>(...args: DropFirst<Parameters<typeof accountFns.getAccountResource<T>>>) {
    return accountFns.getAccountResource<T>(this.config, ...args);
  }

  /** Retrieves all Move resources stored under the specified account. */
  getResources(...args: DropFirst<Parameters<typeof accountFns.getAccountResources>>) {
    return accountFns.getAccountResources(this.config, ...args);
  }

  /** Retrieves transactions sent by the specified account. */
  getTransactions(...args: DropFirst<Parameters<typeof accountFns.getAccountTransactions>>) {
    return accountFns.getAccountTransactions(this.config, ...args);
  }
}

/** Provides access to transaction building, signing, submission, waiting, and querying. */
class TransactionAPI {
  constructor(private config: AptosConfig) {}

  /** Builds a simple entry function transaction. */
  buildSimple(...args: DropFirst<Parameters<typeof transactionFns.buildSimpleTransaction>>) {
    return transactionFns.buildSimpleTransaction(this.config, ...args);
  }

  /** Signs a transaction using the provided account's private key. */
  sign(signer: AccountSigner, transaction: AnyRawTransaction) {
    return transactionFns.signTransaction(signer, transaction);
  }

  /** Submits a signed transaction to the fullnode. */
  submit(...args: DropFirst<Parameters<typeof transactionFns.submitTransaction>>) {
    return transactionFns.submitTransaction(this.config, ...args);
  }

  /** Signs and submits a transaction in a single step. */
  signAndSubmit(signer: AccountSigner, transaction: AnyRawTransaction) {
    return transactionFns.signAndSubmitTransaction(this.config, signer, transaction);
  }

  /** Waits for a transaction to be committed on-chain. */
  waitForTransaction(...args: DropFirst<Parameters<typeof transactionFns.waitForTransaction>>) {
    return transactionFns.waitForTransaction(this.config, ...args);
  }

  /** Retrieves a transaction by its hash. */
  getByHash(...args: DropFirst<Parameters<typeof transactionFns.getTransactionByHash>>) {
    return transactionFns.getTransactionByHash(this.config, ...args);
  }

  /** Retrieves a transaction by its ledger version number. */
  getByVersion(...args: DropFirst<Parameters<typeof transactionFns.getTransactionByVersion>>) {
    return transactionFns.getTransactionByVersion(this.config, ...args);
  }

  /** Retrieves a list of transactions from the ledger. */
  getAll(...args: DropFirst<Parameters<typeof transactionFns.getTransactions>>) {
    return transactionFns.getTransactions(this.config, ...args);
  }

  /** Generates the BCS-serialized signing message for a raw transaction. */
  getSigningMessage(transaction: AnyRawTransaction) {
    return transactionFns.getSigningMessage(transaction);
  }
}

/** Provides access to coin transfer operations. */
class CoinAPI {
  constructor(private config: AptosConfig) {}

  /** Builds a coin transfer transaction. */
  transferTransaction(...args: DropFirst<Parameters<typeof coinFns.transferCoinTransaction>>) {
    return coinFns.transferCoinTransaction(this.config, ...args);
  }
}

/** Provides access to the faucet for funding accounts on devnet/localnet. */
class FaucetAPI {
  constructor(private config: AptosConfig) {}

  /** Funds an account with APT from the faucet and waits for the transaction to commit. */
  fund(...args: DropFirst<Parameters<typeof faucetFns.fundAccount>>) {
    return faucetFns.fundAccount(this.config, ...args);
  }
}

/** Provides access to on-chain Move table queries. */
class TableAPI {
  constructor(private config: AptosConfig) {}

  /** Retrieves a single item from a Move table by its key. */
  getItem<T = unknown>(...args: DropFirst<Parameters<typeof tableFns.getTableItem<T>>>) {
    return tableFns.getTableItem<T>(this.config, ...args);
  }
}

// ── Aptos Facade ──

/**
 * The primary entry point for interacting with the Aptos blockchain.
 * Aggregates domain-specific APIs (account, transaction, coin, etc.) into a single facade.
 *
 * @example
 * ```typescript
 * const aptos = new Aptos({ network: Network.TESTNET });
 *
 * // Query ledger info
 * const ledgerInfo = await aptos.general.getLedgerInfo();
 *
 * // Build, sign, and submit a transaction
 * const txn = await aptos.transaction.buildSimple(sender.accountAddress, {
 *   function: "0x1::aptos_account::transfer",
 *   functionArguments: [recipient, new U64(1_000_000)],
 * });
 * const pending = await aptos.transaction.signAndSubmit(sender, txn);
 * const committed = await aptos.transaction.waitForTransaction(pending.hash);
 * ```
 */
export class Aptos {
  /** The resolved configuration for this instance. */
  readonly config: AptosConfig;
  /** General blockchain queries (ledger info, blocks, view functions, gas estimation). */
  readonly general: GeneralAPI;
  /** Account-related queries (info, modules, resources, transactions). */
  readonly account: AccountAPI;
  /** Transaction building, signing, submission, waiting, and querying. */
  readonly transaction: TransactionAPI;
  /** Coin transfer operations. */
  readonly coin: CoinAPI;
  /** Faucet operations for funding accounts on devnet/localnet. */
  readonly faucet: FaucetAPI;
  /** On-chain Move table queries. */
  readonly table: TableAPI;

  /**
   * Creates a new Aptos client instance.
   * @param settings - Optional configuration settings, or an existing {@link AptosConfig} instance.
   */
  constructor(settings?: AptosSettings | AptosConfig) {
    this.config = settings instanceof AptosConfig ? settings : new AptosConfig(settings);
    this.general = new GeneralAPI(this.config);
    this.account = new AccountAPI(this.config);
    this.transaction = new TransactionAPI(this.config);
    this.coin = new CoinAPI(this.config);
    this.faucet = new FaucetAPI(this.config);
    this.table = new TableAPI(this.config);
  }
}

// ── Helper type ──

/**
 * Utility type that removes the first element from a tuple type.
 * Used internally to strip the `config` parameter from standalone functions when wrapping them in namespace API classes.
 */
// biome-ignore lint/suspicious/noExplicitAny: TypeScript conditional tuple inference requires `any[]`
type DropFirst<T extends any[]> = T extends [unknown, ...infer Rest] ? Rest : never;

export {
  getAccountInfo,
  getAccountModule,
  getAccountModules,
  getAccountResource,
  getAccountResources,
  getAccountTransactions,
} from "./account.js";
export { transferCoinTransaction } from "./coin.js";
// ── Re-exports ──
export { AptosConfig, type AptosSettings, createConfig } from "./config.js";
export { fundAccount } from "./faucet.js";
export {
  getBlockByHeight,
  getBlockByVersion,
  getChainId,
  getGasPriceEstimation,
  getLedgerInfo,
  view,
} from "./general.js";
export { getTableItem } from "./table.js";
export type { BuildSimpleTransactionOptions } from "./transaction.js";
export {
  buildSimpleTransaction,
  getSigningMessage,
  getTransactionByHash,
  getTransactionByVersion,
  getTransactions,
  signAndSubmitTransaction,
  signTransaction,
  submitTransaction,
  waitForTransaction,
} from "./transaction.js";
export * from "./types.js";
