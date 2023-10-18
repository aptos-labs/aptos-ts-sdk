// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/collection}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * collection namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Bool, U64 } from "../bcs/serializable/movePrimitives";
import { Account, Hex } from "../core";
import { GenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
import { AnyNumber, GetCollectionDataResponse, HexInput, TokenStandard } from "../types";
import { GetCollectionDataQuery } from "../types/generated/operations";
import { GetCollectionData } from "../types/generated/queries";
import { queryIndexer } from "./general";
import { generateTransaction } from "./transactionSubmission";
import { MoveString } from "../bcs/serializable/moveStructs";
import { MAX_U64_BIG_INT } from "../bcs/consts";

export interface CreateCollectionOptions {
  maxSupply?: AnyNumber;
  mutableDescription?: boolean;
  mutableRoyalty?: boolean;
  mutableURI?: boolean;
  mutableTokenDescription?: boolean;
  mutableTokenName?: boolean;
  mutableTokenProperties?: boolean;
  mutableTokenURI?: boolean;
  tokensBurnableByCreator?: boolean;
  tokensFreezableByCreator?: boolean;
  royaltyNumerator?: number;
  royaltyDenominator?: number;
}

export async function createCollectionTransaction(
  args: {
    aptosConfig: AptosConfig;
    creator: Account;
    description: string;
    name: string;
    uri: string;
    options?: GenerateTransactionOptions;
  } & CreateCollectionOptions,
): Promise<SingleSignerTransaction> {
  const { aptosConfig, options, creator } = args;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: creator.accountAddress.toString(),
    data: {
      function: "0x4::aptos_token::create_collection",
      arguments: [
        // Do not change the order
        new MoveString(args.description),
        new U64(args.maxSupply ?? MAX_U64_BIG_INT),
        new MoveString(args.name),
        new MoveString(args.uri),
        new Bool(args.mutableDescription ?? true),
        new Bool(args.mutableRoyalty ?? true),
        new Bool(args.mutableURI ?? true),
        new Bool(args.mutableTokenDescription ?? true),
        new Bool(args.mutableTokenName ?? true),
        new Bool(args.mutableTokenProperties ?? true),
        new Bool(args.mutableTokenURI ?? true),
        new Bool(args.tokensBurnableByCreator ?? true),
        new Bool(args.tokensFreezableByCreator ?? true),
        new U64(args.royaltyNumerator ?? 0),
        new U64(args.royaltyDenominator ?? 1),
      ],
    },
    options,
  });
  return transaction as SingleSignerTransaction;
}

/**
 * Queries data of a specific collection by the collection creator address and the collection name.
 *
 * if, for some reason, a creator account has 2 collections with the same name in v1 and v2,
 * can pass an optional `tokenStandard` parameter to query a specific standard
 *
 * @param creatorAddress the address of the collection's creator
 * @param collectionName the name of the collection
 * @returns GetCollectionDataResponse response type
 */
export async function getCollectionData(args: {
  aptosConfig: AptosConfig;
  creatorAddress: HexInput;
  collectionName: string;
  options?: {
    tokenStandard?: TokenStandard;
  };
}): Promise<GetCollectionDataResponse> {
  const { aptosConfig, creatorAddress, collectionName, options } = args;
  const address = Hex.fromHexInput(creatorAddress).toString();

  const whereCondition: any = {
    collection_name: { _eq: collectionName },
    creator_address: { _eq: address },
  };

  if (options?.tokenStandard) {
    whereCondition.token_standard = { _eq: options?.tokenStandard };
  }

  const graphqlQuery = {
    query: GetCollectionData,
    variables: {
      where_condition: whereCondition,
    },
  };
  const data = await queryIndexer<GetCollectionDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getCollectionData",
  });

  if (data.current_collections_v2.length === 0) {
    throw Error("Collection not found");
  }

  if (data.current_collections_v2.length > 1) {
    throw Error(
      "More than one collection with the same name found.  Use args.options.tokenStandard to specify v1 or v2",
    );
  }

  return data.current_collections_v2[0];
}

/**
 * Queries a collection's address.
 *
 * @param creatorAddress the collection creator address
 * @param collectionName the collection name
 * @returns the collection address
 */
export async function getCollectionId(args: {
  aptosConfig: AptosConfig;
  creatorAddress: HexInput;
  collectionName: string;
  options?: {
    tokenStandard?: TokenStandard;
  };
}): Promise<string> {
  return (await getCollectionData(args)).collection_id;
}
