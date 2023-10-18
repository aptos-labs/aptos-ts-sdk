// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos, Account } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { Network } from "../../../src/utils/apiEndpoints";
import { FUND_AMOUNT } from "../../unit/helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

const collectionName = "Test Collection";
const collectionDescription = "My new collection!";
const collectionUri = "http://aptos.dev";

const tokenName = "Test Token";
const tokenDescription = "my first nft";
const tokenUri = "http://aptos.dev/nft";

const creator = Account.generate();
const creatorAddress = creator.accountAddress.toString();

async function setupCollection() {
  await aptos.fundAccount({ accountAddress: creator.accountAddress.toString(), amount: FUND_AMOUNT });
  const transaction = await aptos.createCollectionTransaction({
    creator,
    description: collectionDescription,
    name: collectionName,
    uri: collectionUri,
  });
  const response = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
  await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
}

async function setupToken(): Promise<string> {
  const transaction = await aptos.mintTokenTransaction({
    creator,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenUri,
  });
  const response = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
  await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
  return (
    await aptos.getOwnedTokens({
      ownerAddress: creator.accountAddress.toString(),
    })
  )[0].current_token_data?.token_data_id!;
}

describe("token api", () => {
  let tokenAddress: string;

  beforeAll(async () => {
    await setupCollection();
    tokenAddress = await setupToken();
  });

  test("it gets token data for a token's address", async () => {
    const tokenData = await aptos.getTokenData({ tokenAddress });

    expect(tokenData.token_data_id).toEqual(tokenAddress);
    expect(tokenData.description).toEqual(tokenDescription);
    expect(tokenData.token_name).toEqual(tokenName);
    expect(tokenData.token_data_id).toEqual(tokenAddress);
    expect(tokenData.current_collection?.collection_name).toEqual(collectionName);
    expect(tokenData.current_collection?.creator_address).toEqual(creatorAddress);
  });

  test("it gets an owner's tokens", async () => {
    const tokenData = (await aptos.getOwnedTokens({ ownerAddress: creatorAddress }))[0];
    
    expect(tokenData.token_data_id).toEqual(tokenAddress);
    expect(tokenData.owner_address).toEqual(creatorAddress);
    expect(tokenData.current_token_data?.description).toEqual(tokenDescription);
    expect(tokenData.current_token_data?.token_name).toEqual(tokenName);
    expect(tokenData.current_token_data?.token_uri).toEqual(tokenUri);
  });

  test("it gets ownership data given a token's address", async () => {
    const tokenOwnershipData = await aptos.getCurrentTokenOwnership({ tokenAddress });
    
    expect(tokenOwnershipData.token_data_id).toEqual(tokenAddress);
    expect(tokenOwnershipData.owner_address).toEqual(creatorAddress);
    expect(tokenOwnershipData.current_token_data?.description).toEqual(tokenDescription);
    expect(tokenOwnershipData.current_token_data?.token_name).toEqual(tokenName);
    expect(tokenOwnershipData.current_token_data?.token_uri).toEqual(tokenUri);
  });

  test("it gets activity data given a token's address", async () => {
    const tokenActivityData = await aptos.getTokenActivity({ tokenAddress });

    expect(tokenActivityData[0].entry_function_id_str).toEqual("0x4::aptos_token::mint");
    expect(tokenActivityData[0].token_data_id).toEqual(tokenAddress);
    expect(tokenActivityData[0].from_address).toEqual(creatorAddress);
    expect(tokenActivityData[0].is_fungible_v2).toEqual(false);
  });
});
