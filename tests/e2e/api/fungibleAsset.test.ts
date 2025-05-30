// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, CEDRA_COIN, CEDRA_FA } from "../../../src";
import { getCedraClient } from "../helper";

const { cedra } = getCedraClient();

describe("FungibleAsset", () => {
  test("it should fetch fungible asset metadata", async () => {
    const data = await cedra.getFungibleAssetMetadata({
      options: {
        where: {
          asset_type: { _eq: CEDRA_COIN },
        },
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0]).toHaveProperty("asset_type");
    expect(data[0].asset_type).toEqual(CEDRA_COIN);
  });

  test("it should fetch a specific fungible asset metadata by an asset type", async () => {
    let data = await cedra.getFungibleAssetMetadataByAssetType({ assetType: CEDRA_COIN });
    expect(data.asset_type).toEqual(CEDRA_COIN);

    // fetch by something that doesn't exist
    data = await cedra.getFungibleAssetMetadataByAssetType({ assetType: "0x1::cedra_coin::testnotexist" });
    expect(data).toBeUndefined();
  });

  test("it should fetch a specific fungible asset metadata by a creator address", async () => {
    let data = await cedra.getFungibleAssetMetadataByCreatorAddress({
      creatorAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
    });
    expect(data[1].asset_type).toEqual(CEDRA_FA);

    // fetch by something that doesn't exist
    data = await cedra.getFungibleAssetMetadataByCreatorAddress({ creatorAddress: "0xc" });
    expect(data).toEqual([]);
  });

  test("it should fetch fungible asset activities with correct number and asset type ", async () => {
    const data = await cedra.getFungibleAssetActivities({
      options: {
        limit: 2,
        where: {
          asset_type: { _eq: CEDRA_COIN },
        },
      },
    });
    expect(data.length).toEqual(2);
    expect(data[0].asset_type).toEqual(CEDRA_COIN);
    expect(data[1].asset_type).toEqual(CEDRA_COIN);
  });

  test("it should fetch current fungible asset balance", async () => {
    const userAccount = Account.generate();
    await cedra.fundAccount({ accountAddress: userAccount.accountAddress, amount: 1_000 });

    const APT_COIN_TYPE = "0x1::cedra_coin::CedraCoin";
    const data = await cedra.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: userAccount.accountAddress.toString() },
          asset_type: { _eq: CEDRA_COIN },
        },
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0].asset_type).toEqual(APT_COIN_TYPE);
    expect(data[0].amount).toEqual(1_000);
  });
});
