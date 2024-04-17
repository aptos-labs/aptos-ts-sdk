import { getAptosClient } from "../helper";

describe("PaginateQuery", () => {
  const { aptos } = getAptosClient();

  test("it should paginate correctly on indexer queries", async () => {
    const events = await aptos.getEvents();
    // Expect more than 10 events
    expect(events.length).toBeGreaterThan(10);
    const firstTenEvents = await aptos.getEvents({ options: { limit: 10 } });
    // Expect fetch only first 10 events
    expect(firstTenEvents.length).toBe(10);
    // expect last event data is not the same as the last event data from previous call
    expect(firstTenEvents[firstTenEvents.length - 1]).not.toStrictEqual(events[events.length - 1]);
    const onlyNextTwentyEvents = await aptos.getEvents({ options: { offset: 10, limit: 10 } });
    // expect only next 20 events
    expect(onlyNextTwentyEvents.length).toBe(10);
    // expect first event data is not the same as the first event data from previous call
    expect(firstTenEvents[0]).not.toStrictEqual(onlyNextTwentyEvents[0]);
  });

  test("it should paginate correctly on fullnode queries", async () => {
    const transactions = await aptos.getTransactions();
    // Expect more than 10 transactions
    expect(transactions.length).toBeGreaterThan(10);
    const firstTenTxs = await aptos.getTransactions({ options: { offset: 0, limit: 10 } });
    // Expect fetch only first 10 transactions
    expect(firstTenTxs.length).toBe(10);
    // expect last transaction data is not the same as the last transaction data from previous call
    expect(firstTenTxs[firstTenTxs.length - 1]).not.toStrictEqual(transactions[transactions.length - 1]);
    const onlyNextTwentyTxs = await aptos.getTransactions({ options: { offset: 10, limit: 10 } });
    // expect only next 10 transactions
    expect(onlyNextTwentyTxs.length).toBe(10);
    // expect first transaction data is not the same as the first transaction data from previous call
    expect(firstTenTxs[0]).not.toStrictEqual(onlyNextTwentyTxs[0]);
  });
});
