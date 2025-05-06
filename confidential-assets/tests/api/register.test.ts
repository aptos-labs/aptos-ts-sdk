import {
  confidentialAsset,
  getTestAccount,
  getTestConfidentialAccount,
  sendAndWaitTx,
  MOCK_TOKEN_DATA,
} from "../helpers/e2e";
import { preloadTables } from "../helpers/wasmPollardKangaroo";
import { longTestTimeout } from "../helpers";

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
        tokenAddress: MOCK_TOKEN_DATA.address,
        publicKey: aliceConfidential.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      console.log("gas used:", aliceTxResp.gas_used);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
