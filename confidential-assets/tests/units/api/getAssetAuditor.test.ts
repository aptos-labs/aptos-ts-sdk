import { confidentialAsset, TOKEN_ADDRESS } from "../../helpers";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const globalAuditorPubKey = await confidentialAsset.getAssetAuditorEncryptionKey({
      tokenAddress: TOKEN_ADDRESS,
    });

    console.log(globalAuditorPubKey);

    expect(globalAuditorPubKey).toBeDefined();
  });
});
