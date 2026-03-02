import { TwistedEd25519PrivateKey } from "../../../src";
import {
  confidentialAsset,
  getTestAccount,
  getTestConfidentialAccount,
  longTestTimeout,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../../helpers";
import { preloadTables } from "../../helpers/wasmPollardKangaroo";

describe("Transfer with auditor", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  const TRANSFER_AMOUNT = 2n;
  test("it should transfer Alice's tokens to Alice's confidential balance with auditor", async () => {
    const transferTx = await confidentialAsset.transfer({
      senderDecryptionKey: aliceConfidential,
      recipient: alice.accountAddress,
      amount: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      additionalAuditorEncryptionKeys: [AUDITOR.publicKey()],
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
