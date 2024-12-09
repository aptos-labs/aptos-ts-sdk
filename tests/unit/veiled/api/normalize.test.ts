import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Normalize", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("it should normalize Alice's veiled balance", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const normalizeTx = await aptos.veiledCoin.normalizeUserBalance({
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceVeiled,
      unnormilizedEncryptedBalance: balances.pending.amountEncrypted!,
      balanceAmount: balances.pending.amount,

      sender: alice.accountAddress,
    });

    const txResp = await sendAndWaitTx(normalizeTx, alice);

    expect(txResp.success).toBeTruthy();
  });
});
