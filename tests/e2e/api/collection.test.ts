// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";

// use it here since all tests use the same configuration
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

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
  });
});
