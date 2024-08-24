// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput } from "../core";
import { transferCoinTransaction } from "../internal/coin";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, MoveStructId } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to handle all `Coin` operations
 */
export class Coin {
  constructor(readonly config: AptosConfig) {}

/**
 * Generate a transfer coin transaction that can be simulated, signed, and submitted.
 * 
 * @param args.sender The sender account.
 * @param args.recipient The recipient address.
 * @param args.amount The amount to transfer.
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
 *     sender: "0x1", // replace with a real sender account
 *     recipient: "0x2", // replace with a real recipient account
 *     amount: 10,
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
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