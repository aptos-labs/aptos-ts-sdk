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
  SimpleEntryFunctionArgumentTypes,
} from "../../../src";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";
import { MoveOption, MoveString, MoveVector } from "../../../src/bcs/serializable/moveStructs";
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
  const moduleObjects: Array<AccountAddress> = [];
  let transactionArguments: Array<EntryFunctionArgumentTypes>;
  let simpleTransactionArguments: Array<SimpleEntryFunctionArgumentTypes>;
  let mixedTransactionArguments: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;

  beforeAll(async () => {
    await fundAccounts(aptos, [senderAccount, ...secondarySignerAccounts, feePayerAccount]);
    await publishArgumentTestModule(aptos, senderAccount);

    // when deploying, `init_module` creates 3 objects and stores them into the `SetupData` resource
    // within that resource is 3 fields: `empty_object_1`, `empty_object_2`, `empty_object_3`
    // we need to extract those objects and use them as arguments for the entry functions
    type SetupData = {
      empty_object_1: { inner: string };
      empty_object_2: { inner: string };
      empty_object_3: { inner: string };
    };

    const setupData = await aptos.getAccountResource<SetupData>({
      accountAddress: senderAccount.accountAddress.toString(),
      resourceType: `${senderAccount.accountAddress.toString()}::tx_args_module::SetupData`,
    });

    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_1.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_2.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_3.inner));

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
        AccountAddress.fromStringRelaxed("0x0"),
        AccountAddress.fromStringRelaxed("0xabc"),
        AccountAddress.fromStringRelaxed("0xdef"),
        AccountAddress.fromStringRelaxed("0x123"),
        AccountAddress.fromStringRelaxed("0x456"),
        AccountAddress.fromStringRelaxed("0x789"),
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

    simpleTransactionArguments = [
      true,
      1,
      2,
      3,
      4,
      5,
      6,
      senderAccount.accountAddress.toString(),
      "expected_string",
      moduleObjects[0].toString(),
      [],
      [true, false, true],
      [0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER],
      [0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER],
      [0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER],
      [0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT.toString(10)],
      [0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT.toString(10)],
      [0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT.toString(10)],
      ["0x0", "0xabc", "0xdef", "0x123", "0x456", "0x789"],
      ["expected_string", "abc", "def", "123", "456", "789"],
      moduleObjects.map((obj) => obj.toString()),
      undefined,
      true,
      1,
      2,
      3,
      4,
      5,
      6,
      senderAccount.accountAddress.toString(),
      "expected_string",
      moduleObjects[0].toString(),
    ];

    // Mixes different types of number arguments, and parsed an unparsed arguments
    mixedTransactionArguments = [
      true,
      1,
      2,
      3,
      4n,
      BigInt(5),
      "6",
      senderAccount.accountAddress,
      "expected_string",
      moduleObjects[0],
      [],
      [true, false, true],
      [0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER],
      [0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER],
      [0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER],
      [0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT.toString(10)],
      [0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT.toString(10)],
      [0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT.toString(10)],
      ["0x0", "0xabc", "0xdef", "0x123", "0x456", "0x789"],
      ["expected_string", "abc", "def", "123", "456", "789"],
      moduleObjects.map((obj) => obj.toString()),
      null,
      new MoveOption(new Bool(true)),
      1,
      2,
      3,
      4,
      5,
      6,
      senderAccount.accountAddress.toString(),
      "expected_string",
      moduleObjects[0].toString(),
    ];
  });

  describe("single signer entry fns, all arguments except `&signer`, both public and private entry functions", () => {
    describe("sender is ed25519", () => {
      it("successfully submits a public entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(aptos, senderAccount, "public_arguments", [], transactionArguments);
        expect(response.success).toBe(true);
      });

      it("successfully submits a private entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(
          aptos,
          senderAccount,
          "private_arguments",
          [],
          transactionArguments,
        );
        expect(response.success).toBe(true);
      });

      it("simple inputs successfully submits a public entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(
          aptos,
          senderAccount,
          "public_arguments",
          [],
          simpleTransactionArguments,
        );
        expect(response.success).toBe(true);
      });

      it("simple inputs successfully submits a private entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(
          aptos,
          senderAccount,
          "private_arguments",
          [],
          simpleTransactionArguments,
        );
        expect(response.success).toBe(true);
      });

      it("mixed inputs successfully submits a public entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(
          aptos,
          senderAccount,
          "public_arguments",
          [],
          mixedTransactionArguments,
        );
        expect(response.success).toBe(true);
      });

      it("mixed inputs successfully submits a private entry fn with all argument types except `&signer`", async () => {
        const response = await rawTransactionHelper(
          aptos,
          senderAccount,
          "private_arguments",
          [],
          mixedTransactionArguments,
        );
        expect(response.success).toBe(true);
      });
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

    it("simple inputs successfully submits a single signer transaction with all argument types", async () => {
      const response = await rawTransactionHelper(
        aptos,
        senderAccount,
        "public_arguments_one_signer",
        [],
        [senderAccount.accountAddress.toString(), ...simpleTransactionArguments],
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
        AccountAddress.fromStringRelaxed(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect((responseSignature as any).fee_payer_address).toBeUndefined();
    });

    it("simple inputs successfully submits a multi signer transaction with all argument types", async () => {
      const secondarySignerAddresses = secondarySignerAccounts.map((account) => account.accountAddress);
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments_multiple_signers",
        [],
        [
          [senderAccount.accountAddress.toString(), ...secondarySignerAddresses.map((address) => address.toString())],
          ...simpleTransactionArguments,
        ],
        secondarySignerAccounts,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionMultiAgentSignature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed(address),
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
      expect(AccountAddress.fromStringRelaxed(responseSignature.fee_payer_address).toString()).toEqual(
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
        AccountAddress.fromStringRelaxed(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromStringRelaxed(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });

    it("simple inputs successfully submits a sponsored transaction with all argument types", async () => {
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
      expect(AccountAddress.fromStringRelaxed(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });

    it("simple inputs successfully submits a sponsored multi signer transaction with all argument types", async () => {
      const secondarySignerAddresses = secondarySignerAccounts.map((account) => account.accountAddress);
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments_multiple_signers",
        [],
        [
          [senderAccount.accountAddress.toString(), ...secondarySignerAddresses.map((address) => address.toString())],
          ...simpleTransactionArguments,
        ],
        secondarySignerAccounts,
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionFeePayerSignature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromStringRelaxed(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });
  });
});
