import { TwistedEd25519PrivateKey } from "../../../../src";
import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Transfer with auditor", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  const TRANSFER_AMOUNT = 2n;
  test("it should transfer Alice's tokens to Alice's veiled balance with auditor", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const transferTx = await aptos.veiledCoin.transferCoin({
      senderDecryptionKey: aliceVeiled,
      recipientEncryptionKey: aliceVeiled.publicKey(),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: alice.accountAddress,
      auditorEncryptionKeys: [AUDITOR.publicKey()],
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });
});
