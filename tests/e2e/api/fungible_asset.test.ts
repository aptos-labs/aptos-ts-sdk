// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, AptosConfig, Network } from "../../../src";
import { FungibleAssetMetadataBoolExp } from "../../../src/types/generated/types";

describe("FungibleAsset", () => {
  test("it should fetch fungible asset metadata", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const APT_COIN_TYPE = "0x1::aptos_coin::AptosCoin";
    const data = await aptos.getFungibleAssetMetadata({
      options: {
        where: {
          asset_type: { _eq: APT_COIN_TYPE },
        } as FungibleAssetMetadataBoolExp,
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0]).toHaveProperty("asset_type");
    expect(data[0].asset_type).toEqual(APT_COIN_TYPE);
  });
});
