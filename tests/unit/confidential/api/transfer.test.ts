import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

describe("Transfer", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount(alice);

  console.log(aliceVeiled.publicKey().toString());

  const TRANSFER_AMOUNT = 2n;
  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it("should transfer money from Alice actual to pending balance", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const transferTx = await aptos.confidentialCoin.transferCoin({
      senderDecryptionKey: aliceVeiled,
      recipientEncryptionKey: aliceVeiled.publicKey(),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: alice.accountAddress,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
