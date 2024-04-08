// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";

// use it here since all tests use the same configuration
const { aptos } = getAptosClient();

// Disable these tests for now until we can test against LOCAL
describe("Collection", () => {
  test("it creates a new collection on chain and fetches its data", async () => {
    const creator = Account.generate();
    const creatorAddress = creator.accountAddress;
    const collectionName = "Aptos Test NFT Collection";
    const collectionDescription = "My new collection!";
    const collectionUri = "https://aptos.dev";

    await aptos.fundAccount({ accountAddress: creatorAddress, amount: FUND_AMOUNT });

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

    expect(data.collection_name).toEqual(collectionName);
    expect(data.creator_address).toEqual(creatorAddress.toString());
    expect(data.description).toEqual(collectionDescription);
    expect(data.uri).toEqual(collectionUri);
    expect(data.current_supply).toEqual(0);
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

    // Query again using the collection id should return the same data
    const data2 = await aptos.getCollectionDataByCollectionId({
      collectionId: address,
      minimumLedgerVersion: BigInt(response.version),
    });

    expect(data2.collection_name).toEqual(collectionName);
    expect(data2.creator_address).toEqual(creatorAddress.toString());
    expect(data2.description).toEqual(collectionDescription);
    expect(data2.uri).toEqual(collectionUri);
    expect(data2.current_supply).toEqual(0);
    expect(data2.mutable_description).toEqual(true);
    expect(data2.mutable_uri).toEqual(true);
    expect(data2.token_standard).toEqual("v2");

    expect(data2).toHaveProperty("max_supply");
    expect(data2).toHaveProperty("collection_id");
    expect(data2).toHaveProperty("last_transaction_timestamp");
    expect(data2).toHaveProperty("last_transaction_version");
    expect(data2).toHaveProperty("table_handle_v1");
    expect(data2).toHaveProperty("total_minted_v2");
  });
});
