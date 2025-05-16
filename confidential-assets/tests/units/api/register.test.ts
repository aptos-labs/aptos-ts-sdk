import { confidentialAsset, getTestAccount, getTestConfidentialAccount, longTestTimeout, sendAndWaitTx, TOKEN_ADDRESS } from "../../helpers";
import { preloadTables } from "../../helpers/wasmPollardKangaroo";

describe("Register", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it(
    "it should register Alice confidential balance",
    async () => {
      const aliceRegisterVBTxBody = await confidentialAsset.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        publicKey: aliceConfidential.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      console.log("gas used:", aliceTxResp.gas_used);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
