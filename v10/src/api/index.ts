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

class GeneralAPI {
  constructor(private config: AptosConfig) {}
  getLedgerInfo() {
    return generalFns.getLedgerInfo(this.config);
  }
  getChainId() {
    return generalFns.getChainId(this.config);
  }
  getBlockByVersion(...args: DropFirst<Parameters<typeof generalFns.getBlockByVersion>>) {
    return generalFns.getBlockByVersion(this.config, ...args);
  }
  getBlockByHeight(...args: DropFirst<Parameters<typeof generalFns.getBlockByHeight>>) {
    return generalFns.getBlockByHeight(this.config, ...args);
  }
  view(...args: DropFirst<Parameters<typeof generalFns.view>>) {
    return generalFns.view(this.config, ...args);
  }
  getGasPriceEstimation() {
    return generalFns.getGasPriceEstimation(this.config);
  }
}

class AccountAPI {
  constructor(private config: AptosConfig) {}
  getInfo(...args: DropFirst<Parameters<typeof accountFns.getAccountInfo>>) {
    return accountFns.getAccountInfo(this.config, ...args);
  }
  getModules(...args: DropFirst<Parameters<typeof accountFns.getAccountModules>>) {
    return accountFns.getAccountModules(this.config, ...args);
  }
  getModule(...args: DropFirst<Parameters<typeof accountFns.getAccountModule>>) {
    return accountFns.getAccountModule(this.config, ...args);
  }
  getResource<T = unknown>(...args: DropFirst<Parameters<typeof accountFns.getAccountResource<T>>>) {
    return accountFns.getAccountResource<T>(this.config, ...args);
  }
  getResources(...args: DropFirst<Parameters<typeof accountFns.getAccountResources>>) {
    return accountFns.getAccountResources(this.config, ...args);
  }
  getTransactions(...args: DropFirst<Parameters<typeof accountFns.getAccountTransactions>>) {
    return accountFns.getAccountTransactions(this.config, ...args);
  }
}

class TransactionAPI {
  constructor(private config: AptosConfig) {}
  buildSimple(...args: DropFirst<Parameters<typeof transactionFns.buildSimpleTransaction>>) {
    return transactionFns.buildSimpleTransaction(this.config, ...args);
  }
  sign(signer: AccountSigner, transaction: AnyRawTransaction) {
    return transactionFns.signTransaction(signer, transaction);
  }
  submit(...args: DropFirst<Parameters<typeof transactionFns.submitTransaction>>) {
    return transactionFns.submitTransaction(this.config, ...args);
  }
  signAndSubmit(signer: AccountSigner, transaction: AnyRawTransaction) {
    return transactionFns.signAndSubmitTransaction(this.config, signer, transaction);
  }
  waitForTransaction(...args: DropFirst<Parameters<typeof transactionFns.waitForTransaction>>) {
    return transactionFns.waitForTransaction(this.config, ...args);
  }
  getByHash(...args: DropFirst<Parameters<typeof transactionFns.getTransactionByHash>>) {
    return transactionFns.getTransactionByHash(this.config, ...args);
  }
  getByVersion(...args: DropFirst<Parameters<typeof transactionFns.getTransactionByVersion>>) {
    return transactionFns.getTransactionByVersion(this.config, ...args);
  }
  getAll(...args: DropFirst<Parameters<typeof transactionFns.getTransactions>>) {
    return transactionFns.getTransactions(this.config, ...args);
  }
  getSigningMessage(transaction: AnyRawTransaction) {
    return transactionFns.getSigningMessage(transaction);
  }
}

class CoinAPI {
  constructor(private config: AptosConfig) {}
  transferTransaction(...args: DropFirst<Parameters<typeof coinFns.transferCoinTransaction>>) {
    return coinFns.transferCoinTransaction(this.config, ...args);
  }
}

class FaucetAPI {
  constructor(private config: AptosConfig) {}
  fund(...args: DropFirst<Parameters<typeof faucetFns.fundAccount>>) {
    return faucetFns.fundAccount(this.config, ...args);
  }
}

class TableAPI {
  constructor(private config: AptosConfig) {}
  getItem<T = unknown>(...args: DropFirst<Parameters<typeof tableFns.getTableItem<T>>>) {
    return tableFns.getTableItem<T>(this.config, ...args);
  }
}

// ── Aptos Facade ──

export class Aptos {
  readonly config: AptosConfig;
  readonly general: GeneralAPI;
  readonly account: AccountAPI;
  readonly transaction: TransactionAPI;
  readonly coin: CoinAPI;
  readonly faucet: FaucetAPI;
  readonly table: TableAPI;

  constructor(settings?: AptosSettings) {
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
type DropFirst<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;

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
