import { aptos, TOKEN_ADDRESS } from "../helpers";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const [{ vec }] = await aptos.confidentialCoin.getAssetAuditor({
      tokenAddress: TOKEN_ADDRESS,
    });

    console.log(vec);

    expect(vec).toBeDefined();
  });
});
