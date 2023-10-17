// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./account";
import { AptosConfig } from "./aptosConfig";
import { Coin } from "./coin";
import { Collection } from "./collection";
import { Event } from "./event";
import { Faucet } from "./faucet";
import { FungibleAsset } from "./fungibleAsset";
import { General } from "./general";
import { Staking } from "./staking";
import { Token } from "./token";
import { Transaction } from "./transaction";
import { TransactionSubmission } from "./transaction_submission";

/**
 * This class is the main entry point into Aptos's
 * APIs and separates functionality into different namespaces.
 *
 * To use the SDK, create a new Aptos instance to get access
 * to all the sdk functionality.
 */
export class Aptos {
  readonly config: AptosConfig;

  readonly account: Account;

  readonly coin: Coin;

  readonly collection: Collection;

  readonly event: Event;

  readonly faucet: Faucet;

  readonly fungibleAsset: FungibleAsset;

  readonly general: General;

  readonly staking: Staking;

  readonly token: Token;

  readonly transaction: Transaction;

  readonly transactionSubmission: TransactionSubmission;

  constructor(settings?: AptosConfig) {
    this.config = new AptosConfig(settings);
    this.account = new Account(this.config);
    this.coin = new Coin(this.config);
    this.collection = new Collection(this.config);
    this.event = new Event(this.config);
    this.faucet = new Faucet(this.config);
    this.fungibleAsset = new FungibleAsset(this.config);
    this.general = new General(this.config);
    this.staking = new Staking(this.config);
    this.token = new Token(this.config);
    this.transaction = new Transaction(this.config);
    this.transactionSubmission = new TransactionSubmission(this.config);
  }
}

export interface Aptos
  extends Account,
    Coin,
    Collection,
    Event,
    Faucet,
    FungibleAsset,
    General,
    Staking,
    Token,
    Transaction,
    TransactionSubmission {}

/**
In TypeScript, we can’t inherit or extend from more than one class,
Mixins helps us to get around that by creating a partial classes 
that we can combine to form a single class that contains all the methods and properties from the partial classes.
{@link https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern}

Here, we combine any sub-class and the Aptos class.
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
applyMixin(Aptos, Coin, "coin");
applyMixin(Aptos, Collection, "collection");
applyMixin(Aptos, Event, "event");
applyMixin(Aptos, Faucet, "faucet");
applyMixin(Aptos, FungibleAsset, "fungibleAsset");
applyMixin(Aptos, General, "general");
applyMixin(Aptos, Staking, "staking");
applyMixin(Aptos, Token, "token");
applyMixin(Aptos, Transaction, "transaction");
applyMixin(Aptos, TransactionSubmission, "transactionSubmission");
