import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Transfer", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  const TRANSFER_AMOUNT = 2n;
  it("should transfer money from Alice actual to pending balance", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const transferTx = await aptos.veiledCoin.transferCoin({
      senderDecryptionKey: aliceVeiled,
      recipientEncryptionKey: aliceVeiled.publicKey(),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: alice.accountAddress,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });
});
