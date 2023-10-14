// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import { FUND_AMOUNT, INDEXER_WAIT_TIME, longTestTimeout } from "../../unit/helper";
import { sleep } from "../../../src/utils/helpers";

describe("Event", () => {
  test("it should get fund event by creation number and address", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);

    const testAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress.toString(), amount: FUND_AMOUNT });

    await sleep(INDEXER_WAIT_TIME);
    const events = await aptos.getAccountEventsByCreationNumber({
      address: testAccount.accountAddress.toString(),
      creationNumber: 0,
    });

    expect(events[0].type).toEqual("0x1::account::CoinRegisterEvent");
  });

  test("it should get fund event by event type and address", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);

    const testAccount = Account.generate();
    await aptos.fundAccount({
      accountAddress: testAccount.accountAddress.toString(),
      amount: FUND_AMOUNT,
    });

    await sleep(INDEXER_WAIT_TIME);
    const events = await aptos.getAccountEventsByEventType({
      address: testAccount.accountAddress.toString(),
      eventType: "0x1::account::CoinRegisterEvent",
    });

    expect(events[0].type).toEqual("0x1::account::CoinRegisterEvent");
  });

  test("it should get all events", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);

    const testAccount = Account.generate();
    await aptos.fundAccount({
      accountAddress: testAccount.accountAddress.toString(),
      amount: FUND_AMOUNT,
    });

    await sleep(INDEXER_WAIT_TIME);
    const events = await aptos.getEvents();

    expect(events.length).toBeGreaterThan(0);
  });

  test(
    "it should filter events",
    async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const testAccount1 = Account.generate();
      const testAccount2 = Account.generate();
      await aptos.fundAccount({
        accountAddress: testAccount1.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });
      await aptos.fundAccount({
        accountAddress: testAccount2.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await sleep(INDEXER_WAIT_TIME);
      const events = await aptos.getEvents({
        options: { where: { account_address: { _eq: testAccount1.accountAddress.toString() } } },
      });

      expect(events[0].account_address).toBe(testAccount1.accountAddress.toString());
    },
    longTestTimeout,
  );
});
