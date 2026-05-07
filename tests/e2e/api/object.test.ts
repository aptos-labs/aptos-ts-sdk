import { getAptosClient } from "../helper";

describe("object", () => {
  test("it fetches an object data", async () => {
    const { aptos } = getAptosClient();
    const object = await aptos.getObjectDataByObjectAddress({
      objectAddress: "0x000000000000000000000000000000000000000000000000000000000000000a",
    });
    expect(object.owner_address).toEqual("0x0000000000000000000000000000000000000000000000000000000000000001");
  });
});
