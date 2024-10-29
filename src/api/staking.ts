// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  getDelegatedStakingActivities,
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
} from "../internal/staking";
import { AnyNumber, GetDelegatedStakingActivitiesResponse, GetNumberOfDelegatorsResponse, OrderByArg } from "../types";
import { AccountAddressInput } from "../core";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `Staking` related queries on Aptos.
 */
export class Staking {
  /**
   * Creates an instance of the Aptos client with the specified configuration.
   * This allows you to interact with the Aptos blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your network
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
   * Queries the current number of delegators in a specified pool. Throws an error if the pool is not found.
   *
   * @param args - The parameters for the query.
   * @param args.poolAddress - The address of the pool to query.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @returns The number of delegators for the given pool.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Get the number of delegators for a specific pool
   *   const delegators = await aptos.getNumberOfDelegators({ poolAddress: "0x1" }); // replace with a real pool address
   *   console.log(`Number of delegators: ${delegators}`);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getNumberOfDelegators(args: {
    poolAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<number> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getNumberOfDelegators({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieves the current number of delegators across all pools.
   *
   * @param args Optional parameters for the query.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
   * @param args.options Optional ordering options for the response.
   * @returns GetNumberOfDelegatorsForAllPoolsResponse response type containing the number of delegators per pool.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve the number of delegators for all pools
   *   const delegators = await aptos.getNumberOfDelegatorsForAllPools();
   *   console.log(delegators);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getNumberOfDelegatorsForAllPools(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: OrderByArg<GetNumberOfDelegatorsResponse[0]>;
  }): Promise<GetNumberOfDelegatorsResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getNumberOfDelegatorsForAllPools({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries delegated staking activities for a specific delegator and pool.
   *
   * @param args - The arguments for querying delegated staking activities.
   * @param args.delegatorAddress - The address of the delegator.
   * @param args.poolAddress - The address of the staking pool.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   * @returns The response containing delegated staking activities.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Get delegated staking activities for a specific delegator and pool
   *   const activities = await aptos.getDelegatedStakingActivities({
   *     delegatorAddress: "0x1", // replace with a real delegator address
   *     poolAddress: "0x2", // replace with a real pool address
   *     minimumLedgerVersion: 1, // specify your own if needed
   *   });
   *
   *   console.log(activities);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getDelegatedStakingActivities(args: {
    delegatorAddress: AccountAddressInput;
    poolAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetDelegatedStakingActivitiesResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.STAKE_PROCESSOR,
    });
    return getDelegatedStakingActivities({ aptosConfig: this.config, ...args });
  }
}
