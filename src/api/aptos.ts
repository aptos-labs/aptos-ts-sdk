// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./account";
import { AptosConfig } from "./aptosConfig";
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
import { AptosObject } from "./object";

/**
 * This class is the main entry point into Aptos's
 * APIs and separates functionality into different namespaces.
 *
 * To use the SDK, create a new Aptos instance to get access
 * to all the sdk functionality.
 *
 * @example
 *
 * const aptos = new Aptos();
 */
export class Aptos {
  readonly config: AptosConfig;

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

  readonly object: AptosObject;

  constructor(settings?: AptosConfig) {
    this.config = new AptosConfig(settings);
    this.account = new Account(this.config);
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
    this.object = new AptosObject(this.config);
  }
}

// extends Aptos interface so all the methods and properties
// from the other classes will be recognized by typescript.
export interface Aptos
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
    AptosObject,
    Omit<Transaction, "build" | "simulate" | "submit" | "batch"> {}

/**
 * Mixes in instance methods from a base class into a target class, allowing for multiple inheritance-like behavior.
 * This enables the creation of classes that combine functionality from multiple sources, facilitating code reuse.
 * 
 * @param targetClass - The class that will receive the mixed-in methods.
 * @param baseClass - The class from which methods will be mixed in.
 * @param baseClassProp - The property name on the target class that will hold the instance of the base class.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * class Base {
 *   greet() {
 *     return "Hello from Base!";
 *   }
 * }
 * 
 * class Target {
 *   constructor(public base: Base) {}
 * }
 * 
 * // Applying the mixin
 * applyMixin(Target, Base, 'base');
 * 
 * async function runExample() {
 *   const baseInstance = new Base();
 *   const targetInstance = new Target(baseInstance);
 * 
 *   // Calling the mixed-in method
 *   const message = targetInstance.greet();
 *   console.log(message); // Outputs: Hello from Base!
 * }
 * runExample().catch(console.error);
 * ```
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

applyMixin(Aptos, Account, "account");
applyMixin(Aptos, ANS, "ans");
applyMixin(Aptos, Coin, "coin");
applyMixin(Aptos, DigitalAsset, "digitalAsset");
applyMixin(Aptos, Event, "event");
applyMixin(Aptos, Faucet, "faucet");
applyMixin(Aptos, FungibleAsset, "fungibleAsset");
applyMixin(Aptos, General, "general");
applyMixin(Aptos, Staking, "staking");
applyMixin(Aptos, Transaction, "transaction");
applyMixin(Aptos, Table, "table");
applyMixin(Aptos, Keyless, "keyless");
applyMixin(Aptos, AptosObject, "object");