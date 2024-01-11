// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, AptosConfig, Network, Signer } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";

describe("Faucet", () => {
  test("it should fund an account", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const testAccount = Signer.generate();

    // Fund the account
    await aptos.fundAccount({ accountAddress: testAccount.accountAddress, amount: FUND_AMOUNT });

    // Check the balance
    type Coin = { coin: { value: string } };
    const resource = await aptos.getAccountResource<Coin>({
      accountAddress: testAccount.accountAddress,
      resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
    });
    const amount = Number(resource.coin.value);
    expect(amount).toBe(FUND_AMOUNT);
  });
});
