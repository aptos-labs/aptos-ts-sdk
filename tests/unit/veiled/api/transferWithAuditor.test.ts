import { TwistedEd25519PrivateKey } from "../../../../src";
import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";

describe("Transfer with auditor", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount(alice);

  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

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

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
