import { aptos, getTestAccount, getTestConfidentialAccount, sendAndWaitBatchTxs, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

describe("Safely Rollover", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it("Should safely rollover Alice confidential balance", async () => {
    const rolloverTxPayloads = await aptos.confidentialCoin.safeRolloverPendingCB({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,
      decryptionKey: aliceConfidential,
    });

    const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

    console.log("gas used:", txResponses.map((el) => `${el.hash} - ${el.gas_used}`).join("\n"));

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });
});
