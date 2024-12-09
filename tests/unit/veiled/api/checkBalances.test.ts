import { getBalances, getTestAccount, getTestVeiledAccount } from "../helpers";

describe("Check balance", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount();

  it("should check balance", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

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
