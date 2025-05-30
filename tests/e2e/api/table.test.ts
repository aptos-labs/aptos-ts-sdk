import { getCedraClient } from "../helper";

const { cedra } = getCedraClient();
let resource: Supply;

type Supply = {
  supply: {
    vec: [
      {
        aggregator: {
          vec: [{ handle: string; key: string }];
        };
      },
    ];
  };
};

describe("table", () => {
  beforeAll(async () => {
    resource = await cedra.getAccountResource<Supply>({
      accountAddress: "0x1",
      resourceType: "0x1::coin::CoinInfo<0x1::cedra_coin::CedraCoin>",
    });
  });

  test("it fetches table item", async () => {
    const { handle, key } = resource.supply.vec[0].aggregator.vec[0];

    const supply = await cedra.getTableItem<string>({
      handle,
      data: {
        key_type: "address",
        value_type: "u128",
        key,
      },
    });

    expect(parseInt(supply, 10)).toBeGreaterThan(0);
  });

  test("it fetches table items data", async () => {
    const { handle } = resource.supply.vec[0].aggregator.vec[0];

    const data = await cedra.getTableItemsData({
      options: { where: { table_handle: { _eq: handle }, transaction_version: { _eq: 0 } } },
    });

    expect(data[0].decoded_key).toEqual("0x619dc29a0aac8fa146714058e8dd6d2d0f3bdf5f6331907bf91f3acd81e6935");
    expect(data[0].decoded_value).toEqual("10");
    expect(data[0].key).toEqual("0x0619dc29a0aac8fa146714058e8dd6d2d0f3bdf5f6331907bf91f3acd81e6935");
  });

  test("it fetches table items metadata data", async () => {
    const { handle } = resource.supply.vec[0].aggregator.vec[0];

    const data = await cedra.getTableItemsMetadata({
      options: { where: { handle: { _eq: handle } } },
    });

    expect(data[0].value_type).toEqual("u128");
    expect(data[0].key_type).toEqual("address");
  });
});
