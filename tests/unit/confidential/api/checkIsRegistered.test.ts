import { aptos, getTestAccount, TOKEN_ADDRESS } from "../helpers";

describe("Check Registration status", () => {
  const alice = getTestAccount();

  it("should return true if the user is registered", async () => {
    const isAliceRegistered = await aptos.confidentialAsset.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isAliceRegistered).toBeTruthy();
  });
});
