// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../core";
import { transferCoinTransaction } from "../internal/coin";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, MoveStructId } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to handle all `Coin` operations.
 * @group Coin
 */
export class Coin {
  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Aptos client with testnet configuration
   *     const config = new AptosConfig({ network: Network.TESTNET });
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Coin
   */
  constructor(readonly config: AptosConfig) {}

  /**
   * Generate a transfer coin transaction that can be simulated, signed, and submitted.
   * This function helps you create a transaction to transfer a specified amount of coins
   * from one account to another within the Aptos network.
   *
   * @param args The arguments for the transfer transaction.
   * @param args.sender The sender account address.
   * @param args.recipient The recipient account address.
   * @param args.amount The amount of coins to transfer.
   * @param args.coinType Optional. The coin struct type to transfer. Defaults to 0x1::aptos_coin::AptosCoin.
   * @param args.options Optional. Additional options for generating the transaction.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Generate a transfer coin transaction
   *   const transaction = await aptos.transferCoinTransaction({
   *     sender: "0x1", // replace with a real sender account address
   *     recipient: "0x2", // replace with a real recipient account address
   *     amount: 10,
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Coin
   */
  async transferCoinTransaction(args: {
    sender: AccountAddressInput;
    recipient: AccountAddressInput;
    amount: AnyNumber;
    coinType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return transferCoinTransaction({ aptosConfig: this.config, ...args });
  }
}
