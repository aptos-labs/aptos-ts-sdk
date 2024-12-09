import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Withdraw", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  const WITHDRAW_AMOUNT = 1n;
  it("should withdraw veiled amount", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const withdrawTx = await aptos.veiledCoin.withdraw({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceVeiled,
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
    });
    const txResp = await sendAndWaitTx(withdrawTx, alice);

    expect(txResp.success).toBeTruthy();
  });
});
