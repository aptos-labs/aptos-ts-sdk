import { getBalances, getTestAccount, getTestConfidentialAccount, longTestTimeout } from "../helpers";
import { preloadTables } from "../helpers/wasmPollardKangaroo";

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
        encrypted: balances.pending.amountEncrypted?.map((el) => el.serialize()),
        amount: balances.pending.amount.toString(),
        amountChunks: balances.pending.amountChunks.map((chunk) => chunk.toString()),
      },
      actual: {
        encrypted: balances.actual.amountEncrypted?.map((el) => el.serialize()),
        amount: balances.actual.amount.toString(),
        amountChunks: balances.actual.amountChunks.map((chunk) => chunk.toString()),
      },
    });

    expect(balances.pending.amount).toBeDefined();
    expect(balances.actual.amount).toBeDefined();
  });
});
