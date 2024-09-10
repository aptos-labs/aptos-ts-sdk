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
 * A class to query all `FungibleAsset` related queries on Aptos.
 */
export class FungibleAsset {
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
 *   const fungibleAssets = await aptos.getFungibleAssetMetadata({
 *     minimumLedgerVersion: 1, // replace with a real ledger version if needed
 *     options: {
 *       limit: 10, // specify the number of results to return
 *       offset: 0, // specify the starting point for results
 *     },
 *   });
 * 
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
 * Queries fungible asset metadata by the specified asset type.
 * This function retrieves detailed metadata for a specific fungible asset.
 * 
 * @param args - The arguments for the query.
 * @param args.assetType - The asset type of the fungible asset, e.g., 
 * "0x1::aptos_coin::AptosCoin" for Aptos Coin or 
 * "0xc2948283c2ce03aafbb294821de7ee684b06116bb378ab614fa2de07a99355a8" for address format.
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
 *   // Fetch fungible asset metadata for a specific asset type
 *   const fungibleAsset = await aptos.getFungibleAssetMetadataByAssetType({
 *     assetType: "0x1::aptos_coin::AptosCoin" // replace with a real asset type if needed
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
 * Queries fungible asset metadata by the creator address.
 * This function retrieves the metadata for a specific fungible asset created by the provided address.
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
 *   // Fetch fungible asset metadata by creator address
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
 * Queries all fungible asset activities.
 *
 * @param args Optional parameters for querying fungible asset activities.
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
 *   // Fetching fungible asset activities
 *   const fungibleAssetActivities = await aptos.getFungibleAssetActivities({
 *     minimumLedgerVersion: 1, // specify your own ledger version if needed
 *     options: {
 *       limit: 10, // specify your own limit if needed
 *       offset: 0, // specify your own offset if needed
 *     },
 *   });
 *
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
 * @param args Optional parameters for querying fungible asset balances.
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
 *   // Fetch current fungible asset balances
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
 * This method can be used to transfer any fungible asset, including fungible tokens.
 *
 * @param args - The parameters for the transfer operation.
 * @param args.sender - The sender account.
 * @param args.fungibleAssetMetadataAddress - The fungible asset account address. For example, if you’re transferring USDT, this would be the USDT address.
 * @param args.recipient - The recipient account address.
 * @param args.amount - The number of assets to transfer.
 * @param args.options - Optional parameters for generating the transaction.
 *
 * @returns A SimpleTransaction that can be simulated or submitted to the chain.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Replace with a real sender account
 *   const recipient = "0x456"; // Replace with a real recipient account
 *   const fungibleAssetMetadataAddress = "0x123"; // Replace with a real fungible asset address
 * 
 *   // Transfer 5 units of the fungible asset
 *   const transaction = await aptos.transferFungibleAsset({
 *     sender,
 *     fungibleAssetMetadataAddress,
 *     recipient,
 *     amount: 5,
 *   });
 * 
 *   console.log("Transaction created:", transaction);
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