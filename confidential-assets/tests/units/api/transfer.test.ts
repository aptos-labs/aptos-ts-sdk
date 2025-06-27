import {
  confidentialAsset,
  getTestAccount,
  getTestConfidentialAccount,
  longTestTimeout,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../../helpers";

describe("Transfer", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  const TRANSFER_AMOUNT = 2n;

  it("should transfer money from Alice actual to pending balance", async () => {
    const recipientAccAddr = "0xbae983154b659e5d0e9cb7f84001fdedb06482125a8e2945f47c2bc6ccd00690";

    const transferTx = await confidentialAsset.transfer({
      senderDecryptionKey: aliceConfidential,
      amount: TRANSFER_AMOUNT,
      tokenAddress: TOKEN_ADDRESS,
      recipient: recipientAccAddr,
      signer: alice
    });

    console.log("gas used:", transferTx.gas_used);

    expect(transferTx.success).toBeTruthy();
  });
});
