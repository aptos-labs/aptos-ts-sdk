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

describe("Withdraw", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  const WITHDRAW_AMOUNT = 1n;
  it("should withdraw confidential amount", async () => {
    const balances = await getBalances(aliceConfidential, alice.accountAddress);

    const withdrawTx = await confidentialAsset.withdraw({
      sender: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
      decryptionKey: aliceConfidential,
      encryptedActualBalance: balances.actual.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
    });
    const txResp = await sendAndWaitTx(withdrawTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
