import { longTestTimeout } from "../../helper";
import { aptos, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";

describe("Register", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

  it(
    "it should register Alice veiled balance",
    async () => {
      const aliceRegisterVBTxBody = await aptos.veiledCoin.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        publicKey: aliceVeiled.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      console.log("gas used:", aliceTxResp.gas_used);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
