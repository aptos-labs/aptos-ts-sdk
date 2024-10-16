// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AnyNumber,
  GetCurrentFungibleAssetBalancesResponse,
  GetFungibleAssetActivitiesResponse,
  GetFungibleAssetMetadataResponse,
  PaginationArgs,
  WhereArg,
} from "../types";
import {
  getCurrentFungibleAssetBalances,
  getFungibleAssetActivities,
  getFungibleAssetMetadata,
  transferFungibleAsset,
} from "../internal/fungibleAsset";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../types/generated/types";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";
import { Account } from "../account";
import { AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions } from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class for querying and managing fungible asset-related operations on the Aptos blockchain.
 */
export class FungibleAsset {
  /**
   * Initializes a new instance of the Aptos class with the provided configuration.
   * This allows you to interact with the Aptos blockchain using the specified network settings.
   *
   * @param config - The configuration settings for connecting to the Aptos network.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Aptos client
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your own network if needed
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
   * Queries all fungible asset metadata.
   *
   * @param args Optional parameters for the query.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to before querying.
   * @param args.options Optional configuration for pagination and filtering.
   *
   * @returns A list of fungible asset metadata.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching fungible asset metadata
   *   const fungibleAssets = await aptos.getFungibleAssetMetadata();
   *   console.log(fungibleAssets);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getFungibleAssetMetadata(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & WhereArg<FungibleAssetMetadataBoolExp>;
  }): Promise<GetFungibleAssetMetadataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getFungibleAssetMetadata({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries the fungible asset metadata for a specific asset type.
   * This function helps retrieve detailed information about a fungible asset based on its type.
   *
   * @param args - The parameters for the query.
   * @param args.assetType - The asset type of the fungible asset, e.g., "0x1::aptos_coin::AptosCoin" for Aptos Coin.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   *
   * @returns A fungible asset metadata item.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve fungible asset metadata by asset type
   *   const fungibleAsset = await aptos.getFungibleAssetMetadataByAssetType({
   *     assetType: "0x1::aptos_coin::AptosCoin" // replace with your asset type
   *   });
   *
   *   console.log(fungibleAsset);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getFungibleAssetMetadataByAssetType(args: {
    assetType: string;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetFungibleAssetMetadataResponse[0]> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    const data = await getFungibleAssetMetadata({
      aptosConfig: this.config,
      options: {
        where: {
          asset_type: { _eq: args.assetType },
        },
      },
    });

    return data[0];
  }

  /**
   * Retrieves fungible asset metadata based on the creator address.
   *
   * This function allows you to query metadata for a specific fungible asset created by a given address.
   *
   * @param args - The parameters for the query.
   * @param args.creatorAddress - The creator address of the fungible asset.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   *
   * @returns A fungible asset metadata item.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve fungible asset metadata by creator address
   *   const fungibleAsset = await aptos.getFungibleAssetMetadataByCreatorAddress({
   *     creatorAddress: "0x123", // replace with a real creator address
   *   });
   *
   *   console.log(fungibleAsset);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getFungibleAssetMetadataByCreatorAddress(args: {
    creatorAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetFungibleAssetMetadataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    const data = await getFungibleAssetMetadata({
      aptosConfig: this.config,
      options: {
        where: {
          creator_address: { _eq: AccountAddress.from(args.creatorAddress).toStringLong() },
        },
      },
    });

    return data;
  }

  /**
   * Queries all fungible asset activities and returns a list of their metadata.
   *
   * @param args Optional parameters for the query.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying.
   * @param args.options Optional configuration for pagination and filtering.
   * @returns A list of fungible asset metadata.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching fungible asset activities
   *   const fungibleAssetActivities = await aptos.getFungibleAssetActivities();
   *   console.log(fungibleAssetActivities);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getFungibleAssetActivities(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & WhereArg<FungibleAssetActivitiesBoolExp>;
  }): Promise<GetFungibleAssetActivitiesResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getFungibleAssetActivities({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries all fungible asset balances.
   *
   * @param args Optional parameters for the query.
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying.
   * @param args.options Optional configuration for pagination and filtering.
   *
   * @returns A list of fungible asset metadata.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching current fungible asset balances
   *   const fungibleAssetBalances = await aptos.getCurrentFungibleAssetBalances();
   *
   *   console.log(fungibleAssetBalances);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getCurrentFungibleAssetBalances(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & WhereArg<CurrentFungibleAssetBalancesBoolExp>;
  }): Promise<GetCurrentFungibleAssetBalancesResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.FUNGIBLE_ASSET_PROCESSOR,
    });
    return getCurrentFungibleAssetBalances({ aptosConfig: this.config, ...args });
  }

  /**
   * Transfer a specified amount of fungible asset from the sender's primary store to the recipient's primary store.
   * This method allows you to transfer any fungible asset, including fungible tokens.
   *
   * @param args - The arguments for the transfer operation.
   * @param args.sender - The sender account.
   * @param args.fungibleAssetMetadataAddress - The fungible asset account address. For example, if you’re transferring USDT,
   * this would be the USDT address.
   * @param args.recipient - The recipient account address.
   * @param args.amount - The number of assets to transfer.
   * @param args.options - Optional parameters for generating the transaction.
   *
   * @returns A SimpleTransaction that can be simulated or submitted to the chain.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Transfer fungible asset from sender to recipient
   *   const transaction = await aptos.transferFungibleAsset({
   *     sender: Account.generate(), // replace with a real sender account
   *     fungibleAssetMetadataAddress: "0x123", // replace with a real fungible asset address
   *     recipient: "0x456", // replace with a real recipient account
   *     amount: 5
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async transferFungibleAsset(args: {
    sender: Account;
    fungibleAssetMetadataAddress: AccountAddressInput;
    recipient: AccountAddressInput;
    amount: AnyNumber;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return transferFungibleAsset({ aptosConfig: this.config, ...args });
  }
}
