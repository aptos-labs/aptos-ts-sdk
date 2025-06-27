import {
  confidentialAsset,
  getTestAccount,
  getTestConfidentialAccount,
  TOKEN_ADDRESS,
} from "../../helpers";

describe("Safely Rollover", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it("Should safely rollover Alice confidential balance", async () => {
    const txResponses = await confidentialAsset.rolloverPendingBalance({
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,
      signer: alice
    });


    console.log("gas used:", txResponses.map((el) => `${el.hash} - ${el.gas_used}`).join("\n"));

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });
});
