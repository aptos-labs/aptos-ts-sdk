// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./account.js";
import { AptosConfig } from "./aptosConfig.js";
import { Coin } from "./coin.js";
import { DigitalAsset } from "./digitalAsset.js";
import { Faucet } from "./faucet.js";
import { FungibleAsset } from "./fungibleAsset.js";
import { General } from "./general.js";
import { ANS } from "./ans.js";
import { Staking } from "./staking.js";
import { Transaction } from "./transaction.js";
import { Table } from "./table.js";
import { Keyless } from "./keyless.js";
import { AptosObject } from "./object.js";
import { AccountAbstraction } from "./account/abstraction.js";

/**
 * The main entry point for interacting with the Aptos APIs,
 * providing access to various functionalities organized into
 * distinct namespaces.
 *
 * Note: Importing `Aptos` pulls in all sub-modules and is not tree-shakeable.
 * For smaller bundles, import namespace classes from sub-paths instead:
 *
 * ```typescript
 * import { General, AptosConfig } from "@aptos-labs/ts-sdk/general";
 * const general = new General(new AptosConfig({ network: Network.TESTNET }));
 * await general.getLedgerInfo();
 * ```
 *
 * Or for maximum tree-shaking, import individual functions:
 *
 * ```typescript
 * import { getLedgerInfo } from "@aptos-labs/ts-sdk/general";
 * await getLedgerInfo({ aptosConfig: config });
 * ```
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const ledgerInfo = await aptos.getLedgerInfo();
 * ```
 * @group Client
 */
export class Aptos {
  readonly config: AptosConfig;

  // Lazy-initialized sub-module backing fields
  #account?: Account;
  #abstraction?: AccountAbstraction;
  #ans?: ANS;
  #coin?: Coin;
  #digitalAsset?: DigitalAsset;
  #faucet?: Faucet;
  #fungibleAsset?: FungibleAsset;
  #general?: General;
  #staking?: Staking;
  #transaction?: Transaction;
  #table?: Table;
  #keyless?: Keyless;
  #object?: AptosObject;

  /**
   * Initializes a new instance of the Aptos client with the provided configuration settings.
   *
   * @param config - Configuration settings for the Aptos client.
   * @group Client
   */
  constructor(config?: AptosConfig) {
    this.config = config ?? new AptosConfig();
  }

  get account(): Account {
    this.#account ??= new Account(this.config);
    return this.#account;
  }

  get abstraction(): AccountAbstraction {
    this.#abstraction ??= new AccountAbstraction(this.config);
    return this.#abstraction;
  }

  get ans(): ANS {
    this.#ans ??= new ANS(this.config);
    return this.#ans;
  }

  get coin(): Coin {
    this.#coin ??= new Coin(this.config);
    return this.#coin;
  }

  get digitalAsset(): DigitalAsset {
    this.#digitalAsset ??= new DigitalAsset(this.config);
    return this.#digitalAsset;
  }

  get faucet(): Faucet {
    this.#faucet ??= new Faucet(this.config);
    return this.#faucet;
  }

  get fungibleAsset(): FungibleAsset {
    this.#fungibleAsset ??= new FungibleAsset(this.config);
    return this.#fungibleAsset;
  }

  get general(): General {
    this.#general ??= new General(this.config);
    return this.#general;
  }

  get staking(): Staking {
    this.#staking ??= new Staking(this.config);
    return this.#staking;
  }

  get transaction(): Transaction {
    this.#transaction ??= new Transaction(this.config);
    return this.#transaction;
  }

  get table(): Table {
    this.#table ??= new Table(this.config);
    return this.#table;
  }

  get keyless(): Keyless {
    this.#keyless ??= new Keyless(this.config);
    return this.#keyless;
  }

  get object(): AptosObject {
    this.#object ??= new AptosObject(this.config);
    return this.#object;
  }

  setIgnoreTransactionSubmitter(ignore: boolean) {
    this.config.setIgnoreTransactionSubmitter(ignore);
  }
}

// TypeScript interface merging: declares that Aptos instances also have
// all methods from each sub-module class, applied via mixins below.
export interface Aptos
  extends Account,
    ANS,
    Coin,
    DigitalAsset,
    Faucet,
    FungibleAsset,
    General,
    Keyless,
    Staking,
    Table,
    AptosObject,
    Omit<Transaction, "build" | "simulate" | "submit" | "batch"> {}

/**
 * Mixin helper: copies prototype methods from a sub-module class onto the
 * Aptos class, delegating calls to the lazily-initialized sub-module instance.
 * {@link https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern}
 */
function applyMixin(targetClass: any, baseClass: any, baseClassProp: string) {
  Object.getOwnPropertyNames(baseClass.prototype).forEach((propertyName) => {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, propertyName);
    if (!propertyDescriptor) return;
    Object.defineProperty(targetClass.prototype, propertyName, {
      value(...args: any[]) {
        return this[baseClassProp][propertyName](...args);
      },
      writable: propertyDescriptor.writable,
      configurable: propertyDescriptor.configurable,
      enumerable: propertyDescriptor.enumerable,
    });
  });
}

applyMixin(Aptos, Account, "account");
applyMixin(Aptos, AccountAbstraction, "abstraction");
applyMixin(Aptos, ANS, "ans");
applyMixin(Aptos, Coin, "coin");
applyMixin(Aptos, DigitalAsset, "digitalAsset");
applyMixin(Aptos, Faucet, "faucet");
applyMixin(Aptos, FungibleAsset, "fungibleAsset");
applyMixin(Aptos, General, "general");
applyMixin(Aptos, Staking, "staking");
applyMixin(Aptos, Transaction, "transaction");
applyMixin(Aptos, Table, "table");
applyMixin(Aptos, Keyless, "keyless");
applyMixin(Aptos, AptosObject, "object");
