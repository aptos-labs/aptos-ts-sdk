import { aptos, getTestAccount, getTestVeiledAccount, sendAndWaitBatchTxs, TOKEN_ADDRESS } from "../helpers";

describe("Safely Rollover", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("Should safely rollover Alice veiled balance", async () => {
    const rolloverTxPayloads = await aptos.veiledCoin.safeRolloverPendingVB({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,
      decryptionKey: aliceVeiled,
    });

    const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });
});
