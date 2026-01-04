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
 * API namespaces are lazily initialized on first access to improve
 * startup performance and reduce memory usage when not all features are needed.
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

  // Lazy-initialized API namespace instances
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

  // Lazy getters for API namespaces

  get account(): Account {
    if (!this._account) {
      this._account = new Account(this.config);
    }
    return this._account;
  }

  get abstraction(): AccountAbstraction {
    if (!this._abstraction) {
      this._abstraction = new AccountAbstraction(this.config);
    }
    return this._abstraction;
  }

  get ans(): ANS {
    if (!this._ans) {
      this._ans = new ANS(this.config);
    }
    return this._ans;
  }

  get coin(): Coin {
    if (!this._coin) {
      this._coin = new Coin(this.config);
    }
    return this._coin;
  }

  get digitalAsset(): DigitalAsset {
    if (!this._digitalAsset) {
      this._digitalAsset = new DigitalAsset(this.config);
    }
    return this._digitalAsset;
  }

  get faucet(): Faucet {
    if (!this._faucet) {
      this._faucet = new Faucet(this.config);
    }
    return this._faucet;
  }

  get fungibleAsset(): FungibleAsset {
    if (!this._fungibleAsset) {
      this._fungibleAsset = new FungibleAsset(this.config);
    }
    return this._fungibleAsset;
  }

  get general(): General {
    if (!this._general) {
      this._general = new General(this.config);
    }
    return this._general;
  }

  get staking(): Staking {
    if (!this._staking) {
      this._staking = new Staking(this.config);
    }
    return this._staking;
  }

  get transaction(): Transaction {
    if (!this._transaction) {
      this._transaction = new Transaction(this.config);
    }
    return this._transaction;
  }

  get table(): Table {
    if (!this._table) {
      this._table = new Table(this.config);
    }
    return this._table;
  }

  get keyless(): Keyless {
    if (!this._keyless) {
      this._keyless = new Keyless(this.config);
    }
    return this._keyless;
  }

  get object(): AptosObject {
    if (!this._object) {
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
