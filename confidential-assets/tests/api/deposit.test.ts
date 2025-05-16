import { confidentialAsset, getTestAccount, mintFungibleTokens, sendAndWaitTx, MOCK_TOKEN_DATA } from "../helpers/e2e";
import { preloadTables } from "../helpers/wasmPollardKangaroo";
import { longTestTimeout } from "../helpers";

describe("Deposit", () => {
  const alice = getTestAccount();

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

    const depositTx = await confidentialAsset.deposit({
      sender: alice.accountAddress,
      tokenAddress: MOCK_TOKEN_DATA.address,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    console.log("gas used:", resp.gas_used);

    expect(resp.success).toBeTruthy();
  });
});
