// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, InputViewFunctionJsonData } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { getCedraClient } from "../helper";

describe("Faucet", () => {
  test("it should fund an account", async () => {
    const { cedra } = getCedraClient();
    const testAccount = Account.generate();

    // Fund the account
    await cedra.fundAccount({ accountAddress: testAccount.accountAddress, amount: FUND_AMOUNT });

    // Check the balance
    const payload: InputViewFunctionJsonData = {
      function: "0x1::coin::balance",
      typeArguments: ["0x1::cedra_coin::CedraCoin"],
      functionArguments: [testAccount.accountAddress.toString()],
    };
    const [balance] = await cedra.viewJson<[number]>({ payload: payload });
    expect(Number(balance)).toBe(FUND_AMOUNT);
  });
});
