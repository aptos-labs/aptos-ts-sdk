// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, AptosConfig, Network } from "../../../src";
import { FungibleAssetActivitiesBoolExp, FungibleAssetMetadataBoolExp } from "../../../src/types/generated/types";
import { APTOS_COIN } from "../../../src/utils/const";

describe("FungibleAsset", () => {
  test("it should fetch fungible asset metadata", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
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

  test("it should fetch fungible asset activities with correct number and asset type ", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
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
});
