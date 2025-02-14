import {
  aptos,
  getBalances,
  getTestAccount,
  getTestConfidentialAccount,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

describe("Transfer", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  console.log(aliceConfidential.publicKey().toString());

  const TRANSFER_AMOUNT = 2n;
  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it("should transfer money from Alice actual to pending balance", async () => {
    const balances = await getBalances(aliceConfidential, alice.accountAddress);

    const transferTx = await aptos.confidentialCoin.transferCoin({
      senderDecryptionKey: aliceConfidential,
      recipientEncryptionKey: aliceConfidential.publicKey(),
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
