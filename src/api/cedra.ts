// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./account";
import { CedraConfig } from "./cedraConfig";
import { Coin } from "./coin";
import { DigitalAsset } from "./digitalAsset";
import { Event } from "./event";
import { Faucet } from "./faucet";
import { FungibleAsset } from "./fungibleAsset";
import { General } from "./general";
import { ANS } from "./ans";
import { Staking } from "./staking";
import { Transaction } from "./transaction";
import { Table } from "./table";
import { Keyless } from "./keyless";
import { CedraObject } from "./object";
import { AccountAbstraction } from "./account/abstraction";

/**
 * The main entry point for interacting with the Cedra APIs,
 * providing access to various functionalities organized into
 * distinct namespaces.
 *
 * To utilize the SDK, instantiate a new Cedra object to gain
 * access to the complete range of SDK features.
 *
 * @example
 * ```typescript
 * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
 *
 * async function runExample() {
 *     // Create a configuration for connecting to the Cedra testnet
 *     const config = new CedraConfig({ network: Network.TESTNET });
 *
 *     // Initialize the Cedra client with the configuration
 *     const cedra = new Cedra(config);
 *
 *     console.log("Cedra client initialized:", cedra);
 * }
 * runExample().catch(console.error);
 * ```
 * @group Client
 */
export class Cedra {
  readonly config: CedraConfig;

  readonly account: Account;

  readonly ans: ANS;

  readonly coin: Coin;

  readonly digitalAsset: DigitalAsset;

  readonly event: Event;

  readonly faucet: Faucet;

  readonly fungibleAsset: FungibleAsset;

  readonly general: General;

  readonly staking: Staking;

  readonly transaction: Transaction;

  readonly table: Table;

  readonly keyless: Keyless;

  readonly object: CedraObject;

  /**
   * Initializes a new instance of the Cedra client with the provided configuration settings.
   * This allows you to interact with various Cedra functionalities such as accounts, transactions, and events.
   *
   * @param settings - Configuration settings for the Cedra client.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Cedra client with default settings
   *     const config = new CedraConfig({ network: Network.TESTNET }); // Specify your own settings if needed
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Client
   */
  constructor(settings?: CedraConfig) {
    this.config = new CedraConfig(settings);
    this.account = new Account(this.config);
    this.abstraction = new AccountAbstraction(this.config);
    this.ans = new ANS(this.config);
    this.coin = new Coin(this.config);
    this.digitalAsset = new DigitalAsset(this.config);
    this.event = new Event(this.config);
    this.faucet = new Faucet(this.config);
    this.fungibleAsset = new FungibleAsset(this.config);
    this.general = new General(this.config);
    this.staking = new Staking(this.config);
    this.transaction = new Transaction(this.config);
    this.table = new Table(this.config);
    this.keyless = new Keyless(this.config);
    this.object = new CedraObject(this.config);
  }
}

// extends Cedra interface so all the methods and properties
// from the other classes will be recognized by typescript.
export interface Cedra
  extends Account,
    ANS,
    Coin,
    DigitalAsset,
    Event,
    Faucet,
    FungibleAsset,
    General,
    Keyless,
    Staking,
    Table,
    CedraObject,
    Omit<Transaction, "build" | "simulate" | "submit" | "batch"> {}

/**
In TypeScript, we can’t inherit or extend from more than one class,
Mixins helps us to get around that by creating a partial classes
that we can combine to form a single class that contains all the methods and properties from the partial classes.
{@link https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern}

Here, we combine any subclass and the Cedra class.
 * @group Client
*/
function applyMixin(targetClass: any, baseClass: any, baseClassProp: string) {
  // Mixin instance methods
  Object.getOwnPropertyNames(baseClass.prototype).forEach((propertyName) => {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, propertyName);
    if (!propertyDescriptor) return;
    // eslint-disable-next-line func-names
    propertyDescriptor.value = function (...args: any) {
      return (this as any)[baseClassProp][propertyName](...args);
    };
    Object.defineProperty(targetClass.prototype, propertyName, propertyDescriptor);
  });
}

applyMixin(Cedra, Account, "account");
applyMixin(Cedra, AccountAbstraction, "abstraction");
applyMixin(Cedra, ANS, "ans");
applyMixin(Cedra, Coin, "coin");
applyMixin(Cedra, DigitalAsset, "digitalAsset");
applyMixin(Cedra, Event, "event");
applyMixin(Cedra, Faucet, "faucet");
applyMixin(Cedra, FungibleAsset, "fungibleAsset");
applyMixin(Cedra, General, "general");
applyMixin(Cedra, Staking, "staking");
applyMixin(Cedra, Transaction, "transaction");
applyMixin(Cedra, Table, "table");
applyMixin(Cedra, Keyless, "keyless");
applyMixin(Cedra, CedraObject, "object");
