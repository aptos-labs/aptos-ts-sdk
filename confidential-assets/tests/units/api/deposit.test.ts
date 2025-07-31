import { aptos, confidentialAsset, getTestAccount, TOKEN_ADDRESS } from "../../helpers";

describe("Deposit", () => {
  const alice = getTestAccount();

  const DEPOSIT_AMOUNT = 5n;
  it("it should deposit Alice's balance of fungible token to her confidential balance", async () => {
    await aptos.fundAccount({
      accountAddress: alice.accountAddress,
      amount: 100000000,
    });

    const depositTx = await confidentialAsset.deposit({
      signer: alice,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });

    console.log("gas used:", depositTx.gas_used);

    expect(depositTx.success).toBeTruthy();
  });
});
