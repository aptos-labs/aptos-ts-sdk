import { confidentialAsset, getTestAccount, MOCK_TOKEN_DATA } from "../helpers/e2e";

describe("should check if user confidential account is frozen", () => {
  const alice = getTestAccount();

  it("should check if user confidential account is frozen", async () => {
    const isFrozen = await confidentialAsset.isBalanceFrozen({
      accountAddress: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
    });

    console.log(`${alice.accountAddress.toString()} frozen status is:`, isFrozen);

    expect(isFrozen).toBeDefined();
  });
});
