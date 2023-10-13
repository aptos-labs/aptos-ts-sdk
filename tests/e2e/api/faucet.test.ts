// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, AptosConfig, Account, Network } from "../../../src";
import { SigningScheme } from "../../../src/types";
import { FUND_AMOUNT } from "../../unit/helper";

describe("Faucet", () => {
  test("it should fund an account", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const testAccount = Account.generate({ scheme: SigningScheme.Ed25519 });

    // Fund the account
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress.toString(), amount: FUND_AMOUNT });

    // Check the balance
    let resource = await aptos.getAccountResource({
      accountAddress: testAccount.accountAddress.toString(),
      resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
    });
    let amount = Number((resource.data as { coin: { value: string } }).coin.value);
    expect(amount).toBe(FUND_AMOUNT);
  });
});
