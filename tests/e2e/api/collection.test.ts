// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// import { Aptos, AptosConfig, Network } from "../../../src";

// Disable these tests for now until we can test against LOCAL
describe("Collection", () => {
  test("it should get collection data", async () => {
    /*
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);

    const collectionName = "BoredApePixels";
    const creatorAddress = "0x3d5886363f0a09578b71361ccc86a65310ff2782a0ec18f9a250c9bb0ac46ac5";
    const data = await aptos.getCollectionData({ collectionName, creatorAddress });
    expect(data).toHaveProperty("collection_id");
    expect(data).toHaveProperty("collection_name");
    expect(data).toHaveProperty("creator_address");
    expect(data).toHaveProperty("current_supply");
    expect(data).toHaveProperty("description");
    expect(data).toHaveProperty("last_transaction_timestamp");
    expect(data).toHaveProperty("last_transaction_version");
    expect(data).toHaveProperty("max_supply");
    expect(data).toHaveProperty("mutable_description");
    expect(data).toHaveProperty("mutable_uri");
    expect(data).toHaveProperty("table_handle_v1");
    expect(data).toHaveProperty("token_standard");
    expect(data).toHaveProperty("total_minted_v2");
    expect(data).toHaveProperty("uri");
    */
  });

  test("it should get a collection's address", async () => {
    /*
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);

    const collectionName = "BoredApePixels";
    const creatorAddress = "0x3d5886363f0a09578b71361ccc86a65310ff2782a0ec18f9a250c9bb0ac46ac5";
    const address = await aptos.getCollectionAddress({ collectionName, creatorAddress });
    expect(address).toEqual("0x5e298466bb613f881f3157ddafe2ce217d207fd634048242bff642d4bcd67503");
    */
  });
});
