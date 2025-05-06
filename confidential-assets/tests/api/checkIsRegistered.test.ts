import { confidentialAsset, getTestAccount, MOCK_TOKEN_DATA } from "../helpers/e2e";

describe("Check Registration status", () => {
  const alice = getTestAccount();

  it("should return true if the user is registered", async () => {
    const isAliceRegistered = await confidentialAsset.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
    });

    expect(isAliceRegistered).toBeTruthy();
  });
});
