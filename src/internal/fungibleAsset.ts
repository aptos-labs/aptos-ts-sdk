// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/fungible_asset}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * fungible_asset namespace and without having a dependency cycle error.
 * @group Implementation
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

/**
 * Retrieves metadata for fungible assets based on specified criteria.
 * This function allows you to filter and paginate through fungible asset metadata.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration for Aptos.
 * @param [args.options] - Optional parameters for pagination and filtering.
 * @param [args.options.limit] - The maximum number of results to return.
 * @param [args.options.offset] - The number of results to skip before starting to collect the result set.
 * @param [args.options.where] - Conditions to filter the results.
 * @group Implementation
 */
export async function getFungibleAssetMetadata(args: {
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

/**
 * Retrieves the activities associated with fungible assets.
 * This function allows you to filter and paginate through the activities based on specified conditions.
 *
 * @param args - The arguments for retrieving fungible asset activities.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param [args.options] - Optional parameters for pagination and filtering.
 * @param [args.options.limit] - The maximum number of activities to retrieve.
 * @param [args.options.offset] - The number of activities to skip before starting to collect the result set.
 * @param [args.options.where] - Conditions to filter the activities.
 * @returns A promise that resolves to an array of fungible asset activities.
 * @group Implementation
 */
export async function getFungibleAssetActivities(args: {
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

/**
 * Retrieves the current balances of fungible assets for a specified configuration.
 *
 * @param args - The arguments for retrieving fungible asset balances.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the results.
 * @param args.options.where - Conditions to filter the results based on specific criteria.
 * @returns The current balances of fungible assets.
 * @group Implementation
 */
export async function getCurrentFungibleAssetBalances(args: {
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

/**
 * Transfers a specified amount of a fungible asset from the sender to the recipient.
 * This function helps facilitate the transfer of digital assets between accounts on the Aptos blockchain.
 *
 * @param args - The parameters for the transfer operation.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.sender - The account initiating the transfer.
 * @param args.fungibleAssetMetadataAddress - The address of the fungible asset's metadata.
 * @param args.recipient - The address of the account receiving the asset.
 * @param args.amount - The amount of the fungible asset to transfer.
 * @param args.options - Optional settings for generating the transaction.
 * @group Implementation
 */
export async function transferFungibleAsset(args: {
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
