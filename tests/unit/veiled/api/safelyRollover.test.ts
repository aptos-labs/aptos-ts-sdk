import { aptos, getTestAccount, getTestVeiledAccount, sendAndWaitBatchTxs, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";

describe("Safely Rollover", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

  it("Should safely rollover Alice veiled balance", async () => {
    const rolloverTxPayloads = await aptos.veiledCoin.safeRolloverPendingVB({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,
      decryptionKey: aliceVeiled,
    });

    const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

    console.log("gas used:", txResponses.map((el) => `${el.hash} - ${el.gas_used}`).join("\n"));

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });
});
