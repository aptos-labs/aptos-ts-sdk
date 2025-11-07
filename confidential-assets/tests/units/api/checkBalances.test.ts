import { preloadTables } from "../../@aptos-labs/ts-sdk/preloadKangarooTables";
import { getBalances, getTestAccount, getTestConfidentialAccount, longTestTimeout } from "../../helpers";

describe("Check balance", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );
  it("should check balance", async () => {
    const balances = await getBalances(aliceConfidential, alice.accountAddress);

    console.log({
      pending: {
        encrypted: balances.pendingBalanceCipherText().map((el) => el.serialize()),
        amount: balances.pendingBalance(),
        amountChunks: balances.pending.getAmountChunks().map((chunk) => chunk.toString()),
      },
      actual: {
        encrypted: balances.availableBalanceCipherText().map((el) => el.serialize()),
        amount: balances.availableBalance(),
        amountChunks: balances.available.getAmountChunks().map((chunk) => chunk.toString()),
      },
    });

    expect(balances.pendingBalance()).toBeDefined();
    expect(balances.availableBalance()).toBeDefined();
  });
});
