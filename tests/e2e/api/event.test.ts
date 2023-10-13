// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import { FUND_AMOUNT, INDEXER_WAIT_TIME } from "../../unit/helper";
import { sleep } from "../../../src/utils/helpers";

describe("Event", () => {
  test("it should get fund events by creation number and address", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);

    // Fund the account
    const testAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress.toString(), amount: FUND_AMOUNT });

    await sleep(INDEXER_WAIT_TIME);
    const events = await aptos.getEventsByCreationNumber({
      address: testAccount.accountAddress.toString(),
      creationNumber: 0,
    });

    // Ensure events are returned and that the event type is CoinRegisterEvent
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toEqual("0x1::account::CoinRegisterEvent");
  });
});
