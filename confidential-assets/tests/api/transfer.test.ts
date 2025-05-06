import { AccountAddress } from "@aptos-labs/ts-sdk";
import { TwistedEd25519PublicKey } from "../../src";
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

    const recipientEncKey = await confidentialAsset.getEncryptionByAddr({
      accountAddress: AccountAddress.from(recipientAccAddr),
      tokenAddress: MOCK_TOKEN_DATA.address,
    });

    console.log("recipientEncKey", recipientEncKey);

    const transferTx = await confidentialAsset.transferCoin({
      senderDecryptionKey: aliceConfidential,
      recipientEncryptionKey: new TwistedEd25519PublicKey(recipientEncKey),
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
      recipientAddress: recipientAccAddr,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
