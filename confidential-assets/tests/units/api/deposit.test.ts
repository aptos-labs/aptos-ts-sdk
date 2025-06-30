import {
  confidentialAsset,
  getTestAccount,
  longTestTimeout,
  mintFungibleTokens,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../../helpers";

describe("Deposit", () => {
  const alice = getTestAccount();

  const DEPOSIT_AMOUNT = 5n;
  it("it should deposit Alice's balance of fungible token to her confidential balance", async () => {
    await mintFungibleTokens(alice);

    const depositTx = await confidentialAsset.deposit({
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
      signer: alice
    });

    console.log("gas used:", depositTx.gas_used);

    expect(depositTx.success).toBeTruthy();
  });
});
