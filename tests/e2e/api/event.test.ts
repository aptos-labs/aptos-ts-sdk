// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../../../src";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";

describe("Event", () => {
  test("it should get transaction fee statement module event by event type", async () => {
    const { aptos } = getAptosClient();

    const testAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress, amount: FUND_AMOUNT });

    const events = await aptos.getModuleEventsByEventType({
      eventType: "0x1::transaction_fee::FeeStatement",
    });

    expect(events[0].type).toEqual("0x1::transaction_fee::FeeStatement");
  });

  test("it should get fund event by creation number and address", async () => {
    const { aptos } = getAptosClient();

    const testAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress, amount: FUND_AMOUNT });

    const events = await aptos.getAccountEventsByCreationNumber({
      accountAddress: testAccount.accountAddress,
      creationNumber: 0,
    });

    expect(events[0].type).toEqual("0x1::account::CoinRegisterEvent");
  });

  test("it should get fund event by event type and address", async () => {
    const { aptos } = getAptosClient();

    const testAccount = Account.generate();
    await aptos.fundAccount({
      accountAddress: testAccount.accountAddress,
      amount: FUND_AMOUNT,
    });

    const events = await aptos.getAccountEventsByEventType({
      accountAddress: testAccount.accountAddress,
      eventType: "0x1::account::CoinRegisterEvent",
    });

    expect(events[0].type).toEqual("0x1::account::CoinRegisterEvent");
  });

  test("it should get all events", async () => {
    const { aptos } = getAptosClient();

    const testAccount = Account.generate();
    await aptos.fundAccount({
      accountAddress: testAccount.accountAddress,
      amount: FUND_AMOUNT,
    });

    const events = await aptos.getEvents();

    expect(events.length).toBeGreaterThan(0);
  });

  test(
    "it should filter events",
    async () => {
      const { aptos } = getAptosClient();

      const testAccount1 = Account.generate();
      const testAccount2 = Account.generate();
      await aptos.fundAccount({
        accountAddress: testAccount1.accountAddress,
        amount: FUND_AMOUNT,
      });
      await aptos.fundAccount({
        accountAddress: testAccount2.accountAddress,
        amount: FUND_AMOUNT,
      });

      const events = await aptos.getEvents({
        options: { where: { account_address: { _eq: testAccount1.accountAddress.toString() } } },
      });

      expect(events[0].account_address).toBe(testAccount1.accountAddress.toString());
    },
    longTestTimeout,
  );
});
