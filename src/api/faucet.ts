// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { fundAccount } from "../internal/faucet";
import { UserTransactionResponse, WaitForTransactionOptions } from "../types";
import { AccountAddressInput } from "../core";
import { CedraConfig } from "./cedraConfig";
import { waitForIndexer } from "../internal/transaction";
import { ProcessorType } from "../utils";

/**
 * A class to query all `Faucet` related queries on Cedra.
 * @group Faucet
 */
export class Faucet {
  /**
   * Initializes a new instance of the Cedra client with the specified configuration.
   *
   * Note that only devnet has a publicly accessible faucet. For testnet, you must use
   * the minting page at https://faucet-api.cedra.dev.
   *
   * @param config - The configuration settings for the Cedra client.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Cedra client
   *     const config = new CedraConfig({ network: Network.DEVNET }); // specify your own network if needed
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Faucet
   */
  constructor(readonly config: CedraConfig) {}

  /**
   * This function creates an account if it does not exist and mints the specified amount of coins into that account.
   *
   * Note that only devnet has a publicly accessible faucet. For testnet, you must use
   * the minting page at https://faucet-api.cedra.dev.
   *
   * @param args - The arguments for funding the account.
   * @param args.accountAddress - The address of the account to fund.
   * @param args.amount - The amount of tokens to fund the account with.
   * @param args.options - Configuration options for waiting for the transaction.
   * @returns Transaction hash of the transaction that funded the account.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.DEVNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fund an account with a specified amount of tokens
   *   const transaction = await cedra.fundAccount({
   *     accountAddress: "0x1", // replace with your account address
   *     amount: 100,
   *   });
   *
   *   console.log("Transaction hash:", transaction.hash);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Faucet
   */
  async fundAccount(args: {
    accountAddress: AccountAddressInput;
    amount: number;
    options?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const fundTxn = await fundAccount({ cedraConfig: this.config, ...args });

    // If the user explicitly says to NOT wait by setting waitForIndexer to false, then we skip this.
    // But, by default we want to wait for the indexer.
    if (args.options?.waitForIndexer === undefined || args.options?.waitForIndexer) {
      await waitForIndexer({
        cedraConfig: this.config,
        minimumLedgerVersion: BigInt(fundTxn.version),
        processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
      });
    }

    return fundTxn;
  }
}
