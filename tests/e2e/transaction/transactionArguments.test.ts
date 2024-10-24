// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Bool,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  EntryFunctionArgumentTypes,
  SimpleEntryFunctionArgumentTypes,
  Ed25519PrivateKey,
  parseTypeTag,
  isMultiAgentSignature,
  isFeePayerSignature,
  isUserTransactionResponse,
  MoveOption,
  MoveString,
  MoveVector,
  convertArgument,
  FunctionABI,
  TypeTagBool,
  TypeTagVector,
  TypeTagU8,
  TypeTagU16,
  TypeTagU32,
} from "../../../src";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";
import { getAptosClient } from "../helper";
import {
  fundAccounts,
  rawTransactionHelper,
  rawTransactionMultiAgentHelper,
  publishArgumentTestModule,
  PUBLISHER_ACCOUNT_PK,
  MULTI_SIGNER_SCRIPT_ARGUMENT_TEST,
  PUBLISHER_ACCOUNT_ADDRESS,
} from "./helper";

jest.setTimeout(10000);

// This test uses lots of helper functions, explained here:
//  the `transactionArguments` array contains every possible argument type
//  the `rawTransactionHelper` and `rawTransactionMultiAgentHelper` functions are helpers to generate the transactions,
//    respectively for single signer transactions and for (multi signer & fee payer) transactions
// In any transaction with a `&signer` the move function asserts that the first argument is the senderAccount's address:
// `sender_address: address` or all of the `&signer` addresses: `signer_addresses: vector<address>`

