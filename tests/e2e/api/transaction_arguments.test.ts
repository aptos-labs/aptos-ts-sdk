// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AptosConfig,
  Network,
  Aptos,
  AccountAddress,
  Bool,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  TransactionFeePayerSignature,
  TransactionMultiAgentSignature,
  EntryFunctionArgumentTypes,
} from "../../../src";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";
import { MoveObject, MoveOption, MoveString, MoveVector } from "../../../src/bcs/serializable/move-structs";
import {
  fundAccounts,
  rawTransactionHelper,
  rawTransactionMultiAgentHelper,
  publishArgumentTestModule,
} from "./helper";

jest.setTimeout(10000);

// This test looks enormous, but the breakdown is quite simple:
//  the `transactionArguments` array contains every possible argument type
//  the `rawTransactionHelper` and `rawTransactionMultiAgentHelper` functions are helpers to generate the transactions,
//    respectively for single signer transactions and for (multi signer & fee payer) transactions
// In any transaction with a `&signer` the move function asserts that the first argument is the senderAccount's address:
// `senderAccount_address: address` or all of the `&signer` addresses: `signer_addresses: vector<address>`
// At the end of the tests with fee payers and secondary signers, we assert that the normalized
//   `fee_payer_address` and `secondary_signer_addresses` are correct
//
// TODO: assert that the SignerScheme is correct in the response type

describe("various transaction arguments", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const senderAccount = Account.generate();
  const secondarySignerAccounts = [Account.generate(), Account.generate(), Account.generate(), Account.generate()];
  const feePayerAccount = Account.generate();
  const moduleObjects: Array<MoveObject> = [];
  let transactionArguments: EntryFunctionArgumentTypes[];

  beforeAll(async () => {
    await fundAccounts(aptos, [senderAccount, ...secondarySignerAccounts, feePayerAccount]);
    await publishArgumentTestModule(aptos, senderAccount);

    // when deploying, `init_module` creates 3 objects and stores them into the `SetupData` resource
    // within that resource is 3 fields: `empty_object_1`, `empty_object_2`, `empty_object_3`
    // we need to extract those objects and use them as arguments for the entry functions
    const accountResources = await aptos.getAccountResources({
      accountAddress: senderAccount.accountAddress.toString(),
    });

    accountResources.forEach((resource) => {
      const data = resource.data as any;
      if (data.empty_object_1 !== undefined) {
        moduleObjects.push(new MoveObject(data.empty_object_1.inner));
        moduleObjects.push(new MoveObject(data.empty_object_2.inner));
        moduleObjects.push(new MoveObject(data.empty_object_3.inner));
      }
    });

    transactionArguments = [
      new Bool(true),
      new U8(1),
      new U16(2),
      new U32(3),
      new U64(4),
      new U128(5),
      new U256(6),
      senderAccount.accountAddress,
      new MoveString("expected_string"),
      moduleObjects[0],
      new MoveVector([]),
      MoveVector.Bool([true, false, true]),
      MoveVector.U8([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]),
      MoveVector.U16([0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER]),
      MoveVector.U32([0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER]),
      MoveVector.U64([0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT]),
      MoveVector.U128([0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT]),
      MoveVector.U256([0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT]),
      new MoveVector([
        AccountAddress.fromStringRelaxed({ input: "0x0" }),
        AccountAddress.fromStringRelaxed({ input: "0xabc" }),
        AccountAddress.fromStringRelaxed({ input: "0xdef" }),
        AccountAddress.fromStringRelaxed({ input: "0x123" }),
        AccountAddress.fromStringRelaxed({ input: "0x456" }),
        AccountAddress.fromStringRelaxed({ input: "0x789" }),
      ]),
      MoveVector.MoveString(["expected_string", "abc", "def", "123", "456", "789"]),
      new MoveVector(moduleObjects),
      new MoveOption(),
      new MoveOption(new Bool(true)),
      new MoveOption(new U8(1)),
      new MoveOption(new U16(2)),
      new MoveOption(new U32(3)),
      new MoveOption(new U64(4)),
      new MoveOption(new U128(5)),
      new MoveOption(new U256(6)),
      new MoveOption(senderAccount.accountAddress),
      new MoveOption(new MoveString("expected_string")),
      new MoveOption(moduleObjects[0]),
    ];
  });

  describe("single signer txns with all entry fn arguments except `&signer`, both public and private entry functions", () => {
    it("successfully submits a public entry fn, single signer txn with all argument types except `&signer`", async () => {
      const response = await rawTransactionHelper(aptos, senderAccount, "public_arguments", [], transactionArguments);
      expect(response.success).toBe(true);
    });

    it("successfully submits a private entry fn, single signer txn with all argument types except `&signer`", async () => {
      const response = await rawTransactionHelper(aptos, senderAccount, "private_arguments", [], transactionArguments);
      expect(response.success).toBe(true);
    });
  });

  // only public entry functions- shouldn't need to test private again
  describe("single signer transactions with all entry function arguments", () => {
    it("successfully submits a single signer transaction with all argument types", async () => {
      const response = await rawTransactionHelper(
        aptos,
        senderAccount,
        "public_arguments_one_signer",
        [],
        [senderAccount.accountAddress, ...transactionArguments],
      );
      expect(response.success).toBe(true);
    });
  });

  // only public entry functions- shouldn't need to test private again
  describe("multi signer transaction with all entry function arguments", () => {
    it("successfully submits a multi signer transaction with all argument types", async () => {
      const secondarySignerAddresses = secondarySignerAccounts.map((account) => account.accountAddress);
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments_multiple_signers",
        [],
        [
          new MoveVector<AccountAddress>([senderAccount.accountAddress, ...secondarySignerAddresses]),
          ...transactionArguments,
        ],
        secondarySignerAccounts,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionMultiAgentSignature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed({ input: address }),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect((responseSignature as any).fee_payer_address).toBeUndefined();
    });
  });

  describe("fee payer transactions with various numbers of signers", () => {
    it("successfully submits a sponsored transaction with all argument types", async () => {
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments_one_signer",
        [],
        [senderAccount.accountAddress, ...transactionArguments],
        [], // secondary signers
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionFeePayerSignature;
      expect(responseSignature.secondary_signer_addresses.length).toEqual(0);
      expect(AccountAddress.fromStringRelaxed({ input: responseSignature.fee_payer_address }).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });

    it("successfully submits a sponsored multi signer transaction with all argument types", async () => {
      const secondarySignerAddresses = secondarySignerAccounts.map((account) => account.accountAddress);
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments_multiple_signers",
        [],
        [
          new MoveVector<AccountAddress>([senderAccount.accountAddress, ...secondarySignerAddresses]),
          ...transactionArguments,
        ],
        secondarySignerAccounts,
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionFeePayerSignature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed({ input: address }),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromStringRelaxed({ input: responseSignature.fee_payer_address }).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });
  });
});
