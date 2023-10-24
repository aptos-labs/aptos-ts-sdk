// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import {
  CurrentFungibleAssetBalancesBoolExp,
  FungibleAssetActivitiesBoolExp,
  FungibleAssetMetadataBoolExp,
} from "../../../src/types/generated/types";
import { APTOS_COIN } from "../../../src/utils/const";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

describe("FungibleAsset", () => {
  test("it should fetch fungible asset metadata", async () => {
    const data = await aptos.getFungibleAssetMetadata({
      options: {
        where: {
          asset_type: { _eq: APTOS_COIN },
        } as FungibleAssetMetadataBoolExp,
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0]).toHaveProperty("asset_type");
    expect(data[0].asset_type).toEqual(APTOS_COIN);
  });

  test("it should fetch a specific fungible asset metadata", async () => {
    const data = await aptos.getFungibleAssetMetadataByAssetType(APTOS_COIN);
    expect(data.asset_type).toEqual(APTOS_COIN);
  });

  test("it should fetch fungible asset activities with correct number and asset type ", async () => {
    const data = await aptos.getFungibleAssetActivities({
      options: {
        pagination: {
          limit: 2,
        },
        where: {
          asset_type: { _eq: APTOS_COIN },
        } as FungibleAssetActivitiesBoolExp,
      },
    });
    expect(data.length).toEqual(2);
    expect(data[0].asset_type).toEqual(APTOS_COIN);
    expect(data[1].asset_type).toEqual(APTOS_COIN);
  });

  test("it should fetch current fungible asset balance", async () => {
    const userAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: userAccount.accountAddress.toString(), amount: 1_000 });

    const APT_COIN_TYPE = "0x1::aptos_coin::AptosCoin";
    const data = await aptos.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: userAccount.accountAddress.toString() },
          asset_type: { _eq: APTOS_COIN },
        } as CurrentFungibleAssetBalancesBoolExp,
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0].asset_type).toEqual(APT_COIN_TYPE);
    expect(data[0].amount).toEqual(1_000);
  });
});