describe("various transaction arguments", () => {
  const { aptos } = getAptosClient();
  const senderAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
    legacy: false,
  });
  const secondarySignerAccounts = [Account.generate(), Account.generate(), Account.generate(), Account.generate()];
  const feePayerAccount = Account.generate();
  const moduleObjects: Array<AccountAddress> = [];
  let transactionArguments: Array<EntryFunctionArgumentTypes>;
  let simpleTransactionArguments: Array<SimpleEntryFunctionArgumentTypes>;
  let mixedTransactionArguments: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;
  const EXPECTED_VECTOR_U8 = MoveVector.U8([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]);
  const EXPECTED_VECTOR_STRING = MoveVector.MoveString(["expected_string", "abc", "def", "123", "456", "789"]);

  let backwardsCompatibleArgs: Array<SimpleEntryFunctionArgumentTypes>;
  let backwardsCompatibleAbi: FunctionABI;

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
      accountAddress: senderAccount.accountAddress,
      resourceType: `${senderAccount.accountAddress}::tx_args_module::SetupData`,
    });

    moduleObjects.push(AccountAddress.fromString(setupData.empty_object_1.inner));
    moduleObjects.push(AccountAddress.fromString(setupData.empty_object_2.inner));
    moduleObjects.push(AccountAddress.fromString(setupData.empty_object_3.inner));

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
      EXPECTED_VECTOR_U8,
      MoveVector.U16([0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER]),
      MoveVector.U32([0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER]),
      MoveVector.U64([0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT]),
      MoveVector.U128([0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT]),
      MoveVector.U256([0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT]),
      new MoveVector([
        AccountAddress.fromString("0x0"),
        AccountAddress.fromString("0x0000000000000000000000000000000000000000000000000000000000000abc"),
        AccountAddress.fromString("0x0000000000000000000000000000000000000000000000000000000000000def"),
        AccountAddress.fromString("0x0000000000000000000000000000000000000000000000000000000000000123"),
        AccountAddress.fromString("0x0000000000000000000000000000000000000000000000000000000000000456"),
        AccountAddress.fromString("0x0000000000000000000000000000000000000000000000000000000000000789"),
      ]),
      EXPECTED_VECTOR_STRING,
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
      [
        "0x0",
        "0x0000000000000000000000000000000000000000000000000000000000000abc",
        "0x0000000000000000000000000000000000000000000000000000000000000def",
        "0x0000000000000000000000000000000000000000000000000000000000000123",
        "0x0000000000000000000000000000000000000000000000000000000000000456",
        "0x0000000000000000000000000000000000000000000000000000000000000789",
      ],
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
      [
        "0x0",
        "0x0000000000000000000000000000000000000000000000000000000000000abc",
        "0x0000000000000000000000000000000000000000000000000000000000000def",
        "0x0000000000000000000000000000000000000000000000000000000000000123",
        "0x0000000000000000000000000000000000000000000000000000000000000456",
        "0x0000000000000000000000000000000000000000000000000000000000000789",
      ],
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
    backwardsCompatibleArgs = [
      "true", // True
      "false", // False
      "1", // U8
      "2", // U16
      "3", // U32
      "ABC", // Vector<u8>
      "", // Vector<u8>
    ];
    backwardsCompatibleAbi = {
      typeParameters: [],
      parameters: [
        new TypeTagBool(),
        new TypeTagBool(),
        new TypeTagU8(),
        new TypeTagU16(),
        new TypeTagU32(),
        new TypeTagVector(new TypeTagU8()),
        new TypeTagVector(new TypeTagU8()),
      ],
    };
  });

  describe("type tags", () => {
    it("successfully submits a transaction with 31 complex type tags", async () => {
      const response = await rawTransactionHelper(
        aptos,
        senderAccount,
        "type_tags",
        [
          parseTypeTag("bool"),
          parseTypeTag("u8"),
          parseTypeTag("u16"),
          parseTypeTag("u32"),
          parseTypeTag("u64"),
          parseTypeTag("u128"),
          parseTypeTag("u256"),
          parseTypeTag("address"),
          parseTypeTag("0x1::string::String"),
          parseTypeTag(`0x1::object::Object<${PUBLISHER_ACCOUNT_ADDRESS}::tx_args_module::EmptyResource>`),
          parseTypeTag("vector<bool>"),
          parseTypeTag("vector<u8>"),
          parseTypeTag("vector<u16>"),
          parseTypeTag("vector<u32>"),
          parseTypeTag("vector<u64>"),
          parseTypeTag("vector<u128>"),
          parseTypeTag("vector<u256>"),
          parseTypeTag("vector<address>"),
          parseTypeTag("vector<0x1::string::String>"),
          parseTypeTag(`vector<0x1::object::Object<${PUBLISHER_ACCOUNT_ADDRESS}::tx_args_module::EmptyResource>>`),
          parseTypeTag("0x1::option::Option<bool>"),
          parseTypeTag("0x1::option::Option<u8>"),
          parseTypeTag("0x1::option::Option<u16>"),
          parseTypeTag("0x1::option::Option<u32>"),
          parseTypeTag("0x1::option::Option<u64>"),
          parseTypeTag("0x1::option::Option<u128>"),
          parseTypeTag("0x1::option::Option<u256>"),
          parseTypeTag("0x1::option::Option<address>"),
          parseTypeTag("0x1::option::Option<0x1::string::String>"),
          parseTypeTag(
            `0x1::option::Option<0x1::object::Object<${PUBLISHER_ACCOUNT_ADDRESS}::tx_args_module::EmptyResource>>`,
          ),
          parseTypeTag(
            // eslint-disable-next-line max-len
            `vector<vector<0x1::option::Option<vector<0x1::option::Option<0x1::object::Object<${PUBLISHER_ACCOUNT_ADDRESS}::tx_args_module::EmptyResource>>>>>>`,
          ),
        ],
        [],
      );
      expect(response.success).toBe(true);
    });
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

      it("simple inputs support backwards compatibility", async () => {
        const converted: Array<EntryFunctionArgumentTypes> = backwardsCompatibleArgs.map((arg, i) =>
          convertArgument("testing", backwardsCompatibleAbi, arg, i, []),
        );

        expect(converted).toEqual([
          new Bool(true),
          new Bool(false),
          new U8(1),
          new U16(2),
          new U32(3),
          MoveVector.U8([65, 66, 67]),
          MoveVector.U8([]),
        ]);
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
      const response = await rawTransactionHelper(aptos, senderAccount, "public_arguments", [], transactionArguments);
      expect(response.success).toBe(true);
    });

    it("simple inputs successfully submits a single signer transaction with all argument types", async () => {
      const response = await rawTransactionHelper(
        aptos,
        senderAccount,
        "public_arguments",
        [],
        simpleTransactionArguments,
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

      const responseSignature = response.signature;
      if (responseSignature === undefined || !isMultiAgentSignature(responseSignature)) {
        throw new Error("Expected multi agent signature");
      }

      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromString(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
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
      if (response.signature === undefined || !isMultiAgentSignature(response.signature)) {
        throw new Error("Expected multi agent signature");
      }
      const responseSignature = response.signature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromString(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
    });
  });

  describe("fee payer transactions with various numbers of signers", () => {
    it("successfully submits a sponsored transaction with all argument types", async () => {
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments",
        [],
        transactionArguments,
        [], // secondary signers
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      if (response.signature === undefined || !isFeePayerSignature(response.signature)) {
        throw new Error("Expected fee payer signature");
      }
      const responseSignature = response.signature;
      expect(responseSignature.secondary_signer_addresses.length).toEqual(0);
      expect(AccountAddress.fromString(responseSignature.fee_payer_address).toString()).toEqual(
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
      if (response.signature === undefined || !isFeePayerSignature(response.signature)) {
        throw new Error("Expected fee payer signature");
      }
      const responseSignature = response.signature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromString(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromString(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });

    it("simple inputs successfully submits a sponsored transaction with all argument types", async () => {
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "public_arguments",
        [],
        transactionArguments,
        [], // secondary signers
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      if (response.signature === undefined || !isFeePayerSignature(response.signature)) {
        throw new Error("Expected fee payer signature");
      }
      const responseSignature = response.signature;
      expect(responseSignature.secondary_signer_addresses.length).toEqual(0);
      expect(AccountAddress.fromString(responseSignature.fee_payer_address).toString()).toEqual(
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
      if (response.signature === undefined || !isFeePayerSignature(response.signature)) {
        throw new Error("Expected fee payer signature");
      }
      const responseSignature = response.signature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromString(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromString(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
    });
  });

  describe("script transactions", () => {
    it("successfully submits a script transaction with all argument types", async () => {
      const rawTransaction = await aptos.transaction.build.multiAgent({
        sender: senderAccount.accountAddress,
        data: {
          bytecode: MULTI_SIGNER_SCRIPT_ARGUMENT_TEST,
          functionArguments: [
            senderAccount.accountAddress,
            ...secondarySignerAccounts.map((account) => account.accountAddress),
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
            MoveVector.U8([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]),
          ],
        },
        secondarySignerAddresses: secondarySignerAccounts.map((account) => account.accountAddress),
      });
      const senderAuthenticator = await aptos.transaction.sign({ signer: senderAccount, transaction: rawTransaction });
      const secondaryAuthenticators = secondarySignerAccounts.map((account) =>
        aptos.transaction.sign({
          signer: account,
          transaction: rawTransaction,
        }),
      );
      const transactionResponse = await aptos.transaction.submit.multiAgent({
        transaction: rawTransaction,
        senderAuthenticator,
        additionalSignersAuthenticators: secondaryAuthenticators,
      });
      const response = await aptos.waitForTransaction({
        transactionHash: transactionResponse.hash,
      });
      expect(response.success).toBe(true);

      if (!isUserTransactionResponse(response)) {
        throw new Error("Expected user transaction response");
      }

      if (response.signature === undefined || !isMultiAgentSignature(response.signature)) {
        throw new Error("Expected multi agent signature");
      }
      expect(response.signature.type).toBe("multi_agent_signature");
      expect(response.payload.type).toBe("script_payload");
    });
  });

  describe("nested, complex arguments", () => {
    it("successfully submits a function with very complex arguments", async () => {
      const optionVector = new MoveOption(EXPECTED_VECTOR_STRING);
      const deeplyNested3 = new MoveVector([optionVector, optionVector, optionVector]);
      const deeplyNested4 = new MoveVector([deeplyNested3, deeplyNested3, deeplyNested3]);

      const response = await rawTransactionMultiAgentHelper(
        aptos,
        senderAccount,
        "complex_arguments",
        [],
        [
          new MoveVector([EXPECTED_VECTOR_U8, EXPECTED_VECTOR_U8, EXPECTED_VECTOR_U8]),
          new MoveVector([EXPECTED_VECTOR_STRING, EXPECTED_VECTOR_STRING, EXPECTED_VECTOR_STRING]),
          deeplyNested3,
          deeplyNested4,
        ],
        secondarySignerAccounts,
        feePayerAccount,
      );
      expect(response.success).toBe(true);
    });
  });
});
