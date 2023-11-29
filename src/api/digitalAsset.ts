// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AnyNumber,
  GetCollectionDataResponse,
  GetCurrentTokenOwnershipResponse,
  GetOwnedTokensResponse,
  GetTokenActivityResponse,
  GetTokenDataResponse,
  MoveStructId,
  OrderByArg,
  PaginationArgs,
  TokenStandard,
  TokenStandardArg,
} from "../types";
import { Account, AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
import {
  CreateCollectionOptions,
  createCollectionTransaction,
  getCollectionData,
  getCollectionId,
  getCurrentTokenOwnership,
  getOwnedTokens,
  getTokenActivity,
  getTokenData,
  mintTokenTransaction,
  transferDigitalAsset,
} from "../internal/digitalAsset";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `DigitalAsset` related queries on Aptos.
 */
export class DigitalAsset {
  constructor(readonly config: AptosConfig) {}

  /**
   * Creates a new collection within the specified account
   *
   * @param args.creator the account of the collection's creator
   * @param args.description the description of the collection
   * @param args.name the name of the collection
   * @param args.uri the URI to additional info about the collection
   *
   * The parameters below are optional.
   * @param args.maxSupply controls the max supply of the tokens - defaults MAX_U64_BIG_INT
   * @param args.mutableDescription controls mutability of the collection's description - defaults true
   * @param args.mutableRoyalty controls mutability of the collection's description - defaults true
   * @param args.mutableUri controls mutability of the collection's URI - defaults true
   * @param args.mutableTokenDescription controls mutability of the token's description - defaults true
   * @param args.mutableTokenName controls mutability of the token's name - defaults true
   * @param args.mutableTokenProperties controls mutability of token's properties - defaults true
   * @param args.mutableTokenUri controls mutability of the token's URI - defaults true
   * @param args.tokensBurnableByCreator controls whether tokens can be burnable by the creator - defaults true
   * @param args.tokensFreezableByCreator controls whether tokens can be frozen by the creator - defaults true
   * @param args.royaltyNumerator the numerator of the royalty to be paid to the creator when a token is transferred - defaults 0
   * @param args.royaltyDenominator the denominator of the royalty to be paid to the creator when a token is transferred -
   *    defaults 1
   *
   * @returns A SingleSignerTransaction that when submitted will create the collection.
   */
  async createCollectionTransaction(
    args: {
      creator: Account;
      description: string;
      name: string;
      uri: string;
      options?: InputGenerateTransactionOptions;
    } & CreateCollectionOptions,
  ): Promise<SingleSignerTransaction> {
    return createCollectionTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries data of a specific collection by the collection creator address and the collection name.
   *
   * If, for some reason, a creator account has 2 collections with the same name in v1 and v2,
   * can pass an optional `tokenStandard` parameter to query a specific standard
   *
   * @param args.creatorAddress the address of the collection's creator
   * @param args.collectionName the name of the collection
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @param args.options.tokenStandard the token standard to query
   * @returns GetCollectionDataResponse response type
   */
  async getCollectionData(args: {
    creatorAddress: AccountAddressInput;
    collectionName: string;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg;
  }): Promise<GetCollectionDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorTypes: getTokenProcessorTypes(args.options?.tokenStandard),
    });
    return getCollectionData({ aptosConfig: this.config, ...args });
  }

  /**
   * Queries a collection's ID.
   *
   * This is the same as the collection's object address in V2, but V1 does
   * not use objects, and does not have an address
   *
   * @param args.creatorAddress the address of the collection's creator
   * @param args.collectionName the name of the collection
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @param args.options.tokenStandard the token standard to query
   * @returns the collection id
   */
  async getCollectionId(args: {
    creatorAddress: AccountAddressInput;
    collectionName: string;
    minimumLedgerVersion?: AnyNumber;
    options?: TokenStandardArg;
  }): Promise<string> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorTypes: getTokenProcessorTypes(args.options?.tokenStandard),
    });
    return getCollectionId({ aptosConfig: this.config, ...args });
  }

  /**
   * Create a transaction to mint a token into the creators account within an existing collection.
   *
   * @param args.creator the creator of the collection
   * @param args.collection the name of the collection the token belongs to
   * @param args.description the description of the token
   * @param args.name the name of the token
   * @param args.uri the URI to additional info about the token
   *
   * @returns A SingleSignerTransaction that can be simulated or submitted to chain
   */
  async mintTokenTransaction(args: {
    creator: Account;
    collection: string;
    description: string;
    name: string;
    uri: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return mintTokenTransaction({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets token data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetTokenDataResponse containing relevant data to the token.
   */
  async getTokenData(args: {
    tokenAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetTokenDataResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      // TODO(greg): Should take in a consistent input for token queries
      processorTypes: getTokenProcessorTypes(undefined),
    });
    return getTokenData({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets token ownership data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetCurrentTokenOwnershipResponse containing relevant ownership data of the token.
   */
  async getCurrentTokenOwnership(args: {
    tokenAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetCurrentTokenOwnershipResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      // TODO(greg): Should take in a consistent input for token queries
      processorTypes: getTokenProcessorTypes(undefined),
    });
    return getCurrentTokenOwnership({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets the tokens that the given address owns.
   *
   * @param args.ownerAddress The address of the owner
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetOwnedTokensResponse containing ownership data of the tokens belonging to the ownerAddresss.
   */
  async getOwnedTokens(args: {
    ownerAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetOwnedTokensResponse[0]>;
  }): Promise<GetOwnedTokensResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      // TODO(greg): Should take in a consistent input for token queries
      processorTypes: getTokenProcessorTypes(undefined),
    });
    return getOwnedTokens({ aptosConfig: this.config, ...args });
  }

  /**
   * Gets the activity data given the address of a token.
   *
   * @param args.tokenAddress The address of the token
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @returns GetTokenActivityResponse containing relevant activity data to the token.
   */
  async getTokenActivity(args: {
    tokenAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetTokenActivityResponse[0]>;
  }): Promise<GetTokenActivityResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      // TODO(greg): Should take in a consistent input for token queries
      processorTypes: getTokenProcessorTypes(undefined),
    });
    return getTokenActivity({ aptosConfig: this.config, ...args });
  }

  /**
   * Transfer a digital asset (non fungible token) ownership.
   *
   * We can transfer a digital asset only when the digital asset is not frozen
   * (i.e. owner transfer is not disabled such as for soul bound tokens)
   *
   * @param args.sender The sender account of the current digital asset owner
   * @param args.digitalAssetAddress The digital asset address
   * @param args.recipient The recipient account address
   * @param args.digitalAssetType optional. The digital asset type, default to "0x4::token::Token"
   *
   * @returns A SingleSignerTransaction that can be simulated or submitted to chain
   */
  async transferDigitalAsset(args: {
    sender: Account;
    digitalAssetAddress: AccountAddressInput;
    recipient: AccountAddress;
    digitalAssetType?: MoveStructId;
    options?: InputGenerateTransactionOptions;
  }): Promise<SingleSignerTransaction> {
    return transferDigitalAsset({ aptosConfig: this.config, ...args });
  }
}

function getTokenProcessorTypes(tokenStandard?: TokenStandard) {
  switch (tokenStandard) {
    case "v1":
      return [ProcessorType.TOKEN_PROCESSOR];
    case "v2":
      return [ProcessorType.TOKEN_V2_PROCESSOR];
    default:
      // If it's something we don't recognize, or undefined, just do both
      return [ProcessorType.TOKEN_PROCESSOR, ProcessorType.TOKEN_V2_PROCESSOR];
  }
}
