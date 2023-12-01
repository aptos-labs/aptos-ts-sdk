// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

const collectionName = "Test Collection";
const collectionDescription = "My new collection!";
const collectionUri = "https://aptos.dev";

const tokenName = "Test Token";
const tokenDescription = "my first nft";
const tokenUri = "https://aptos.dev/nft";

const creator = Account.generate();
const creatorAddress = creator.accountAddress.toString();

async function setupCollection(): Promise<string> {
  await aptos.fundAccount({ accountAddress: creator.accountAddress, amount: FUND_AMOUNT });
  const transaction = await aptos.createCollectionTransaction({
    creator,
    description: collectionDescription,
    name: collectionName,
    uri: collectionUri,
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
  const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  const data = await aptos.getCollectionData({
    collectionName,
    creatorAddress,
    minimumLedgerVersion: BigInt(response.version),
  });
  return data.collection_id;
}

async function setupToken(): Promise<string> {
  const transaction = await aptos.mintTokenTransaction({
    creator,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenUri,
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
  const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  return (
    await aptos.getOwnedTokens({
      ownerAddress: creator.accountAddress.toString(),
      minimumLedgerVersion: BigInt(response.version),
    })
  )[0].current_token_data?.token_data_id!;
}

describe("DigitalAsset", () => {
  let tokenAddress: string;

  beforeAll(async () => {
    await setupCollection();
    tokenAddress = await setupToken();
  });

  test("it gets token data for a digital asset's address", async () => {
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

  test("it gets ownership data given a digital asset's address", async () => {
    const tokenOwnershipData = await aptos.getCurrentTokenOwnership({ tokenAddress });

    expect(tokenOwnershipData.token_data_id).toEqual(tokenAddress);
    expect(tokenOwnershipData.owner_address).toEqual(creatorAddress);
    expect(tokenOwnershipData.current_token_data?.description).toEqual(tokenDescription);
    expect(tokenOwnershipData.current_token_data?.token_name).toEqual(tokenName);
    expect(tokenOwnershipData.current_token_data?.token_uri).toEqual(tokenUri);
  });

  test("it gets activity data given a digital asset's address", async () => {
    const tokenActivityData = await aptos.getTokenActivity({ tokenAddress });

    expect(tokenActivityData[0].entry_function_id_str).toEqual("0x4::aptos_token::mint");
    expect(tokenActivityData[0].token_data_id).toEqual(tokenAddress);
    expect(tokenActivityData[0].from_address).toEqual(creatorAddress);
    expect(tokenActivityData[0].is_fungible_v2).toEqual(false);
  });
  test("it fetches collection data", async () => {
    const data = await aptos.getCollectionData({ collectionName, creatorAddress });

    expect(data.collection_name).toEqual(collectionName);
    expect(data.creator_address).toEqual(creatorAddress);
    expect(data.description).toEqual(collectionDescription);
    expect(data.uri).toEqual(collectionUri);
    expect(data.current_supply).toEqual(1);
    expect(data.mutable_description).toEqual(true);
    expect(data.mutable_uri).toEqual(true);
    expect(data.token_standard).toEqual("v2");

    expect(data).toHaveProperty("max_supply");
    expect(data).toHaveProperty("collection_id");
    expect(data).toHaveProperty("last_transaction_timestamp");
    expect(data).toHaveProperty("last_transaction_version");
    expect(data).toHaveProperty("table_handle_v1");
    expect(data).toHaveProperty("total_minted_v2");

    const address = await aptos.getCollectionId({ collectionName, creatorAddress });
    expect(address).toEqual(data.collection_id);
  });

  test("it transfers digital asset ownership", async () => {
    const digitalAssetReceiver = Account.generate();
    await aptos.fundAccount({ accountAddress: digitalAssetReceiver.accountAddress, amount: FUND_AMOUNT });

    const transaction = await aptos.transferDigitalAsset({
      sender: creator,
      digitalAssetAddress: tokenAddress,
      recipient: digitalAssetReceiver.accountAddress,
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
    await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });

    const tokenData = (await aptos.getOwnedTokens({ ownerAddress: digitalAssetReceiver.accountAddress }))[0];
    expect(tokenData.token_data_id).toEqual(tokenAddress);
    expect(tokenData.owner_address).toEqual(digitalAssetReceiver.accountAddress.toString());
  });
});
