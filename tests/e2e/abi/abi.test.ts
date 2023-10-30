// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, Aptos, AptosConfig, Network } from "../../../src";
import { fetchABIs } from "../../../src/abi/abi-gen";
import { FUND_AMOUNT } from "../../unit/helper";
import { publishArgumentTestModule } from "../transaction/helper";
import * as FrameworkModules from "../../../src/abi/0x1";
// import { TxArgsModule } from "../../../src/abi/example";

describe("abi test", () => {
  it("parses abis correctly", async () => {
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const account = Account.generate();
    await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT });
    await publishArgumentTestModule(aptos, account);
    const moduleABIs = await fetchABIs(aptos, account.accountAddress);
    // eslint-disable-next-line no-console
    console.log(moduleABIs.join("\n\n"));
  });

  it("parses tournament abis correctly", async () => {
    const accountAddress = AccountAddress.fromHexInputRelaxed(
      "0xa7693d83e4436fbac2f7fd478d468aec6386466a9506e6696751c99cb7b4cd44",
    );
    const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const moduleABIs = await fetchABIs(aptos, accountAddress);
    // eslint-disable-next-line no-console
    console.log(moduleABIs.join("\n\n"));
  });

  it.only("parses 0x1 module abis correctly", async () => {
    const accountAddress = AccountAddress.fromHexInputRelaxed("0x1");
    const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const moduleABIs = await fetchABIs(aptos, accountAddress);
    // eslint-disable-next-line no-console
    console.log(moduleABIs.join("\n\n"));

    const coinTransferPayload = new FrameworkModules.Coin.Transfer({
      arg_0: Account.generate().accountAddress,
      arg_1: 1000n,
    });

    console.log(coinTransferPayload.bcsToBytes());
  });


















  // it("serializes from abis correctly", async () => {
  //     const address = AccountAddress.ZERO;
  //     const testPayload = new TxArgsModule.PublicArgumentsMultipleSigners({
  //         arg_0: [address],
  //         arg_1: true,
  //         arg_2: 2,
  //         arg_3: 3,
  //         arg_4: 4,
  //         arg_5: 5n,
  //         arg_6: 6n,
  //         arg_7: 7n,
  //         arg_8: address,
  //         arg_9: "9",
  //         arg_10: address,
  //         arg_11: [11],
  //         arg_12: [true],
  //         arg_13: [13],
  //         arg_14: [14],
  //         arg_15: [15],
  //         arg_16: [16n],
  //         arg_17: [17n],
  //         arg_18: [18n],
  //         arg_19: [address],
  //         arg_20: ["20"],
  //         arg_21: [address],
  //         arg_22: [22],
  //         arg_23: [true],
  //         arg_24: [24],
  //         arg_25: [25],
  //         arg_26: [26],
  //         arg_27: [27n],
  //         arg_28: [28n],
  //         arg_29: [29n],
  //         arg_30: [address],
  //         arg_31: ["31"],
  //         arg_32: [address],
  //     });
  // });
});
