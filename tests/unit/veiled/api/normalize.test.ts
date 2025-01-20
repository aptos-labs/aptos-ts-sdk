import { aptos, getBalances, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";

describe("Normalize", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

  it("it should normalize Alice's veiled balance", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const normalizeTx = await aptos.veiledCoin.normalizeUserBalance({
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceVeiled,
      unnormalizedEncryptedBalance: balances.actual.amountEncrypted!,
      balanceAmount: balances.actual.amount,

      sender: alice.accountAddress,
    });

    const txResp = await sendAndWaitTx(normalizeTx, alice);

    console.log("gas used:", txResp.gas_used);

    expect(txResp.success).toBeTruthy();
  });
});
