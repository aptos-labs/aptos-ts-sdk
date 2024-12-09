import { longTestTimeout } from "../../helper";
import { aptos, getTestAccount, getTestVeiledAccount, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";

describe("Register", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it(
    "it should register Alice veiled balance",
    async () => {
      const aliceRegisterVBTxBody = await aptos.veiledCoin.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        publicKey: aliceVeiled.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
