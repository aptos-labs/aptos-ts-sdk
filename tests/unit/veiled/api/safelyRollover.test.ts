import { aptos, getTestAccount, getTestVeiledAccount, sendAndWaitBatchTxs, TOKEN_ADDRESS } from "../helpers";
import { VeiledAmount } from "../../../../src/core/crypto/veiled/veiledAmount";

describe("Safely Rollover", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("Should safely rollover Alice veiled balance", async () => {
    const aliceBalances = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    const unnormalizedVeiledAmount = await VeiledAmount.fromEncrypted(aliceBalances.actual, aliceVeiled);

    const rolloverTxPayloads = await aptos.veiledCoin.safeRolloverPendingVB({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,

      decryptionKey: aliceVeiled,
      unnormilizedEncryptedBalance: unnormalizedVeiledAmount.amountEncrypted!,
      balanceAmount: unnormalizedVeiledAmount.amount,
    });

    const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });
});
