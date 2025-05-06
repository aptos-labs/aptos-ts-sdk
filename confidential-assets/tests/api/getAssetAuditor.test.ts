import { confidentialAsset, MOCK_TOKEN_DATA } from "../helpers/e2e";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const [{ vec }] = await confidentialAsset.getAssetAuditor({
      tokenAddress: MOCK_TOKEN_DATA.address,
    });

    console.log(vec);

    expect(vec).toBeDefined();
  });
});
