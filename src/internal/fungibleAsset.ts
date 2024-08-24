// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/fungible_asset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * fungible_asset namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import {
  AnyNumber,
  GetCurrentFungibleAssetBalancesResponse,
  GetFungibleAssetActivitiesResponse,
  GetFungibleAssetMetadataResponse,
  PaginationArgs,
  WhereArg,
} from "../types";
import { queryIndexer } from "./general";
import {
  GetCurrentFungibleAssetBalances,
  GetFungibleAssetActivities,
  GetFungibleAssetMetadata,
} from "../types/generated/queries";
import {
  GetCurrentFungibleAssetBalancesQuery,
  GetFungibleAssetActivitiesQuery,
  GetFungibleAssetMetadataQuery,
} from "../types/generated/operations";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../types/generated/types";
import { AccountAddressInput } from "../core";
import { Account } from "../account";
import {
  EntryFunctionABI,
  InputGenerateTransactionOptions,
  parseTypeTag,
  TypeTagAddress,
  TypeTagU64,
} from "../transactions";
import { generateTransaction } from "./transactionSubmission";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

export async

/**
 * Retrieves metadata for fungible assets from the Aptos blockchain.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.options - Optional pagination and filtering parameters.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the result set.
 * @param args.options.where - Conditions to filter the results.
 * 
 * @returns An array of fungible asset metadata.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch fungible asset metadata
 *   const metadata = await aptos.getFungibleAssetMetadata({
 *     aptosConfig: config,
 *     options: {
 *       limit: 10, // Specify the number of results to return
 *       where: {
 *         creator_address: { _eq: "0x1" }, // Replace with a real creator address
 *       },
 *     },
 *   });
 * 
 *   console.log(metadata);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getFungibleAssetMetadata(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & WhereArg<FungibleAssetMetadataBoolExp>;
}): Promise<GetFungibleAssetMetadataResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetFungibleAssetMetadata,
    variables: {
      where_condition: options?.where,
      limit: options?.limit,
      offset: options?.offset,
    },
  };

  const data = await queryIndexer<GetFungibleAssetMetadataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getFungibleAssetMetadata",
  });

  return data.fungible_asset_metadata;
}

export async

/**
 * Retrieves fungible asset activities based on the specified options.
 * 
 * @param args - The arguments for fetching fungible asset activities.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.options - Optional parameters for pagination and filtering the results.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the results.
 * @param args.options.where - Conditions to filter the activities.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching fungible asset activities with pagination options
 *   const activities = await aptos.getFungibleAssetActivities({
 *     aptosConfig: config,
 *     options: {
 *       limit: 10, // Specify the number of results to return
 *       offset: 0, // Specify the number of results to skip
 *       where: { /* conditions for filtering */ }, // replace with actual conditions
 *     },
 *   });
 * 
 *   console.log(activities);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getFungibleAssetActivities(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & WhereArg<FungibleAssetActivitiesBoolExp>;
}): Promise<GetFungibleAssetActivitiesResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetFungibleAssetActivities,
    variables: {
      where_condition: options?.where,
      limit: options?.limit,
      offset: options?.offset,
    },
  };

  const data = await queryIndexer<GetFungibleAssetActivitiesQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getFungibleAssetActivities",
  });

  return data.fungible_asset_activities;
}

export async

/**
 * Retrieves the current balances of fungible assets for the specified configuration.
 * 
 * @param args - The arguments required to fetch the fungible asset balances.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.options - Optional pagination and filtering parameters.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the results.
 * @param args.options.where - Conditions to filter the results.
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
 *   const balances = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
 *     aptosConfig: config,
 *     options: {
 *       limit: 10, // Specify the number of results to return
 *       offset: 0, // Specify the starting point for results
 *       where: { /* Add your filtering conditions here */ },
 *     },
 *   });
 * 
 *   console.log(balances);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getCurrentFungibleAssetBalances(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & WhereArg<CurrentFungibleAssetBalancesBoolExp>;
}): Promise<GetCurrentFungibleAssetBalancesResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetCurrentFungibleAssetBalances,
    variables: {
      where_condition: options?.where,
      limit: options?.limit,
      offset: options?.offset,
    },
  };

  const data = await queryIndexer<GetCurrentFungibleAssetBalancesQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCurrentFungibleAssetBalances",
  });

  return data.current_fungible_asset_balances;
}

const faTransferAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [] }],
  parameters: [parseTypeTag("0x1::object::Object"), new TypeTagAddress(), new TypeTagU64()],
};

export async

/**
 * Transfers a specified amount of a fungible asset from one account to another.
 * This function helps facilitate the transfer of assets on the Aptos blockchain.
 * 
 * @param args - The parameters required to execute the transfer.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.sender - The account initiating the transfer.
 * @param args.fungibleAssetMetadataAddress - The address of the fungible asset to be transferred.
 * @param args.recipient - The address of the account receiving the asset.
 * @param args.amount - The amount of the asset to transfer.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Generate a new sender account
 *   const recipient = "0x1"; // Replace with a real recipient address
 *   const fungibleAssetMetadataAddress = "0x1"; // Replace with a real fungible asset address
 *   const amount = 100; // Specify the amount to transfer
 * 
 *   // Transfer the fungible asset
 *   const transaction = await aptos.transferFungibleAsset({
 *     aptosConfig: config,
 *     sender,
 *     fungibleAssetMetadataAddress,
 *     recipient,
 *     amount,
 *   });
 * 
 *   console.log("Transaction generated:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function transferFungibleAsset(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  fungibleAssetMetadataAddress: AccountAddressInput;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, fungibleAssetMetadataAddress, recipient, amount, options } = args;
  return generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [fungibleAssetMetadataAddress, recipient, amount],
      abi: faTransferAbi,
    },
    options,
  });
}