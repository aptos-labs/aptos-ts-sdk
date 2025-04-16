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
import { AccountAddress, TwistedEd25519PublicKey } from "../../../../src";

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

    const recipientAccAddr = "0xbae983154b659e5d0e9cb7f84001fdedb06482125a8e2945f47c2bc6ccd00690";

    const recipientEncKey = await aptos.confidentialCoin.getEncryptionByAddr({
      accountAddress: AccountAddress.from(recipientAccAddr),
      tokenAddress: TOKEN_ADDRESS,
    });

    console.log("recipientEncKey", recipientEncKey);

    const transferTx = await aptos.confidentialCoin.transferCoin({
      senderDecryptionKey: aliceConfidential,
      recipientEncryptionKey: new TwistedEd25519PublicKey(recipientEncKey),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: recipientAccAddr,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
