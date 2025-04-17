import { aptos, getTestAccount, TOKEN_ADDRESS } from "../helpers";

describe("Check is normalized", () => {
  const alice = getTestAccount();

  it("should check if user confidential balance is normalized", async () => {
    const isAliceBalanceNormalized = await aptos.confidentialAsset.isUserBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isAliceBalanceNormalized).toBeDefined();
  });
});
