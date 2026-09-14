import { getAptosClient } from "../helper.js";

const { aptos } = getAptosClient();

// AptosCoin CoinInfo supply no longer uses a table-backed aggregator on recent
// localnets (ConcurrentSupply / integer supply). Use the stable genesis
// coin-to-FA pairing table instead: TypeInfo -> Object<Metadata>.
type TypeInfoKey = {
  account_address: string;
  module_name: string;
  struct_name: string;
};

describe("table", () => {
  let handle: string;
  let keyType: string;
  let valueType: string;
  let sampleKey: TypeInfoKey;
  let sampleDecodedKey: unknown;
  let sampleDecodedValue: unknown;
  let sampleRawKey: string;

  beforeAll(async () => {
    const metadatas = await aptos.getTableItemsMetadata({
      options: {
        where: { key_type: { _eq: "0x1::type_info::TypeInfo" } },
        limit: 1,
      },
    });
    expect(metadatas.length).toBeGreaterThan(0);
    handle = metadatas[0].handle;
    keyType = metadatas[0].key_type;
    valueType = metadatas[0].value_type;

    const items = await aptos.getTableItemsData({
      options: {
        where: { table_handle: { _eq: handle }, transaction_version: { _eq: 0 } },
        limit: 1,
      },
    });
    expect(items.length).toBeGreaterThan(0);
    sampleDecodedKey = items[0].decoded_key;
    sampleDecodedValue = items[0].decoded_value;
    sampleRawKey = items[0].key;

    // REST getTableItem expects hex-encoded Move strings without the 0x prefix.
    const decoded = items[0].decoded_key as TypeInfoKey;
    sampleKey = {
      account_address: decoded.account_address,
      module_name: decoded.module_name.replace(/^0x/, ""),
      struct_name: decoded.struct_name.replace(/^0x/, ""),
    };
  });

  test("it fetches table item", async () => {
    const value = await aptos.getTableItem<unknown>({
      handle,
      data: {
        key_type: keyType,
        value_type: valueType,
        key: sampleKey,
      },
    });

    expect(value).toEqual(sampleDecodedValue);
  });

  test("it fetches table items data", async () => {
    const data = await aptos.getTableItemsData({
      options: { where: { table_handle: { _eq: handle }, transaction_version: { _eq: 0 } }, limit: 1 },
    });

    expect(data[0].decoded_key).toEqual(sampleDecodedKey);
    expect(data[0].decoded_value).toEqual(sampleDecodedValue);
    expect(data[0].key).toEqual(sampleRawKey);
  });

  test("it fetches table items metadata data", async () => {
    const data = await aptos.getTableItemsMetadata({
      options: { where: { handle: { _eq: handle } } },
    });

    expect(data[0].value_type).toEqual(valueType);
    expect(data[0].key_type).toEqual(keyType);
  });
});
