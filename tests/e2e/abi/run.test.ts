// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { PUBLISHER_ACCOUNT_PK, fundAccounts, publishArgumentTestModule } from "../transaction/helper";
// import { TxArgsModule } from "../../../generated/args_test_suite";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";

jest.setTimeout(30000);

describe.only("abi test", () => {
  // NOTE: THIS FUNCTION WILL FAIL CURRENTLY
  // This is because I am too lazy to implement the correct MoveStructLayout type for JSON serialization.
  // I would rather just wait for BCS serialized view functions to be implemented.
  // it.skip("calls a view function correctly", async () => {
  //   const aptosLocal = new Aptos(new AptosConfig({ network: Network.LOCAL }));
  //   const account = Account.fromPrivateKey({
  //     privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
  //     legacy: false,
  //   });
  //   await fundAccounts(aptosLocal, [account]);
  //   await publishArgumentTestModule(aptosLocal, account);
  //   const viewPayload = new TxArgsModule.ViewAllArguments(
  //     true,
  //     0,
  //     1,
  //     2,
  //     3n,
  //     4n,
  //     5, //?
  //     account.accountAddress,
  //     "9",
  //     account.accountAddress,
  //     new Uint8Array([1, 2, 3, 4]),
  //     [true, true, false, true, false, false],
  //     new Uint8Array([1, 2, 3, 4, 5]),
  //     [1, 2, 3, 4, 5, 6],
  //     [1, 2, 3, 4, 5, 6, 7],
  //     [100, 121, 131],
  //     [100, 121, 131],
  //     [100, 121, 131],
  //     [account.accountAddress, account.accountAddress, account.accountAddress],
  //     ["okay", "one", "two"],
  //     [account.accountAddress, account.accountAddress, account.accountAddress],
  //     [],
  //     [true],
  //     [1],
  //     [2],
  //     [3],
  //     [4],
  //     [5],
  //     [6],
  //     [account.accountAddress],
  //     ["string option"],
  //     [account.accountAddress],
  //   );
  //   viewPayload.argsToArray().forEach((arg, i) => {
  //     console.log(`arg ${i}: ${arg}`);
  //   });
  //   const response = await viewPayload.submit({ aptos: aptosLocal });
  //   console.log(response);
  // });

  // TODO: Fix the signers in `arg` class types. They should probably be a separate field
  // or at least the `argsToArray()` should ignore them. Most likely just a different field, although I like seeing them together in the
  // constructor.
  it.skip("serializes from abis correctly", async () => {
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const account1 = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    // const account2 = Account.generate();
    // const account3 = Account.generate();
    // const account4 = Account.generate();
    // const account5 = Account.generate();
    await aptos.fundAccount({ accountAddress: account1.accountAddress.toString(), amount: FUND_AMOUNT });
    await publishArgumentTestModule(aptos, account1);

    type SetupData = {
      empty_object_1: { inner: string };
      empty_object_2: { inner: string };
      empty_object_3: { inner: string };
    };

    const setupData = await aptos.getAccountResource<SetupData>({
      accountAddress: account1.accountAddress.toString(),
      resourceType: `${account1.accountAddress.toString()}::tx_args_module::SetupData`,
    });
    const moduleObjects: Array<AccountAddress> = [];

    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_1.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_2.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_3.inner));

    // const testPayload = new TxArgsModule.PublicArguments(
    //   true,
    //   1,
    //   2,
    //   3,
    //   4,
    //   5,
    //   6,
    //   account1.accountAddress.toString(),
    //   "expected_string",
    //   moduleObjects[0].toString(),
    //   new Uint8Array([]),
    //   [true, false, true],
    //   new Uint8Array([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]),
    //   [0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER],
    //   [0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER],
    //   [0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT],
    //   [0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT],
    //   [0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT],
    //   ["0x0", "0xabc", "0xdef", "0x123", "0x456", "0x789"],
    //   ["expected_string", "abc", "def", "123", "456", "789"],
    //   moduleObjects.map((obj) => obj.toString()),
    //   [],
    //   [true],
    //   [1],
    //   [2],
    //   [3],
    //   [4],
    //   [5],
    //   [6],
    //   [account1.accountAddress.toString()],
    //   ["expected_string"],
    //   [moduleObjects[0].toString()],
    // );
    // // TODO: Add support for smart `submit` with feepayer and multiagent
    // const response = await testPayload.submit({ signer: account1, aptos: aptos });
    // console.log(response);
  });
});
