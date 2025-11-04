// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./account";
import { AptosConfig } from "./aptosConfig";
import { Coin } from "./coin";
import { DigitalAsset } from "./digitalAsset";
import { Faucet } from "./faucet";
import { FungibleAsset } from "./fungibleAsset";
import { General } from "./general";
import { ANS } from "./ans";
import { Staking } from "./staking";
import { Transaction } from "./transaction";
import { Table } from "./table";
import { Keyless } from "./keyless";
import { AptosObject } from "./object";
import { AccountAbstraction } from "./account/abstraction";

/**
 * The main entry point for interacting with the Aptos APIs,
 * providing access to various functionalities organized into
 * distinct namespaces.
 *
 * To utilize the SDK, instantiate a new Aptos object to gain
 * access to the complete range of SDK features.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * async function runExample() {
 *     // Create a configuration for connecting to the Aptos testnet
 *     const config = new AptosConfig({ network: Network.TESTNET });
 *
 *     // Initialize the Aptos client with the configuration
 *     const aptos = new Aptos(config);
 *
 *     console.log("Aptos client initialized:", aptos);
 * }
 * runExample().catch(console.error);
 * ```
 * @group Client
 */
export class Aptos {
  readonly config: AptosConfig;

  // Private fields to store lazy-loaded instances
  private _account?: Account;
  private _abstraction?: AccountAbstraction;
  private _ans?: ANS;
  private _coin?: Coin;
  private _digitalAsset?: DigitalAsset;
  private _faucet?: Faucet;
  private _fungibleAsset?: FungibleAsset;
  private _general?: General;
  private _staking?: Staking;
  private _transaction?: Transaction;
  private _table?: Table;
  private _keyless?: Keyless;
  private _object?: AptosObject;

  // Track which mixins have been applied
  static mixinsApplied = new Set<string>();

  /**
   * Initializes a new instance of the Aptos client with the provided configuration settings.
   * This allows you to interact with various Aptos functionalities such as accounts, transactions, and events.
   *
   * @param settings - Configuration settings for the Aptos client.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Aptos client with default settings
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your own settings if needed
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Client
   */
  constructor(config?: AptosConfig) {
    this.config = config ?? new AptosConfig();
  }

