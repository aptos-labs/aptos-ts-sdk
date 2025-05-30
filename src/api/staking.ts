// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  getDelegatedStakingActivities,
  getNumberOfDelegators,
  getNumberOfDelegatorsForAllPools,
} from "../internal/staking";
import { AnyNumber, GetDelegatedStakingActivitiesResponse, GetNumberOfDelegatorsResponse, OrderByArg } from "../types";
import { AccountAddressInput } from "../core";
import { ProcessorType } from "../utils/const";
import { CedraConfig } from "./cedraConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `Staking` related queries on Cedra.
 * @group Staking
 */
export class Staking {
  /**
   * Creates an instance of the Cedra client with the specified configuration.
   * This allows you to interact with the Cedra blockchain using the provided settings.
   *
   * @param config - The configuration settings for the Cedra client.
   * @param config.network - The network to connect to (e.g., TESTNET, MAINNET).
   * @param config.nodeUrl - The URL of the Cedra node to connect to.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Cedra client
   *     const config = new CedraConfig({ network: Network.TESTNET }); // Specify your network
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Staking
   */
  constructor(readonly config: CedraConfig) {}

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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Get the number of delegators for a specific pool
   *   const delegators = await cedra.getNumberOfDelegators({ poolAddress: "0x1" }); // replace with a real pool address
   *   console.log(`Number of delegators: ${delegators}`);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Staking
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
    return getNumberOfDelegators({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve the number of delegators for all pools
   *   const delegators = await cedra.getNumberOfDelegatorsForAllPools();
   *   console.log(delegators);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Staking
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
    return getNumberOfDelegatorsForAllPools({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Get delegated staking activities for a specific delegator and pool
   *   const activities = await cedra.getDelegatedStakingActivities({
   *     delegatorAddress: "0x1", // replace with a real delegator address
   *     poolAddress: "0x2", // replace with a real pool address
   *     minimumLedgerVersion: 1, // specify your own if needed
   *   });
   *
   *   console.log(activities);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Staking
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
    return getDelegatedStakingActivities({ cedraConfig: this.config, ...args });
  }
}
