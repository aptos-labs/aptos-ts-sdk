// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos } from "../../../src";
import { Network } from "../../../src/utils/apiEndpoints";

describe("token api", () => {
  test.skip("it gets token data for a token's address", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
    const tokenAddress = "0x0cb098d8f875f38dcb4109e2638e3e24055a585ed2143e9ba76e002fea303795";
    const tokenData = await aptos.getTokenData({ tokenAddress });
    expect(tokenData).toHaveProperty("description");
    expect(tokenData).toHaveProperty("current_collection");
    expect(tokenData).toHaveProperty("token_data_id");
    expect(tokenData.current_collection).toHaveProperty("collection_id");
    expect(tokenData.current_collection).toHaveProperty("collection_name");
    expect(tokenData.current_collection).toHaveProperty("creator_address");
  });
});
