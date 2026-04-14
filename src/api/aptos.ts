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
 * @deprecated The Aptos class is deprecated and will be removed in a future version.
 * Use standalone functions instead for better tree-shaking and smaller bundle sizes.
 *
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
  private static _warned = false;

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
   * @deprecated Use standalone functions instead for better tree-shaking.
   *
   * Initializes a new instance of the Aptos client with the provided configuration settings.
   * This allows you to interact with various Aptos functionalities such as accounts, transactions, and events.
   *
   * @param config - Configuration settings for the Aptos client.
   * @group Client
   */
  constructor(config?: AptosConfig) {
    if (!Aptos._warned) {
      console.warn(
        "[@aptos-labs/ts-sdk] The Aptos class is deprecated. " +
          "Use standalone functions for better tree-shaking and smaller bundle sizes. " +
          "See the migration guide for details.",
      );
      Aptos._warned = true;
    }
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
