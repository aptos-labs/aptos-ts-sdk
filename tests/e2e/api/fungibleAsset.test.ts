// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, APTOS_COIN } from "../../../src";
import { getAptosClient } from "../helper";

const { aptos } = getAptosClient();

describe("FungibleAsset", () => {
  test("it should fetch fungible asset metadata", async () => {
    const data = await aptos.getFungibleAssetMetadata({
      options: {
        where: {
          asset_type: { _eq: APTOS_COIN },
        },
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0]).toHaveProperty("asset_type");
    expect(data[0].asset_type).toEqual(APTOS_COIN);
  });

  test("it should fetch a specific fungible asset metadata by an asset type", async () => {
    let data = await aptos.getFungibleAssetMetadataByAssetType({ assetType: APTOS_COIN });
    expect(data.asset_type).toEqual(APTOS_COIN);

    // fetch by something that doesn't exist
    data = await aptos.getFungibleAssetMetadataByAssetType({ assetType: "0x1::aptos_coin::testnotexist" });
    expect(data).toBeUndefined();
  });

  test("it should fetch a specific fungible asset metadata by a creator address", async () => {
    let data = await aptos.getFungibleAssetMetadataByCreatorAddress({
      creatorAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
    });
    expect(data[1].asset_type).toEqual(APTOS_COIN);

    // fetch by something that doesn't exist
    data = await aptos.getFungibleAssetMetadataByCreatorAddress({ creatorAddress: "0xc" });
    expect(data).toEqual([]);
  });

  test("it should fetch fungible asset activities with correct number and asset type ", async () => {
    const data = await aptos.getFungibleAssetActivities({
      options: {
        limit: 2,
        where: {
          asset_type: { _eq: APTOS_COIN },
        },
      },
    });
    expect(data.length).toEqual(2);
    expect(data[0].asset_type).toEqual(APTOS_COIN);
    expect(data[1].asset_type).toEqual(APTOS_COIN);
  });

  test("it should fetch current fungible asset balance", async () => {
    const userAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: userAccount.accountAddress, amount: 1_000 });

    const APT_COIN_TYPE = "0x1::aptos_coin::AptosCoin";
    const data = await aptos.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: userAccount.accountAddress.toString() },
          asset_type: { _eq: APTOS_COIN },
        },
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0].asset_type).toEqual(APT_COIN_TYPE);
    expect(data[0].amount).toEqual(1_000);
  });
});
