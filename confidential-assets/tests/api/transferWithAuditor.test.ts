import { TwistedEd25519PrivateKey } from "../../src";
import {
  confidentialAsset,
  getBalances,
  getTestAccount,
  getTestConfidentialAccount,
  sendAndWaitTx,
  MOCK_TOKEN_DATA,
} from "../helpers/e2e";
import { preloadTables } from "../helpers/wasmPollardKangaroo";
import { longTestTimeout } from "../helpers";

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

    const transferTx = await confidentialAsset.transferCoin({
      senderDecryptionKey: aliceConfidential,
      recipientEncryptionKey: aliceConfidential.publicKey(),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
      recipientAddress: alice.accountAddress,
      auditorEncryptionKeys: [AUDITOR.publicKey()],
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