  /**
   * Lazy-loaded getter for Account functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get account(): Account {
    if (!this._account) {
      ensureMixinApplied(Aptos, Account, "account");
      this._account = new Account(this.config);
    }
    return this._account;
  }

  /**
   * Lazy-loaded getter for AccountAbstraction functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get abstraction(): AccountAbstraction {
    if (!this._abstraction) {
      ensureMixinApplied(Aptos, AccountAbstraction, "abstraction");
      this._abstraction = new AccountAbstraction(this.config);
    }
    return this._abstraction;
  }

  /**
   * Lazy-loaded getter for ANS functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get ans(): ANS {
    if (!this._ans) {
      ensureMixinApplied(Aptos, ANS, "ans");
      this._ans = new ANS(this.config);
    }
    return this._ans;
  }

  /**
   * Lazy-loaded getter for Coin functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get coin(): Coin {
    if (!this._coin) {
      ensureMixinApplied(Aptos, Coin, "coin");
      this._coin = new Coin(this.config);
    }
    return this._coin;
  }

  /**
   * Lazy-loaded getter for DigitalAsset functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get digitalAsset(): DigitalAsset {
    if (!this._digitalAsset) {
      ensureMixinApplied(Aptos, DigitalAsset, "digitalAsset");
      this._digitalAsset = new DigitalAsset(this.config);
    }
    return this._digitalAsset;
  }

  /**
   * Lazy-loaded getter for Faucet functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get faucet(): Faucet {
    if (!this._faucet) {
      ensureMixinApplied(Aptos, Faucet, "faucet");
      this._faucet = new Faucet(this.config);
    }
    return this._faucet;
  }

  /**
   * Lazy-loaded getter for FungibleAsset functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get fungibleAsset(): FungibleAsset {
    if (!this._fungibleAsset) {
      ensureMixinApplied(Aptos, FungibleAsset, "fungibleAsset");
      this._fungibleAsset = new FungibleAsset(this.config);
    }
    return this._fungibleAsset;
  }

  /**
   * Lazy-loaded getter for General functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get general(): General {
    if (!this._general) {
      ensureMixinApplied(Aptos, General, "general");
      this._general = new General(this.config);
    }
    return this._general;
  }

  /**
   * Lazy-loaded getter for Staking functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get staking(): Staking {
    if (!this._staking) {
      ensureMixinApplied(Aptos, Staking, "staking");
      this._staking = new Staking(this.config);
    }
    return this._staking;
  }

  /**
   * Lazy-loaded getter for Transaction functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get transaction(): Transaction {
    if (!this._transaction) {
      ensureMixinApplied(Aptos, Transaction, "transaction");
      this._transaction = new Transaction(this.config);
    }
    return this._transaction;
  }

  /**
   * Lazy-loaded getter for Table functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get table(): Table {
    if (!this._table) {
      ensureMixinApplied(Aptos, Table, "table");
      this._table = new Table(this.config);
    }
    return this._table;
  }

  /**
   * Lazy-loaded getter for Keyless functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get keyless(): Keyless {
    if (!this._keyless) {
      ensureMixinApplied(Aptos, Keyless, "keyless");
      this._keyless = new Keyless(this.config);
    }
    return this._keyless;
  }

  /**
   * Lazy-loaded getter for AptosObject functionality.
   * Only instantiates and applies mixin when first accessed.
   */
  get object(): AptosObject {
    if (!this._object) {
      ensureMixinApplied(Aptos, AptosObject, "object");
      this._object = new AptosObject(this.config);
    }
    return this._object;
  }

  setIgnoreTransactionSubmitter(ignore: boolean) {
    this.config.setIgnoreTransactionSubmitter(ignore);
  }
}

// extends Aptos interface so all the methods and properties
// from the other classes will be recognized by typescript.
// Note: Mixins are applied lazily when the corresponding property is first accessed.
export interface Aptos
  extends Account,
    AccountAbstraction,
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
In TypeScript, we can't inherit or extend from more than one class,
Mixins helps us to get around that by creating a partial classes
that we can combine to form a single class that contains all the methods and properties from the partial classes.
{@link https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern}

Here, we combine any subclass and the Aptos class.
 * @group Client
*/
function applyMixin(targetClass: any, baseClass: any, baseClassProp: string) {
  // Mixin instance methods
  Object.getOwnPropertyNames(baseClass.prototype).forEach((propertyName) => {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, propertyName);
    if (!propertyDescriptor) return;

    // Skip constructor and properties that already exist
    if (propertyName === "constructor" || targetClass.prototype[propertyName]) {
      return;
    }

    // Define new method that calls through baseClassProp
    Object.defineProperty(targetClass.prototype, propertyName, {
      value: function (...args: any[]) {
        return (this as any)[baseClassProp][propertyName](...args);
      },
      writable: propertyDescriptor.writable,
      configurable: propertyDescriptor.configurable,
      enumerable: propertyDescriptor.enumerable,
    });
  });
}

/**
 * Ensures a mixin is applied only once when the corresponding functionality is first accessed.
 * This enables lazy loading - mixins are only applied when their functionality is actually used.
 */
function ensureMixinApplied(targetClass: any, baseClass: any, baseClassProp: string) {
  const mixinKey = `${targetClass.name}-${baseClass.name}-${baseClassProp}`;
  if (Aptos.mixinsApplied.has(mixinKey)) {
    return;
  }

  applyMixin(targetClass, baseClass, baseClassProp);
  Aptos.mixinsApplied.add(mixinKey);
}
