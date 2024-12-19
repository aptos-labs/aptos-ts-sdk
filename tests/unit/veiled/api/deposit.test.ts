import { aptos, getTestAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Deposit", () => {
  const alice = getTestAccount();

  const DEPOSIT_AMOUNT = 5n;
  it("it should deposit Alice's balance of fungible token to her veiled balance", async () => {
    const depositTx = await aptos.veiledCoin.deposit({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    expect(resp.success).toBeTruthy();
  });
});
