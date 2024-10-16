// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { fundAccount } from "../internal/faucet";
import { UserTransactionResponse, WaitForTransactionOptions } from "../types";
import { AccountAddressInput } from "../core";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexer } from "../internal/transaction";
import { ProcessorType } from "../utils";

/**
 * A class to query all `Faucet` related queries on Aptos.
 */
export class Faucet {
  /**
   * Initializes a new instance of the Aptos client with the specified configuration.
   *
   * @param config - The configuration settings for the Aptos client.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({ network: Network.TESTNET }); // specify your own network if needed
   *
   *     // Initialize the Aptos client with the configuration
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   */
  constructor(readonly config: AptosConfig) {}

  /**
   * This function creates an account if it does not exist and mints the specified amount of coins into that account.
   *
   * @param args - The arguments for funding the account.
   * @param args.accountAddress - The address of the account to fund.
   * @param args.amount - The amount of tokens to fund the account with.
   * @param args.options - Configuration options for waiting for the transaction.
   * @returns Transaction hash of the transaction that funded the account.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fund an account with a specified amount of tokens
   *   const transaction = await aptos.fundAccount({
   *     accountAddress: "0x1", // replace with your account address
   *     amount: 100,
   *   });
   *
   *   console.log("Transaction hash:", transaction.hash);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async fundAccount(args: {
    accountAddress: AccountAddressInput;
    amount: number;
    options?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const fundTxn = await fundAccount({ aptosConfig: this.config, ...args });

    // If the user explicitly says to NOT wait by setting waitForIndexer to false, then we skip this.
    // But, by default we want to wait for the indexer.
    if (args.options?.waitForIndexer === undefined || args.options?.waitForIndexer) {
      await waitForIndexer({
        aptosConfig: this.config,
        minimumLedgerVersion: BigInt(fundTxn.version),
        processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
      });
    }

    return fundTxn;
  }
}
