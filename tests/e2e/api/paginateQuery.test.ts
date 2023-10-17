import { AptosConfig, Network, Aptos } from "../../../src";

test("it should paginate correctly on indexer queries", async () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  const events = await aptos.getEvents();
  // Expect more than 10 events
  expect(events.length).toBeGreaterThan(10);
  const firstTenEvents = await aptos.getEvents({ options: { pagination: { limit: 10 } } });
  // Expect fetch only first 10 events
  expect(firstTenEvents.length).toBe(10);
  // expect last event data is not the same as the last event data from previous call
  expect(firstTenEvents[firstTenEvents.length - 1]).not.toStrictEqual(events[events.length - 1]);
  const onlyNextTwentyEvents = await aptos.getEvents({ options: { pagination: { offset: 10, limit: 10 } } });
  // expect only next 20 events
  expect(onlyNextTwentyEvents.length).toBe(10);
  // expect first event data is not the same as the first event data from previous call
  expect(firstTenEvents[0]).not.toStrictEqual(onlyNextTwentyEvents[0]);
});
