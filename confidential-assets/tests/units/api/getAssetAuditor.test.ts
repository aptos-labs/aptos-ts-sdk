import { confidentialAsset, TOKEN_ADDRESS } from "../../helpers";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const [{ vec }] = await confidentialAsset.getAssetAuditor({
      tokenAddress: TOKEN_ADDRESS,
    });

    console.log(vec);

    expect(vec).toBeDefined();
  });
});
