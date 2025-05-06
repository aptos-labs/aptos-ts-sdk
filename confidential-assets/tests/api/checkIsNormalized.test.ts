import { confidentialAsset, getTestAccount, MOCK_TOKEN_DATA } from "../helpers/e2e";

describe("Check is normalized", () => {
  const alice = getTestAccount();

  it("should check if user confidential balance is normalized", async () => {
    const isAliceBalanceNormalized = await confidentialAsset.isUserBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
    });

    expect(isAliceBalanceNormalized).toBeDefined();
  });
});
