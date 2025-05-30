// Copyright © Cedra Foundation
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
  transferFungibleAssetBetweenStores,
} from "../internal/fungibleAsset";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../types/generated/types";
import { ProcessorType } from "../utils/const";
import { CedraConfig } from "./cedraConfig";
import { waitForIndexerOnVersion } from "./utils";
import { Account } from "../account";
import { AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions } from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class for querying and managing fungible asset-related operations on the Cedra blockchain.
 * @group FungibleAsset
 */
export class FungibleAsset {
  /**
   * Initializes a new instance of the Cedra class with the provided configuration.
   * This allows you to interact with the Cedra blockchain using the specified network settings.
   *
   * @param config - The configuration settings for connecting to the Cedra network.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Cedra client
   *     const config = new CedraConfig({ network: Network.TESTNET }); // Specify your own network if needed
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
   */
  constructor(readonly config: CedraConfig) {}

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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching fungible asset metadata
   *   const fungibleAssets = await cedra.getFungibleAssetMetadata();
   *   console.log(fungibleAssets);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
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
    return getFungibleAssetMetadata({ cedraConfig: this.config, ...args });
  }

  /**
   * Queries the fungible asset metadata for a specific asset type.
   * This function helps retrieve detailed information about a fungible asset based on its type.
   *
   * @param args - The parameters for the query.
   * @param args.assetType - The asset type of the fungible asset, e.g., "0x1::cedra_coin::CedraCoin" for Cedra Coin.
   * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
   *
   * @returns A fungible asset metadata item.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve fungible asset metadata by asset type
   *   const fungibleAsset = await cedra.getFungibleAssetMetadataByAssetType({
   *     assetType: "0x1::cedra_coin::CedraCoin" // replace with your asset type
   *   });
   *
   *   console.log(fungibleAsset);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
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
      cedraConfig: this.config,
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve fungible asset metadata by creator address
   *   const fungibleAsset = await cedra.getFungibleAssetMetadataByCreatorAddress({
   *     creatorAddress: "0x123", // replace with a real creator address
   *   });
   *
   *   console.log(fungibleAsset);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
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
      cedraConfig: this.config,
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching fungible asset activities
   *   const fungibleAssetActivities = await cedra.getFungibleAssetActivities();
   *   console.log(fungibleAssetActivities);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
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
    return getFungibleAssetActivities({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching current fungible asset balances
   *   const fungibleAssetBalances = await cedra.getCurrentFungibleAssetBalances();
   *
   *   console.log(fungibleAssetBalances);
   * }
   * runExample().catch(console.error);
   * ```
   * @group FungibleAsset
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
    return getCurrentFungibleAssetBalances({ cedraConfig: this.config, ...args });
  }

  /**
   * Transfer a specified amount of fungible asset from the sender's primary store to the recipient's primary store.
   * This method allows you to transfer any fungible asset, including fungible tokens.
   *
   * @param args - The arguments for the transfer operation.
   * @param args.sender - The sender account.
   * @param args.fungibleAssetMetadataAddress - The fungible asset account address. For example, if you're transferring USDT,
   * this would be the USDT address.
   * @param args.recipient - The recipient account address.
   * @param args.amount - The number of assets to transfer.
   * @param args.options - Optional parameters for generating the transaction.
   *
   * @returns A SimpleTransaction that can be simulated or submitted to the chain.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Transfer fungible asset from sender to recipient
   *   const transaction = await cedra.transferFungibleAsset({
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
   * @group FungibleAsset
   */
  async transferFungibleAsset(args: {
    sender: Account;
    fungibleAssetMetadataAddress: AccountAddressInput;
    recipient: AccountAddressInput;
    amount: AnyNumber;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return transferFungibleAsset({ cedraConfig: this.config, ...args });
  }

  /**
   * Transfer a specified amount of fungible asset from the sender's any (primary or secondary) fungible store to any (primary or secondary) fungible store.
   * This method allows you to transfer any fungible asset, including fungible tokens.
   *
   * @param args - The arguments for the transfer operation.
   * @param args.sender - The sender account initiating the transfer.
   * @param args.fromStore - The fungible store address initiating the transfer.
   * @param args.toStore - The fungible store address receiving the asset.
   * @param args.amount - The number of assets to transfer. Must be a positive number.
   * @param args.options - Optional parameters for generating the transaction.
   *
   * @returns A SimpleTransaction that can be simulated or submitted to the chain.
   *
   * @throws Error if:
   * - The sender account is invalid
   * - The store addresses are invalid
   * - The amount is negative or zero
   * - The transaction fails to generate
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network, Account } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function transferAssets() {
   *   // Transfer 100 units of the asset from senderStore to recipientStore
   *   const transaction = await cedra.transferFungibleAssetBetweenStores({
   *     sender: Account.generate(), // replace with a real sender account
   *     fromStore: "0x123", // replace with a real fungible store address
   *     toStore: "0x456", // replace with a real fungible store address
   *     amount: 100
   *   });
   *
   *   console.log(transaction);
   * }
   *
   * transferAssets().catch(console.error);
   * ```
   * @group FungibleAsset
   */
  async transferFungibleAssetBetweenStores(args: {
    sender: Account;
    fromStore: AccountAddressInput;
    toStore: AccountAddressInput;
    amount: AnyNumber;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return transferFungibleAssetBetweenStores({ cedraConfig: this.config, ...args });
  }
}
