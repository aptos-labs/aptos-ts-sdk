import { aptos, getTestAccount, mintFungibleTokens, sendAndWaitTx, TOKEN_ADDRESS } from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

describe("Deposit", () => {
  const alice = getTestAccount();

  console.log(alice.accountAddress.toString());

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  const DEPOSIT_AMOUNT = 5n;
  it("it should deposit Alice's balance of fungible token to her confidential balance", async () => {
    await mintFungibleTokens(alice);

    const depositTx = await aptos.confidentialAsset.deposit({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    console.log("gas used:", resp.gas_used);

    expect(resp.success).toBeTruthy();
  });
});
