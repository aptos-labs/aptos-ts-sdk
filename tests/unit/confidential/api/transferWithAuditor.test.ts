import { TwistedEd25519PrivateKey } from "../../../../src";
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
    const balances = await getBalances(aliceConfidential, alice.accountAddress);

    const transferTx = await aptos.confidentialCoin.transferCoin({
      senderDecryptionKey: aliceConfidential,
      recipientEncryptionKey: aliceConfidential.publicKey(),
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
