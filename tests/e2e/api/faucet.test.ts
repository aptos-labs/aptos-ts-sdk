// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, InputViewFunctionJsonData } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";

describe("Faucet", () => {
  test("it should fund an account", async () => {
    const { aptos } = getAptosClient();
    const testAccount = Account.generate();

    // Fund the account
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress, amount: FUND_AMOUNT });

    // Check the balance
    const payload: InputViewFunctionJsonData = {
      function: "0x1::coin::balance",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [testAccount.accountAddress.toString()],
    };
    const [balance] = await aptos.viewJson<[number]>({ payload });
    expect(Number(balance)).toBe(FUND_AMOUNT);
  });
});
